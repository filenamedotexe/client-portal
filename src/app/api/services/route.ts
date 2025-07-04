import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { rolePermissions } from '@/types/roles'

export async function GET() {
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

    // Get services based on user role
    const userRole = user.role.toLowerCase() as keyof typeof rolePermissions
    const where = rolePermissions[userRole].canViewAllServices 
      ? {} 
      : { clientId: user.id }

    const services = await prisma.service.findMany({
      where,
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
          where: {
            status: { in: ['OPEN', 'IN_PROGRESS'] }
          }
        },
        forms: {
          include: {
            form: true
          }
        },
        _count: {
          select: {
            tasks: true,
            milestones: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Add computed client name to services
    const servicesWithClientNames = services.map(service => ({
      ...service,
      client: {
        ...service.client,
        name: `${service.client.firstName || ''} ${service.client.lastName || ''}`.trim() || service.client.email
      }
    }))

    return NextResponse.json(servicesWithClientNames)
  } catch (error) {
    console.error('[SERVICES_GET]', error)
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
    if (!user || !rolePermissions[userRole].canAssignServices) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const { name, description, templateId, clientId, startDate, endDate } = body

    // Get the template with all related data
    const template = await prisma.serviceTemplate.findUnique({
      where: { id: templateId },
      include: {
        tasks: true,
        milestones: true,
        requiredForms: true
      }
    })

    if (!template) {
      return new NextResponse("Template not found", { status: 404 })
    }

    // Create the service with all related data
    const service = await prisma.service.create({
      data: {
        name,
        description,
        templateId,
        clientId,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined,
        // Create service tasks from template tasks
        tasks: {
          create: template.tasks.map(task => ({
            taskId: task.id,
            status: 'PENDING'
          }))
        },
        // Create service milestones from template milestones
        milestones: {
          create: template.milestones.map(milestone => ({
            milestoneId: milestone.id,
            achieved: false
          }))
        },
        // Assign required forms
        forms: {
          create: template.requiredForms.map(form => ({
            formId: form.id,
            required: true
          }))
        }
      },
      include: {
        client: true,
        template: true,
        tasks: {
          include: { task: true }
        },
        milestones: {
          include: { milestone: true }
        },
        forms: {
          include: { form: true }
        }
      }
    })

    // Add computed client name
    const serviceWithClientName = {
      ...service,
      client: {
        ...service.client,
        name: `${service.client.firstName || ''} ${service.client.lastName || ''}`.trim() || service.client.email
      }
    }

    return NextResponse.json(serviceWithClientName)
  } catch (error) {
    console.error('[SERVICES_POST]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}