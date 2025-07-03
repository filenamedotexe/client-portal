# Client Portal Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or hosted)
- Clerk account

## Step 1: Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your environment variables:
   - Get Clerk keys from: https://dashboard.clerk.com
   - Set up your PostgreSQL database URL

## Step 2: Database Setup

1. Push the database schema:
```bash
npx prisma db push
```

2. (Optional) Run the setup script to create sample data:
```bash
npx tsx scripts/setup.ts
```

## Step 3: Clerk Configuration

### 3.1 Webhook Setup

1. Go to Clerk Dashboard > Webhooks
2. Click "Add Endpoint"
3. Set the endpoint URL: `https://your-domain.com/api/webhooks/clerk`
   - For local development, use ngrok: `https://xxxxx.ngrok.io/api/webhooks/clerk`
4. Select these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the signing secret and add to `.env` as `WEBHOOK_SECRET`

### 3.2 User Metadata Setup

Users need a role set in their public metadata. In Clerk Dashboard:

1. Go to Users
2. Click on a user
3. Click "Edit" on Public metadata
4. Add:
```json
{
  "role": "ADMIN"
}
```

Available roles: `ADMIN`, `MANAGER`, `CLIENT`

### 3.3 Create Test Users

Create at least one user for each role:

1. **Admin User**: Can manage everything
   - Email: admin@example.com
   - Metadata: `{"role": "ADMIN"}`

2. **Manager User**: Can view services and submit requests
   - Email: manager@example.com
   - Metadata: `{"role": "MANAGER"}`

3. **Client User**: Can view assigned services and submit requests
   - Email: client@example.com
   - Metadata: `{"role": "CLIENT"}`

## Step 4: Run the Application

1. Start the development server:
```bash
npm run dev
```

2. Visit http://localhost:3000

## Step 5: Test the Features

### Admin Features (login as admin)
1. Go to `/admin` - Admin Panel
2. Create service templates at `/admin/service-templates`
3. Build forms at `/admin/forms`
4. Assign services to clients at `/admin/services`

### Client Features (login as client)
1. View assigned services at `/services`
2. Submit requests at `/services/requests/new`
3. Complete assigned forms

## Troubleshooting

### Database Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env
- Try `npx prisma studio` to view data

### Clerk Webhook Issues
- Check webhook logs in Clerk Dashboard
- Ensure WEBHOOK_SECRET is correct
- For local testing, use ngrok or similar

### Permission Issues
- Verify user role in Clerk metadata
- Check rolePermissions in `/src/types/roles.ts`
- Ensure webhook is syncing users to database

## Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)