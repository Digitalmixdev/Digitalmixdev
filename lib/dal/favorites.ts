import { prisma } from '@/lib/prisma'
import { ToolDefinition, ToolId, getToolById, getToolBySlug } from '@/constants/tools'

// Map legacy tool slugs that may exist in existing database rows to canonical ToolId
const LEGACY_SLUG_MAP: Record<string, ToolId> = {
  'base64-tool': 'base64',
  'base64': 'base64',
  'jwt-tool': 'jwt',
  'jwt': 'jwt',
  'hash-tool': 'hash-generator',
  'hash-generator': 'hash-generator',
  'uuid-tool': 'uuid-generator',
  'uuid-generator': 'uuid-generator',
  'regex-tool': 'regex-tester',
  'regex-tester': 'regex-tester',
  'pdf-merge-tool': 'pdf-merge',
  'pdf-merge': 'pdf-merge',
  'image-resizer-tool': 'image-resizer',
  'image-resizer': 'image-resizer',
  'kpi-calculator-tool': 'kpi-calculator',
  'kpi-calculator': 'kpi-calculator',
  'profit-calculator': 'profit-calculator',
  'roi-calculator': 'roi-calculator',
  'csv-to-json-tool': 'csv-json',
  'csv-json': 'csv-json',
  'sql-formatter': 'sql-formatter',
  'json-formatter': 'json-formatter',
  'qr-code-generator': 'qr-code-generator',
}

export function normalizeToolId(toolIdOrSlug: string): ToolId | string {
  return LEGACY_SLUG_MAP[toolIdOrSlug] || toolIdOrSlug
}

/**
 * Check if a tool is favorited by a user.
 * Checks both canonical toolId and legacy slugs for maximum compatibility.
 */
export async function isToolFavorited(
  userId: string,
  toolId: ToolId | string
): Promise<boolean> {
  if (!userId || !toolId) return false

  const canonicalId = normalizeToolId(toolId)

  // Find either matching canonical id or raw input
  const favorite = await prisma.favoriteTool.findFirst({
    where: {
      userId,
      OR: [
        { toolSlug: canonicalId },
        { toolSlug: toolId },
      ],
    },
  })

  return Boolean(favorite)
}

/**
 * Toggle a tool's favorite status for a user.
 * Deletes any existing favorite (canonical or legacy) or creates one with the canonical id.
 */
export async function toggleToolFavorite(
  userId: string,
  toolId: ToolId | string
): Promise<boolean> {
  if (!userId || !toolId) return false

  const canonicalId = normalizeToolId(toolId)

  const existingFavorites = await prisma.favoriteTool.findMany({
    where: {
      userId,
      OR: [
        { toolSlug: canonicalId },
        { toolSlug: toolId },
      ],
    },
  })

  if (existingFavorites.length > 0) {
    await prisma.favoriteTool.deleteMany({
      where: {
        id: { in: existingFavorites.map((f: { id: string }) => f.id) },
      },
    })
    return false
  }

  await prisma.favoriteTool.create({
    data: {
      userId,
      toolSlug: canonicalId,
    },
  })

  return true
}

/**
 * Get all favorited tools for a user as canonical ToolDefinition objects.
 */
export async function getUserFavorites(userId: string): Promise<ToolDefinition[]> {
  if (!userId) return []

  const favorites = await prisma.favoriteTool.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  const seenIds = new Set<string>()
  const tools: ToolDefinition[] = []

  for (const favorite of favorites) {
    const normalized = normalizeToolId(favorite.toolSlug)
    const tool = getToolById(normalized) || getToolBySlug(normalized)

    if (tool && !seenIds.has(tool.id)) {
      seenIds.add(tool.id)
      tools.push(tool)
    }
  }

  return tools
}
