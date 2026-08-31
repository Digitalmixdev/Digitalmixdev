'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  History,
  Star,
  Settings,
  Zap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { UserAvatar } from '@/components/user-avatar'
import { useLanguage } from '@/lib/i18n/context'
import { ToolActivityItem } from '@/types/history'
import { HistoryView } from '@/components/dashboard/history-view'
import { RecentToolActivityList } from '@/components/dashboard/recent-tool-activity-list'
import { getLocalActivityHistory } from '@/lib/history-service'

interface DashboardContentProps {
  user: {
    id: string
    email: string
    name?: string | null
    avatarData?: string | null
  }
  stats: {
    toolsUsedCount: number
    historyCount: number
    favoritesCount: number
  }
  initialActivities?: ToolActivityItem[]
}

export function DashboardContent({
  user,
  stats,
  initialActivities = [],
}: DashboardContentProps) {
  const { t, language, dir } = useLanguage()
  const isRtl = dir === 'rtl'
  const isArabic = language === 'ar'
  const searchParams = useSearchParams()

  // View state: 'dashboard' or 'history'
  const [currentView, setCurrentView] = useState<'dashboard' | 'history'>(() => {
    return searchParams?.get('view') === 'history' ? 'history' : 'dashboard'
  })

  const [historyCount, setHistoryCount] = useState(() => {
    const local = getLocalActivityHistory()
    return Math.max(stats.historyCount, initialActivities.length, local.length)
  })

  useEffect(() => {
    if (searchParams?.get('view') === 'history') {
      setCurrentView('history')
    }
  }, [searchParams])

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e?.detail?.all) {
        setHistoryCount(e.detail.all.length)
      } else {
        setHistoryCount(getLocalActivityHistory().length)
      }
    }
    window.addEventListener('digitalmix_history_updated', handleUpdate)
    return () => {
      window.removeEventListener('digitalmix_history_updated', handleUpdate)
    }
  }, [])

  const displayName = user.name || user.email.split('@')[0] || 'Developer'

  if (currentView === 'history') {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Back to Dashboard Bar */}
        <div className="flex items-center justify-between bg-card/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-border shadow-xs">
          <button
            type="button"
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer shadow-2xs hover:scale-[1.01]"
          >
            {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span>{isArabic ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}</span>
          </button>
        </div>

        {/* Full Detailed Activity History View */}
        <div className="space-y-4">
          <HistoryView
            initialActivities={initialActivities}
            onCountChange={(cnt) => setHistoryCount(cnt)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/90 backdrop-blur-md p-6 rounded-2xl border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t('dashboard.welcome_back', 'Welcome back,')} {displayName}!
            </h1>
          </div>
          <p className="text-muted-foreground text-sm font-mono">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <UserAvatar
            name={user.name}
            email={user.email}
            avatarData={user.avatarData}
            className="h-12 w-12 text-sm ring-2 ring-primary/30 shadow-xs"
          />
        </div>
      </div>

      {/* Quick Stats Grid - Hover-only stat indicators (no link/navigation redirection) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tools Used */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-xs hover:border-primary/50 hover:shadow-sm transition-all select-none">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.toolsUsedCount}</p>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.tools_used', 'Tools Used')}
              </p>
            </div>
          </div>
        </div>

        {/* History Items */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-xs hover:border-cyan-500/50 hover:shadow-sm transition-all select-none">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <History className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{historyCount}</p>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.history_items', 'History Items')}
              </p>
            </div>
          </div>
        </div>

        {/* Favorites */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-xs hover:border-amber-500/50 hover:shadow-sm transition-all select-none">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.favoritesCount}</p>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.favorites', 'Favorites')}
              </p>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-xs hover:border-emerald-500/50 hover:shadow-sm transition-all select-none">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {t('dashboard.plan_free', 'Free')}
              </p>
              <p className="text-xs text-muted-foreground">{t('dashboard.plan', 'Plan')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Activity History Card */}
        <div
          onClick={() => setCurrentView('history')}
          className="bg-card border border-border p-6 rounded-2xl hover:border-cyan-500/60 transition-all duration-200 cursor-pointer group shadow-xs hover:shadow-cyan-950/20"
        >
          <div className="h-11 w-11 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-cyan-400">
            <History className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-foreground mb-2 group-hover:text-cyan-400 transition-colors">
            {t('dashboard.saved_history', 'Activity History')}
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {t(
              'dashboard.saved_history_desc',
              'View, inspect, copy, and manage your formatted queries and tool activities.'
            )}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold mt-4">
            <span>{t('dashboard.view_history', 'View History')}</span>
            {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Favorites Card */}
        <Link
          href="/favorites"
          className="bg-card border border-border p-6 rounded-2xl hover:border-amber-500/60 transition-all duration-200 group shadow-xs"
        >
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-amber-500">
            <Star className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-foreground mb-2 group-hover:text-amber-500 transition-colors">
            {t('dashboard.favorites', 'Favorites')}
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {t('dashboard.favorites_desc', 'Save your most-used tools for quick access.')}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold mt-4">
            <span>{t('dashboard.view_favorites', 'View Favorites')}</span>
            {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </div>
        </Link>

        {/* Settings Card */}
        <Link
          href="/settings"
          className="bg-card border border-border p-6 rounded-2xl hover:border-emerald-500/60 transition-all duration-200 group shadow-xs"
        >
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-emerald-500">
            <Settings className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-foreground mb-2 group-hover:text-emerald-500 transition-colors">
            {t('settings.title', 'Settings')}
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {t('dashboard.settings_desc', 'Customize your experience and preferences.')}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold mt-4">
            <span>{t('dashboard.open_settings', 'Open Settings')}</span>
            {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </div>
        </Link>
      </div>

      {/* Recent Tool Activity List (Compact, showing only tool names & quick launch) */}
      <div className="pt-2">
        <RecentToolActivityList
          initialActivities={initialActivities}
          onViewFullHistory={() => setCurrentView('history')}
        />
      </div>
    </div>
  )
}
