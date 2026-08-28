'use client'

import React, { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useTheme } from '@/components/theme-provider'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Wrench,
  Star,
  LayoutDashboard,
  Sun,
  Moon,
  ShieldCheck,
  Zap,
  Lock,
  Sparkles,
  ChevronRight,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useAuth } from '@/components/auth-provider'
import { UserMenu } from '@/components/user-menu'
import { MobileMenu } from '@/components/mobile-menu'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useLanguage } from '@/lib/i18n/context'
import { Footer } from '@/components/footer'
import {
  TOOL_CATEGORIES,
  getToolsByCategory,
  type ToolId,
} from '@/constants/tools'
import { isFavoriteTool, toggleFavoriteTool } from '@/actions/favorites'
import { cn } from '@/lib/utils'

export interface ToolFeature {
  title: string
  desc: string
  icon?: LucideIcon
}

export interface ToolFaq {
  q: string
  a: string
}

export interface ToolRelatedItem {
  id?: string
  name: string
  href: string
  description?: string
  icon?: LucideIcon
}

export interface ToolMetadata {
  id: ToolId | string
  name: string
  description: string
  category: {
    id: string
    name: string
    slug: string
  }
  icon: LucideIcon
  privacyBadge?: string
  features?: ToolFeature[]
  faqs?: ToolFaq[]
  relatedTools?: ToolRelatedItem[]
}

interface ToolLayoutProps {
  metadata: ToolMetadata
  children: React.ReactNode
  className?: string
  maxWidth?: '5xl' | '6xl' | '7xl' | 'full'
}

const DEFAULT_PILLARS: ToolFeature[] = [
  {
    icon: Zap,
    title: 'Instant Execution',
    desc: 'Powered entirely by your browser thread with zero network latency.',
  },
  {
    icon: ShieldCheck,
    title: '100% Client-Side',
    desc: 'Your queries, texts, and files never leave your device.',
  },
  {
    icon: Lock,
    title: 'Sandboxed & Secure',
    desc: 'Local memory processing with zero server-side storage or tracking.',
  },
  {
    icon: Sparkles,
    title: 'Free & Unlimited',
    desc: 'No rate limits, subscription walls, or mandatory registrations.',
  },
]

export function ToolLayout({
  metadata,
  children,
  className,
  maxWidth = '6xl',
}: ToolLayoutProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const { t, language } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isPending, startTransition] = useTransition()

  const ToolIcon = metadata.icon || Wrench

  const localizedToolName = t(`tool.${metadata.id.replace(/-/g, '_')}`, metadata.name)
  const localizedToolDesc = t(`tool.${metadata.id.replace(/-/g, '_')}_desc`, metadata.description)
  const localizedCategoryName = t(`cat.${metadata.category.id}`, metadata.category.name)

  const defaultPillarsLocalized: ToolFeature[] = [
    {
      icon: Zap,
      title: t('tool_layout.instant_title', 'Instant Execution'),
      desc: t('tool_layout.instant_desc', 'Powered entirely by your browser thread with zero network latency.'),
    },
    {
      icon: ShieldCheck,
      title: t('tool_layout.client_side_title', '100% Client-Side'),
      desc: t('tool_layout.client_side_desc', 'Your queries, texts, and files never leave your device.'),
    },
    {
      icon: Lock,
      title: t('tool_layout.secure_title', 'Sandboxed & Secure'),
      desc: t('tool_layout.secure_desc', 'Local memory processing with zero server-side storage or tracking.'),
    },
    {
      icon: Sparkles,
      title: t('tool_layout.free_title', 'Free & Unlimited'),
      desc: t('tool_layout.free_desc', 'No rate limits, subscription walls, or mandatory registrations.'),
    },
  ]

  const features = metadata.features && metadata.features.length > 0 ? metadata.features : defaultPillarsLocalized
  const faqs = metadata.faqs || []

  // Compute related tools dynamically if not explicitly provided
  const relatedTools: ToolRelatedItem[] =
    metadata.relatedTools && metadata.relatedTools.length > 0
      ? metadata.relatedTools
      : getToolsByCategory(metadata.category.id)
          .filter((t) => t.id !== metadata.id && t.slug !== metadata.id)
          .slice(0, 3)
          .map((t) => ({
            name: t.name,
            href: t.href,
            description: t.description,
          }))

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let isCancelled = false
    const checkFavorite = async () => {
      try {
        const favorited = await isFavoriteTool(metadata.id)
        if (!isCancelled) {
          setIsFavorite(favorited)
        }
      } catch (err) {
        console.error('Failed to load favorite status:', err)
      }
    }
    checkFavorite()
    return () => {
      isCancelled = true
    }
  }, [metadata.id])

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      toast.info('Sign in required', {
        description: 'Please sign in to save tools to your favorites list.',
      })
      router.push('/login')
      return
    }

    startTransition(async () => {
      try {
        const newStatus = await toggleFavoriteTool(metadata.id)
        setIsFavorite(newStatus)
        if (newStatus) {
          toast.success('Added to favorites', {
            description: `${metadata.name} is now pinned to your favorites dashboard.`,
            icon: <Star className="h-4 w-4 text-amber-500 fill-amber-500" />,
          })
        } else {
          toast.info('Removed from favorites', {
            description: `${metadata.name} removed from your favorites list.`,
          })
        }
      } catch (err) {
        toast.error('Could not update favorites', {
          description: 'An unexpected error occurred. Please try again.',
        })
      }
    })
  }

  const maxWidthClass = {
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  }[maxWidth]

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* 1. STICKY GLASSMORPHISM HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/65 transition-all">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3 sm:gap-4">
            {/* Left: Brand + Breadcrumbs */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <Link
                href="/"
                className="flex items-center gap-2.5 shrink-0 group py-1"
                aria-label="DigitalMix Home"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25 group-hover:scale-105 group-hover:shadow-primary/35 transition-all duration-200">
                  <Wrench className="h-4.5 w-4.5" />
                </div>
                <span className="text-lg font-extrabold tracking-tight text-foreground hidden sm:inline-block">
                  DigitalMix
                </span>
              </Link>

              {/* Breadcrumbs (Desktop & Tablet) */}
              <div className="hidden sm:flex items-center text-xs text-muted-foreground gap-1.5 pl-2.5 border-l border-border/60">
                <Link
                  href={`/tools/${metadata.category.slug}`}
                  className="hover:text-foreground transition-colors font-medium hover:underline underline-offset-2"
                >
                  {localizedCategoryName}
                </Link>
                <ChevronRight className="h-3 w-3 text-muted-foreground/50 rtl:rotate-180" />
                <span className="text-foreground font-semibold truncate max-w-35 md:max-w-50 lg:max-w-70 flex items-center gap-1.5">
                  <ToolIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                  {localizedToolName}
                </span>
              </div>

              {/* Mobile Breadcrumb Chip (<640px) */}
              <Link
                href={`/tools/${metadata.category.slug}`}
                className="sm:hidden flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary/80 px-2 py-1 rounded-lg border border-border/60 truncate max-w-36"
              >
                <span>{localizedCategoryName}</span>
              </Link>
            </div>

            {/* Right: Actions (Language, Theme, Tool Favorite Toggle, Auth Conditional Links) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Language Switcher */}
              <div className="hidden sm:block">
                <LanguageSwitcher variant="button" />
              </div>

              {/* Favorite Button for the current tool */}
              {!isLoading && isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFavorite}
                  disabled={isPending}
                  className={cn(
                    'h-9 w-9 rounded-xl transition-all duration-200 active:scale-95',
                    isFavorite
                      ? 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                  )}
                  title={isFavorite ? t('nav.favorites', 'Remove from favorites') : t('nav.favorites', 'Add to favorites')}
                  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star
                    className={cn(
                      'h-4.5 w-4.5 transition-transform duration-300',
                      isFavorite ? 'fill-amber-500 text-amber-500 scale-110' : 'text-current',
                    )}
                  />
                </Button>
              )}

              {/* Theme Toggle */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-95"
                  aria-label="Toggle color theme"
                >
                  {resolvedTheme === 'dark' ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5" />}
                </Button>
              )}

              {/* Conditional Auth Section */}
              {!isLoading && (
                <>
                  {isAuthenticated ? (
                    <UserMenu />
                  ) : (
                    <div className="hidden sm:flex items-center gap-2">
                      <Button asChild variant="ghost" size="sm" className="h-9 px-3 text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground">
                        <Link href="/login">{t('nav.signin', 'Sign In')}</Link>
                      </Button>
                      <Button asChild size="sm" className="h-9 px-3.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20">
                        <Link href="/signup">{t('nav.signup', 'Sign Up')}</Link>
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Mobile Drawer */}
              <MobileMenu
                categories={TOOL_CATEGORIES}
                isLoaded={!isLoading}
                isSignedIn={isAuthenticated}
                handleToolClick={() => {}}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-10 sm:pt-14 sm:pb-14 text-center bg-radial from-primary/10 via-background to-background border-b border-border/40">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/3 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-10 right-1/3 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          {/* Dynamic Floating Tool Icon */}
          <div className="inline-flex items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-primary/10 border border-primary/25 text-primary shadow-xl shadow-primary/15 mb-4 sm:mb-5 transition-transform hover:scale-105 duration-200">
            <ToolIcon className="h-7 w-7 sm:h-9 sm:w-9" />
          </div>

          {/* Tool Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-3 text-balance leading-tight">
            {localizedToolName}
          </h1>

          {/* Tool Description */}
          <p className="text-xs sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-5 text-pretty">
            {localizedToolDesc}
          </p>

          {/* Privacy Guarantee Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>{t('tool_layout.privacy_badge', metadata.privacyBadge || '100% Client-Side • Zero Server Storage')}</span>
          </div>
        </div>
      </section>

      {/* 3. TOOL WORKSPACE CONTAINER */}
      <main className="flex-1 py-8 sm:py-10">
        <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', maxWidthClass, className)}>
          {children}
        </div>

        {/* 4. UNIFIED FEATURE CARDS GRID (4 Pillars) */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20 pt-12 border-t border-border/50">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
              {t('tool_layout.guarantee_badge', 'Performance & Privacy Guarantee')}
            </h2>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {t('tool_layout.guarantee_title', 'Engineered for Modern Developers')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, idx) => {
              const FeatureIcon = feature.icon || Zap
              return (
                <div
                  key={idx}
                  className="p-5 sm:p-6 rounded-2xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 flex flex-col group"
                >
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit mb-4 group-hover:scale-110 transition-transform duration-200">
                    <FeatureIcon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-base text-foreground mb-1.5">
                    {feature.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* 5. INTERACTIVE FAQ ACCORDION */}
        {faqs.length > 0 && (
          <section className="mx-auto max-w-3xl px-4 sm:px-6 mt-16 sm:mt-20">
            <div className="text-center mb-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                {t('tool_layout.faq_badge', 'Knowledge Base')}
              </h2>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {t('tool_layout.faq_title', 'Frequently Asked Questions')}
              </h3>
            </div>

            <Accordion type="single" collapsible defaultValue="faq-0">
              {faqs.map((faq, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`}>
                  <AccordionTrigger>{faq.q}</AccordionTrigger>
                  <AccordionContent>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {/* 6. RELATED TOOLS GRID */}
        {relatedTools.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16 sm:mt-20 pt-12 border-t border-border/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {t('tool_layout.explore_more', 'Explore More')} {localizedCategoryName}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('tool_layout.related_desc', 'Discover related utilities in this suite.')}
                </p>
              </div>

              <Link
                href={`/tools/${metadata.category.slug}`}
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
              >
                {t('tool_layout.view_all_cat', 'View all category tools')}
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {relatedTools.map((tool) => {
                const toolSlug = tool.href.replace('/tools/', '').replace(/\?.*$/, '')
                const relToolName = t(`tool.${toolSlug.replace(/-/g, '_')}`, tool.name)
                const relToolDesc = t(`tool.${toolSlug.replace(/-/g, '_')}_desc`, tool.description || '')

                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="p-5 rounded-2xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1.5 flex items-center justify-between text-sm sm:text-base">
                        <span>{relToolName}</span>
                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary rtl:rotate-180" />
                      </h4>
                      {relToolDesc && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {relToolDesc}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/40 text-xs font-semibold text-primary inline-flex items-center gap-1">
                      <span>{t('tool_layout.open_tool', 'Open Tool')}</span>
                      <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </main>

      {/* 7. FOOTER */}
      <Footer />
    </div>
  )
}
