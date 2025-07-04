import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { rolePermissions } from '@/types/roles'

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where = activeOnly ? { isActive: true } : {}

    const templates = await prisma.serviceTemplate.findMany({
      where,
      include: {
        tasks: {
          orderBy: { order: 'asc' }
        },
        milestones: {
          orderBy: { order: 'asc' }
        },
        requiredForms: true,
        _count: {
          select: { 
            services: true,
            tasks: true,
            milestones: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('[SERVICE_TEMPLATES_GET]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
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

    const body = await req.json()
    const { name, description, tasks = [], milestones = [], requiredFormIds = [], isActive = true } = body

    const template = await prisma.serviceTemplate.create({
      data: {
        name,
        description,
        isActive,
        tasks: tasks.length > 0 ? {
          create: tasks.map((task: { title: string; description?: string }, index: number) => ({
            title: task.title,
            description: task.description,
            order: index
          }))
        } : undefined,
        milestones: milestones.length > 0 ? {
          create: milestones.map((milestone: { title: string; description?: string }, index: number) => ({
            title: milestone.title,
            description: milestone.description,
            order: index
          }))
        } : undefined,
        requiredForms: requiredFormIds.length > 0 ? {
          connect: requiredFormIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        tasks: true,
        milestones: true,
        requiredForms: true
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('[SERVICE_TEMPLATES_POST]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}