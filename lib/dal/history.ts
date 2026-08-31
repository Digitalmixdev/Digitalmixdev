import { prisma } from '@/lib/prisma'
import { ToolActivityItem } from '@/types/history'

/**
 * Record user tool activity in database.
 */
export async function recordUserActivity(
  userId: string,
  activity: {
    toolId: string
    toolName: string
    actionTitle: string
    details: string
    inputSnippet?: string | null
    outputSnippet?: string | null
    metadata?: Record<string, any> | string | null
  }
): Promise<ToolActivityItem | null> {
  if (!userId) return null

  try {
    // Check for recent duplicate within 3 seconds to prevent double-logging from React StrictMode / multi-triggers
    const recentThreshold = new Date(Date.now() - 3000)
    const existing = await prisma.activityHistory.findFirst({
      where: {
        userId,
        toolId: activity.toolId,
        actionTitle: activity.actionTitle,
        createdAt: { gte: recentThreshold },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (existing) {
      let parsedMeta: any = null
      if (existing.metadata) {
        try {
          parsedMeta = typeof existing.metadata === 'string' ? JSON.parse(existing.metadata) : existing.metadata
        } catch {
          parsedMeta = existing.metadata
        }
      }
      return {
        id: existing.id,
        userId: existing.userId,
        toolId: existing.toolId,
        toolName: existing.toolName,
        actionTitle: existing.actionTitle,
        details: existing.details,
        inputSnippet: existing.inputSnippet,
        outputSnippet: existing.outputSnippet,
        metadata: parsedMeta,
        createdAt: (existing.createdAt instanceof Date ? existing.createdAt : new Date(existing.createdAt)).toISOString(),
      }
    }

    const metaString =
      typeof activity.metadata === 'object' && activity.metadata !== null
        ? JSON.stringify(activity.metadata)
        : activity.metadata || null

    const created = await prisma.activityHistory.create({
      data: {
        userId,
        toolId: activity.toolId,
        toolName: activity.toolName,
        actionTitle: activity.actionTitle,
        details: activity.details,
        inputSnippet: activity.inputSnippet?.slice(0, 2000) ?? null,
        outputSnippet: activity.outputSnippet?.slice(0, 2000) ?? null,
        metadata: metaString,
      },
    })

    return {
      id: created.id,
      userId: created.userId,
      toolId: created.toolId,
      toolName: created.toolName,
      actionTitle: created.actionTitle,
      details: created.details,
      inputSnippet: created.inputSnippet,
      outputSnippet: created.outputSnippet,
      metadata: created.metadata ? JSON.parse(created.metadata) : null,
      createdAt: (created.createdAt instanceof Date ? created.createdAt : new Date()).toISOString(),
    }
  } catch (error) {
    console.error('Error recording user activity:', error)
    return null
  }
}

/**
 * Get user activity history ordered by createdAt desc.
 */
export async function getUserActivities(
  userId: string,
  limit: number = 100
): Promise<ToolActivityItem[]> {
  if (!userId) return []

  try {
    const records = await prisma.activityHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return records.map((r: any) => {
      let parsedMeta: any = null
      if (r.metadata) {
        try {
          parsedMeta = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata
        } catch {
          parsedMeta = r.metadata
        }
      }

      return {
        id: r.id,
        userId: r.userId,
        toolId: r.toolId,
        toolName: r.toolName,
        actionTitle: r.actionTitle,
        details: r.details,
        inputSnippet: r.inputSnippet,
        outputSnippet: r.outputSnippet,
        metadata: parsedMeta,
        createdAt: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt || Date.now())).toISOString(),
      }
    })
  } catch (error) {
    console.error('Error getting user activities:', error)
    return []
  }
}

/**
 * Delete a specific activity record.
 */
export async function deleteUserActivity(
  userId: string,
  activityId: string
): Promise<boolean> {
  if (!userId || !activityId) return false

  try {
    await prisma.activityHistory.deleteMany({
      where: {
        userId,
        id: activityId,
      },
    })
    return true
  } catch (error) {
    console.error('Error deleting user activity:', error)
    return false
  }
}

/**
 * Clear all activities for a user.
 */
export async function clearAllUserActivities(userId: string): Promise<boolean> {
  if (!userId) return false

  try {
    await prisma.activityHistory.deleteMany({
      where: { userId },
    })
    return true
  } catch (error) {
    console.error('Error clearing user activities:', error)
    return false
  }
}
