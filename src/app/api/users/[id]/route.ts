import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { rolePermissions } from '@/types/roles'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    const userRole = currentUser?.role.toLowerCase() as keyof typeof rolePermissions
    
    if (!currentUser || (!rolePermissions[userRole].canManageUsers && !rolePermissions[userRole].canAssignServices)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        clientProfile: {
          include: {
            socialMediaProfiles: true
          }
        },
        assignedServices: {
          include: {
            template: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const formattedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      clientProfile: user.clientProfile,
      services: user.assignedServices.map(service => ({
        id: service.id,
        name: service.template.name,
        description: service.description || '',
        status: service.status,
        createdAt: service.createdAt.toISOString(),
        template: service.template
      }))
    }

    return NextResponse.json(formattedUser)
  } catch (error) {
    console.error('[USER_GET]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}