'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { History, Star, Settings, Zap, LayoutDashboard, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react'
import { UserAvatar } from '@/components/user-avatar'
import { useLanguage } from '@/lib/i18n/context'
import { ToolActivityItem } from '@/types/history'
import { HistoryView } from '@/components/dashboard/history-view'

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

export function DashboardContent({ user, stats, initialActivities = [] }: DashboardContentProps) {
  const { t, language, dir } = useLanguage()
  const isRtl = dir === 'rtl'
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview')
  const [historyCount, setHistoryCount] = useState(
    Math.max(stats.historyCount, initialActivities.length)
  )

  const displayName = user.name || user.email.split('@')[0] || 'Developer'

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/90 backdrop-blur-md p-6 rounded-2xl border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {t('dashboard.welcome_back', 'Welcome back,')} {displayName}!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              PRO
            </span>
          </div>
          <p className="text-muted-foreground text-sm font-mono">
            {user.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <UserAvatar
            name={user.name}
            email={user.email}
            avatarData={user.avatarData}
            className="h-12 w-12 text-sm ring-2 ring-primary/30 shadow-md"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-2">
        <button
          id="tab-dashboard-overview"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'overview'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>{t('dashboard.tab_overview', 'Overview')}</span>
        </button>

        <button
          id="tab-dashboard-history"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{t('dashboard.tab_history', 'Activity History')}</span>
          {historyCount > 0 && (
            <span
              className={`px-2 py-0.2 text-[11px] rounded-full font-bold ${
                activeTab === 'history'
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {historyCount}
            </span>
          )}
        </button>

        <Link
          href="/favorites"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <Star className="w-4 h-4 text-amber-500" />
          <span>{t('dashboard.tab_favorites', 'Favorites')}</span>
          {stats.favoritesCount > 0 && (
            <span className="px-2 py-0.2 text-[11px] rounded-full font-bold bg-amber-500/10 text-amber-500">
              {stats.favoritesCount}
            </span>
          )}
        </Link>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.toolsUsedCount}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.tools_used', 'Tools Used')}</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('history')}
              className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:border-cyan-500/50 cursor-pointer transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <History className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{historyCount}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.history_items', 'History Items')}</p>
                </div>
              </div>
            </div>

            <Link
              href="/favorites"
              className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:border-amber-500/50 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.favoritesCount}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.favorites', 'Favorites')}</p>
                </div>
              </div>
            </Link>

            <Link
              href="/settings"
              className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:border-emerald-500/50 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{t('dashboard.plan_free', 'Free')}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.plan', 'Plan')}</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Access Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* History Card - Real Interactive Trigger */}
            <div
              onClick={() => setActiveTab('history')}
              className="bg-card border border-border p-6 rounded-2xl hover:border-cyan-500/60 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-cyan-950/20"
            >
              <div className="h-11 w-11 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform text-cyan-400">
                <History className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-foreground mb-2 group-hover:text-cyan-400 transition-colors">
                {t('dashboard.saved_history', 'Activity History')}
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {t('dashboard.saved_history_desc', 'View, inspect, copy, and manage your formatted queries and tool activities.')}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold mt-4">
                <span>{t('dashboard.view_history', 'View History')}</span>
                {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </div>
            </div>

            {/* Favorites Card */}
            <Link
              href="/favorites"
              className="bg-card border border-border p-6 rounded-2xl hover:border-amber-500/60 transition-all duration-200 group shadow-sm"
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
              className="bg-card border border-border p-6 rounded-2xl hover:border-emerald-500/60 transition-all duration-200 group shadow-sm"
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

          {/* Recent Activity Section right on the Overview */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-foreground">
                  {language === 'ar' ? 'سجل العمليات والنشاطات الأخيرة' : 'Recent Tool Activity'}
                </h2>
              </div>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs text-cyan-400 hover:underline font-semibold flex items-center gap-1"
              >
                <span>{language === 'ar' ? 'عرض السجل بالكامل' : 'View Full History'}</span>
                {isRtl ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
              </button>
            </div>

            <HistoryView
              initialActivities={initialActivities}
              onCountChange={(cnt) => setHistoryCount(cnt)}
            />
          </div>
        </div>
      ) : (
        /* Full History Tab View */
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {t('dashboard.tab_history', 'Activity History')}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {language === 'ar'
                  ? 'سجل تفصيلي بكافة الأدوات والعمليات التي قمت بتنفيذها مع إمكانية البحث والنسخ والحذف.'
                  : 'Comprehensive log of all executed queries, conversions, and tool runs with copy, filter, and export.'}
              </p>
            </div>
          </div>

          <HistoryView
            initialActivities={initialActivities}
            onCountChange={(cnt) => setHistoryCount(cnt)}
          />
        </div>
      )}
    </div>
  )
}
