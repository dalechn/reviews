import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  return response
}

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }))
}

export async function GET(request: NextRequest) {
  try {
    // During build time, return empty data to avoid database connection
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
      return addCorsHeaders(NextResponse.json({
        reviews: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      }))
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // 'pending', 'published', 'all'
    const productId = searchParams.get('productId')

    const skip = (page - 1) * limit

    const where: any = {}
    if (status === 'pending') {
      where.published = false
    } else if (status === 'published') {
      where.published = true
    }
    if (productId) {
      where.productId = productId
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            handle: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    })

    const total = await prisma.review.count({ where })

    return addCorsHeaders(NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }))
  } catch (error) {
    console.error('Error fetching admin reviews:', error)
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    ))
  }
}
