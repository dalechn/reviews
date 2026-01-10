import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { rating, title, content, published, hideReason, mediaUrls } = body

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(rating !== undefined && { rating }),
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(published !== undefined && { published }),
        ...(hideReason !== undefined && { hideReason }),
        ...(mediaUrls !== undefined && { mediaUrls }),
        updatedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        product: {
          select: {
            title: true,
            handle: true,
          },
        },
      },
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error('Error updating review:', error)
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.review.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Review deleted successfully' })
  } catch (error) {
    console.error('Error deleting review:', error)
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (action === 'helpful') {
      const review = await prisma.review.update({
        where: { id },
        data: {
          helpful: {
            increment: 1,
          },
        },
      })
      return NextResponse.json(review)
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating review helpful count:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}
