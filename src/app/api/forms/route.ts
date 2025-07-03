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

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    // Auto-create user if they don't exist in database
    if (!user) {
      // Get user info from Clerk
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return new NextResponse("User not found", { status: 404 })
      }

      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
          role: 'CLIENT' // Default role - can be changed later by admin
        }
      })
    }

    const userRole = await getUserRole(userId, user)
    if (rolePermissions[userRole].canManageForms) {
      // Admins see all forms
      const forms = await prisma.formTemplate.findMany({
        include: {
          _count: {
            select: {
              submissions: true,
              assignedForms: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(forms)
    } else {
      // Clients see only their assigned forms
      const assignedForms = await prisma.assignedForm.findMany({
        where: {
          service: {
            clientId: user.id
          }
        },
        include: {
          form: true,
          service: true
        }
      })
      return NextResponse.json(assignedForms)
    }
  } catch (error) {
    console.error('[FORMS_GET]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    // Auto-create user if they don't exist in database
    if (!user) {
      // Get user info from Clerk
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return new NextResponse("User not found", { status: 404 })
      }

      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
          role: 'CLIENT' // Default role - can be changed later by admin
        }
      })
    }

    const userRole = await getUserRole(userId, user)
    if (!rolePermissions[userRole].canManageForms) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const { name, description, fields } = body

    const form = await prisma.formTemplate.create({
      data: {
        name,
        description,
        fields: fields || {},
        isTemplate: true
      }
    })

    return NextResponse.json(form)
  } catch (error) {
    console.error('[FORMS_POST]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}