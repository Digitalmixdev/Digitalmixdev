'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Code,
  FileCode,
  FileText,
  Binary,
  Shield,
  Fingerprint,
  Key,
  BarChart3,
  Calculator,
  Layers,
  Maximize2,
  QrCode,
  FileArchive,
  Flame,
  RefreshCw,
  Image as ImageIcon,
  File,
  Search,
  ArrowRight,
  Database,
  Wrench,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
  TrendingUp,
  ScanLine,
  Palette,
} from 'lucide-react'
import { ALL_TOOLS, TOOL_CATEGORIES, CategoryId } from '@/constants/tools'
import { useLanguage } from '@/lib/i18n/context'

const ICON_MAP: Record<string, any> = {
  Database,
  Code,
  FileCode,
  FileSpreadsheet,
  FileText,
  FileArchive,
  File,
  Binary,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Fingerprint,
  Key,
  BarChart3,
  Calculator,
  TrendingUp,
  Layers,
  Maximize2,
  QrCode,
  Flame,
  RefreshCw,
  Image: ImageIcon,
  ScanLine,
  Palette,
}

const CATEGORY_ICON_MAP: Record<CategoryId, any> = {
  database: Database,
  developer: Code,
  calculators: Calculator,
  files: FileText,
}

export function ToolsDirectory() {
  const router = useRouter()
  const { t } = useLanguage()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const filteredTools = useMemo(() => {
    return ALL_TOOLS.filter((tool) => {
      const matchesCategory =
        selectedCategory === 'all' || tool.categoryId === selectedCategory

      const q = searchQuery.toLowerCase().trim()
      if (!q) return matchesCategory

      const matchesSearch =
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q)) ||
        tool.slug.toLowerCase().includes(q)

      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t('tools_dir.badge', '100% Free & Privacy-First Utilities')}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            {t('tools_dir.title', 'Explore All Developer & Business Tools')}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground text-pretty">
            {t('tools_dir.subtitle', 'High-performance, client-side developer utilities and financial calculators. No sign-up required, zero data collection.')}
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="max-w-2xl mx-auto mb-12 space-y-5">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('tools_dir.search_placeholder', 'Search tools by name, tag, or keyword (e.g., JWT, SQL, JSON, QR)...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-13 pl-12 pr-4 rtl:pl-4 rtl:pr-12 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm sm:text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground bg-secondary px-2 py-1 rounded-md"
              >
                {t('tools_dir.clear', 'Clear')}
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                  : 'bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40'
              }`}
            >
              {t('tools_dir.all_categories', 'All Categories')} ({ALL_TOOLS.length})
            </button>

            {TOOL_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICON_MAP[category.id] || Wrench
              const isSelected = selectedCategory === category.id
              const count = category.tools.length
              const catName = t(`cat.${category.id}`, category.name)

              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                      : 'bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/40'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{catName}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-background/80 text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border/40">
          <p className="text-sm text-muted-foreground">
            {t('cat.toolkit_badge', 'Tools')}: <span className="font-semibold text-foreground">{filteredTools.length}</span>
            {selectedCategory !== 'all' && (
              <span> • {t(`cat.${selectedCategory}`, TOOL_CATEGORIES.find((c) => c.id === selectedCategory)?.name || '')}</span>
            )}
            {searchQuery && <span> matching &ldquo;{searchQuery}&rdquo;</span>}
          </p>

          <Link
            href="/favorites"
            className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <span>{t('nav.favorites', 'Favorites')} →</span>
          </Link>
        </div>

        {/* Tools Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredTools.map((tool) => {
              const IconComponent = ICON_MAP[tool.icon] || Code
              const category = TOOL_CATEGORIES.find((c) => c.id === tool.categoryId)
              const toolName = t(`tool.${tool.id.replace(/-/g, '_')}`, tool.name)
              const toolDesc = t(`tool.${tool.id.replace(/-/g, '_')}_desc`, tool.description)
              const catName = t(`cat.${tool.categoryId}`, category?.name || tool.categoryId)

              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xs p-5 sm:p-6 transition-all duration-300 hover:shadow-xl hover:border-primary/40 hover:-translate-y-1 hover:shadow-primary/5"
                >
                  <div>
                    {/* Top Row: Icon + Category Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105 transition-all duration-300 shadow-xs">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-secondary border border-border/50 text-muted-foreground">
                        {catName}
                      </span>
                    </div>

                    {/* Tool Name */}
                    <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                      {toolName}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                      {toolDesc}
                    </p>
                  </div>

                  <div>
                    {/* Keywords/tags */}
                    <div className="flex flex-wrap gap-1 mb-4 pt-3 border-t border-border/40">
                      {tool.keywords.slice(0, 3).map((keyword) => (
                        <span
                          key={keyword}
                          className="text-[10px] font-medium text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-md border border-border/30"
                        >
                          #{keyword}
                        </span>
                      ))}
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between text-xs font-semibold text-primary pt-1">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> 100% Free
                      </span>
                      <span className="inline-flex items-center gap-1 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                        {t('tools_dir.open_tool', 'Open Tool')}
                        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-border/60 bg-card/40">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-lg font-semibold text-foreground">{t('tools_dir.no_tools', 'No tools found matching your search.')}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              We couldn&apos;t find any tools matching your criteria. Try adjusting your search query or filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
              className="mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              {t('tools_dir.clear', 'Clear')}
            </button>
          </div>
        )}

        {/* Categories Section */}
        <div className="mt-20 pt-12 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-foreground">{t('cat.toolkit_title', 'Browse by Category')}</h2>
            <p className="text-sm text-muted-foreground mt-2">
              {t('cat.toolkit_subtitle', 'Deep dive into specialized toolkits designed for specific workflows.')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TOOL_CATEGORIES.map((cat) => {
              const catName = t(`cat.${cat.id}`, cat.name)
              const catDesc = t(`cat.${cat.id}.desc`, cat.description)

              return (
                <Link
                  key={cat.id}
                  href={`/tools/${cat.slug}`}
                  className="group p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-lg transition-all"
                >
                  <div className="text-3xl mb-3">{cat.icon}</div>
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                    {catName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                    {catDesc}
                  </p>
                  <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <span>{cat.tools.length} {t('cat.tools_count', 'tools')}</span>
                    <span className="text-primary group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                      {t('cat.explore', 'Explore')} →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
