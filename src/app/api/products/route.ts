import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shopifyId, title, handle, imageUrl } = body

    if (!shopifyId || !title || !handle) {
      return NextResponse.json(
        { error: 'Shopify ID, title, and handle are required' },
        { status: 400 }
      )
    }

    const product = await prisma.product.upsert({
      where: { shopifyId },
      update: {
        title,
        handle,
        imageUrl,
      },
      create: {
        shopifyId,
        title,
        handle,
        imageUrl,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating product:', error)
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'Product with this handle already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create/update product' },
      { status: 500 }
    )
  }
}
