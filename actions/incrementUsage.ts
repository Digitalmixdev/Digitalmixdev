'use server'

import { getSession } from '@/lib/auth/session'
import { incrementUserToolsUsedCount } from '@/lib/dal/stats'

// In-memory cache to prevent duplicate counts for the same user and content signature
// Maps userId:signature -> timestamp
const userLastSignatures = new Map<string, number>()
// Maps userId -> lastIncrementTimestamp (to debounce rapid duplicate bursts under 2 seconds)
const userLastIncrementTime = new Map<string, number>()

export async function incrementToolUsage(signature?: string): Promise<{ incremented: boolean }> {
  const session = await getSession()
  if (!session?.user?.id) return { incremented: false }

  const userId = session.user.id
  const now = Date.now()

  // 1. If a content signature is provided, check if this user already incremented for this exact content
  if (signature) {
    const userSigKey = `${userId}:${signature}`
    const lastSigTime = userLastSignatures.get(userSigKey)
    if (lastSigTime) {
      // Exactly the same content signature was already counted for this user!
      return { incremented: false }
    }
    userLastSignatures.set(userSigKey, now)
  }

  // 2. Protect against rapid bursts (e.g. rapid multiple clicks on copy/calculate within 2 seconds)
  const lastTime = userLastIncrementTime.get(userId) || 0
  if (now - lastTime < 2000) {
    return { incremented: false }
  }
  userLastIncrementTime.set(userId, now)

  // 3. Periodic cache cleanup to prevent memory accumulation
  if (userLastSignatures.size > 5000) {
    const cutoff = now - 24 * 60 * 60 * 1000 // 24 hours
    for (const [k, v] of userLastSignatures.entries()) {
      if (v < cutoff) userLastSignatures.delete(k)
    }
  }

  await incrementUserToolsUsedCount(userId)
  return { incremented: true }
}