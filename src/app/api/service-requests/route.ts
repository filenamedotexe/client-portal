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

    // Get requests based on user role
    const userRole = user.role.toLowerCase() as keyof typeof rolePermissions
    const where = rolePermissions[userRole].canViewAllServices 
      ? {} 
      : { clientId: user.id }

    const requests = await prisma.serviceRequest.findMany({
      where,
      include: {
        client: true,
        service: {
          include: {
            template: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Add computed client names
    const requestsWithClientNames = requests.map(request => ({
      ...request,
      client: {
        ...request.client,
        name: `${request.client.firstName || ''} ${request.client.lastName || ''}`.trim() || request.client.email
      }
    }))

    return NextResponse.json(requestsWithClientNames)
  } catch (error) {
    console.error('[SERVICE_REQUESTS_GET]', error)
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
    if (!user || !rolePermissions[userRole].canSubmitRequests) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const { title, description, serviceId, priority } = body

    const request = await prisma.serviceRequest.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        serviceId: serviceId === 'general' ? null : serviceId,
        clientId: user.id
      },
      include: {
        client: true,
        service: true
      }
    })

    return NextResponse.json(request)
  } catch (error) {
    console.error('[SERVICE_REQUESTS_POST]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}