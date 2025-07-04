import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        clientProfile: {
          include: {
            socialMediaProfiles: true,
          },
        },
      },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    return NextResponse.json(user.clientProfile)
  } catch (error) {
    console.error('[CLIENT_PROFILE_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    const values = await req.json()

    if (!clerkId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    })

    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    const { socialMediaProfiles, ...profileData } = values

    const updatedProfile = await prisma.clientProfile.upsert({
      where: { userId: user.id },
      update: profileData,
      create: {
        userId: user.id,
        ...profileData,
      },
      include: {
        socialMediaProfiles: true,
      },
    })

    if (socialMediaProfiles && Array.isArray(socialMediaProfiles)) {
      // Delete existing social media profiles
      await prisma.socialMediaProfile.deleteMany({
        where: { profileId: updatedProfile.id },
      })

      // Create new ones
      await prisma.socialMediaProfile.createMany({
        data: socialMediaProfiles.map((profile: { platform: string; url: string }) => ({
          profileId: updatedProfile.id,
          platform: profile.platform,
          url: profile.url,
        })),
      })
    }
    
    const finalProfile = await prisma.clientProfile.findUnique({
        where: { id: updatedProfile.id },
        include: { socialMediaProfiles: true }
    })

    return NextResponse.json(finalProfile)
  } catch (error) {
    console.error('[CLIENT_PROFILE_PUT]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 