import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create test users
  const testClients = [
    {
      clerkId: 'test_client_1',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'CLIENT' as const
    },
    {
      clerkId: 'test_client_2',
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'CLIENT' as const
    },
    {
      clerkId: 'test_client_3',
      email: 'bob.wilson@example.com',
      firstName: 'Bob',
      lastName: 'Wilson',
      role: 'CLIENT' as const
    }
  ]

  console.log('Creating test clients...')
  for (const client of testClients) {
    await prisma.user.upsert({
      where: { clerkId: client.clerkId },
      update: {},
      create: client
    })
  }

  // Create a test service template
  console.log('Creating test service template...')
  await prisma.serviceTemplate.create({
    data: {
      name: 'Website Development Package',
      description: 'Complete website development service including design, development, and deployment',
      isActive: true,
      tasks: {
        create: [
          {
            title: 'Initial Consultation',
            description: 'Meet with client to discuss requirements',
            order: 0
          },
          {
            title: 'Design Mockups',
            description: 'Create initial design mockups for approval',
            order: 1
          },
          {
            title: 'Development',
            description: 'Build the website according to approved designs',
            order: 2
          },
          {
            title: 'Testing',
            description: 'Test website functionality and responsiveness',
            order: 3
          },
          {
            title: 'Deployment',
            description: 'Deploy website to production',
            order: 4
          }
        ]
      },
      milestones: {
        create: [
          {
            title: 'Design Approved',
            description: 'Client has approved the design mockups',
            order: 0
          },
          {
            title: 'Development Complete',
            description: 'Website development is complete',
            order: 1
          },
          {
            title: 'Site Live',
            description: 'Website is deployed and live',
            order: 2
          }
        ]
      }
    }
  })

  console.log('Test data created successfully!')
  console.log('- Created 3 test clients')
  console.log('- Created 1 service template')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })