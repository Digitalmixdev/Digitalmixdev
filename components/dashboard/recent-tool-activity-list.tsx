'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Clock,
  ExternalLink,
  Code,
  FileCode,
  QrCode,
  Layers,
  Image as ImageIcon,
  Calculator,
  Flame,
  FileSpreadsheet,
  Key,
  ShieldCheck,
  Hash,
  Binary,
  FileText,
  Scan,
  TrendingUp,
  Wrench,
} from 'lucide-react'
import { ToolActivityItem } from '@/types/history'
import { getLocalActivityHistory } from '@/lib/history-service'
import { useLanguage } from '@/lib/i18n/context'
import { ALL_TOOLS } from '@/constants/tools'

interface RecentToolActivityListProps {
  initialActivities?: ToolActivityItem[]
  onViewFullHistory: () => void
}

// Icon helper mapped to toolId or category
function getToolIcon(toolId?: string, category?: string) {
  switch (toolId) {
    case 'sql-formatter':
      return Code
    case 'json-formatter':
      return FileCode
    case 'csv-json':
      return FileSpreadsheet
    case 'qr-code-generator':
    case 'qr-code':
      return QrCode
    case 'qr-barcode-scanner':
      return Scan
    case 'calorie-calculator':
      return Flame
    case 'kpi-calculator':
    case 'profit-calculator':
    case 'roi-calculator':
      return TrendingUp
    case 'image-and-file-compressor':
    case 'image-compressor':
      return Layers
    case 'image-converter':
    case 'image-resizer':
      return ImageIcon
    case 'document-converter':
    case 'pdf-merge':
      return FileText
    case 'jwt':
      return Key
    case 'hash-generator':
      return Hash
    case 'base64':
    case 'uuid-generator':
    case 'regex-tester':
      return Binary
    default:
      return Wrench
  }
}

// Helper to find tool link from toolId or name
function getToolHref(toolId?: string, toolName?: string) {
  if (toolId) {
    const found = ALL_TOOLS.find(
      (t) => t.id === toolId || t.slug === toolId || t.href.includes(toolId)
    )
    if (found) return found.href
    return `/tools/${toolId.replace('tool_', '')}`
  }
  if (toolName) {
    const found = ALL_TOOLS.find((t) => t.name.toLowerCase() === toolName.toLowerCase())
    if (found) return found.href
  }
  return '/tools'
}

function formatRelativeTime(dateStr: string, isArabic: boolean): string {
  try {
    const now = new Date().getTime()
    const itemDate = new Date(dateStr).getTime()
    const diffSeconds = Math.max(0, Math.floor((now - itemDate) / 1000))

    if (diffSeconds < 60) {
      return isArabic ? 'الآن' : 'Just now'
    }
    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) {
      return isArabic ? `منذ ${diffMinutes} دقيقة` : `${diffMinutes}m ago`
    }
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) {
      return isArabic ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`
    }
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) {
      return isArabic ? 'أمس' : 'Yesterday'
    }
    return isArabic ? `منذ ${diffDays} أيام` : `${diffDays}d ago`
  } catch {
    return ''
  }
}

export function RecentToolActivityList({
  initialActivities = [],
  onViewFullHistory,
}: RecentToolActivityListProps) {
  const { language, dir } = useLanguage()
  const isArabic = language === 'ar'
  const isRtl = dir === 'rtl'

  const [activities, setActivities] = useState<ToolActivityItem[]>(() => {
    const local = getLocalActivityHistory()
    if (local.length > 0) return local
    return initialActivities
  })

  // Listen for real-time history updates
  useEffect(() => {
    const local = getLocalActivityHistory()
    if (local.length > 0) {
      setActivities(local)
    } else if (initialActivities.length > 0) {
      setActivities(initialActivities)
    }

    const handleUpdate = (e: any) => {
      if (e?.detail?.all) {
        setActivities(e.detail.all)
      } else {
        const fresh = getLocalActivityHistory()
        setActivities(fresh)
      }
    }

    window.addEventListener('digitalmix_history_updated', handleUpdate)
    return () => {
      window.removeEventListener('digitalmix_history_updated', handleUpdate)
    }
  }, [initialActivities])

  // Get most recent tool usage items (up to 6 recent items)
  const recentTools = useMemo(() => {
    return activities.slice(0, 6)
  }, [activities])

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {isArabic ? 'الأدوات المستخدمة مؤخراً' : 'Recent Tool Activity'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isArabic
                ? 'قائمة سريعة بالأدوات التي قمت باستخدامها مؤخراً'
                : 'Quick overview of tools you recently interacted with'}
            </p>
          </div>
        </div>

        {activities.length > 0 && (
          <button
            type="button"
            onClick={onViewFullHistory}
            className="text-xs font-semibold text-primary hover:text-primary/80 hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{isArabic ? 'عرض سجل النشاط بالتفصيل' : 'View Detailed History'}</span>
            {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Items List or Empty State */}
      {recentTools.length === 0 ? (
        <div className="p-8 text-center bg-card rounded-2xl border border-dashed border-border/80 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">
              {isArabic ? 'لا توجد أدوات مستخدمة بعد' : 'No tools used yet'}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isArabic
                ? 'استخدم أي أداة من أدوات المنصة (مثل الـ QR، محول الصور، أو الآلات الحاسبة) لتظهر هنا تلقائياً.'
                : 'Try out any tool (such as QR Generator, Image Tools, or Calculators) and your activity will automatically appear here.'}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/tools/qr-code-generator"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {isArabic ? 'مولد QR Code' : 'QR Code Generator'}
            </Link>
            <Link
              href="/tools/calorie-calculator"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              {isArabic ? 'حاسبة السعرات BMR' : 'Calorie Calculator'}
            </Link>
            <Link
              href="/tools/json-formatter"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              {isArabic ? 'منسق JSON' : 'JSON Formatter'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentTools.map((item) => {
            const IconComponent = getToolIcon(item.toolId, item.category)
            const toolHref = getToolHref(item.toolId, item.toolName)
            const relativeTime = formatRelativeTime(item.createdAt, isArabic)

            return (
              <div
                key={item.id}
                className="group relative flex items-center justify-between p-4 bg-card rounded-2xl border border-border/80 hover:border-primary/50 hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {item.toolName}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      {item.category && (
                        <span className="font-medium truncate">{item.category}</span>
                      )}
                      {item.category && relativeTime && <span>•</span>}
                      {relativeTime && (
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <Clock className="w-3 h-3 inline" />
                          {relativeTime}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Link
                  href={toolHref}
                  className="ms-2 shrink-0 p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  title={isArabic ? 'فتح الأداة' : 'Open Tool'}
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
