"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Database,
  Code,
  Calculator,
  FileText,
  ArrowRight,
  Rocket,
  Flame,
} from "lucide-react"
import { TOOL_CATEGORIES, ToolDefinition, ToolCategory, CategoryId } from "@/constants/tools"
import { useLanguage } from "@/lib/i18n/context"

const iconMap: Record<CategoryId, typeof Database> = {
  database: Database,
  developer: Code,
  calculators: Calculator,
  files: FileText,
}

const categoryStyles: Record<CategoryId, {
  activeButton: string
  sublabelColor: string
}> = {
  database: {
    activeButton: "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/25 hover:border-blue-500/50",
    sublabelColor: "text-blue-600 dark:text-blue-400",
  },
  developer: {
    activeButton: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/25 hover:border-emerald-500/50",
    sublabelColor: "text-emerald-600 dark:text-emerald-400",
  },
  calculators: {
    activeButton: "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/25 hover:border-amber-500/50",
    sublabelColor: "text-amber-600 dark:text-amber-400",
  },
  files: {
    activeButton: "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/25 hover:border-rose-500/50",
    sublabelColor: "text-rose-600 dark:text-rose-400",
  },
}

function showComingSoon() {
  toast("Coming Soon!", {
    description: "We are working hard to build this tool for you.",
    icon: <Rocket className="h-4 w-4" />,
    duration: 3000,
  })
}

export function CategoriesGrid() {
  const router = useRouter()
  const { t } = useLanguage()

  const handleToolClick = (tool: ToolDefinition, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (tool.active && tool.href) {
      router.push(tool.href)
    } else {
      showComingSoon()
    }
  }

  const getCategoryName = (id: string, defName: string) => t(`cat.${id}`, defName)
  const getCategoryDesc = (id: string, defDesc: string) => t(`cat.${id}.desc`, defDesc)

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1 rounded-full border border-primary/20">
            {t('cat.toolkit_badge', 'Categorized Toolkits')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance mt-3">
            {t('cat.toolkit_title', 'Explore Powerful Developer Suites')}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto text-pretty">
            {t('cat.toolkit_subtitle', 'Discover lightweight, zero-latency utilities organized by workflow domain. All tools are free, private, and execute locally.')}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {TOOL_CATEGORIES.map((category) => {
            const IconComponent = iconMap[category.id] || Database
            const href = `/tools/${category.slug}`
            const catStyle = categoryStyles[category.id]
            const categoryName = getCategoryName(category.id, category.name)
            const categoryDesc = getCategoryDesc(category.id, category.description)

            return (
              <div
                key={category.id}
                onClick={() => router.push(href)}
                className={`group relative flex flex-col rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xs p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer ${category.borderColor || 'hover:border-primary/50'}`}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 rounded-2xl bg-linear-to-br ${category.color || 'from-primary/20 to-primary/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

                <div className="relative flex flex-col justify-between h-full">
                  <div>
                    {/* Icon and Tool Count */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/80 border border-border/60 ${category.iconColor || 'text-primary'} shadow-xs group-hover:scale-105 transition-transform duration-200`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <span className="inline-flex items-center rounded-full bg-secondary/80 border border-border/60 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                        {category.tools.length} {t('cat.tools_count', 'tools')}
                      </span>
                    </div>

                    {/* Title and Description */}
                    <h3 className="text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors" suppressHydrationWarning>
                      {categoryName}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2" suppressHydrationWarning>
                      {categoryDesc}
                    </p>

                    {/* Tool Tags with All Tools Visible from Outside in Category Colors */}
                    <div className="mb-5">
                      <div className="flex flex-wrap gap-1.5">
                        {category.tools.map((tool) => {
                          const localizedToolName = t(`tool.${tool.id.replace(/-/g, '_')}`, tool.name)
                          const localizedToolDesc = t(`tool.${tool.id.replace(/-/g, '_')}_desc`, tool.description)

                          return (
                            <button
                              key={tool.id}
                              type="button"
                              suppressHydrationWarning
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToolClick(tool, e)
                              }}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all text-left rtl:text-right ${
                                tool.active
                                  ? `${catStyle?.activeButton || 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'} hover:scale-[1.02]`
                                  : "bg-secondary text-muted-foreground/60 cursor-pointer border border-border/40"
                              }`}
                              title={localizedToolDesc}
                            >
                              <span className="flex items-center gap-1">
                                {localizedToolName}
                                {!tool.active && (
                                  <span className="text-[9px] opacity-70">{t('nav.coming_soon', 'Soon')}</span>
                                )}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Arrow CTA */}
                  <div className={`pt-3 border-t border-border/40 flex items-center justify-between text-xs font-semibold ${catStyle?.sublabelColor || 'text-primary'}`}>
                    <span>{t('cat.explore', 'Explore All')} {categoryName}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
