# Service Area Documentation

## Overview

The service area is a comprehensive system for managing client services, including service templates, form assignments, and request handling.

## Key Features

### For Admins

1. **Service Templates Management** (`/admin/service-templates`)
   - Create reusable service templates with tasks and milestones
   - Assign required forms to templates
   - Track which services use each template

2. **Drag-and-Drop Form Builder** (`/admin/forms`)
   - Create custom forms with various field types
   - Visual form builder with real-time preview
   - Form templates can be assigned to services

3. **Service Assignment** (`/admin/services`)
   - Assign service templates to specific clients
   - Monitor active services across all clients
   - Manage service lifecycle (Active, Paused, Completed, Cancelled)

### For Clients

1. **Services Dashboard** (`/services`)
   - View assigned services with progress tracking
   - Access service-specific forms
   - Monitor tasks and milestones

2. **Service Requests** (`/services/requests/new`)
   - Submit requests related to specific services or general inquiries
   - Set priority levels
   - Track request status

## Database Schema

### Core Models

- **ServiceTemplate**: Reusable templates with predefined tasks, milestones, and required forms
- **Service**: Instances of templates assigned to specific clients
- **FormTemplate**: Custom forms created with the form builder
- **ServiceRequest**: Client-submitted requests linked to services

## API Endpoints

- `GET/POST /api/service-templates` - Manage service templates
- `GET/POST /api/services` - Manage service assignments
- `GET/POST /api/forms` - Manage form templates
- `GET/POST /api/service-requests` - Handle service requests
- `POST /api/forms/submissions` - Submit form data

## Setup Instructions

1. **Database Setup**
   ```bash
   # Set DATABASE_URL in .env
   npx prisma generate
   npx prisma db push
   ```

2. **Clerk Webhook Setup**
   - Go to Clerk Dashboard > Webhooks
   - Create endpoint pointing to `/api/webhooks/clerk`
   - Add the signing secret to `.env` as `WEBHOOK_SECRET`
   - Enable user.created, user.updated, and user.deleted events

3. **User Roles**
   - Set user roles in Clerk Dashboard under user metadata
   - Available roles: ADMIN, MANAGER, CLIENT

## Permissions

- **Admins**: Full access to all service management features
- **Managers**: Can submit requests, view own services
- **Clients**: Can view assigned services and submit requests