"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Search, Rocket } from "lucide-react"
import { popularSearches } from "@/lib/tools"
import { toolsFuse } from "@/lib/fuse"
import { Tool } from "@/types/tool"

function showComingSoon() {
  toast("Coming Soon!", {
    description: "We are working hard to build this tool for you.",
    icon: <Rocket className="h-4 w-4" />,
    duration: 3000,
  })
}

export function SearchBox() {
  const router = useRouter()
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Tool[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (searchQuery.trim()) {
      // استدعاء البحث مباشرة من الـ instance الجاهزة في الـ lib
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

  const handleSearchSelect = (tool: Tool) => {
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
    }
  }

  return (
    <div className="mt-10 sm:mt-12">
      <div ref={searchRef} className={`relative mx-auto max-w-xl transition-all duration-300 ${searchFocused ? 'scale-[1.02]' : ''}`}>
        <div className={`relative rounded-2xl border-2 bg-card shadow-lg transition-all duration-300 ${searchFocused ? 'border-primary shadow-primary/20 shadow-xl' : 'border-border/50 hover:border-border'}`}>
          <Search className={`absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors ${searchFocused ? 'text-primary' : 'text-muted-foreground'}`} />
          <input
            type="text"
            placeholder="Search for tools... (e.g., SQL formatter, JSON converter)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-14 sm:h-16 w-full rounded-2xl bg-transparent pl-14 pr-32 text-base sm:text-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Search
          </button>
        </div>

        {/* Dropdown Results */}
        {searchFocused && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-card shadow-2xl overflow-y-auto max-h-[180px] z-50 p-1 flex flex-col gap-0.5 custom-scrollbar">
            {searchResults.map((tool) => (
              <button 
                key={tool.name} 
                onClick={() => handleSearchSelect(tool)} 
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-secondary/50 rounded-lg transition-colors text-left shrink-0"
              >
                <div className={`font-medium ${!tool.active ? 'text-muted-foreground' : ''}`}>
                  {tool.name}
                </div>
                {!tool.active && (
                  <span className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                    Coming Soon
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        
        {searchFocused && searchQuery && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-card shadow-xl p-4 text-center text-sm text-muted-foreground z-50">
            No tools found for &ldquo;{searchQuery}&rdquo;
          </div>
        )}

        {/* Popular Tags */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Popular:</span>
          {popularSearches.map((search) => (
            <button key={search.name} onClick={() => router.push(search.href)} className="rounded-full border border-border/50 bg-secondary/50 px-3 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              {search.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}