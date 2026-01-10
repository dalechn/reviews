import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shopifyId, email, firstName, lastName, avatarUrl, shopId } = body

    if (!shopifyId || !shopId) {
      return NextResponse.json(
        { error: 'Shopify ID and shopId are required' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.upsert({
      where: { shopifyId },
      update: {
        email,
        firstName,
        lastName,
        avatarUrl,
        shopId,
      },
      create: {
        shopifyId,
        email,
        firstName,
        lastName,
        avatarUrl,
        shopId,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create/update customer' },
      { status: 500 }
    )
  }
}
