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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shopifyId, email, firstName, lastName, avatarUrl, shopId } = body

    if (!shopifyId || !shopId) {
      return addCorsHeaders(NextResponse.json(
        { error: 'Shopify ID and shopId are required' },
        { status: 400 }
      ))
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

    return addCorsHeaders(NextResponse.json(customer, { status: 201 }))
  } catch (error) {
    console.error('Error creating/updating customer:', error)
    return addCorsHeaders(NextResponse.json(
      { error: 'Failed to create/update customer' },
      { status: 500 }
    ))
  }
}
