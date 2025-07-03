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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    // Auto-create user if they don't exist in database
    if (!user) {
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return new NextResponse("User not found", { status: 404 })
      }

      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
          role: 'CLIENT'
        }
      })
    }

    const userRole = await getUserRole(userId, user)
    if (!rolePermissions[userRole].canManageForms) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const form = await prisma.formTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            submissions: true,
            assignedForms: true
          }
        }
      }
    })

    if (!form) {
      return new NextResponse("Form not found", { status: 404 })
    }

    return NextResponse.json(form)
  } catch (error) {
    console.error('[FORM_GET]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    // Auto-create user if they don't exist in database
    if (!user) {
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return new NextResponse("User not found", { status: 404 })
      }

      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
          role: 'CLIENT'
        }
      })
    }

    const userRole = await getUserRole(userId, user)
    if (!rolePermissions[userRole].canManageForms) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const { name, description, fields } = body

    // Check if form exists
    const existingForm = await prisma.formTemplate.findUnique({
      where: { id }
    })

    if (!existingForm) {
      return new NextResponse("Form not found", { status: 404 })
    }

    const form = await prisma.formTemplate.update({
      where: { id },
      data: {
        name,
        description,
        fields: fields || {},
        updatedAt: new Date()
      }
    })

    return NextResponse.json(form)
  } catch (error) {
    console.error('[FORM_PUT]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    // Auto-create user if they don't exist in database
    if (!user) {
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return new NextResponse("User not found", { status: 404 })
      }

      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
          role: 'CLIENT'
        }
      })
    }

    const userRole = await getUserRole(userId, user)
    if (!rolePermissions[userRole].canManageForms) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Check if form exists
    const existingForm = await prisma.formTemplate.findUnique({
      where: { id }
    })

    if (!existingForm) {
      return new NextResponse("Form not found", { status: 404 })
    }

    await prisma.formTemplate.delete({
      where: { id }
    })

    return new NextResponse("Form deleted", { status: 200 })
  } catch (error) {
    console.error('[FORM_DELETE]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 