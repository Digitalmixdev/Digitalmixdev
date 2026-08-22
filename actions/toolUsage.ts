'use server'

import { getSession } from '@/lib/auth/session'
import { recordToolUsage } from '@/lib/dal/stats'
import { ToolId } from '@/constants/tools'

export async function markToolUsed(toolSlugOrId: ToolId | string): Promise<void> {
  const session = await getSession()
  if (!session?.user?.id) return
  await recordToolUsage(session.user.id, toolSlugOrId)
}