import { ToolActivityItem } from '@/types/history'
import { logActivityAction } from '@/actions/history'

const LOCAL_STORAGE_KEY = 'digitalmix_user_activity_history'
const MAX_LOCAL_ITEMS = 150

/**
 * Universal function to log any tool activity across the entire app.
 */
export async function logToolActivity(activity: {
  toolId: string
  toolName: string
  category?: string
  actionTitle: string
  details: string
  inputSnippet?: string | null
  outputSnippet?: string | null
  metadata?: Record<string, any> | string | null
}): Promise<ToolActivityItem> {
  const newItem: ToolActivityItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    toolId: activity.toolId,
    toolName: activity.toolName,
    category: activity.category,
    actionTitle: activity.actionTitle,
    details: activity.details,
    inputSnippet: activity.inputSnippet ?? null,
    outputSnippet: activity.outputSnippet ?? null,
    metadata: activity.metadata ?? null,
    createdAt: new Date().toISOString(),
  }

  // 1. Save to LocalStorage immediately
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
      const list: ToolActivityItem[] = raw ? JSON.parse(raw) : []
      const updated = [newItem, ...list.filter((it) => it.id !== newItem.id)].slice(0, MAX_LOCAL_ITEMS)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))

      // Dispatch event for active UI components
      window.dispatchEvent(
        new CustomEvent('digitalmix_history_updated', {
          detail: { newItem, all: updated },
        })
      )
    } catch (e) {
      console.warn('LocalStorage error while saving activity:', e)
    }
  }

  // 2. Sync to Server in background if logged in
  try {
    logActivityAction(activity).catch(() => {
      // Background sync silent catch
    })
  } catch {
    // Non-blocking
  }

  return newItem
}

/**
 * Retrieve all history items from local cache and merge seamlessly.
 */
export function getLocalActivityHistory(): ToolActivityItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    const parsed: ToolActivityItem[] = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Save merged history items to local cache.
 */
export function saveLocalActivityHistory(items: ToolActivityItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items.slice(0, MAX_LOCAL_ITEMS)))
    window.dispatchEvent(
      new CustomEvent('digitalmix_history_updated', {
        detail: { all: items },
      })
    )
  } catch (e) {
    console.warn('Error updating local activity history:', e)
  }
}

/**
 * Delete a specific activity from local storage.
 */
export function deleteLocalActivity(id: string): ToolActivityItem[] {
  const current = getLocalActivityHistory()
  const filtered = current.filter((it) => it.id !== id)
  saveLocalActivityHistory(filtered)
  return filtered
}

/**
 * Clear all activities from local storage.
 */
export function clearLocalActivityHistory(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    window.dispatchEvent(
      new CustomEvent('digitalmix_history_updated', {
        detail: { all: [] },
      })
    )
  } catch (e) {
    console.warn('Error clearing local activity history:', e)
  }
}

/**
 * Export history as formatted JSON file download.
 */
export function exportHistoryAsJson(items: ToolActivityItem[]): void {
  if (typeof window === 'undefined' || items.length === 0) return
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2))
  const downloadAnchor = document.createElement('a')
  downloadAnchor.setAttribute('href', dataStr)
  downloadAnchor.setAttribute('download', `digitalmix-activity-history-${new Date().toISOString().split('T')[0]}.json`)
  document.body.appendChild(downloadAnchor)
  downloadAnchor.click()
  downloadAnchor.remove()
}

/**
 * Export history as CSV file download.
 */
export function exportHistoryAsCsv(items: ToolActivityItem[]): void {
  if (typeof window === 'undefined' || items.length === 0) return

  const headers = ['Date & Time', 'Tool Name', 'Action', 'Details', 'Input Preview', 'Output Preview']
  const rows = items.map((it) => [
    `"${new Date(it.createdAt).toLocaleString()}"`,
    `"${(it.toolName || it.toolId).replace(/"/g, '""')}"`,
    `"${(it.actionTitle || '').replace(/"/g, '""')}"`,
    `"${(it.details || '').replace(/"/g, '""')}"`,
    `"${(it.inputSnippet || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
    `"${(it.outputSnippet || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
  ])

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `digitalmix-activity-history-${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
}
