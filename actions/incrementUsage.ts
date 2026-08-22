'use server'

import { getSession } from '@/lib/auth/session'
import { incrementUserToolsUsedCount } from '@/lib/dal/stats'

export async function incrementToolUsage(): Promise<void> {
  const session = await getSession()
  if (!session?.user?.id) return
  await incrementUserToolsUsedCount(session.user.id)
}