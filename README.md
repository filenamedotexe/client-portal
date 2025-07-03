# Client Portal

A modern, responsive client portal built with Next.js, TypeScript, Tailwind CSS, Shadcn UI, and Clerk authentication. Features role-based access control for Admin, Manager, and Client users.

## Features

- **🔐 Role-Based Authentication**: Three distinct user roles with granular permissions
  - **Admin**: Full system access, user management, system settings
  - **Manager**: Project oversight, reports, team coordination
  - **Client**: Limited access to personal projects and documents

- **🎨 Modern UI**: Built with Shadcn UI components and Tailwind CSS
- **📱 Responsive Design**: Mobile-first approach with responsive layouts
- **⚡ Performance**: Built on Next.js 14 with App Router
- **🔒 Secure**: Powered by Clerk authentication with middleware protection
- **🎯 TypeScript**: Fully typed for better development experience

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Authentication**: Clerk
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Clerk account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd client-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.sample .env.local
   ```

4. **Configure Clerk Authentication**
   - Go to [Clerk Dashboard](https://clerk.com/)
   - Create a new application
   - Copy your publishable key and secret key
   - Update `.env.local` with your keys:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   CLERK_SECRET_KEY=sk_test_your_key_here
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## User Roles & Permissions

### Admin
- ✅ View admin panel
- ✅ Manage users and roles
- ✅ View all reports
- ✅ Edit all projects
- ✅ Access own data
- ✅ System configuration

### Manager
- ❌ View admin panel
- ❌ Manage users
- ✅ View reports
- ✅ Edit projects
- ✅ Access own data

### Client
- ❌ View admin panel
- ❌ Manage users
- ❌ View reports
- ❌ Edit projects
- ✅ Access own data

## Setting User Roles

To assign roles to users in Clerk:

1. Go to your Clerk Dashboard
2. Navigate to Users
3. Select a user
4. Go to the "Metadata" tab
5. Add public metadata:
   ```json
   {
     "role": "admin"
   }
   ```
   Replace "admin" with "manager" or "client" as needed.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin-only pages
│   ├── dashboard/         # Main dashboard
│   ├── sign-in/           # Authentication pages
│   ├── sign-up/           
│   └── layout.tsx         # Root layout with Clerk provider
├── components/
│   ├── ui/                # Shadcn UI components
│   └── navigation.tsx     # Role-based navigation
├── lib/
│   ├── roles.ts           # Role utilities and permissions
│   └── utils.ts           # General utilities
├── types/
│   └── roles.ts           # TypeScript role definitions
└── middleware.ts          # Clerk middleware for route protection
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Customization

### Adding New Roles

1. Update `src/types/roles.ts` with new role type
2. Add permissions in `rolePermissions` object
3. Update role utilities in `src/lib/roles.ts`
4. Modify navigation component to show appropriate menu items

### Adding New Pages

1. Create page in appropriate directory under `src/app/`
2. Add route protection logic using `usePermissions` hook
3. Update navigation component if needed

### Styling

The project uses Tailwind CSS with Shadcn UI components. You can:
- Modify `tailwind.config.js` for custom themes
- Update `src/app/globals.css` for global styles
- Customize Shadcn components in `src/components/ui/`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Make sure to:
- Set environment variables
- Build the project (`npm run build`)
- Serve the `.next` folder

## Environment Variables Reference

```env
# Required - Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional - Clerk URLs (defaults provided)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please create an issue in the GitHub repository or contact the development team.
