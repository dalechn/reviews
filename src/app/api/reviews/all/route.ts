import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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
      })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const shopId = searchParams.get('shopId') // 新增：商店ID参数
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const skip = (page - 1) * limit

    // 验证排序字段
    const validSortFields = ['createdAt', 'rating', 'customer.firstName', 'product.title', 'title']
    const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const actualSortOrder = sortOrder === 'asc' ? 'asc' : 'desc'

    // 构建查询条件 - 管理界面需要显示所有评论（包括隐藏的）
    const whereCondition: any = {}

    if (shopId) {
      whereCondition.shopId = shopId // 只返回指定商店的评论
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
        customer: {
          select: {
            id: true,
            shopifyId: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        product: {
          select: {
            id: true,
            shopifyId: true,
            title: true,
            handle: true,
            imageUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
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

    const total = await prisma.review.count({
      where: whereCondition,
    })

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching all reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
