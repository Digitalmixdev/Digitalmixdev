import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken } from '@/lib/auth/jwt'
import { SESSION_COOKIE_NAME } from '@/lib/auth/session'

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/favorites']

// Auth routes (redirect logged-in users away from these)
const authRoutes = ['/login', '/signup']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignore static assets, sitemaps, robots, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname === '/site.webmanifest' ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/og-image')
  ) {
    return NextResponse.next()
  }

  // Get session token from cookie
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token) : null
  const isAuthenticated = Boolean(session?.userId)

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  // Redirect unauthenticated users attempting to access protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)
    const loginUrl = new URL(`/login?callbackUrl=${callbackUrl}`, request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users attempting to access login or signup pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Next.js 16 supports default export or named export for proxy
export default proxy

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|txt)).*)',
    '/(api|trpc)(.*)',
  ],
}