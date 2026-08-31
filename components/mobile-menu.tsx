'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Database,
  Code,
  Calculator,
  FileText,
  FileCode,
  FileSpreadsheet,
  Binary,
  Shield,
  Fingerprint,
  Key,
  BarChart3,
  TrendingUp,
  Layers,
  Maximize2,
  QrCode,
  FileArchive,
  Flame,
  RefreshCw,
  Image as ImageIcon,
  Menu,
  X,
  LayoutDashboard,
  Star,
  History,
  ScanLine,
  LogOut,
  Loader2,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { UserAvatar } from '@/components/user-avatar'
import { useLanguage } from '@/lib/i18n/context'
import { LanguageSwitcher } from '@/components/language-switcher'
import type { ToolCategory, ToolDefinition } from '@/constants/tools'

const iconMap: Record<string, LucideIcon> = {
  database: Database,
  developer: Code,
  calculators: Calculator,
  files: FileText,
}

const toolIconMap: Record<string, LucideIcon> = {
  Database,
  Code,
  FileCode,
  FileSpreadsheet,
  FileText,
  Binary,
  Shield,
  Fingerprint,
  Key,
  BarChart3,
  Calculator,
  TrendingUp,
  Layers,
  Maximize2,
  QrCode,
  FileArchive,
  Flame,
  RefreshCw,
  Image: ImageIcon,
  ScanLine,
}

interface MobileMenuProps {
  categories: ToolCategory[]
  isLoaded: boolean
  isSignedIn: boolean
  handleToolClick?: (tool: ToolDefinition, e: React.MouseEvent) => void
}

export function MobileMenu({
  categories,
  isLoaded,
  isSignedIn,
  handleToolClick,
}: MobileMenuProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const totalToolsCount = categories.reduce((sum, c) => sum + (c.tools?.length || 0), 0) || 18

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      setMobileMenuOpen(false)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'User')
  const { t } = useLanguage()

  const getCategoryTitle = (categoryId: string, defaultName: string) => {
    return t(`cat.${categoryId}`, defaultName)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 z-50 bg-background/95 backdrop-blur-2xl border-t border-border/60 flex flex-col max-h-[calc(100vh-64px)] overflow-y-auto p-4 sm:p-6 space-y-4 pb-20 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          {/* Quick Hub Links & Language Switcher */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-card border border-border/70">
            <span className="text-xs font-semibold text-muted-foreground">{t('nav.language', 'Language')}</span>
            <LanguageSwitcher variant="button" />
          </div>



          {/* Categories Navigation */}
          <nav className="space-y-3 shrink-0">
            {categories.map((category) => {
              const IconComponent = iconMap[category.id] || Code
              const categoryTitle = getCategoryTitle(category.id, category.name)

              return (
                <div key={category.id} className="rounded-2xl border border-border/60 bg-card/60 p-2.5 space-y-1">
                  <div className="flex items-center justify-between px-2 py-1.5 text-foreground font-bold text-xs tracking-wider uppercase">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-primary/10 text-primary">
                        <IconComponent className="h-3.5 w-3.5" />
                      </div>
                      <span>{categoryTitle}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {category.tools.length}
                    </span>
                  </div>

                    <div className="space-y-0.5 pt-0.5">
                      {category.tools.map((item) => {
                        const isActive = item.active !== false
                        const ToolIcon = toolIconMap[item.icon] || Code
                        const toolName = t(`tool.${item.id.replace(/-/g, '_')}`, item.name)

                        return (
                          <Link
                            key={item.id}
                            href={isActive ? item.href : '#'}
                            onClick={(e) => {
                              if (handleToolClick) handleToolClick(item, e)
                              if (isActive) setMobileMenuOpen(false)
                            }}
                            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                              isActive
                                ? 'text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-[0.99]'
                                : 'text-muted-foreground/40'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <ToolIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span className="truncate">{toolName}</span>
                            </div>
                            {!isActive && (
                              <span className="text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground/70 ml-2 rtl:ml-0 rtl:mr-2 shrink-0">
                                {t('nav.coming_soon', 'Soon')}
                              </span>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                </div>
              )
            })}
          </nav>

          {/* Auth Section */}
          <div className="shrink-0 pt-2 border-t border-border/40 space-y-2">
            {isLoaded && !isSignedIn && (
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="w-full h-11 text-xs font-semibold rounded-xl border-border">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    {t('nav.signin', 'Sign In')}
                  </Link>
                </Button>
                <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-xs font-bold rounded-xl shadow-md shadow-primary/20">
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    {t('nav.signup', 'Sign Up')}
                  </Link>
                </Button>
              </div>
            )}
            {isLoaded && isSignedIn && (
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs">
                <div className="flex items-center gap-3 pb-2.5 border-b border-border/40">
                  <UserAvatar
                    name={user?.name}
                    email={user?.email}
                    avatarData={user?.avatarData}
                    className="h-9 w-9 rounded-xl text-xs shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">{user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button asChild variant="ghost" size="sm" className="justify-start text-xs font-semibold rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-3.5 w-3.5 text-primary" /> {t('nav.dashboard', 'Dashboard')}
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="justify-start text-xs font-semibold rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/dashboard?view=history" className="flex items-center gap-2">
                      <History className="h-3.5 w-3.5 text-sky-500" /> {useLanguage().language === 'ar' ? 'سجل النشاطات' : 'Activity History'}
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="justify-start text-xs font-semibold rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="h-3.5 w-3.5 text-emerald-500" /> {t('nav.settings', 'Settings')}
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="justify-start text-xs font-semibold rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/favorites" className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> {t('nav.favorites', 'Favorites')}
                    </Link>
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full justify-center text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 h-9 rounded-xl gap-2"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5 rtl:rotate-180" />
                  )}
                  <span>{isLoggingOut ? t('action.processing', 'Logging out...') : t('nav.logout', 'Sign out')}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
