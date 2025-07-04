import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { rolePermissions } from '@/types/roles'

export async function POST(
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

    const userRole = user.role.toLowerCase() as keyof typeof rolePermissions
    const { id } = await params

    // Check if the service exists and user has access
    const service = await prisma.service.findUnique({
      where: { id: id },
      include: { client: true }
    })

    if (!service) {
      return new NextResponse("Service not found", { status: 404 })
    }

    // Check permissions
    const canManage = rolePermissions[userRole].canAssignServices
    const isOwner = service.clientId === user.id

    const body = await req.json()
    const { tasks, milestones } = body

    // Use a transaction to update multiple items
    const result = await prisma.$transaction(async (tx) => {
      const updates: {
        tasks: Array<{
          id: string
          status: string
          completedAt: Date | null
          task: {
            id: string
            title: string
            description: string | null
            order: number
            templateId: string
          }
        }>
        milestones: Array<{
          id: string
          achieved: boolean
          achievedAt: Date | null
          milestone: {
            id: string
            title: string
            description: string | null
            order: number
            templateId: string
          }
        }>
      } = {
        tasks: [],
        milestones: []
      }

      // Update tasks
      if (tasks && Array.isArray(tasks)) {
        for (const taskUpdate of tasks) {
          // Only allow task updates if user can manage or is owner
          if (canManage || isOwner) {
            const updated = await tx.serviceTask.update({
              where: { 
                id: taskUpdate.id,
                serviceId: id
              },
              data: {
                status: taskUpdate.status,
                completedAt: taskUpdate.status === 'COMPLETED' 
                  ? (taskUpdate.completedAt ? new Date(taskUpdate.completedAt) : new Date())
                  : null
              },
              include: {
                task: true
              }
            })
            updates.tasks.push(updated)
          }
        }
      }

      // Update milestones (only for managers/admins)
      if (milestones && Array.isArray(milestones) && canManage) {
        for (const milestoneUpdate of milestones) {
          const updated = await tx.serviceMilestone.update({
            where: { 
              id: milestoneUpdate.id,
              serviceId: id
            },
            data: {
              achieved: milestoneUpdate.achieved ?? false,
              achievedAt: milestoneUpdate.achieved 
                ? (milestoneUpdate.achievedAt ? new Date(milestoneUpdate.achievedAt) : new Date())
                : null
            },
            include: {
              milestone: true
            }
          })
          updates.milestones.push(updated)
        }
      }

      // Get updated service with all data
      const updatedService = await tx.service.findUnique({
        where: { id: id },
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

      return { ...updates, service: updatedService }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[SERVICE_BATCH_UPDATE]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}