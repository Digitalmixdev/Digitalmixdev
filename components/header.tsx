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
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const handleToolClick = (tool: ToolDefinition, e: React.MouseEvent) => {
    if (tool.active === false || !tool.href) {
      e.preventDefault()
      showComingSoon()
    }
  }

return (
  <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
    <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between w-full gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-auto lg:mr-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">DigitalMix</span>
        </Link>
                
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center justify-center gap-1 lg:mx-auto">
          {TOOL_CATEGORIES.map((category) => {
            const IconComponent = iconMap[category.id] || Code 

            return (
              <DropdownMenu key={category.id}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                    <IconComponent className="h-4 w-4 text-primary" />
                    {category.name}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent 
                  align="start" 
                  className="w-64 z-60 bg-popover/95 backdrop-blur-md border border-border/80 shadow-2xl p-1">
                  {category.tools.map((item) => {
                    const isActive = item.active !== false
                    const ToolIcon = toolIconMap[item.icon] || Code
                    return (
                      <DropdownMenuItem 
                        key={item.id} 
                        asChild 
                        className={`cursor-pointer rounded-md transition-colors hover:bg-secondary/80 ${!isActive ? "opacity-50" : ""}`}
                      >
                        <Link 
                          href={isActive ? item.href : "#"} 
                          onClick={(e) => handleToolClick(item, e)} 
                          className="flex items-center justify-between w-full px-2.5 py-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ToolIcon className="h-4 w-4 text-primary shrink-0" />
                            <span className={`text-sm font-medium ${!isActive ? "text-muted-foreground" : "text-foreground"} truncate`}>
                              {item.name}
                            </span>
                          </div>
                          {!isActive && (
                            <span className="text-[10px] font-semibold bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0 ml-2">
                              Soon
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

        {/* Header actions */}
        <div className="flex items-center gap-2 ml-auto lg:ml-0 shrink-0">
          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {mounted && resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Auth Section */}
          {!isLoading && !isAuthenticated && (
            <div className="hidden sm:flex items-center gap-2">
              <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
          {!isLoading && isAuthenticated && (
            <div className="hidden sm:flex items-center gap-2">
              <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
                <Link href="/favorites" className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" /> Favorites
                </Link>
              </Button>
              <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
                <Link href="/dashboard" className="flex items-center gap-1.5">
                  <LayoutDashboard className="h-4 w-4 text-primary" /> Dashboard
                </Link>
              </Button>
              <UserMenu />
            </div>
          )}

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
