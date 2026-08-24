'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSessionToken, type SessionUser } from '@/lib/auth/jwt'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { PASSWORD_RULE_MESSAGE, isStrongPassword } from '@/lib/auth/password-rules'
import { getSession, setSessionCookie } from '@/lib/auth/session'
import type { ActionResult } from '@/actions/auth'

const profileSchema = z.object({
  name: z.string().trim().max(80, { message: 'Display name must be 80 characters or fewer' }).optional(),
  avatarData: z
    .string()
    .max(750_000, { message: 'Avatar image is too large' })
    .nullable()
    .optional(),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'Current password is required' }),
    newPassword: z.string().refine(isStrongPassword, { message: PASSWORD_RULE_MESSAGE }),
    confirmPassword: z.string().min(1, { message: 'Please confirm your new password' }),
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    message: 'New password must be different from your current password',
    path: ['newPassword'],
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  })

const preferencesSchema = z.object({
  emailNotifications: z.boolean(),
  themePreference: z.enum(['light', 'dark', 'system']),
})

async function requireSessionUser() {
  const session = await getSession()
  if (!session?.user?.id) {
    return null
  }

  return session.user
}

export async function updateProfileAction(values: {
  name?: string
  avatarData?: string | null
}): Promise<ActionResult<{ user: SessionUser }>> {
  try {
    const sessionUser = await requireSessionUser()
    if (!sessionUser) {
      return { success: false, error: 'You must be signed in to update your profile' }
    }

    const validated = profileSchema.safeParse(values)
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || 'Invalid profile details',
      }
    }

    const name = validated.data.name?.trim() || null
    const user = await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        name,
        avatarData: validated.data.avatarData ?? null,
      },
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

    const updatedUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarData: user.avatarData,
      emailNotifications: user.emailNotifications,
      themePreference: user.themePreference,
      role: user.role,
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    await setSessionCookie(token)
    revalidatePath('/dashboard')
    revalidatePath('/settings')

    return { success: true, data: { user: updatedUser } }
  } catch (error) {
    console.error('Update profile action error:', error)
    return { success: false, error: 'Failed to update your profile. Please try again.' }
  }
}

export async function changePasswordAction(values: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): Promise<ActionResult> {
  try {
    const sessionUser = await requireSessionUser()
    if (!sessionUser) {
      return { success: false, error: 'You must be signed in to change your password' }
    }

    const validated = passwordSchema.safeParse(values)
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.errors[0]?.message || 'Invalid password details',
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { passwordHash: true },
    })

    if (!user?.passwordHash) {
      return { success: false, error: 'Unable to change password for this account' }
    }

    const isCurrentPasswordValid = await verifyPassword(
      validated.data.currentPassword,
      user.passwordHash,
    )

    if (!isCurrentPasswordValid) {
      return { success: false, error: 'Current password is incorrect' }
    }

    const passwordHash = await hashPassword(validated.data.newPassword)

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { passwordHash },
    })

    return { success: true }
  } catch (error) {
    console.error('Change password action error:', error)
    return { success: false, error: 'Failed to change your password. Please try again.' }
  }
}

export async function updatePreferencesAction(values: {
  emailNotifications: boolean
  themePreference: 'light' | 'dark' | 'system'
}): Promise<ActionResult<{ user: SessionUser }>> {
  const sessionUser = await requireSessionUser()
  if (!sessionUser) {
    return { success: false, error: 'You must be signed in to update your preferences' }
  }

  const validated = preferencesSchema.safeParse(values)

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.errors[0]?.message || 'Invalid preference details',
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id: sessionUser.id },
      data: validated.data,
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

    const updatedUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarData: user.avatarData,
      emailNotifications: user.emailNotifications,
      themePreference: user.themePreference,
      role: user.role,
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })

    await setSessionCookie(token)
    revalidatePath('/settings')
    revalidatePath('/dashboard')

    return { success: true, data: { user: updatedUser } }
  } catch (error) {
    console.error('Update preferences action error:', error)
    return { success: false, error: 'Failed to update your preferences. Please try again.' }
  }
}
