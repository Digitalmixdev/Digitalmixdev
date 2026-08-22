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
  Menu,
  X,
  LayoutDashboard,
  Star,
  LogOut,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/auth-provider'
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
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email
      ? user.email.slice(0, 2).toUpperCase()
      : 'DM'

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-muted-foreground z-50"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 z-40 bg-background/95 backdrop-blur-xl border-t border-border/40 flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto p-4 space-y-4 pb-16 shadow-2xl">
          {/* Categories Navigation */}
          <nav className="space-y-1 shrink-0">
            {categories.map((category) => {
              const IconComponent = iconMap[category.id] || Code

              return (
                <div key={category.id} className="space-y-1">
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground font-semibold text-sm tracking-wide border-b border-border/10">
                    <IconComponent className="h-4 w-4 text-primary" />
                    {category.name}
                  </div>

                  <div className="pl-6 space-y-0.5 pt-1">
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
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                            isActive
                              ? 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                              : 'text-muted-foreground/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ToolIcon className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">{item.name}</span>
                          </div>
                          {!isActive && (
                            <span className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground/60 scale-90 ml-2 shrink-0">
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
          <div className="shrink-0 -mt-2 pt-3 border-t border-border/40 space-y-2">
            {isLoaded && !isSignedIn && (
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="w-full h-11 border-border/80">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11">
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
                  </Link>
                </Button>
              </div>
            )}
            {isLoaded && isSignedIn && (
              <div className="space-y-2 p-3 rounded-xl bg-secondary/40 border border-border/60">
                <div className="flex items-center gap-3 pb-2 border-b border-border/40">
                  <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs tracking-wider shadow-xs shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate font-mono">{user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button asChild variant="ghost" className="justify-start text-foreground" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="justify-start text-foreground" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/favorites" className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Favorites
                    </Link>
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full justify-center text-destructive hover:text-destructive hover:bg-destructive/10 h-9 mt-1"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
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
