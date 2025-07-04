import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { rolePermissions } from '@/types/roles'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
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

    const { id, taskId } = await params

    const userRole = user.role.toLowerCase() as keyof typeof rolePermissions

    // Check if the service exists and user has access
    const service = await prisma.service.findUnique({
      where: { id },
      include: { client: true }
    })

    if (!service) {
      return new NextResponse("Service not found", { status: 404 })
    }

    // Check permissions
    const canManage = rolePermissions[userRole].canAssignServices
    const isOwner = service.clientId === user.id

    if (!canManage && !isOwner) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const { status, completedAt } = body

    // Update the service task
    const task = await prisma.serviceTask.update({
      where: { 
        id: taskId,
        serviceId: id // Ensure task belongs to this service
      },
      data: {
        ...(status && { status }),
        completedAt: status === 'COMPLETED' 
          ? (completedAt ? new Date(completedAt) : new Date())
          : null
      },
      include: {
        task: true
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('[SERVICE_TASK_PATCH]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}