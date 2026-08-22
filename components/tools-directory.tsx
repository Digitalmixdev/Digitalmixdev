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
  Search,
  ArrowRight,
  Database,
  Wrench,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { ALL_TOOLS, TOOL_CATEGORIES, CategoryId, ToolDefinition } from '@/constants/tools'

const ICON_MAP: Record<string, any> = {
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
}

const CATEGORY_ICON_MAP: Record<CategoryId, any> = {
  database: Database,
  developer: Code,
  calculators: Calculator,
  files: FileText,
}

export function ToolsDirectory() {
  const router = useRouter()
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
            <span>100% Free & Privacy-First Utilities</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Explore All Developer & Business Tools
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground text-pretty">
            High-performance, client-side developer utilities and financial calculators.
            No sign-up required, zero data collection.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="max-w-2xl mx-auto mb-12 space-y-5">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tools by name, tag, or keyword (e.g., JWT, SQL, JSON, QR)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-13 pl-12 pr-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm sm:text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground bg-secondary px-2 py-1 rounded-md"
              >
                Clear
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
              All Tools ({ALL_TOOLS.length})
            </button>

            {TOOL_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICON_MAP[category.id] || Wrench
              const isSelected = selectedCategory === category.id
              const count = category.tools.length

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
                  <span>{category.name}</span>
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
            Showing <span className="font-semibold text-foreground">{filteredTools.length}</span> tools
            {selectedCategory !== 'all' && (
              <span> in {TOOL_CATEGORIES.find((c) => c.id === selectedCategory)?.name}</span>
            )}
            {searchQuery && <span> matching &ldquo;{searchQuery}&rdquo;</span>}
          </p>

          <Link
            href="/favorites"
            className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <span>View Saved Favorites →</span>
          </Link>
        </div>

        {/* Tools Grid */}
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => {
              const IconComponent = ICON_MAP[tool.icon] || Code
              const category = TOOL_CATEGORIES.find((c) => c.id === tool.categoryId)

              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:shadow-xl hover:border-primary/40 hover:-translate-y-1"
                >
                  <div>
                    {/* Top Row: Icon + Category Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                        {category?.name || tool.categoryId}
                      </span>
                    </div>

                    {/* Tool Name */}
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {tool.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                      {tool.description}
                    </p>
                  </div>

                  <div>
                    {/* Keywords/tags */}
                    <div className="flex flex-wrap gap-1 mb-4 pt-2 border-t border-border/30">
                      {tool.keywords.slice(0, 3).map((keyword) => (
                        <span
                          key={keyword}
                          className="text-[11px] font-medium text-muted-foreground/80 bg-secondary/50 px-2 py-0.5 rounded-md"
                        >
                          #{keyword}
                        </span>
                      ))}
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between text-xs font-semibold text-primary pt-2">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Free Tool
                      </span>
                      <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Launch Tool
                        <ArrowRight className="h-3.5 w-3.5" />
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
            <h3 className="text-lg font-semibold text-foreground">No tools found</h3>
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
              Reset Filters
            </button>
          </div>
        )}

        {/* Categories Section */}
        <div className="mt-20 pt-12 border-t border-border/40">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-foreground">Browse by Category</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Deep dive into specialized toolkits designed for specific workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TOOL_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/tools/${cat.slug}`}
                className="group p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-lg transition-all"
              >
                <div className="text-3xl mb-3">{cat.icon}</div>
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                  {cat.description}
                </p>
                <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>{cat.tools.length} Tools</span>
                  <span className="text-primary group-hover:translate-x-1 transition-transform">
                    Explore →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
