'use server'

import { z } from 'zod'
import { isStrongPassword, PASSWORD_RULE_MESSAGE } from '@/lib/auth/password-rules'

import { sendOtpEmail } from '@/lib/email/send-email'

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
}): Promise<{ success: boolean; error?: string; message?: string }> {
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
        error: 'An account with this email already exists. Please sign in instead.',
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

    // Send real email via SMTP / Transporter
    const emailResult = await sendOtpEmail({
      to: email,
      subject: 'Verify your DigitalMix email address',
      title: 'Email Verification Code',
      purposeText: 'Thank you for signing up with DigitalMix. Use the verification code below to verify your email and activate your account.',
      code,
      validityMinutes: 10,
    })

    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error || 'Failed to send email verification code to your inbox.',
      }
    }

    return {
      success: true,
      message: `A 6-digit verification code has been sent to ${email}. Please check your inbox.`,
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
