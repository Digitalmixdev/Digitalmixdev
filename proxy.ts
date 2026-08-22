import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/about(.*)',
  '/blog(.*)',
  '/login(.*)',
  '/signup(.*)',
  '/tools(.*)',
  '/privacy-policy(.*)',
  '/terms(.*)',
  '/api/webhook(.*)',
  '/sitemap.xml',
  '/robots.txt',
])

export default clerkMiddleware(async (auth, request) => {
  const url = new URL(request.url)
  
  if (url.pathname === '/sitemap.xml' || url.pathname === '/robots.txt') {
    return;
  }

  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|txt)).*)',
    '/(api|trpc)(.*)',
  ],
}