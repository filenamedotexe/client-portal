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
    const isAdmin = rolePermissions[userRole].canViewAllServices

    // Build queries based on user role
    const servicesWhere = isAdmin ? {} : { clientId: user.id }
    const requestsWhere = isAdmin ? {} : { clientId: user.id }

    // Fetch all data in parallel
    const [
      services,
      requests,
      forms,
      milestones,
      recentRequests,
      recentServices,
      recentSubmissions
    ] = await Promise.all([
      // Services
      prisma.service.findMany({
        where: servicesWhere,
        select: { id: true, status: true }
      }),
      
      // Service Requests
      prisma.serviceRequest.findMany({
        where: requestsWhere,
        select: { id: true, status: true, priority: true }
      }),
      
      // Forms (for clients: assigned forms; for admins: all forms)
      isAdmin 
        ? prisma.formTemplate.count()
        : prisma.assignedForm.count({
            where: {
              service: {
                clientId: user.id,
                status: 'ACTIVE'
              }
            }
          }),
      
      // Milestones
      prisma.serviceMilestone.findMany({
        where: {
          service: servicesWhere
        },
        select: {
          id: true,
          achieved: true,
          achievedAt: true,
          milestone: true
        }
      }),
      
      // Recent activity - Service Requests
      prisma.serviceRequest.findMany({
        where: requestsWhere,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true,
          status: true
        }
      }),
      
      // Recent activity - Services
      prisma.service.findMany({
        where: servicesWhere,
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          updatedAt: true,
          status: true,
          template: {
            select: { name: true }
          }
        }
      }),
      
      // Recent activity - Form Submissions
      prisma.formSubmission.findMany({
        where: isAdmin ? {} : { userId: user.id },
        orderBy: { submittedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          submittedAt: true,
          form: {
            select: { name: true }
          }
        }
      })
    ])

    // Calculate stats
    const activeServices = services.filter(s => s.status === 'ACTIVE').length
    const openRequests = requests.filter(r => r.status === 'OPEN' || r.status === 'IN_PROGRESS').length
    const urgentRequests = requests.filter(r => r.priority === 'URGENT' && (r.status === 'OPEN' || r.status === 'IN_PROGRESS')).length
    
    // Calculate milestone stats
    const achievedMilestones = milestones.filter(m => m.achieved).length
    const upcomingMilestones = milestones.filter(m => !m.achieved).length

    // For clients, count pending forms that haven't been submitted
    let pendingForms = 0
    if (!isAdmin) {
      const assignedForms = await prisma.assignedForm.findMany({
        where: {
          service: {
            clientId: user.id,
            status: 'ACTIVE'
          },
          required: true
        },
        include: {
          form: {
            include: {
              submissions: {
                where: { userId: user.id }
              }
            }
          }
        }
      })
      pendingForms = assignedForms.filter(af => af.form.submissions.length === 0).length
    } else {
      pendingForms = forms as number
    }

    // Combine and sort recent activity
    const recentActivity = [
      ...recentRequests.map(r => ({
        id: r.id,
        type: 'request' as const,
        title: `Service request: ${r.title}`,
        timestamp: r.createdAt.toISOString()
      })),
      ...recentServices.map(s => ({
        id: s.id,
        type: 'service' as const,
        title: `Service ${s.status.toLowerCase()}: ${s.name || s.template?.name}`,
        timestamp: s.updatedAt.toISOString()
      })),
      ...recentSubmissions.map(s => ({
        id: s.id,
        type: 'form' as const,
        title: `Form submitted: ${s.form.name}`,
        timestamp: s.submittedAt.toISOString()
      }))
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)

    const dashboardData = {
      services: {
        total: services.length,
        active: activeServices
      },
      requests: {
        total: requests.length,
        open: openRequests,
        urgent: urgentRequests
      },
      forms: {
        total: forms,
        pending: pendingForms
      },
      milestones: {
        total: milestones.length,
        upcoming: upcomingMilestones,
        achieved: achievedMilestones
      },
      recentActivity
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('[DASHBOARD_GET]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}