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
  Menu,
  X,
  LayoutDashboard,
  Star,
  LogOut,
  Loader2,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
import { UserAvatar } from '@/components/user-avatar'
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
          {/* Quick Hub Links */}
          <div className={`grid ${isSignedIn ? 'grid-cols-2' : 'grid-cols-1'} gap-2 shrink-0 pb-2 border-b border-border/40`}>
            <Link
              href="/tools"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/70 text-xs font-bold text-foreground hover:border-primary/40 hover:bg-secondary/60 transition-all"
            >
              <div className="p-1 rounded-lg bg-primary/10 text-primary">
                <LayoutDashboard className="h-3.5 w-3.5" />
              </div>
              <span>All Tools (14)</span>
            </Link>

            {isSignedIn && (
              <Link
                href="/favorites"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border/70 text-xs font-bold text-foreground hover:border-amber-500/40 hover:bg-amber-500/5 transition-all"
              >
                <div className="p-1 rounded-lg bg-amber-500/10 text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                </div>
                <span>My Favorites</span>
              </Link>
            )}
          </div>

          {/* Categories Navigation */}
          <nav className="space-y-3 shrink-0">
            {categories.map((category) => {
              const IconComponent = iconMap[category.id] || Code

              return (
                <div key={category.id} className="rounded-2xl border border-border/60 bg-card/60 p-2.5 space-y-1">
                  <div className="flex items-center justify-between px-2 py-1.5 text-foreground font-bold text-xs tracking-wider uppercase">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-primary/10 text-primary">
                        <IconComponent className="h-3.5 w-3.5" />
                      </div>
                      <span>{category.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {category.tools.length}
                    </span>
                  </div>

                  <div className="space-y-0.5 pt-0.5">
                    {category.tools.map((item) => {
                      const isActive = item.active !== false
                      const ToolIcon = toolIconMap[item.icon] || Code
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
                            <span className="truncate">{item.name}</span>
                          </div>
                          {!isActive && (
                            <span className="text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground/70 ml-2 shrink-0">
                              Soon
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
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-xs font-bold rounded-xl shadow-md shadow-primary/20">
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button asChild variant="ghost" size="sm" className="justify-start text-xs font-semibold rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-3.5 w-3.5 text-primary" /> Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="justify-start text-xs font-semibold rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings className="h-3.5 w-3.5 text-emerald-500" /> Settings
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm" className="justify-start text-xs font-semibold rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/favorites" className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Favorites
                    </Link>
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full justify-center text-xs font-semibold text-destructive hover:text-destructive hover:bg-destructive/10 h-9 rounded-xl"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  <span>{isLoggingOut ? 'Logging out...' : 'Sign out'}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
