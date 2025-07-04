import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { rolePermissions } from '@/types/roles'

export async function POST(req: Request) {
  try {
    const { userId: authedUserId } = await auth()
    if (!authedUserId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: authedUserId }
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const userRole = user.role.toLowerCase() as keyof typeof rolePermissions
    if (!rolePermissions[userRole].canManageUsers) {
      return new NextResponse("Forbidden", { status: 403 })
    }
    
    const body = await req.json()
    const { action, email, firstName, lastName, ...profileData } = body

    if (!action || !email) {
      return new NextResponse('Missing required fields', { status: 400 })
    }
    
    if (action === 'invite') {
      const clerk = await clerkClient()
      await clerk.invitations.createInvitation({
        emailAddress: email,
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
        publicMetadata: {
          role: 'CLIENT'
        }
      })
    } else if (action === 'create') {
        if (!firstName || !lastName) {
            return new NextResponse('Missing first name or last name for manual creation', { status: 400 })
        }
        
        const clerk = await clerkClient()
        const newUser = await clerk.users.createUser({
            emailAddress: [email],
            firstName,
            lastName,
            publicMetadata: {
                role: 'CLIENT'
            }
        })

        const { socialMediaProfiles, ...restOfProfileData } = profileData;

        await prisma.$transaction(async (tx) => {
          const localUser = await tx.user.create({
            data: {
              clerkId: newUser.id,
              email: email,
              firstName: firstName,
              lastName: lastName,
              name: `${firstName} ${lastName}`,
              role: 'CLIENT',
            }
          })

          await tx.clientProfile.create({
            data: {
              userId: localUser.id,
              ...restOfProfileData,
              socialMediaProfiles: {
                create: socialMediaProfiles || [],
              },
            }
          })
        })

    } else {
        return new NextResponse('Invalid action', { status: 400 })
    }

    return NextResponse.json({ message: 'Client action completed successfully' }, { status: 201 })

  } catch (error) {
    console.error('[CLIENTS_POST]', error)
    if (error && typeof error === 'object' && 'errors' in error) {
      const clerkError = (error as { errors: Array<{ longMessage?: string; message: string }> }).errors[0];
      return new NextResponse(JSON.stringify({ error: clerkError.longMessage || clerkError.message }), { status: 400 });
    }
    return new NextResponse('Internal Error', { status: 500 })
  }
} 