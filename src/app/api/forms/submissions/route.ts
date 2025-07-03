import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { rolePermissions } from '@/types/roles'

// Helper function to get user role from Clerk metadata or database
async function getUserRole(userId: string, dbUser: { role?: string } | null) {
  try {
    const clerkUser = await currentUser()
    const clerkRole = clerkUser?.publicMetadata?.role as string
    
    // Use Clerk metadata role if available, otherwise fallback to database role
    return (clerkRole || dbUser?.role || 'CLIENT').toLowerCase() as keyof typeof rolePermissions
  } catch (error) {
    console.error('Error getting user role:', error)
    return (dbUser?.role || 'CLIENT').toLowerCase() as keyof typeof rolePermissions
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

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const body = await req.json()
    const { formId, data } = body

    // Verify the user has access to this form
    const assignedForm = await prisma.assignedForm.findFirst({
      where: {
        formId,
        service: {
          clientId: user.id
        }
      }
    })

    if (!assignedForm) {
      return new NextResponse("Form not found or access denied", { status: 404 })
    }

    const submission = await prisma.formSubmission.create({
      data: {
        formId,
        userId: user.id,
        data
      },
      include: {
        form: true,
        user: true
      }
    })

    return NextResponse.json(submission)
  } catch (error) {
    console.error('[FORM_SUBMISSION_POST]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url)
    const formId = searchParams.get('formId')

    const where: { formId?: string; userId?: string } = {}
    
    if (formId) {
      where.formId = formId
    }

    // Non-admins can only see their own submissions
    const userRole = await getUserRole(userId, user)
    if (userRole !== 'admin') {
      where.userId = user.id
    }

    const submissions = await prisma.formSubmission.findMany({
      where,
      include: {
        form: true,
        user: true
      },
      orderBy: { submittedAt: 'desc' }
    })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error('[FORM_SUBMISSIONS_GET]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}