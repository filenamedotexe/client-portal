# Role Management Guide

## Overview

The application has three user roles:
- **Admin**: Full access to all features including user management, service templates, and forms
- **Manager**: Can assign services and view all clients but cannot manage templates or users
- **Client**: Can only view their own services and submit requests

## Navigation Differences by Role

### Admin/Manager Navigation
- Dashboard
- Service Management (goes to `/admin/services`)
- Clients
- Forms (Admin only)
- Admin Panel

### Client Navigation
- Dashboard
- Services (goes to `/services`)

## How Roles Work

1. Roles are stored in the database (`User.role` field)
2. Role permissions are checked via Clerk's publicMetadata
3. The default role for new users is 'CLIENT'

## Setting User Roles

### Method 1: API Endpoint (For Development)

To set yourself as admin:
1. Start the dev server: `npm run dev`
2. Log in to the application
3. Visit: `http://localhost:3000/api/set-admin`
4. Refresh the page to see admin navigation

### Method 2: Clerk Dashboard (Recommended for Production)

1. Go to your Clerk dashboard
2. Navigate to Users
3. Click on a user
4. Edit their public metadata
5. Add: `{ "role": "admin" }` (or "manager" or "client")

### Method 3: Database + Script

The database stores the authoritative role, but Clerk metadata needs to be synced.
A script is provided at `scripts/set-user-roles.ts` but requires Clerk secret key configuration.

## Known Issues Fixed

1. **Services Navigation**: Previously showed the same `/services` link for all users. Now shows:
   - `/services` for clients only
   - `/admin/services` for admin/manager as "Service Management"

2. **Client Display**: Fixed missing client names in admin views by computing display names from firstName/lastName or email

3. **Role Sync**: Roles default to 'client' if not set in Clerk metadata

## Testing Different Roles

1. Create test users with different emails
2. Set their roles using the methods above
3. Log in as each user to test the different experiences

## Permissions Reference

See `src/types/roles.ts` for the complete permission matrix.