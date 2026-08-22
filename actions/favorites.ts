'use server'

import { getSession } from '@/lib/auth/session'
import { isToolFavorited, toggleToolFavorite, getUserFavorites } from '@/lib/dal/favorites'
import { ToolDefinition, ToolId } from '@/constants/tools'

export async function isFavoriteTool(toolIdOrSlug: ToolId | string): Promise<boolean> {
  const session = await getSession()
  if (!session?.user?.id) return false
  return isToolFavorited(session.user.id, toolIdOrSlug)
}

export async function toggleFavoriteTool(toolIdOrSlug: ToolId | string): Promise<boolean> {
  const session = await getSession()
  if (!session?.user?.id) return false
  return toggleToolFavorite(session.user.id, toolIdOrSlug)
}

export async function getFavoriteTools(): Promise<ToolDefinition[]> {
  const session = await getSession()
  if (!session?.user?.id) return []
  return getUserFavorites(session.user.id)
}