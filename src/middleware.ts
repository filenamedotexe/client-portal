import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk'
])

export default clerkMiddleware((auth, request) => {
  // Allow public routes to pass through without authentication
  if (isPublicRoute(request)) {
    return
  }

  // Protect all other routes - user must be signed in
  auth.protect()

  // Additional role-based protection can be added here
  // This will be handled in the page components for better UX
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
} 