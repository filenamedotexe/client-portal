import { Vercel } from '@vercel/sdk';

async function main() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error('VERCEL_TOKEN environment variable is not set.');
  }

  const client = new Vercel({ bearerToken: token });
  const projects = await client.projects.getProjects({ search: 'client-portal' });
  const project = projects.projects?.[0];
  
  if (!project) {
    throw new Error('Project "client-portal" not found');
  }

  const envs = [
    { type: 'secret' as const, key: 'DATABASE_URL', value: 'postgresql://neondb_owner:npg_F2fsxHgwln4j@ep-bitter-bread-a8browe6-pooler.eastus2.azure.neon.tech/neondb?sslmode=require', target: ['production', 'preview', 'development'] as const },
    { type: 'secret' as const, key: 'CLERK_SECRET_KEY', value: 'sk_test_xMcgukD12MzbBL8xTruF0IVWzYg6Bdldobj2iCIK62', target: ['production', 'preview', 'development'] as const },
    { type: 'plain' as const, key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', value: 'pk_test_cGxlYXNlZC1weXRob24tNDQuY2xlcmsuYWNjb3VudHMuZGV2JA', target: ['production', 'preview', 'development'] as const },
    { type: 'plain' as const, key: 'NEXT_PUBLIC_CLERK_SIGN_IN_URL', value: '/sign-in', target: ['production', 'preview', 'development'] as const },
    { type: 'plain' as const, key: 'NEXT_PUBLIC_CLERK_SIGN_UP_URL', value: '/sign-up', target: ['production', 'preview', 'development'] as const },
  ];

  for (const env of envs) {
    console.log(`Adding ${env.key}...`);
    await client.projects.createProjectEnv({
      idOrName: project.id,
      requestBody: {
        key: env.key,
        value: env.value,
        type: env.type,
        target: [...env.target]
      }
    });
    console.log(`Added ${env.key} successfully.`);
  }

  console.log('All environment variables added successfully.');
}

main().catch(console.error); 