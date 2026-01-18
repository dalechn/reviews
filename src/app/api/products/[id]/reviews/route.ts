import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import emailService from '@/lib/email'
import { queues } from '@/lib/queue'

// 辅助函数：转换媒体URL为媒体对象
function convertMediaUrlsToMedia(mediaUrls: string[]): any[] {
  if (!mediaUrls || mediaUrls.length === 0) return []

  return mediaUrls.map(url => {
    // 检查是否为视频（简单检查URL中的文件扩展名）
    const isVideo = /\.(mp4|webm|ogg|avi|mov|mkv|flv|wmv|3gpp|quicktime)$/i.test(url)

    return {
      type: isVideo ? 'video' : 'image',
      url,
      thumbnailUrl: isVideo ? null : undefined, // 视频会异步生成缩略图
    }
  })
}

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

    // 先通过shopifyId找到产品，获取数据库ID
    const product = await prisma.product.findFirst({
      where: { shopifyId: id },
    })

    if (!product) {
      console.log('Product not found for shopifyId:', id)
      return NextResponse.json({
        reviews: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
        },
        averageRating: 0,
      })
    }

    // 构建查询条件 - 使用数据库产品ID查找评论
    const whereCondition: any = {
      productId: product.id, // 使用数据库产品ID
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
    const { customerId, author, email, rating, title, content, mediaUrls, verified, productData } = body

    console.log('Received review request:', { author, email, rating, content, productData, id })

    // Validate required fields - author and email are always required
    if (!rating || !content || !author || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: rating, content, author, and email are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if product exists and get shopId
    let product = await prisma.product.findFirst({
      where: { shopifyId: id },
    })

    console.log('Product lookup result for shopifyId:', id, product ? 'FOUND' : 'NOT FOUND')

    // If product doesn't exist and we have productData, try to create it
    if (!product && productData) {
      try {
        console.log('Attempting to auto-create product with data:', productData)
        product = await prisma.product.create({
          data: {
            shopifyId: productData.shopifyId || id,
            title: productData.title,
            handle: productData.handle,
            imageUrl: productData.imageUrl,
            shopId: productData.shopId,
          },
        })
        console.log('Product auto-created with ID:', product.id, 'and shopifyId:', product.shopifyId)
      } catch (createError: any) {
        console.error('Failed to auto-create product:', createError)
        console.error('Product data received:', productData)
        return NextResponse.json(
          { error: `Product not found and could not be created automatically: ${createError?.message || 'Unknown error'}` },
          { status: 404 }
        )
      }
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found. Please ensure the product is synced to the database first.' },
        { status: 404 }
      )
    }

    // Find or create customer by email
    let customer = await prisma.customer.findFirst({
      where: {
        email: email,
        shopId: product.shopId,
      },
    })

    if (!customer) {
      // Create new customer
      try {
        customer = await prisma.customer.create({
          data: {
            shopifyId: customerId || null, // Optional Shopify ID for logged-in users
            email: email,
            firstName:author,
            // lastName: author.split(' ').slice(1).join(' ') || null,
            shopId: product.shopId,
          },
        })
        console.log('Customer created with email:', email, 'database ID:', customer.id)
      } catch (createError: any) {
        console.error('Failed to create customer:', createError)
        return NextResponse.json(
          { error: `Failed to create customer: ${createError?.message || 'Unknown error'}` },
          { status: 500 }
        )
      }
    } else {
      // Update customer name if it's different (in case they updated their name)
      if (customer.firstName !== (author.split(' ')[0] || author) ||
          customer.lastName !== (author.split(' ').slice(1).join(' ') || null)) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            firstName: author,
            // lastName: author.split(' ').slice(1).join(' ') || null,
          },
        })
      }
    }

    // 转换媒体URL为新的媒体结构
    const media = convertMediaUrlsToMedia(mediaUrls || [])

    const review = await prisma.review.create({
      data: {
        productId: product.id,
        customerId: customer.id,
        shopId: product.shopId,
        rating,
        title: title || null,
        content,
        mediaUrls: mediaUrls || [], // 保留向后兼容性
        media: media.length > 0 ? (media as any) : null, // 新字段
        verified: verified || false, // Verification status can be set externally if needed
      } as any,
      include: {
        customer: {
          select: {
            id: true,
            shopifyId: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        product: {
          select: {
            id: true,
            shopifyId: true,
            title: true,
            handle: true,
            imageUrl: true,
            averageRating: true,
          },
        },
      },
    })

    // 异步发送新评论通知邮件（通过消息队列）
    console.log('📧 Adding review notification email to queue...')
    try {
      await queues.reviewNotifications.add('new-review-notification', {
        customerName: `${(review as any).customer.firstName} ${(review as any).customer.lastName || ''}`.trim(),
        productTitle: (review as any).product.title,
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

    // 检查是否有视频需要生成缩略图，更新videoThumbnail队列中的reviewId
    if (media && media.some(item => item.type === 'video')) {
      console.log('🎥 Review contains videos, updating thumbnail generation jobs with reviewId')
      try {
        // 这里可以添加逻辑来更新已经存在的视频缩略图任务，设置正确的reviewId
        // 由于上传API可能在review创建之前就被调用，我们需要在上传时传递reviewId
        // 或者在这里重新添加缩略图生成任务
        const videoUrls = media.filter(item => item.type === 'video').map(item => item.url)

        // 为每个视频重新添加缩略图生成任务（带reviewId）
        for (const videoUrl of videoUrls) {
          // 从URL中提取文件名
          const urlParts = videoUrl.split('/')
          const fileName = urlParts[urlParts.length - 1]

          await queues.videoThumbnail.add('generate-video-thumbnail', {
            videoUrl,
            reviewId: review.id,
            fileName,
          })
        }
        console.log(`✅ Re-queued ${videoUrls.length} video thumbnail generation jobs with reviewId`)
      } catch (queueError) {
        console.error('🎥 Failed to re-queue video thumbnail generation jobs:', queueError)
      }
    }

    // 异步更新产品评分统计
    console.log('📊 Adding rating calculation job to queue...')
    try {
      await queues.ratingCalculation.add('update-product-rating', {
        productId: product.id,
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
