export interface ToolActivityItem {
  id: string
  userId?: string | null
  toolId: string
  toolName: string
  category?: string
  actionTitle: string
  details: string
  inputSnippet?: string | null
  outputSnippet?: string | null
  metadata?: Record<string, any> | string | null
  createdAt: string
}
