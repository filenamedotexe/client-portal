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

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const { id } = await params

    // Get service with all related data
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        client: true,
        template: {
          include: {
            tasks: true,
            milestones: true
          }
        },
        tasks: {
          include: {
            task: true
          }
        },
        milestones: {
          include: {
            milestone: true
          }
        },
        requests: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        forms: {
          include: {
            form: {
              include: {
                submissions: {
                  where: {
                    userId: user.id
                  },
                  orderBy: {
                    submittedAt: 'desc'
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!service) {
      return new NextResponse("Service not found", { status: 404 })
    }

    // Check if user has permission to view this service
    const userRole = user.role.toLowerCase() as keyof typeof rolePermissions
    const canViewAll = rolePermissions[userRole].canViewAllServices
    
    if (!canViewAll && service.clientId !== user.id) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('[SERVICE_GET]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    const userRole = user?.role.toLowerCase() as keyof typeof rolePermissions
    if (!user || !rolePermissions[userRole].canAssignServices) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { id } = await params

    const body = await req.json()
    const { status, endDate } = body

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null })
      },
      include: {
        client: true,
        template: true,
        tasks: {
          include: { task: true }
        },
        milestones: {
          include: { milestone: true }
        }
      }
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('[SERVICE_PATCH]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    const userRole = user?.role.toLowerCase() as keyof typeof rolePermissions
    if (!user || !rolePermissions[userRole].canAssignServices) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { id } = await params

    // Delete related data first due to foreign key constraints
    await prisma.serviceTask.deleteMany({
      where: { serviceId: id }
    })

    await prisma.serviceMilestone.deleteMany({
      where: { serviceId: id }
    })

    await prisma.assignedForm.deleteMany({
      where: { serviceId: id }
    })

    await prisma.serviceRequest.deleteMany({
      where: { serviceId: id }
    })

    // Delete the service
    await prisma.service.delete({
      where: { id: id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[SERVICE_DELETE]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}