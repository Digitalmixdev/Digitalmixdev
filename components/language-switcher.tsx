'use client'

import React from 'react'
import { Languages, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/lib/i18n/context'

interface LanguageSwitcherProps {
  variant?: 'button' | 'dropdown' | 'compact'
  className?: string
}

export function LanguageSwitcher({ variant = 'dropdown', className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage, toggleLanguage } = useLanguage()

  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        className={`h-9 px-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all gap-1.5 shrink-0 ${className}`}
        aria-label="Toggle language between English and Arabic"
      >
        <Languages className="h-4 w-4 text-primary" />
        <span>{language === 'en' ? 'العربية' : 'English'}</span>
      </Button>
    )
  }

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleLanguage}
        className={`h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-95 shrink-0 ${className}`}
        title={language === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
        aria-label="Toggle Language"
      >
        <div className="flex items-center justify-center font-bold text-xs uppercase tracking-wider text-foreground">
          {language === 'en' ? 'AR' : 'EN'}
        </div>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 px-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all gap-1.5 shrink-0 ${className}`}
          aria-label="Select Language"
        >
          <Languages className="h-4 w-4 text-primary" />
          <span className="font-medium">{language === 'en' ? 'English' : 'العربية'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 p-1 z-60 bg-popover/95 backdrop-blur-xl border border-border/80 rounded-xl shadow-xl">
        <DropdownMenuItem
          onClick={() => setLanguage('en')}
          className={`flex items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-lg cursor-pointer ${language === 'en' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary'}`}
        >
          <div className="flex items-center gap-2">
            <span>English</span>
          </div>
          {language === 'en' && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage('ar')}
          className={`flex items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-lg cursor-pointer ${language === 'ar' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary'}`}
        >
          <div className="flex items-center gap-2">
            <span>العربية (Arabic)</span>
          </div>
          {language === 'ar' && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
