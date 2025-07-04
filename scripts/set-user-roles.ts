// Run this script with: npx tsx scripts/set-user-roles.ts

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })

import { clerkClient } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setUserRoles() {
  try {
    console.log('Setting user roles in Clerk metadata...')
    
    // Get all users from database
    const users = await prisma.user.findMany()
    const clerk = await clerkClient()
    
    for (const user of users) {
      const role = user.role.toLowerCase()
      console.log(`Setting ${user.email} as ${role}...`)
      
      try {
        await clerk.users.updateUserMetadata(user.clerkId, {
          publicMetadata: {
            role: role
          }
        })
        console.log(`✓ ${user.email} set as ${role}`)
      } catch (error) {
        console.error(`✗ Failed to set role for ${user.email}:`, error)
      }
    }
    
    console.log('User roles updated successfully!')
  } catch (error) {
    console.error('Error setting user roles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setUserRoles()