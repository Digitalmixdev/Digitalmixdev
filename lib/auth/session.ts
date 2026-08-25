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
  try {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })
  } catch (err) {
    console.warn('[Session] Failed to set cookie:', err)
  }
}

/**
 * Delete the session cookie (logout)
 */
export async function clearSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 0,
    })
  } catch (err) {
    console.warn('[Session] Failed to clear cookie:', err)
  }
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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarData: true,
        emailNotifications: true,
        themePreference: true,
        role: true,
      },
    })

    if (!user) {
      const restoredUser: SessionUser = {
        id: payload.userId,
        email: payload.email,
        name: payload.name || null,
        avatarData: null,
        emailNotifications: true,
        themePreference: 'dark',
        role: payload.role || 'USER',
      }
      return { user: restoredUser }
    }

    return { user }
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarData: true,
      emailNotifications: true,
      themePreference: true,
      role: true,
      toolsUsedCount: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (user) return user

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    avatarData: session.user.avatarData ?? null,
    emailNotifications: session.user.emailNotifications ?? true,
    themePreference: session.user.themePreference ?? 'dark',
    role: session.user.role ?? 'USER',
    toolsUsedCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}
