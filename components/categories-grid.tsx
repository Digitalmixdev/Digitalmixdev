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

const iconMap: Record<CategoryId, typeof Database> = {
  database: Database,
  developer: Code,
  calculators: Calculator,
  files: FileText,
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

  const handleToolClick = (tool: ToolDefinition, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (tool.active && tool.href) {
      router.push(tool.href)
    } else {
      showComingSoon()
    }
  }

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1 rounded-full border border-primary/20">
            Categorized Toolkits
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground text-balance mt-3">
            Explore Powerful Developer Suites
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto text-pretty">
            Discover lightweight, zero-latency utilities organized by workflow domain. All tools are free, private, and execute locally.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {TOOL_CATEGORIES.map((category) => {
            const IconComponent = iconMap[category.id] || Database
            const href = `/tools/${category.slug}`

            return (
              <Link
                key={category.id}
                href={href}
                className="group relative flex flex-col"
              >
                <div className={`relative h-full rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xs p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${category.borderColor || 'hover:border-primary/50'}`}>
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
                          {category.tools.length} tools
                        </span>
                      </div>

                      {/* Title and Description */}
                      <h3 className="text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                        {category.description}
                      </p>

                      {/* Tool Tags with Active/Soon States */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {category.tools.slice(0, 4).map((tool) => (
                          <button
                            key={tool.id}
                            onClick={(e) => handleToolClick(tool, e)}
                            className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
                              tool.active
                                ? "bg-primary/10 text-primary hover:bg-primary/20"
                                : "bg-secondary text-muted-foreground/60 cursor-pointer"
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              {tool.name}
                              {!tool.active && (
                                <span className="text-[9px] opacity-70">Soon</span>
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Arrow CTA */}
                    <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-primary">
                      <span>Explore Category</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
