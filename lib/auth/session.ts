import { cookies } from 'next/headers'
import { verifySessionToken, type SessionUser } from './jwt'
import { prisma } from '@/lib/prisma'

export const SESSION_COOKIE_NAME = 'auth_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface Session {
  user: SessionUser
}

/**
 * Set the HTTP-only session cookie with the given JWT token
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

/**
 * Delete the session cookie (logout)
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Get current decoded session from cookies (Server Components, Server Actions, Route Handlers)
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const payload = await verifySessionToken(token)
    if (!payload) {
      return null
    }

    return {
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      },
    }
  } catch {
    return null
  }
}

/**
 * Fetch the full, fresh user record from the database for the current session
 */
export async function getCurrentUser() {
  const session = await getSession()
  if (!session?.user?.id) return null

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      toolsUsedCount: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}
