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
    
    // Only admins and managers can view user lists
    if (!user || (!rolePermissions[userRole].canManageUsers && !rolePermissions[userRole].canAssignServices)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role')
    const includeServices = searchParams.get('includeServices') === 'true'

    const where = role ? { role: role.toUpperCase() } : {}

    if (includeServices) {
      const usersWithServices = await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedServices: {
            where: {
              status: 'ACTIVE'
            }
          }
        }
      })
      
      const formattedUsers = usersWithServices.map((user) => ({
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        activeServices: user.assignedServices.length,
        createdAt: user.createdAt.toISOString()
      }))
      
      return NextResponse.json(formattedUsers)
    } else {
      const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      })
      
      const formattedUsers = users.map((user) => ({
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        activeServices: undefined,
        createdAt: user.createdAt.toISOString()
      }))
      
      return NextResponse.json(formattedUsers)
    }
  } catch (error) {
    console.error('[USERS_GET]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}