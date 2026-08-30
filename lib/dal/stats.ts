import { prisma } from '@/lib/prisma'
import { ToolId } from '@/constants/tools'
import { normalizeToolId } from './favorites'

export interface UserStats {
  toolsUsedCount: number
  favoritesCount: number
  historyCount: number
}

/**
 * Record that a user has used a specific tool.
 */
export async function recordToolUsage(
  userId: string,
  toolId: ToolId | string
): Promise<void> {
  if (!userId || !toolId) return

  const canonicalId = normalizeToolId(toolId)

  try {
    await prisma.toolUsage.upsert({
      where: {
        userId_toolSlug: {
          userId,
          toolSlug: canonicalId,
        },
      },
      update: {},
      create: {
        userId,
        toolSlug: canonicalId,
      },
    })
  } catch (error) {
    console.error('Error recording tool usage:', error)
  }
}

/**
 * Increment total cumulative tool usage count for a user.
 */
export async function incrementUserToolsUsedCount(userId: string): Promise<void> {
  if (!userId) return

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        toolsUsedCount: {
          increment: 1,
        },
      },
    })
  } catch (error) {
    console.error('Error incrementing user tools count:', error)
  }
}

/**
 * Get aggregated user statistics for the dashboard.
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  if (!userId) {
    return {
      toolsUsedCount: 0,
      favoritesCount: 0,
      historyCount: 0,
    }
  }

  try {
    const [dbUser, toolCount, favoriteCount, activityCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
      }),
      prisma.toolUsage.count({
        where: { userId },
      }),
      prisma.favoriteTool.count({
        where: { userId },
      }),
      prisma.activityHistory.count({
        where: { userId },
      }),
    ])

    return {
      historyCount: Math.max(activityCount || 0, dbUser?.toolsUsedCount || 0),
      toolsUsedCount: toolCount,
      favoritesCount: favoriteCount,
    }
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return {
      toolsUsedCount: 0,
      favoritesCount: 0,
      historyCount: 0,
    }
  }
}
