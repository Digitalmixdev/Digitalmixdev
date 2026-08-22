'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { createSessionToken, type SessionUser } from '@/lib/auth/jwt'
import { setSessionCookie, clearSessionCookie, getSession } from '@/lib/auth/session'

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
})

const signupSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
})

export type ActionResult<T = unknown> = {
  success: boolean
  error?: string
  data?: T
}

/**
 * Log in an existing user with email and password
 */
export async function loginAction(values: {
  email: string
  password: string
}): Promise<ActionResult<{ user: SessionUser }>> {
  try {
    const validated = loginSchema.safeParse(values)
    if (!validated.success) {
      const firstError = validated.error.errors[0]?.message || 'Invalid input data'
      return { success: false, error: firstError }
    }

    const { email, password } = validated.data

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.passwordHash) {
      return { success: false, error: 'Invalid email or password' }
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password' }
    }

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    await setSessionCookie(token)

    return {
      success: true,
      data: { user: sessionUser },
    }
  } catch (error) {
    console.error('Login action error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred during login. Please try again.',
    }
  }
}

/**
 * Register a new user with name, email, and password
 */
export async function signupAction(values: {
  name?: string
  email: string
  password: string
}): Promise<ActionResult<{ user: SessionUser }>> {
  try {
    const validated = signupSchema.safeParse(values)
    if (!validated.success) {
      const firstError = validated.error.errors[0]?.message || 'Invalid input data'
      return { success: false, error: firstError }
    }

    const { name, email, password } = validated.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email already exists',
      }
    }

    const passwordHash = await hashPassword(password)

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name ? name.trim() : null,
        role: 'USER',
      },
    })

    const sessionUser: SessionUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    }

    const token = await createSessionToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    })

    await setSessionCookie(token)

    return {
      success: true,
      data: { user: sessionUser },
    }
  } catch (error) {
    console.error('Signup action error:', error)
    return {
      success: false,
      error: 'Failed to create your account. Please try again.',
    }
  }
}

/**
 * Log out current user and invalidate session cookie
 */
export async function logoutAction(): Promise<ActionResult> {
  try {
    await clearSessionCookie()
    return { success: true }
  } catch (error) {
    console.error('Logout action error:', error)
    return { success: false, error: 'Failed to log out' }
  }
}

/**
 * Get current session user for client components
 */
export async function getSessionAction(): Promise<SessionUser | null> {
  const session = await getSession()
  return session?.user || null
}
