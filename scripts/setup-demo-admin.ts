// Run this script with: npx tsx scripts/setup-demo-admin.ts
// This will set the current logged-in user as admin when accessing /api/set-admin

console.log(`
===========================================
ADMIN SETUP INSTRUCTIONS
===========================================

To set yourself as an admin:

1. Make sure the development server is running:
   npm run dev

2. Log in to the application with your account

3. Visit this URL in your browser:
   http://localhost:3000/api/set-admin

4. You should see a success message

5. Refresh the page and you'll see the Admin Panel in the navigation

Note: This only works for the currently logged-in user.
To set other users as admin/manager, you'll need to use the Clerk dashboard.

===========================================
`)