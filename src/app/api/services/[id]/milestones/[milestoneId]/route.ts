import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { rolePermissions } from '@/types/roles'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
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

    const userRole = user.role.toLowerCase() as keyof typeof rolePermissions
    const { id, milestoneId } = await params

    // Check if the service exists and user has access
    const service = await prisma.service.findUnique({
      where: { id: id },
      include: { client: true }
    })

    if (!service) {
      return new NextResponse("Service not found", { status: 404 })
    }

    // Check permissions - only managers/admins can update milestones
    if (!rolePermissions[userRole].canAssignServices) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const { achieved, achievedAt } = body

    // Update the service milestone
    const milestone = await prisma.serviceMilestone.update({
      where: { 
        id: milestoneId,
        serviceId: id // Ensure milestone belongs to this service
      },
      data: {
        achieved: achieved ?? false,
        achievedAt: achieved 
          ? (achievedAt ? new Date(achievedAt) : new Date())
          : null
      },
      include: {
        milestone: true
      }
    })

    return NextResponse.json(milestone)
  } catch (error) {
    console.error('[SERVICE_MILESTONE_PATCH]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}