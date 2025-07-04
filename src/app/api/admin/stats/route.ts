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

    const userRole = user.role.toLowerCase() as keyof typeof rolePermissions
    if (!rolePermissions[userRole].canViewAdminPanel) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Calculate the date for "this month"
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Fetch all stats in parallel
    const [
      totalUsers,
      newUsersThisMonth,
      recentUsers,
      recentServices,
      recentForms
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // New users this month
      prisma.user.count({
        where: {
          createdAt: {
            gte: firstDayOfMonth
          }
        }
      }),
      
      // Recent user activity
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true
        }
      }),
      
      // Recent service activity
      prisma.service.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          updatedAt: true,
          template: {
            select: { name: true }
          }
        }
      }),
      
      // Recent form activity
      prisma.formTemplate.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true
        }
      })
    ])

    // Calculate storage (mock for now - in production, you'd query actual DB size)
    const storageUsed = "2.4GB" // This would be calculated from actual DB

    // Combine recent activity
    const recentActivity = [
      ...recentUsers.map(u => ({
        id: u.id,
        type: 'user' as const,
        title: `New user: ${u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : u.email}`,
        timestamp: u.createdAt.toISOString()
      })),
      ...recentServices.map(s => ({
        id: s.id,
        type: 'service' as const,
        title: `Service ${s.status.toLowerCase()}: ${s.name || s.template?.name}`,
        timestamp: s.updatedAt.toISOString()
      })),
      ...recentForms.map(f => ({
        id: f.id,
        type: 'form' as const,
        title: `Form ${f.createdAt === f.updatedAt ? 'created' : 'updated'}: ${f.name}`,
        timestamp: f.updatedAt.toISOString()
      }))
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)

    const stats = {
      totalUsers,
      newUsersThisMonth,
      activeSessions: Math.floor(totalUsers * 0.3), // Mock active sessions
      storageUsed,
      systemHealth: 'healthy' as const,
      recentActivity
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[ADMIN_STATS_GET]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}