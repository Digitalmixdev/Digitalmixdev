"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTheme } from "@/components/theme-provider"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { UserMenu } from "@/components/user-menu"
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
  ChevronDown,
  Moon,
  Sun,
  Wrench,
  Rocket,
  LayoutDashboard,
  Star,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { TOOL_CATEGORIES, type ToolDefinition } from "@/constants/tools"
import { MobileMenu } from "./mobile-menu"
import { LanguageSwitcher } from "./language-switcher"
import { useLanguage } from "@/lib/i18n/context"

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
}

function showComingSoon() {
  toast("Coming Soon!", {
    description: "We are working hard to build this tool for you.",
    icon: <Rocket className="h-4 w-4" />,
    duration: 3000,
  })
}

export function Header() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const { isAuthenticated, isLoading } = useAuth()
  const { t, language } = useLanguage()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const handleToolClick = (tool: ToolDefinition, e: React.MouseEvent) => {
    if (tool.active === false || !tool.href) {
      e.preventDefault()
      showComingSoon()
    }
  }

  const getCategoryTitle = (categoryId: string, defaultName: string) => {
    return t(`cat.${categoryId}`, defaultName)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/65 transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 sm:gap-4">

          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25 group-hover:scale-105 group-hover:shadow-primary/35 transition-all duration-200">
              <Wrench className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors">
                {language === 'ar' ? 'DigitalMix' : 'DigitalMix'}
              </span>
            </div>
          </Link>
                  
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center gap-1.5 lg:mx-auto">
            {TOOL_CATEGORIES.map((category) => {
              const IconComponent = iconMap[category.id] || Code 
              const categoryTitle = getCategoryTitle(category.id, category.name)

              return (
                <DropdownMenu key={category.id}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 px-3 gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/70 rounded-xl transition-all">
                      <IconComponent className="h-3.5 w-3.5 text-primary" />
                      {categoryTitle}
                      <ChevronDown className="h-3 w-3 opacity-60 transition-transform duration-200" />
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent 
                    align="start" 
                    className="w-68 z-60 bg-popover/95 backdrop-blur-xl border border-border/80 shadow-2xl p-1.5 rounded-2xl animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
                  >
                    <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 border-b border-border/40 mb-1">
                      {categoryTitle} ({category.tools.length})
                    </div>
                    {category.tools.map((item) => {
                      const isActive = item.active !== false
                      const ToolIcon = toolIconMap[item.icon] || Code
                      return (
                        <DropdownMenuItem 
                          key={item.id} 
                          asChild 
                          className={`cursor-pointer rounded-xl transition-all hover:bg-secondary/80 ${!isActive ? "opacity-50" : ""}`}
                        >
                          <Link 
                            href={isActive ? item.href : "#"} 
                            onClick={(e) => handleToolClick(item, e)} 
                            className="flex items-center justify-between w-full px-2.5 py-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="p-1 rounded-lg bg-primary/10 text-primary">
                                <ToolIcon className="h-3.5 w-3.5 shrink-0" />
                              </div>
                              <span className={`text-xs font-semibold ${!isActive ? "text-muted-foreground" : "text-foreground"} truncate`}>
                                {t(`tool.${item.id.replace(/-/g, '_')}`, item.name)}
                              </span>
                            </div>
                            {!isActive && (
                              <span className="text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground shrink-0 ml-2">
                                {t('nav.coming_soon', 'Soon')}
                              </span>
                            )}
                          </Link>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            })}
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Language Switcher */}
            <LanguageSwitcher variant="dropdown" className="hidden sm:flex" />
            <LanguageSwitcher variant="compact" className="sm:hidden flex" />

            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme} 
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-95"
              aria-label="Toggle theme"
              suppressHydrationWarning
            >
              {mounted && resolvedTheme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5" />}
            </Button>

            {/* Quick Favorites Link (Desktop) */}
            {mounted && !isLoading && isAuthenticated && (
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 hidden sm:flex transition-all"
                title={t('nav.favorites', 'My Favorites')}
              >
                <Link href="/favorites" aria-label="Favorites">
                  <Star className="h-4.5 w-4.5 text-amber-500" />
                </Link>
              </Button>
            )}

            {/* Auth Section */}
            {mounted && !isLoading && !isAuthenticated ? (
              <div className="hidden lg:flex items-center gap-2 animate-in fade-in duration-150">
                <Button asChild variant="ghost" size="sm" className="h-9 px-3 text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground">
                  <Link href="/login">{t('nav.signin', 'Sign In')}</Link>
                </Button>
                <Button asChild size="sm" className="h-9 px-3.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20">
                  <Link href="/signup">{t('nav.signup', 'Sign Up')}</Link>
                </Button>
              </div>
            ) : mounted && isAuthenticated ? (
              <div className="hidden sm:flex items-center min-h-[36px]">
                <UserMenu />
              </div>
            ) : null}

            <MobileMenu 
              categories={TOOL_CATEGORIES} 
              isLoaded={!isLoading} 
              isSignedIn={isAuthenticated} 
              handleToolClick={handleToolClick} 
            />
          </div>
        </div>
      </div>
    </header>
  )
}
