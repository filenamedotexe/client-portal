import { createClerkClient } from '@clerk/backend'
import { prisma } from '../src/lib/db'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!
})

async function syncCurrentUser() {
  try {
    // Get all users from Clerk
    const clerkUsers = await clerkClient.users.getUserList()
    
    console.log(`Found ${clerkUsers.data.length} users in Clerk`)
    
    for (const clerkUser of clerkUsers.data) {
      const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
      
      if (!email) {
        console.log(`Skipping user ${clerkUser.id} - no email found`)
        continue
      }
      
      const role = (clerkUser.publicMetadata?.role as string) || 'CLIENT'
      
      // Create or update user in database
      const user = await prisma.user.upsert({
        where: { clerkId: clerkUser.id },
        update: {
          email,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email,
          role: role as 'ADMIN' | 'MANAGER' | 'CLIENT'
        },
        create: {
          clerkId: clerkUser.id,
          email,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email,
          role: role as 'ADMIN' | 'MANAGER' | 'CLIENT'
        }
      })
      
      console.log(`Synced user: ${user.email} (${user.role})`)
      
      // Create client profile if user is a client and doesn't have one
      if (user.role === 'CLIENT') {
        const existingProfile = await prisma.clientProfile.findUnique({
          where: { userId: user.id }
        })
        
        if (!existingProfile) {
          await prisma.clientProfile.create({
            data: {
              userId: user.id,
              businessName: user.name,
              phoneNumber: '',
              workHours: '',
              logoUrl: '',
              customFont: '',
              brandColor1: '#3B82F6',
              brandColor2: '#10B981',
              brandColor3: '#F59E0B',
              brandColor4: '#F3F4F6'
            }
          })
          console.log(`Created client profile for ${user.email}`)
        }
      }
    }
    
    console.log('User sync completed!')
  } catch (error) {
    console.error('Error syncing users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

syncCurrentUser()