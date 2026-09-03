'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  History,
  Trash2,
  Search,
  Filter,
  Download,
  ExternalLink,
  Copy,
  Check,
  Code,
  FileText,
  FileCode,
  QrCode,
  Layers,
  Image as ImageIcon,
  Calculator,
  Key,
  ShieldCheck,
  CheckCircle2,
  Hash,
  Binary,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/context'
import { ToolActivityItem } from '@/types/history'
import {
  getLocalActivityHistory,
  syncHistoryWithServer,
  deleteActivityItem,
  clearAllActivities,
  exportHistoryAsJson,
  exportHistoryAsCsv,
} from '@/lib/history-service'
import {
  fetchUserHistoryAction,
  deleteHistoryItemAction,
  clearAllHistoryAction,
} from '@/actions/history'

interface HistoryViewProps {
  initialActivities?: ToolActivityItem[]
  onCountChange?: (count: number) => void
}

export function HistoryView({ initialActivities = [], onCountChange }: HistoryViewProps) {
  const { t, language, dir } = useLanguage()
  const isRtl = dir === 'rtl'

  const [activities, setActivities] = useState<ToolActivityItem[]>(() => {
    return syncHistoryWithServer(initialActivities)
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedToolFilter, setSelectedToolFilter] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedDetailItem, setSelectedDetailItem] = useState<ToolActivityItem | null>(null)
  const [isClearModalOpen, setIsClearModalOpen] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [isClearing, setIsClearing] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Sync with initialActivities, cross-tab storage, and live polling
  useEffect(() => {
    const refreshHistory = async () => {
      const localFresh = getLocalActivityHistory()
      setActivities(localFresh)
      if (onCountChange) onCountChange(localFresh.length)

      try {
        const serverItems = await fetchUserHistoryAction(100, localFresh)
        if (serverItems && serverItems.length > 0) {
          const freshMerged = syncHistoryWithServer(serverItems)
          setActivities(freshMerged)
          if (onCountChange) onCountChange(freshMerged.length)
        }
      } catch {
        // ignore
      }
    }

    refreshHistory()

    // 1. CustomEvent listener for same-tab updates
    const handleUpdate = (e: any) => {
      if (e?.detail?.all) {
        setActivities(e.detail.all)
        if (onCountChange) onCountChange(e.detail.all.length)
      } else {
        const fresh = getLocalActivityHistory()
        setActivities(fresh)
        if (onCountChange) onCountChange(fresh.length)
      }
    }

    // 2. Cross-tab storage listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'digitalmix_user_activity_history' || !e.key) {
        const fresh = getLocalActivityHistory()
        setActivities(fresh)
        if (onCountChange) onCountChange(fresh.length)
      }
    }

    // 3. Focus / Visibility change listener
    const handleFocus = () => {
      refreshHistory()
    }

    window.addEventListener('digitalmix_history_updated', handleUpdate)
    window.addEventListener('storage', handleStorage)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)

    // 4. Interval polling every 4 seconds for live background sync
    const intervalId = setInterval(() => {
      const currentLocal = getLocalActivityHistory()
      setActivities(currentLocal)
      if (onCountChange) onCountChange(currentLocal.length)
    }, 4000)

    return () => {
      window.removeEventListener('digitalmix_history_updated', handleUpdate)
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
      clearInterval(intervalId)
    }
  }, [initialActivities, onCountChange])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Delete single item
  const handleDeleteItem = async (item: ToolActivityItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeletingId(item.id)

    // Remove locally, from tool histories, and sync DB deletion
    const updated = deleteActivityItem(item.id)
    setActivities(updated)
    if (onCountChange) onCountChange(updated.length)
    showToast(t('dashboard.history_item_deleted'))
    setIsDeletingId(null)
  }

  // Clear all items
  const handleClearAll = async () => {
    setIsClearing(true)
    clearAllActivities()
    setActivities([])
    if (onCountChange) onCountChange(0)
    setIsClearModalOpen(false)
    showToast(t('dashboard.history_all_cleared'))
    setIsClearing(false)
  }

  const handleCopyText = (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    showToast(t('dashboard.history_copied'))
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Get distinct tool list for filter
  const distinctTools = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    activities.forEach((it) => {
      if (it.toolId && !map.has(it.toolId)) {
        map.set(it.toolId, { id: it.toolId, name: it.toolName || it.toolId })
      }
    })
    return Array.from(map.values())
  }, [activities])

  // Filtered & Searched activities
  const filteredActivities = useMemo(() => {
    return activities.filter((it) => {
      // Tool filter
      if (selectedToolFilter !== 'all' && it.toolId !== selectedToolFilter) {
        return false
      }

      // Search query
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const toolNameMatch = it.toolName?.toLowerCase().includes(q)
      const actionMatch = it.actionTitle?.toLowerCase().includes(q)
      const detailsMatch = it.details?.toLowerCase().includes(q)
      const inputMatch = it.inputSnippet?.toLowerCase().includes(q)
      const outputMatch = it.outputSnippet?.toLowerCase().includes(q)
      return toolNameMatch || actionMatch || detailsMatch || inputMatch || outputMatch
    })
  }, [activities, selectedToolFilter, searchQuery])

  // Helper for icon per tool
  const getToolIcon = (toolId: string) => {
    const id = (toolId || '').toLowerCase()
    if (id.includes('sql-validator')) return <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    if (id.includes('json-validator')) return <ShieldCheck className="w-5 h-5 text-emerald-400" />
    if (id.includes('sql')) return <Code className="w-5 h-5 text-sky-400" />
    if (id.includes('doc') || id.includes('office') || id.includes('word'))
      return <FileText className="w-5 h-5 text-blue-400" />
    if (id.includes('json')) return <FileCode className="w-5 h-5 text-amber-400" />
    if (id.includes('qr')) return <QrCode className="w-5 h-5 text-emerald-400" />
    if (id.includes('pdf')) return <Layers className="w-5 h-5 text-rose-400" />
    if (id.includes('image') || id.includes('compress'))
      return <ImageIcon className="w-5 h-5 text-violet-400" />
    if (id.includes('calc') || id.includes('kpi') || id.includes('calorie'))
      return <Calculator className="w-5 h-5 text-teal-400" />
    if (id.includes('jwt') || id.includes('hash'))
      return <ShieldCheck className="w-5 h-5 text-indigo-400" />
    if (id.includes('uuid') || id.includes('base64'))
      return <Binary className="w-5 h-5 text-purple-400" />
    if (id.includes('csv')) return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
    return <Sparkles className="w-5 h-5 text-cyan-400" />
  }

  // Format timestamp nicely
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      const dateFormatted = date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      const timeFormatted = date.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
      return `${dateFormatted} • ${timeFormatted}`
    } catch {
      return isoString
    }
  }

  // Map toolId to application route
  const getToolRoute = (toolId: string) => {
    const map: Record<string, string> = {
      'sql-formatter': '/tools/sql-formatter',
      'document-converter': '/tools/document-converter',
      'json-formatter': '/tools/json-formatter',
      'qr-code-generator': '/tools/qr-code-generator',
      'qr-barcode-scanner': '/tools/qr-barcode-scanner',
      'image-converter': '/tools/image-converter',
      'image-and-file-compressor': '/tools/image-and-file-compressor',
      'image-resizer': '/tools/image-resizer',
      'pdf-merge': '/tools/pdf-merge',
      'calorie-calculator': '/tools/calorie-calculator',
      'kpi-roi-calculator': '/tools/kpi-roi-calculator',
      'base64-encoder-decoder': '/tools/base64-encoder-decoder',
      'hash-generator': '/tools/hash-generator',
      'uuid-generator': '/tools/uuid-generator',
      'csv-to-json': '/tools/csv-to-json',
      'jwt-debugger': '/tools/jwt-debugger',
      'regex-tester': '/tools/regex-tester',
    }
    return map[toolId] || `/tools/${toolId}`
  }

  return (
    <div id="history-section" className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-cyan-500/40 text-cyan-200 px-4 py-3 rounded-xl shadow-2xl shadow-cyan-950/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Action Bar: Search, Filters, Export, Clear All */}
      <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${
                isRtl ? 'right-3.5' : 'left-3.5'
              }`}
            />
            <input
              type="text"
              id="history-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('dashboard.history_search_placeholder')}
              className={`w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all ${
                isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 ${
                  isRtl ? 'left-3' : 'right-3'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tool Filter Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[160px] sm:min-w-[190px]">
              <Filter
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none ${
                  isRtl ? 'right-3' : 'left-3'
                }`}
              />
              <select
                id="history-tool-filter"
                value={selectedToolFilter}
                onChange={(e) => setSelectedToolFilter(e.target.value)}
                className={`w-full appearance-none bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-all cursor-pointer ${
                  isRtl ? 'pr-9 pl-8' : 'pl-9 pr-8'
                }`}
              >
                <option value="all">{t('dashboard.history_filter_all')}</option>
                {distinctTools.map((tItem) => (
                  <option key={tItem.id} value={tItem.id}>
                    {tItem.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none ${
                  isRtl ? 'left-3' : 'right-3'
                }`}
              />
            </div>

            {/* Export Buttons */}
            {activities.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  id="export-history-json"
                  onClick={() => exportHistoryAsJson(activities)}
                  title={t('dashboard.history_export_json')}
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-slate-700/60 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">JSON</span>
                </button>
                <button
                  id="export-history-csv"
                  onClick={() => exportHistoryAsCsv(activities)}
                  title={t('dashboard.history_export_csv')}
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700/60 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
                <button
                  id="clear-all-history-btn"
                  onClick={() => setIsClearModalOpen(true)}
                  title={t('dashboard.history_clear_all')}
                  className="p-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-800/50 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden md:inline">{t('dashboard.history_clear_all')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Counter Subheading */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-3">
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {language === 'ar'
                ? `عرض ${filteredActivities.length} من إجمالي ${activities.length} عملية مسجلة`
                : `Showing ${filteredActivities.length} of ${activities.length} recorded activities`}
            </span>
          </div>
          {selectedToolFilter !== 'all' && (
            <button
              onClick={() => setSelectedToolFilter('all')}
              className="text-cyan-400 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              {language === 'ar' ? 'إعادة ضبط الفلتر' : 'Reset filter'}
            </button>
          )}
        </div>
      </div>

      {/* History Items List */}
      {filteredActivities.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
            <History className="w-8 h-8 opacity-70" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-semibold text-slate-200">
              {searchQuery || selectedToolFilter !== 'all'
                ? language === 'ar'
                  ? 'لم يتم العثور على نتائج مطابقة'
                  : 'No matching activities found'
                : t('dashboard.history_empty_title')}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {searchQuery || selectedToolFilter !== 'all'
                ? language === 'ar'
                  ? 'جرب البحث بكلمات أخرى أو اختر أداة مختلفة من قائمة الفلاتر.'
                  : 'Try searching with different terms or reset your tool filters.'
                : t('dashboard.history_empty_desc')}
            </p>
          </div>
          {(searchQuery || selectedToolFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedToolFilter('all')
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-all"
            >
              {language === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredActivities.map((item) => {
            const isExpanded = expandedId === item.id
            const hasSnippet = Boolean(item.inputSnippet || item.outputSnippet)
            const snippetToShow = item.outputSnippet || item.inputSnippet || ''

            return (
              <div
                key={item.id}
                id={`history-item-${item.id}`}
                className={`group relative bg-slate-900/90 hover:bg-slate-900 border rounded-2xl transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
                  isExpanded ? 'border-cyan-500/40 ring-1 ring-cyan-500/20' : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    {/* Left: Icon & Main Titles */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner group-hover:border-cyan-500/30 transition-colors">
                        {getToolIcon(item.toolId)}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                            {item.toolName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                            {item.actionTitle}
                          </span>
                        </div>

                        {/* Narrative description */}
                        <p className="text-xs text-slate-300 leading-relaxed font-normal break-words">
                          {item.details}
                        </p>

                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formatTime(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
                      {/* Copy Details */}
                      <button
                        onClick={(e) =>
                          handleCopyText(
                            `${item.toolName} - ${item.actionTitle}\n${item.details}\n${
                              item.inputSnippet ? `Input:\n${item.inputSnippet}\n` : ''
                            }${item.outputSnippet ? `Output:\n${item.outputSnippet}` : ''}`,
                            item.id,
                            e
                          )
                        }
                        title={t('dashboard.history_copy_details')}
                        className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-lg transition-all"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {/* View Payload/Modal */}
                      <button
                        onClick={() => setSelectedDetailItem(item)}
                        title={t('dashboard.history_view_details')}
                        className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-lg transition-all"
                      >
                        <FileCode className="w-4 h-4" />
                      </button>

                      {/* Open Tool Link */}
                      <Link
                        href={getToolRoute(item.toolId)}
                        title={t('dashboard.history_open_tool')}
                        className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 rounded-lg transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      {/* Delete this item */}
                      <button
                        onClick={(e) => handleDeleteItem(item, e)}
                        disabled={isDeletingId === item.id}
                        title={t('dashboard.history_delete_item')}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Snippet Preview if available */}
                  {hasSnippet && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                        >
                          <Code className="w-3.5 h-3.5" />
                          <span>
                            {isExpanded
                              ? language === 'ar'
                                ? 'إخفاء معاينة الكود/البيانات'
                                : 'Hide Code / Data Preview'
                              : language === 'ar'
                              ? 'معاينة الكود / البيانات المدخلة'
                              : 'Preview Code / Input Data'}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => setSelectedDetailItem(item)}
                          className="text-[11px] text-slate-400 hover:text-slate-200"
                        >
                          {language === 'ar' ? 'عرض بالكامل' : 'Expand full'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-2.5 p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300 overflow-x-auto overflow-y-auto max-h-56 scrollbar-thin">
                          <pre className="whitespace-pre break-words leading-relaxed">
                            {snippetToShow}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800/40 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-100">
                {t('dashboard.history_clear_confirm_title')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('dashboard.history_clear_confirm_desc')}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-all"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                id="confirm-clear-history-action"
                onClick={handleClearAll}
                disabled={isClearing}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-red-950"
              >
                {isClearing ? (
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{t('dashboard.history_clear_confirm_btn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Item Details Modal */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400">
                  {getToolIcon(selectedDetailItem.toolId)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    {selectedDetailItem.toolName}
                  </h3>
                  <p className="text-xs text-cyan-400 font-medium">
                    {selectedDetailItem.actionTitle}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDetailItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1 scrollbar-thin">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400">
                  {language === 'ar' ? 'الوصف والتفاصيل:' : 'Summary & Details:'}
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selectedDetailItem.details}
                </p>
                <div className="text-[11px] text-slate-500 pt-1">
                  {formatTime(selectedDetailItem.createdAt)}
                </div>
              </div>

              {selectedDetailItem.inputSnippet && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">
                      {language === 'ar' ? 'المدخلات (Input):' : 'Input Snippet:'}
                    </span>
                    <button
                      onClick={() =>
                        handleCopyText(selectedDetailItem.inputSnippet!, 'modal_input')
                      }
                      className="text-cyan-400 hover:underline text-[11px] flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedId === 'modal_input'
                        ? language === 'ar'
                          ? 'تم النسخ'
                          : 'Copied'
                        : language === 'ar'
                        ? 'نسخ'
                        : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto overflow-y-auto max-h-56 whitespace-pre leading-relaxed scrollbar-thin">
                    {selectedDetailItem.inputSnippet}
                  </pre>
                </div>
              )}

              {selectedDetailItem.outputSnippet && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300">
                      {language === 'ar' ? 'المخرجات (Output):' : 'Output Snippet:'}
                    </span>
                    <button
                      onClick={() =>
                        handleCopyText(selectedDetailItem.outputSnippet!, 'modal_output')
                      }
                      className="text-cyan-400 hover:underline text-[11px] flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedId === 'modal_output'
                        ? language === 'ar'
                          ? 'تم النسخ'
                          : 'Copied'
                        : language === 'ar'
                        ? 'نسخ'
                        : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto overflow-y-auto max-h-56 whitespace-pre leading-relaxed scrollbar-thin">
                    {selectedDetailItem.outputSnippet}
                  </pre>
                </div>
              )}

              {selectedDetailItem.metadata && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">
                    {language === 'ar' ? 'البيانات الفنية الإضافية (Metadata):' : 'Metadata:'}
                  </span>
                  <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-32">
                    {typeof selectedDetailItem.metadata === 'string'
                      ? selectedDetailItem.metadata
                      : JSON.stringify(selectedDetailItem.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <Link
                href={getToolRoute(selectedDetailItem.toolId)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{t('dashboard.history_open_tool')}</span>
              </Link>

              <button
                onClick={() => setSelectedDetailItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-all"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
