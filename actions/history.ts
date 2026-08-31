'use server'

import { getSession } from '@/lib/auth/session'
import {
  getUserActivities,
  recordUserActivity,
  deleteUserActivity,
  clearAllUserActivities,
} from '@/lib/dal/history'
import { ToolActivityItem } from '@/types/history'
import { recordToolUsage, incrementUserToolsUsedCount } from '@/lib/dal/stats'

/**
 * Log tool activity for the current logged-in user.
 */
export async function logActivityAction(activity: {
  toolId: string
  toolName: string
  category?: string
  actionTitle: string
  details: string
  inputSnippet?: string | null
  outputSnippet?: string | null
  metadata?: Record<string, any> | string | null
}): Promise<{ success: boolean; item?: ToolActivityItem | null }> {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return { success: false }
    }

    const userId = session.user.id
    const item = await recordUserActivity(userId, activity)

    // Also mark tool usage & increment count
    await Promise.allSettled([
      recordToolUsage(userId, activity.toolId),
      incrementUserToolsUsedCount(userId),
    ])

    return { success: true, item }
  } catch (error) {
    console.error('Error in logActivityAction:', error)
    return { success: false }
  }
}

/**
 * Fetch all history items for the logged-in user.
 */
export async function fetchUserHistoryAction(
  limit: number = 100
): Promise<ToolActivityItem[]> {
  try {
    const session = await getSession()
    if (!session?.user?.id) return []

    return await getUserActivities(session.user.id, limit)
  } catch (error) {
    console.error('Error in fetchUserHistoryAction:', error)
    return []
  }
}

/**
 * Delete a specific history item.
 */
export async function deleteHistoryItemAction(
  activityId: string
): Promise<{ success: boolean }> {
  try {
    const session = await getSession()
    if (!session?.user?.id) return { success: false }

    const success = await deleteUserActivity(session.user.id, activityId)
    return { success }
  } catch (error) {
    console.error('Error in deleteHistoryItemAction:', error)
    return { success: false }
  }
}

/**
 * Sync offline/local activities to the logged-in user database in batch.
 */
export async function syncLocalActivitiesToServerAction(
  activities: {
    toolId: string
    toolName: string
    category?: string
    actionTitle: string
    details: string
    inputSnippet?: string | null
    outputSnippet?: string | null
    metadata?: Record<string, any> | string | null
  }[]
): Promise<{ success: boolean; count: number }> {
  try {
    const session = await getSession()
    if (!session?.user?.id || !activities || activities.length === 0) {
      return { success: false, count: 0 }
    }

    const userId = session.user.id
    let count = 0
    const existing = await getUserActivities(userId, 200)
    const existingKeys = new Set(
      existing.map((e) => `${e.toolId}|${e.actionTitle}|${(e.details || '').slice(0, 50)}`)
    )

    for (const act of activities.slice(0, 50)) {
      const key = `${act.toolId}|${act.actionTitle}|${(act.details || '').slice(0, 50)}`
      if (!existingKeys.has(key)) {
        await recordUserActivity(userId, act)
        count++
      }
    }

    return { success: true, count }
  } catch (error) {
    console.error('Error in syncLocalActivitiesToServerAction:', error)
    return { success: false, count: 0 }
  }
}

/**
 * Clear all history items for the user.
 */
export async function clearAllHistoryAction(): Promise<{ success: boolean }> {
  try {
    const session = await getSession()
    if (!session?.user?.id) return { success: false }

    const success = await clearAllUserActivities(session.user.id)
    return { success }
  } catch (error) {
    console.error('Error in clearAllHistoryAction:', error)
    return { success: false }
  }
}
