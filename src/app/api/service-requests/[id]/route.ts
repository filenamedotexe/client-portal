import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { rolePermissions } from '@/types/roles'

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
    
    // Only admins and managers can update request status
    if (!user || (!rolePermissions[userRole].canAssignServices && !rolePermissions[userRole].canManageServices)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const { status } = body
    const { id } = await params

    // Validate status
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
    if (!validStatuses.includes(status)) {
      return new NextResponse("Invalid status", { status: 400 })
    }

    const request = await prisma.serviceRequest.update({
      where: { id },
      data: {
        status,
        ...(status === 'RESOLVED' ? { resolvedAt: new Date() } : {})
      },
      include: {
        client: true,
        service: true
      }
    })

    return NextResponse.json(request)
  } catch (error) {
    console.error('[SERVICE_REQUEST_PATCH]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}