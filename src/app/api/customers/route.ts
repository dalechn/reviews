import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shopifyId, email, firstName, lastName, avatarUrl } = body

    if (!shopifyId) {
      return NextResponse.json(
        { error: 'Shopify ID is required' },
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
      },
      create: {
        shopifyId,
        email,
        firstName,
        lastName,
        avatarUrl,
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
