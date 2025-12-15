// app/api/user/profile/route.ts - API endpoint for updating user profile

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma, withPrismaRetry } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional().nullable(),
  citizenship: z.string().optional().nullable(), // ISO country code or region string
})

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error('[Profile API] JSON parse error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body', message: parseError.message },
        { status: 400 }
      )
    }

    const validationResult = updateProfileSchema.safeParse(body)
    if (!validationResult.success) {
      console.error('[Profile API] Validation error:', validationResult.error.errors)
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Update user profile
    const updatedUser = await withPrismaRetry(() =>
      prisma.user.update({
        where: { id: userId },
        data: {
          first_name: data.firstName,
          last_name: data.lastName || null,
          citizenship: data.citizenship || null,
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          citizenship: true,
        },
      })
    )

    console.log('[Profile API] Profile updated successfully:', {
      userId,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      citizenship: updatedUser.citizenship,
    })

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        citizenship: updatedUser.citizenship,
        fullName: `${updatedUser.first_name} ${updatedUser.last_name || ''}`.trim(),
      },
    })
  } catch (error: any) {
    console.error('[Profile API] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    return NextResponse.json(
      {
        error: 'Failed to update profile',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = parseInt(session.user.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Get user profile
    const user = await withPrismaRetry(() =>
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          citizenship: true,
        },
      })
    )

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        citizenship: user.citizenship,
        fullName: `${user.first_name} ${user.last_name || ''}`.trim(),
      },
    })
  } catch (error: any) {
    console.error('[Profile API] Error fetching profile:', {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      {
        error: 'Failed to fetch profile',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

