import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    
    if (!clerkId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        role: true,
        clientProfile: {
          include: {
            socialMediaProfiles: true
          }
        }
      }
    })
    
    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('[USER_ME_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}