import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import emailService from '@/lib/email'

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

    const skip = (page - 1) * limit

    const reviews = await prisma.review.findMany({
      where: {
        productId: id,
        published: true,
      },
      include: {
        customer: true, // Include all customer fields
        product: true,  // Include all product fields
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    })

    const total = await prisma.review.count({
      where: {
        productId: id,
        published: true,
      },
    })

    const averageRating = await prisma.review.aggregate({
      where: {
        productId: id,
        published: true,
      },
      _avg: {
        rating: true,
      },
    })

    return NextResponse.json({
      reviews,
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

    // Check if product exists
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

    // 发送新评论通知邮件
    console.log('📧 Sending review notification email...')
    try {
      await emailService.sendNewReviewNotification({
        customerName: `${review.customer.firstName} ${review.customer.lastName}`,
        productTitle: review.product.title,
        rating: review.rating,
        title: review.title || '',
        content: review.content,
        reviewId: review.id,
      })
      console.log('📧 Review notification email sent successfully')
    } catch (emailError) {
      console.error('📧 Failed to send review notification email:', emailError instanceof Error ? emailError.message : String(emailError))
      // 不影响评论创建的成功响应，只记录错误
      console.warn('⚠️  Review created successfully, but email notification failed. Please check SMTP configuration.')
    }

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
