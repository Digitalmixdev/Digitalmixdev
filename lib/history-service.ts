import { ToolActivityItem } from '@/types/history'
import { logActivityAction, deleteHistoryItemAction, clearAllHistoryAction } from '@/actions/history'

const LOCAL_STORAGE_KEY = 'digitalmix_user_activity_history'
const MAX_LOCAL_ITEMS = 300

// Cross-tab broadcast channel for instant real-time synchronization
let syncChannel: BroadcastChannel | null = null
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel('digitalmix_sync_channel')
    syncChannel.onmessage = (event) => {
      if (event?.data?.type === 'digitalmix_history_updated') {
        window.dispatchEvent(
          new CustomEvent('digitalmix_history_updated', {
            detail: { all: event.data.all },
          })
        )
      }
    }
  } catch {
    // ignore
  }
}

export function notifyHistoryUpdated(items?: ToolActivityItem[]): void {
  if (typeof window === 'undefined') return
  const current = items || getLocalActivityHistory()
  window.dispatchEvent(
    new CustomEvent('digitalmix_history_updated', {
      detail: { all: current },
    })
  )
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'digitalmix_history_updated', all: current })
    } catch {
      // ignore
    }
  }
}

// In-flight log deduplication tracker (prevents double logging on rapid clicks or React StrictMode re-renders)
let lastLoggedActivitySignature = ''
let lastLoggedActivityTime = 0

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
  createdAt?: string
}): Promise<ToolActivityItem> {
  const now = Date.now()
  const sig = `${activity.toolId}|${activity.actionTitle}|${(activity.details || '').slice(0, 40)}`

  // Debounce duplicate invocations within 1.5 seconds
  if (sig === lastLoggedActivitySignature && now - lastLoggedActivityTime < 1500) {
    const existing = getLocalActivityHistory()
    if (existing.length > 0) return existing[0]
  }

  lastLoggedActivitySignature = sig
  lastLoggedActivityTime = now

  const localId = `act_${now}_${Math.random().toString(36).substring(2, 7)}`
  const timestampIso = activity.createdAt || new Date(now).toISOString()

  const newItem: ToolActivityItem = {
    id: localId,
    toolId: activity.toolId,
    toolName: activity.toolName,
    category: activity.category,
    actionTitle: activity.actionTitle,
    details: activity.details,
    inputSnippet: activity.inputSnippet ?? null,
    outputSnippet: activity.outputSnippet ?? null,
    metadata: activity.metadata ?? null,
    createdAt: timestampIso,
  }

  // 1. Save to LocalStorage immediately with de-duplication
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
      const list: ToolActivityItem[] = raw ? JSON.parse(raw) : []

      // Filter out duplicate identical actions within recent seconds
      const filtered = list.filter((it) => {
        if (it.id === newItem.id) return false
        if (it.toolId === newItem.toolId && it.actionTitle === newItem.actionTitle) {
          const diffMs = Math.abs(new Date(it.createdAt).getTime() - new Date(newItem.createdAt).getTime())
          if (diffMs < 3000) return false
        }
        return true
      })

      const updated = [newItem, ...filtered].slice(0, MAX_LOCAL_ITEMS)
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))

      // Dispatch event for active UI components & cross-tab sync
      notifyHistoryUpdated(updated)
    } catch (e) {
      console.warn('LocalStorage error while saving activity:', e)
    }
  }

  // 2. Sync to Server in background if logged in
  try {
    logActivityAction(activity)
      .then((serverSavedItem) => {
        // If server returned a record, update the local ID so it matches the DB ID
        if (serverSavedItem && serverSavedItem.item && serverSavedItem.item.id && typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
            if (raw) {
              const list: ToolActivityItem[] = JSON.parse(raw)
              const updatedList = list.map((item) =>
                item.id === localId ? { ...item, id: serverSavedItem.item!.id } : item
              )
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList))
            }
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // Background sync silent catch
      })
  } catch {
    // Non-blocking
  }

  return newItem
}

/**
 * Retrieve all history items from local cache safely.
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
    const safeItems = (Array.isArray(items) ? items : []).slice(0, MAX_LOCAL_ITEMS)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(safeItems))
    notifyHistoryUpdated(safeItems)
  } catch (e) {
    console.warn('Error updating local activity history:', e)
  }
}

/**
 * Merge local and server activities seamlessly without duplicate counting.
 */
export function syncHistoryWithServer(serverActivities: ToolActivityItem[] = []): ToolActivityItem[] {
  if (typeof window === 'undefined') return serverActivities

  try {
    const local = getLocalActivityHistory()
    const map = new Map<string, ToolActivityItem>()

    // 1. Add server items first (canonical source of truth for logged-in user)
    serverActivities.forEach((item) => {
      if (item && item.id) {
        map.set(item.id, item)
      }
    })

    // 2. Add local items that have not yet reached the server
    local.forEach((item) => {
      if (!item || !item.id) return

      if (map.has(item.id)) return

      // Check if another server item represents the same action within 15 seconds
      const itemTime = new Date(item.createdAt).getTime()
      const isDuplicate = Array.from(map.values()).some((s) => {
        if (s.toolId === item.toolId && s.actionTitle === item.actionTitle) {
          const sTime = new Date(s.createdAt).getTime()
          return Math.abs(sTime - itemTime) < 15000
        }
        return false
      })

      if (!isDuplicate) {
        map.set(item.id, item)
      }
    })

    const merged = Array.from(map.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, MAX_LOCAL_ITEMS)

    // Persist merged items
    saveLocalActivityHistory(merged)

    return merged
  } catch (e) {
    console.warn('Error syncing history with server:', e)
    return serverActivities.length > 0 ? serverActivities : getLocalActivityHistory()
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
    notifyHistoryUpdated([])
  } catch (e) {
    console.warn('Error clearing local activity history:', e)
  }
}

/**
 * Delete a specific activity record locally & on server DB, and clean up tool-specific storages.
 */
export function deleteActivityItem(id: string): ToolActivityItem[] {
  if (typeof window === 'undefined') return []

  // 1. Delete from primary activity storage
  const filtered = deleteLocalActivity(id)

  // 2. Remove matching ID from tool-specific local storages
  const toolKeys = [
    'digitalmix_qr_history',
    'digitalmix_sql_history',
    'digitalmix_json_history',
    'digitalmix_scan_history',
  ]

  toolKeys.forEach((key) => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const list = JSON.parse(raw)
        if (Array.isArray(list)) {
          const updated = list.filter((item: any) => item.id !== id && item.activityId !== id)
          localStorage.setItem(key, JSON.stringify(updated))
        }
      }
    } catch {
      // ignore
    }
  })

  // 3. Sync delete action to server database
  deleteHistoryItemAction(id).catch(() => {})

  // 4. Notify all components & cross-tab sync
  notifyHistoryUpdated(filtered)

  return filtered
}

/**
 * Clear all activity history records locally & on server DB, and clean up tool-specific storages.
 */
export function clearAllActivities(): void {
  if (typeof window === 'undefined') return

  // 1. Clear primary activity storage
  clearLocalActivityHistory()

  // 2. Clear tool-specific local storages
  const toolKeys = [
    'digitalmix_qr_history',
    'digitalmix_sql_history',
    'digitalmix_json_history',
    'digitalmix_scan_history',
  ]

  toolKeys.forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  })

  // 3. Sync clear action to server database
  clearAllHistoryAction().catch(() => {})

  // 4. Notify all components
  notifyHistoryUpdated([])
}

/**
 * Get all recorded activities for a specific tool ID.
 */
export function getToolHistoryFromActivities(toolId: string): ToolActivityItem[] {
  const local = getLocalActivityHistory()
  return local.filter((item) => item.toolId === toolId)
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
