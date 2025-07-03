import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting database setup...')
  
  try {
    // Check database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Example: Create default form templates
    const onboardingForm = await prisma.formTemplate.create({
      data: {
        name: 'Client Onboarding Form',
        description: 'Initial information gathering for new clients',
        fields: {
          sections: [
            {
              title: 'Company Information',
              fields: [
                { id: 'company_name', type: 'text', label: 'Company Name', required: true },
                { id: 'company_email', type: 'email', label: 'Company Email', required: true },
                { id: 'company_phone', type: 'phone', label: 'Company Phone', required: true },
                { id: 'company_website', type: 'text', label: 'Website URL', required: false }
              ]
            },
            {
              title: 'Project Details',
              fields: [
                { id: 'project_type', type: 'select', label: 'Project Type', required: true, options: ['Website', 'Mobile App', 'Marketing', 'Other'] },
                { id: 'project_description', type: 'textarea', label: 'Project Description', required: true },
                { id: 'timeline', type: 'select', label: 'Expected Timeline', required: true, options: ['1-2 months', '3-4 months', '5-6 months', '6+ months'] }
              ]
            }
          ]
        },
        isTemplate: true
      }
    })
    
    console.log('✅ Created onboarding form template:', onboardingForm.name)
    
    // Create a sample service template
    const websiteTemplate = await prisma.serviceTemplate.create({
      data: {
        name: 'Website Development Package',
        description: 'Complete website development service including design, development, and deployment',
        tasks: {
          create: [
            { title: 'Initial Consultation', description: 'Discuss project requirements and goals', order: 0 },
            { title: 'Design Mockups', description: 'Create initial design concepts', order: 1 },
            { title: 'Design Revisions', description: 'Refine designs based on feedback', order: 2 },
            { title: 'Development Phase 1', description: 'Build core functionality', order: 3 },
            { title: 'Development Phase 2', description: 'Implement additional features', order: 4 },
            { title: 'Testing & QA', description: 'Comprehensive testing and bug fixes', order: 5 },
            { title: 'Deployment', description: 'Deploy to production environment', order: 6 },
            { title: 'Post-Launch Support', description: '30-day support period', order: 7 }
          ]
        },
        milestones: {
          create: [
            { title: 'Project Kickoff', description: 'Project officially begins', order: 0 },
            { title: 'Design Approval', description: 'Client approves final designs', order: 1 },
            { title: 'Beta Launch', description: 'Beta version available for testing', order: 2 },
            { title: 'Go Live', description: 'Website launched to public', order: 3 }
          ]
        },
        requiredForms: {
          connect: { id: onboardingForm.id }
        }
      }
    })
    
    console.log('✅ Created service template:', websiteTemplate.name)
    
    console.log('\n🎉 Database setup completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Set up Clerk webhook in your Clerk Dashboard')
    console.log('2. Add user role metadata in Clerk Dashboard')
    console.log('3. Create test users with different roles (admin, manager, client)')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()