import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Update user's public metadata to set role as admin
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: 'admin'
      }
    })

    return NextResponse.json({ 
      message: 'User role set to admin successfully',
      userId,
      role: 'admin'
    })
  } catch (error) {
    console.error('[SET_ADMIN_POST]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 