"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {Database, Code, Calculator, FileText, Menu, X, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserButton } from "@clerk/nextjs"
const iconMap: Record<string, any> = {
  database: Database,
  developer: Code,
  calculators: Calculator,
  files: FileText,
}

export function MobileMenu({ categories, isLoaded, isSignedIn, handleToolClick }: any) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => { document.body.style.overflow = "unset" }
  }, [mobileMenuOpen])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-muted-foreground z-50"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 z-40 bg-background/95 backdrop-blur-xl border-t border-border/40 flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto p-4 space-y-4 pb-16 shadow-2xl">
          {/* Categories Navigation */}
          <nav className="space-y-1 shrink-0">
            {categories.map((category: any) => {
              // نجيب الأيقونة الصح
              const IconComponent = iconMap[category.id] || Code

              return (
                <div key={category.id} className="space-y-1">
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-foreground font-semibold text-sm tracking-wide border-b border-border/10">
                    {/* رندرة أيقونة Lucide المظبوطة */}
                    <IconComponent className="h-4 w-4 text-primary" />
                    {category.name}
                  </div>
                  
                  <div className="pl-6 space-y-0.5 pt-1">
                    {category.tools.map((item: any) => {
                      const isActive = item.active !== false;
                      return (
                        <Link
                          key={item.id}
                          href={isActive ? item.href : "#"}
                          onClick={(e) => {
                            handleToolClick(item, e)
                            if (isActive) setMobileMenuOpen(false)
                          }}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? "text-muted-foreground hover:bg-secondary hover:text-foreground" : "text-muted-foreground/40"}`}
                        >
                          <span>{item.name}</span>
                          {!isActive && <span className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground/60 scale-90">Soon</span>}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </nav>

          {/* Auth Section */}
          <div className="shrink-0 -mt-2 pt-2 border-t border-border/40">
            {isLoaded && !isSignedIn && (
              <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11">
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
              </Button>
            )}
            {isLoaded && isSignedIn && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/60">
                <Button asChild variant="ghost" className="text-foreground -ml-2" onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                </Button>
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
