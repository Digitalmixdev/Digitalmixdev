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
  limit: number = 100,
  _unusedLocalItems?: ToolActivityItem[]
): Promise<ToolActivityItem[]> {
  try {
    const session = await getSession()
    if (!session?.user?.id) return []

    const userId = session.user.id
    return await getUserActivities(userId, limit)
  } catch (error) {
    console.error('Error in fetchUserHistoryAction:', error)
    return []
  }
}

/**
 * Sync local activity items to server and return fresh history.
 */
export async function syncLocalActivitiesToServerAction(
  localItems?: ToolActivityItem[]
): Promise<ToolActivityItem[]> {
  try {
    const session = await getSession()
    if (!session?.user?.id) return []

    const userId = session.user.id

    if (localItems && localItems.length > 0) {
      const serverActivities = await getUserActivities(userId, 100)
      for (const item of localItems) {
        if (!item || !item.toolId) continue
        const exists = serverActivities.some(
          (s) =>
            s.toolId === item.toolId &&
            s.actionTitle === item.actionTitle &&
            (s.inputSnippet === item.inputSnippet || s.id === item.id)
        )
        if (!exists) {
          await recordUserActivity(userId, {
            toolId: item.toolId,
            toolName: item.toolName,
            actionTitle: item.actionTitle,
            details: item.details,
            inputSnippet: item.inputSnippet,
            outputSnippet: item.outputSnippet,
            metadata: item.metadata,
          })
          await recordToolUsage(userId, item.toolId).catch(() => {})
        }
      }
    }

    return await getUserActivities(userId, 100)
  } catch (error) {
    console.error('Error in syncLocalActivitiesToServerAction:', error)
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
