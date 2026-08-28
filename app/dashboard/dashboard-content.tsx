'use client'

import Link from 'next/link'
import { History, Star, Settings, Zap } from 'lucide-react'
import { UserAvatar } from '@/components/user-avatar'
import { useLanguage } from '@/lib/i18n/context'

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
}

export function DashboardContent({ user, stats }: DashboardContentProps) {
  const { t, language } = useLanguage()
  const displayName = user.name || user.email.split('@')[0] || 'Developer'

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('dashboard.welcome_back', 'Welcome back,')} {displayName}!
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-mono">
            {user.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <UserAvatar
            name={user.name}
            email={user.email}
            avatarData={user.avatarData}
            className="h-10 w-10 text-xs ring-2 ring-primary/20"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.toolsUsedCount}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.tools_used', 'Tools Used')}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <History className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.historyCount}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.history_items', 'History Items')}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.favoritesCount}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.favorites', 'Favorites')}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{t('dashboard.plan_free', 'Free')}</p>
              <p className="text-xs text-muted-foreground">{t('dashboard.plan', 'Plan')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-xl">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
            <History className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">{t('dashboard.saved_history', 'Saved History')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('dashboard.saved_history_desc', 'Your formatted queries and tool histories will appear here.')}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-3 italic">{t('dashboard.coming_soon', 'Coming Soon')}</p>
        </div>

        <Link
          href="/favorites"
          className="bg-card border border-border p-6 rounded-xl hover:border-primary/50 transition-colors group"
        >
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Star className="h-5 w-5 text-amber-500" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">{t('dashboard.favorites', 'Favorites')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('dashboard.favorites_desc', 'Save your most-used tools for quick access.')}
          </p>
          <p className="text-xs text-primary font-medium mt-3">
            {t('dashboard.view_favorites', 'View Favorites')} &rarr;
          </p>
        </Link>

        <Link
          href="/settings"
          className="bg-card border border-border p-6 rounded-xl hover:border-primary/50 transition-colors group"
        >
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Settings className="h-5 w-5 text-emerald-500" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">{t('settings.title', 'Settings')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('dashboard.settings_desc', 'Customize your experience and preferences.')}
          </p>
          <p className="text-xs text-emerald-500 font-medium mt-3">{t('dashboard.open_settings', 'Open Settings')} &rarr;</p>
        </Link>
      </div>
    </div>
  )
}
