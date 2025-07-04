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

    const userRole = user?.role.toLowerCase() as keyof typeof rolePermissions
    if (!user || !rolePermissions[userRole].canManageServices) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { id } = await params
    const template = await prisma.serviceTemplate.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: { order: 'asc' }
        },
        milestones: {
          orderBy: { order: 'asc' }
        },
        requiredForms: true,
        _count: {
          select: { services: true }
        }
      }
    })

    if (!template) {
      return new NextResponse("Template not found", { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('[SERVICE_TEMPLATE_GET]', error)
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
    if (!user || !rolePermissions[userRole].canManageServices) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, description, isActive, tasks, milestones } = body

    // Update template with transaction to handle tasks and milestones
    const template = await prisma.$transaction(async (tx) => {
      // Delete existing tasks and milestones
      await tx.task.deleteMany({
        where: { templateId: id }
      })
      await tx.milestone.deleteMany({
        where: { templateId: id }
      })

      // Update template and create new tasks/milestones
      return await tx.serviceTemplate.update({
        where: { id },
        data: {
          name,
          description,
          isActive,
          tasks: {
            create: tasks?.map((task: { title: string; description?: string }, index: number) => ({
              title: task.title,
              description: task.description,
              order: index
            })) || []
          },
          milestones: {
            create: milestones?.map((milestone: { title: string; description?: string }, index: number) => ({
              title: milestone.title,
              description: milestone.description,
              order: index
            })) || []
          }
        },
        include: {
          tasks: {
            orderBy: { order: 'asc' }
          },
          milestones: {
            orderBy: { order: 'asc' }
          },
          requiredForms: true
        }
      })
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('[SERVICE_TEMPLATE_PATCH]', error)
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
    if (!user || !rolePermissions[userRole].canManageServices) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { id } = await params
    // Check if template has active services
    const template = await prisma.serviceTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: { services: true }
        }
      }
    })

    if (!template) {
      return new NextResponse("Template not found", { status: 404 })
    }

    if (template._count.services > 0) {
      return new NextResponse("Cannot delete template with active services", { status: 400 })
    }

    await prisma.serviceTemplate.delete({
      where: { id: id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[SERVICE_TEMPLATE_DELETE]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}