import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shopifyId = searchParams.get('shopifyId')
    const shopId = searchParams.get('shopId')

    if (!shopifyId) {
      return NextResponse.json(
        { error: 'Shopify ID is required' },
        { status: 400 }
      )
    }

    // 如果提供了shopId，则按shopId和shopifyId一起查找，否则只按shopifyId查找
    const whereClause = shopId
      ? { shopifyId, shopId }
      : { shopifyId }

    const product = await prisma.product.findFirst({
      where: whereClause,
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // 转换 Decimal 类型为 number
    const formattedProduct = {
      ...product,
      averageRating: product.averageRating ? Number(product.averageRating) : null,
    }

    return NextResponse.json(formattedProduct)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shopifyId, title, handle, imageUrl, shopId } = body

    if (!shopifyId || !title || !handle || !shopId) {
      return NextResponse.json(
        { error: 'Shopify ID, title, handle, and shopId are required' },
        { status: 400 }
      )
    }

    // First, try to upsert normally
    try {
      const product = await prisma.product.upsert({
        where: { shopifyId },
        update: {
          title,
          handle,
          imageUrl,
          shopId,
        },
        create: {
          shopifyId,
          title,
          handle,
          imageUrl,
          shopId,
        },
      })

      // 转换 Decimal 类型为 number
      const formattedProduct = {
        ...product,
        averageRating: product.averageRating ? Number(product.averageRating) : null,
      }

      return NextResponse.json(formattedProduct, { status: 201 })
    } catch (error) {
      // If upsert fails due to handle conflict, try to find existing product by handle
      // and update its shopifyId
      if ((error as any).code === 'P2002') {
        const existingProduct = await prisma.product.findUnique({
          where: {
            shopId_handle: {
              shopId,
              handle,
            },
          },
        })

        if (existingProduct) {
          // Update the existing product with new shopifyId and other fields
          const updatedProduct = await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              shopifyId,
              title,
              imageUrl,
              shopId,
            },
          })
          // 转换 Decimal 类型为 number
          const formattedUpdatedProduct = {
            ...updatedProduct,
            averageRating: updatedProduct.averageRating ? Number(updatedProduct.averageRating) : null,
          }

          return NextResponse.json(formattedUpdatedProduct, { status: 200 })
        }
      }

      // Re-throw if it's not a handle conflict or no existing product found
      throw error
    }
  } catch (error) {
    console.error('Error creating/updating product:', error)
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Product with this handle already exists and could not be updated' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create/update product' },
      { status: 500 }
    )
  }
}
