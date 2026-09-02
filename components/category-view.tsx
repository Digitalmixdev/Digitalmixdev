'use client'

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
  File,
  ScanLine,
  Palette,
  ArrowRight,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { ToolCategory, TOOL_CATEGORIES } from '@/constants/tools'
import { useLanguage } from '@/lib/i18n/context'

const categoryIcons: Record<string, LucideIcon> = {
  database: Database,
  developer: Code,
  calculators: Calculator,
  files: FileText,
}

const toolIcons: Record<string, LucideIcon> = {
  Database,
  Code,
  FileCode,
  FileSpreadsheet,
  FileText,
  FileArchive,
  File,
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
  Flame,
  RefreshCw,
  Image: ImageIcon,
  ScanLine,
  Palette,
}

interface CategoryViewProps {
  category: ToolCategory
}

export function CategoryView({ category }: CategoryViewProps) {
  const { t } = useLanguage()
  const CategoryIcon = categoryIcons[category.id] || Layers

  const localizedCategoryName = t(`cat.${category.id}`, category.name)
  const localizedCategoryDesc = t(`cat.${category.id}.desc`, category.description)

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center text-xs font-medium text-muted-foreground gap-1.5" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground transition-colors">
          {t('action.back_to_home', 'Back to Home')}
        </Link>
        <ChevronRight className="h-3 w-3 opacity-50 rtl:rotate-180" />
        <Link href="/tools" className="hover:text-foreground transition-colors">
          {t('footer.tools_directory', 'Tools Directory')}
        </Link>
        <ChevronRight className="h-3 w-3 opacity-50 rtl:rotate-180" />
        <span className="text-foreground font-semibold">{localizedCategoryName}</span>
      </nav>

      {/* Category Hero Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-8 rounded-3xl border border-border/70 bg-card shadow-xs">
        <div className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner shrink-0">
          <CategoryIcon className="h-8 w-8" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              {category.tools.length} {t('cat.tools_count', 'tools')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {localizedCategoryName}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            {localizedCategoryDesc}
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {category.tools.map((tool) => {
          const isActive = tool.active !== false
          const ToolIcon = toolIcons[tool.icon] || Code
          const toolName = t(`tool.${tool.id.replace(/-/g, '_')}`, tool.name)
          const toolDesc = t(`tool.${tool.id.replace(/-/g, '_')}_desc`, tool.description)

          return (
            <Link
              key={tool.id}
              href={isActive ? tool.href : '#'}
              className={`group relative p-6 rounded-2xl border border-border/70 bg-card hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between ${
                !isActive ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <ToolIcon className="h-5 w-5" />
                  </div>
                  {!isActive && (
                    <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                      {t('nav.coming_soon', 'Coming Soon')}
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {toolName}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {toolDesc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-primary">
                <span>{isActive ? t('tool_layout.open_tool', 'Open Tool') : t('nav.coming_soon', 'In Development')}</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Explore Other Categories */}
      <div className="pt-8 border-t border-border/60 space-y-6">
        <h2 className="text-lg font-bold text-foreground">{t('cat.toolkit_title', 'Explore Other Categories')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOL_CATEGORIES.filter((cat) => cat.slug !== category.slug).map((cat) => {
            const CatIcon = categoryIcons[cat.id] || Layers
            const otherCatName = t(`cat.${cat.id}`, cat.name)

            return (
              <Link
                key={cat.id}
                href={`/tools/${cat.slug}`}
                className="p-5 rounded-2xl border border-border/70 bg-card hover:border-primary/40 hover:bg-secondary/40 transition-all flex items-center gap-4 group shadow-xs"
              >
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
                  <CatIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                    {otherCatName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cat.tools.length} {t('cat.tools_count', 'tools')}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
