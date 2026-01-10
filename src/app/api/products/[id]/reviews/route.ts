import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import emailService from '@/lib/email'
import { queues } from '@/lib/queue'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // During build time, return empty data to avoid database connection
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      return NextResponse.json({
        reviews: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
        averageRating: 0,
      })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // 验证排序字段
    const validSortFields = ['createdAt', 'rating', 'customer.firstName', 'title']
    const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const actualSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    // 构建查询条件
    const whereCondition: any = {
      productId: id,
      published: true,
    }

    // 添加时间范围筛选
    if (startDate || endDate) {
      whereCondition.createdAt = {}
      if (startDate) {
        whereCondition.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        // 设置结束日期为当天的23:59:59
        const endOfDay = new Date(endDate)
        endOfDay.setHours(23, 59, 59, 999)
        whereCondition.createdAt.lte = endOfDay
      }
    }

    const reviews = await prisma.review.findMany({
      where: whereCondition,
      include: {
        customer: true, // Include all customer fields
        product: true,  // Include all product fields
      },
      orderBy: actualSortBy.includes('customer.') || actualSortBy.includes('product.')
        ? {
            [actualSortBy.split('.')[0]]: {
              [actualSortBy.split('.')[1]]: actualSortOrder,
            },
          }
        : {
            [actualSortBy]: actualSortOrder,
          },
      skip,
      take: limit,
    })

    // 转换产品中的 Decimal 类型为 number
    const formattedReviews = reviews.map(review => ({
      ...review,
      product: {
        ...review.product,
        averageRating: review.product.averageRating ? Number(review.product.averageRating) : null,
      },
    }))

    const total = await prisma.review.count({
      where: whereCondition,
    })

    const averageRating = await prisma.review.aggregate({
      where: whereCondition,
      _avg: {
        rating: true,
      },
    })

    return NextResponse.json({
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      averageRating: averageRating._avg.rating || 0,
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { customerId, rating, title, content, mediaUrls, verified } = body

    if (!customerId || !rating || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if product exists and get shopId
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const review = await prisma.review.create({
      data: {
        productId: id,
        customerId,
        shopId: product.shopId,
        rating,
        title,
        content,
        mediaUrls: mediaUrls || [],
        verified: verified || false,
      },
      include: {
        customer: true, // Include all customer fields
        product: true,  // Include all product fields
      },
    })

    // 异步发送新评论通知邮件（通过消息队列）
    console.log('📧 Adding review notification email to queue...')
    try {
      await queues.reviewNotifications.add('new-review-notification', {
        customerName: `${review.customer.firstName} ${review.customer.lastName}`,
        productTitle: review.product.title,
        rating: review.rating,
        title: review.title || '',
        content: review.content,
        mediaUrls: review.mediaUrls || [],
        reviewId: review.id,
      })
      console.log('📧 Review notification email queued successfully')
    } catch (queueError) {
      console.error('📧 Failed to queue review notification email:', queueError instanceof Error ? queueError.message : String(queueError))
      // 不影响评论创建的成功响应，只记录错误
      console.warn('⚠️  Review created successfully, but email notification queue failed. Email will not be sent.')
    }

    // 异步更新产品评分统计
    console.log('📊 Adding rating calculation job to queue...')
    try {
      await queues.ratingCalculation.add('update-product-rating', {
        productId: id,
      })
      console.log('📊 Rating calculation job queued successfully')
    } catch (queueError) {
      console.error('📊 Failed to queue rating calculation job:', queueError instanceof Error ? queueError.message : String(queueError))
      console.warn('⚠️  Review created successfully, but rating calculation queue failed. Rating stats may be outdated.')
    }

    // 转换产品中的 Decimal 类型为 number
    const formattedReview = {
      ...review,
      product: {
        ...review.product,
        averageRating: review.product.averageRating ? Number(review.product.averageRating) : null,
      },
    }

    return NextResponse.json(formattedReview, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
