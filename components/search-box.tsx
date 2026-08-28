"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Search, Rocket } from "lucide-react"
import { popularSearches, ToolDefinition } from "@/constants/tools"
import { toolsFuse } from "@/lib/fuse"
import { useLanguage } from "@/lib/i18n/context"

function showComingSoon() {
  toast("Coming Soon!", {
    description: "We are working hard to build this tool for you.",
    icon: <Rocket className="h-4 w-4" />,
    duration: 3000,
  })
}

export function SearchBox() {
  const router = useRouter()
  const { t } = useLanguage()
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ToolDefinition[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = toolsFuse.search(searchQuery)
      setSearchResults(results.map(result => result.item))
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearchSelect = (tool: ToolDefinition) => {
    if (tool.active && tool.href) {
      router.push(tool.href)
      setSearchQuery("")
      setSearchFocused(false)
    } else {
      showComingSoon()
    }
  }

  const handleSearch = () => {
    if (searchResults.length > 0 && searchResults[0].active && searchResults[0].href) {
      router.push(searchResults[0].href)
      setSearchQuery("")
      setSearchFocused(false)
    }
  }

  return (
    <div className="mt-8 sm:mt-10">
      <div ref={searchRef} className={`relative mx-auto max-w-xl transition-all duration-300 ${searchFocused ? 'scale-[1.01]' : ''}`}>
        {/* Search Input Bar */}
        <div className="relative">
          <div className={`relative rounded-2xl border-2 bg-card shadow-lg transition-all duration-300 ${searchFocused ? 'border-primary shadow-primary/20 shadow-xl' : 'border-border/60 hover:border-border'}`}>
            <Search className={`absolute start-4 sm:start-5 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors ${searchFocused ? 'text-primary' : 'text-muted-foreground'}`} />
            <input
              type="text"
              suppressHydrationWarning
              placeholder={t('hero.search_placeholder', 'Search tools... (e.g., PDF, QR, SQL, JSON, JWT, UUID)')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-13 sm:h-15 w-full rounded-2xl bg-transparent ps-11 sm:ps-14 pe-36 sm:pe-40 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
            />

            <div className="absolute end-2 sm:end-2.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {searchQuery && (
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 border border-border/60 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs"
                >
                  {t('action.cancel', 'Clear')}
                </button>
              )}
              <button
                type="button"
                suppressHydrationWarning
                onClick={handleSearch}
                className="rounded-xl bg-primary px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all cursor-pointer"
              >
                {t('action.search', 'Search')}
              </button>
            </div>
          </div>

          {/* Dropdown Results - Sticked to the bottom of the search input bar */}
          {searchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-border/80 bg-popover/95 backdrop-blur-xl shadow-2xl overflow-y-auto max-h-60 z-50 p-1.5 flex flex-col gap-1 custom-scrollbar animate-in fade-in-0 slide-in-from-top-2 duration-150">
              {searchResults.map((tool) => (
                <button 
                  key={tool.id} 
                  onClick={() => handleSearchSelect(tool)} 
                  className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-secondary/80 rounded-xl transition-all text-left shrink-0 cursor-pointer group"
                >
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-semibold group-hover:text-primary transition-colors truncate ${!tool.active ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {tool.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground line-clamp-1">
                      {tool.description}
                    </span>
                  </div>
                  {!tool.active ? (
                    <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground shrink-0 ms-2">
                      {t('nav.coming_soon', 'Coming Soon')}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ms-2">
                      Open →
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {searchFocused && searchQuery.trim() && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-border bg-popover/95 backdrop-blur-xl shadow-xl p-4 text-center text-xs sm:text-sm text-muted-foreground z-50">
              No tools found for &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>

        {/* Popular Tags - Hidden when searching */}
        {!searchQuery.trim() && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 animate-in fade-in duration-200">
            <span className="text-xs font-semibold text-muted-foreground">{t('hero.popular', 'Popular')}:</span>
            {popularSearches.map((search) => (
              <button
                key={search.name}
                type="button"
                suppressHydrationWarning
                onClick={() => router.push(search.href)}
                className="rounded-full border border-border/60 bg-secondary/60 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-primary/40 transition-all cursor-pointer"
              >
                {t(`tool.${search.href.replace('/tools/', '').replace(/-/g, '_')}`, search.name)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}