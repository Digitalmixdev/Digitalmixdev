'use server'

import { z } from 'zod'
import { isStrongPassword, PASSWORD_RULE_MESSAGE } from '@/lib/auth/password-rules'

// In-memory verification code store: email -> { code, expiresAt, name, password }
interface VerificationEntry {
  code: string
  expiresAt: number
  name?: string
  password: string
}

declare global {
  var __verificationCodes: Map<string, VerificationEntry> | undefined
}

if (!globalThis.__verificationCodes) {
  globalThis.__verificationCodes = new Map<string, VerificationEntry>()
}

const codesStore = globalThis.__verificationCodes

const initiateSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email({ message: 'Please enter a valid email address' }),
  password: z.string().refine(isStrongPassword, { message: PASSWORD_RULE_MESSAGE }),
})

/**
 * Step 1: Send a 6-digit verification code to the given email address
 */
export async function sendVerificationCodeAction(values: {
  name?: string
  email: string
  password: string
}): Promise<{ success: boolean; error?: string; message?: string; debugCode?: string }> {
  try {
    const validated = initiateSchema.safeParse(values)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message || 'Invalid input data' }
    }

    const { name, email, password } = validated.data

    // Check if user already exists
    const { prisma } = await import('@/lib/prisma')
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email already exists',
      }
    }

    // Generate random 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes expiry

    codesStore.set(email, {
      code,
      expiresAt,
      name,
      password,
    })

    console.log(`[Email Verification] Code for ${email} is: ${code}`)

    // If an SMTP / Resend provider is configured, it would send email here
    // In preview / serverless mode without external email provider credentials,
    // we return debugCode so user can test and fill the code directly.
    return {
      success: true,
      message: `A 6-digit verification code was generated for ${email}.`,
      debugCode: code,
    }
  } catch (err) {
    console.error('Send verification code error:', err)
    return {
      success: false,
      error: 'Failed to send verification code. Please try again.',
    }
  }
}

/**
 * Step 2: Verify code and finalize user registration
 */
export async function verifyEmailAndRegisterAction(values: {
  email: string
  code: string
}) {
  try {
    const email = values.email.trim().toLowerCase()
    const code = values.code.trim()

    const entry = codesStore.get(email)
    if (!entry) {
      return {
        success: false,
        error: 'No verification request found for this email. Please sign up again.',
      }
    }

    if (Date.now() > entry.expiresAt) {
      codesStore.delete(email)
      return {
        success: false,
        error: 'Verification code has expired. Please request a new code.',
      }
    }

    if (entry.code !== code) {
      return {
        success: false,
        error: 'Invalid verification code. Please check the 6-digit code and try again.',
      }
    }

    // Verification succeeded -> register user
    const { signupAction } = await import('@/actions/auth')
    const result = await signupAction({
      name: entry.name,
      email,
      password: entry.password,
    })

    // Clean up code from store
    codesStore.delete(email)

    return result
  } catch (err) {
    console.error('Verification error:', err)
    return {
      success: false,
      error: 'An unexpected error occurred during verification.',
    }
  }
}
