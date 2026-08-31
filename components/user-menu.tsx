'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Star, History, LogOut, Loader2, Settings } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'
import { useLanguage } from '@/lib/i18n/context'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserMenuProps {
  align?: 'start' | 'end' | 'center'
  className?: string
}

export function UserMenu({ align = 'end', className }: UserMenuProps) {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (!user) return null

  const displayName = user.name || user.email.split('@')[0]
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative h-9 w-9 rounded-full ring-offset-background transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:scale-105 ${className || ''}`}
          aria-label="User account menu"
        >
          <UserAvatar
            name={user.name}
            email={user.email}
            avatarData={user.avatarData}
            className="h-9 w-9 text-xs"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={align}
        className="w-56 p-1.5 bg-popover/95 backdrop-blur-md border border-border/80 shadow-2xl z-70"
      >
        <DropdownMenuLabel className="font-normal px-2 py-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-foreground truncate">
              {displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground truncate font-mono">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1 bg-border/60" />

        <DropdownMenuItem asChild className="cursor-pointer rounded-md focus:bg-secondary">
          <Link href="/dashboard" className="flex items-center gap-2.5 px-2 py-2 text-sm font-medium">
            <LayoutDashboard className="h-4 w-4 text-primary" />
            <span>{t('nav.dashboard', 'Dashboard')}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer rounded-md focus:bg-secondary">
          <Link href="/dashboard?view=history" className="flex items-center gap-2.5 px-2 py-2 text-sm font-medium">
            <History className="h-4 w-4 text-sky-500" />
            <span>{useLanguage().language === 'ar' ? 'سجل النشاطات' : 'Activity History'}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer rounded-md focus:bg-secondary">
          <Link href="/settings" className="flex items-center gap-2.5 px-2 py-2 text-sm font-medium">
            <Settings className="h-4 w-4 text-emerald-500" />
            <span>{t('nav.settings', 'Settings')}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer rounded-md focus:bg-secondary">
          <Link href="/favorites" className="flex items-center gap-2.5 px-2 py-2 text-sm font-medium">
            <Star className="h-4 w-4 text-amber-500" />
            <span>{t('nav.favorites', 'Favorites')}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 bg-border/60" />

        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer rounded-md text-destructive focus:text-destructive focus:bg-destructive/10 px-2 py-2 text-sm font-medium"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 mr-2.5 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4 mr-2.5" />
          )}
          <span>{isLoggingOut ? t('action.processing', 'Logging out...') : t('nav.logout', 'Sign out')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
