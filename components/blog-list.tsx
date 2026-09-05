'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Calendar, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  Tag, 
  BookOpen,
  Filter,
  X,
  ExternalLink
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

export interface BlogPostItem {
  slug: string
  title: string
  description: string
  category: string
  date: string
  content: string
  toolUrl?: string
  toolName?: string
  relatedSlugs?: string[]
}

interface BlogListProps {
  posts: BlogPostItem[]
}

export function BlogList({ posts }: BlogListProps) {
  const { isRTL } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Calculate distinct categories
  const categories = useMemo(() => {
    const set = new Set<string>()
    posts.forEach(p => {
      if (p.category) set.add(p.category)
    })
    return ['all', ...Array.from(set)]
  }, [posts])

  // Filter posts by search query and category
  const filteredPosts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return posts.filter(post => {
      const matchesCategory = selectedCategory === 'all' || post.category.toLowerCase() === selectedCategory.toLowerCase()
      if (!matchesCategory) return false

      if (!q) return true
      return (
        post.title.toLowerCase().includes(q) ||
        post.description.toLowerCase().includes(q) ||
        post.category.toLowerCase().includes(q) ||
        (post.toolName && post.toolName.toLowerCase().includes(q))
      )
    })
  }, [posts, searchQuery, selectedCategory])

  const firstPost = posts[0]
  const showFeaturedHero = !searchQuery && selectedCategory === 'all' && firstPost

  // Display posts (if featured hero is shown, exclude first post from the grid)
  const displayGridPosts = showFeaturedHero ? filteredPosts.slice(1) : filteredPosts

  const estimateReadTime = (content: string) => {
    const wordCount = content.split(/\s+/).length
    const minutes = Math.max(3, Math.ceil(wordCount / 180))
    return `${minutes} min read`
  }

  return (
    <div className="w-full">
      {/* Search & Category Filter Controls */}
      <div className="mb-10 space-y-4">
        <div className="relative max-w-xl">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3.5' : 'left-3.5'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRTL ? 'ابحث في مقالات وأدلة المطورين...' : 'Search articles, tutorials, guides...'}
            className={`w-full h-11 rounded-xl border border-input bg-card/80 backdrop-blur-sm text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all shadow-sm ${
              isRTL ? 'pr-10 pl-9 text-right' : 'pl-10 pr-9 text-left'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition ${
                isRTL ? 'left-2.5' : 'right-2.5'
              }`}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span>{isRTL ? 'التصنيف:' : 'Filter:'}</span>
          </span>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary/70 hover:bg-secondary text-secondary-foreground'
                }`}
              >
                {cat === 'all' ? (isRTL ? 'الكل' : 'All Topics') : cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Featured Flagship First Post (Only when on 'all' and no active search) */}
      {showFeaturedHero && (
        <section className="mb-14">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>{isRTL ? 'دليل المنصة الشامل' : 'Featured Platform Guide'}</span>
          </div>
          <Link
            href={`/blog/${firstPost.slug}`}
            className="block group relative rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 sm:p-8 hover:border-primary/60 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
                {firstPost.category}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {firstPost.date}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {estimateReadTime(firstPost.content)}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold group-hover:text-primary transition-colors mb-3">
              {firstPost.title}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg mb-6 leading-relaxed">
              {firstPost.description}
            </p>
            <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
              <span>{isRTL ? 'قراءة الدليل الشامل والميزات ←' : 'Read Full Platform Guide & Tool Manual →'}</span>
            </div>
          </Link>
        </section>
      )}

      {/* Articles Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            {searchQuery 
              ? (isRTL ? `نتائج البحث (${filteredPosts.length})` : `Search Results (${filteredPosts.length})`)
              : selectedCategory !== 'all' 
                ? (isRTL ? `مقالات تصنيف ${selectedCategory}` : `${selectedCategory} Articles`)
                : (isRTL ? `جميع المقالات والأدلة (${posts.length})` : `All Articles & Guides (${posts.length})`)}
          </h2>
        </div>

        {displayGridPosts.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-muted-foreground/30 bg-card/40">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-semibold mb-1">
              {isRTL ? 'لم يتم العثور على مقالات' : 'No articles found'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isRTL 
                ? 'جرّب البحث بكلمة أخرى أو اختر تصنيفاً مختلفاً.' 
                : 'Try adjusting your search terms or filter to find what you are looking for.'}
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
            >
              {isRTL ? 'عرض جميع المقالات' : 'Reset All Filters'}
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {displayGridPosts.map((post) => (
              <article
                key={post.slug}
                className="group flex flex-col justify-between p-6 border rounded-2xl hover:border-primary/50 hover:shadow-md transition-all bg-card/90"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs font-mono mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {post.category}
                    </span>
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </span>
                  </div>

                  <Link href={`/blog/${post.slug}`} className="block">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors mb-2.5 leading-snug">
                      {post.title}
                    </h3>
                  </Link>

                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4 leading-relaxed">
                    {post.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/50 flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3" />
                    {estimateReadTime(post.content)}
                  </span>

                  <div className="flex items-center gap-3">
                    {post.toolUrl && (
                      <Link
                        href={post.toolUrl}
                        className="text-xs font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition"
                        title={post.toolName}
                      >
                        <span>{isRTL ? 'الأداة' : 'Tool'}</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1"
                    >
                      <span>{isRTL ? 'قراءة' : 'Read'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
