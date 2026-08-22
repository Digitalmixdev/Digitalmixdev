"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useTheme } from 'next-themes'
import {
  Code,
  Trash2,
  Copy,
  Check,
  Sun,
  Moon,
  Menu,
  X,
  Star,
  LayoutDashboard,
  Binary,
  Sparkles,
  Download,
  Layers,
  Settings,
  Key,
  Fingerprint
} from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { isFavoriteTool, toggleFavoriteTool } from '@/actions/favorites'
import { useRouter } from 'next/navigation'

function UUIDToolContent() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // إعدادات التوليد
  const [quantity, setQuantity] = useState<number>(5)
  const [uppercase, setUppercase] = useState<boolean>(false)
  const [brackets, setBrackets] = useState<boolean>(false)

  const [uuidList, setUuidList] = useState<string[]>([])
  const [isCopied, setIsCopied] = useState(false)

  const handleToggleFavorite = async () => {
    const nextFavorite = !isFavorite
    setIsFavorite(nextFavorite)

    try {
      await toggleFavoriteTool("uuid-tool")
      router.refresh()
    } catch (error) {
      setIsFavorite(!nextFavorite)
      console.error("Error toggling favorite:", error)
    }
  }

  const handleSomething = async () => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed("uuid-tool")
      ]);
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }

  useEffect(() => {
    setMounted(true)
    generateUUIDs(5, false, false)
  }, [])

  useEffect(() => {
    const loadFavorite = async () => {
      const favorite = await isFavoriteTool("uuid-tool")
      setIsFavorite(favorite)
    }

    loadFavorite()
  }, [])


  // دالة توليد UUID v4 القياسية محلياً بالكامل
  const cryptoUUID = (): string => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID()
    }
    // Fallback للأنظمة القديمة لو المتصفح مفيش فيه randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  // المايسترو المسؤول عن توليد الكمية المطلوبة بالخيارات المحددة
  const generateUUIDs = (qty = quantity, upper = uppercase, bkt = brackets) => {
    const list: string[] = []
    const targetQty = Math.min(Math.max(qty, 1), 100) // تحديد حد أقصى 100 في المرة لحماية المتصفح

    for (let i = 0; i < targetQty; i++) {
      let id = cryptoUUID()
      if (upper) id = id.toUpperCase()
      if (bkt) id = `{${id}}`
      list.push(id)
    }
    setUuidList(list)
  }

  const handleCopy = async () => {
    if (uuidList.length === 0) return
    const textToCopy = uuidList.join('\n')
    navigator.clipboard.writeText(textToCopy)
    setIsCopied(true)
    await handleSomething();
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleDownload = (format: 'txt' | 'json') => {
    if (uuidList.length === 0) return
    let content = ''
    let mimeType = 'text/plain'
    let filename = `digitalmix-uuids.${format}`

    if (format === 'json') {
      content = JSON.stringify({ uuids: uuidList, total: uuidList.length, generator: "DigitalMix Engine" }, null, 2)
      mimeType = 'application/json'
    } else {
      content = uuidList.join('\n')
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Framework */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between w-full gap-4">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Fingerprint className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground leading-none">
                  DigitalMix
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">RFC 4122 UUID Generator</span>
              </div>
            </Link>

            <div className="flex items-center gap-2 shrink-0">
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="text-muted-foreground hover:text-foreground h-9 w-9"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              )}

              <Button
                variant="ghost"
                className={`hidden sm:flex gap-2 font-medium h-9 px-3 ${isFavorite
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                onClick={handleToggleFavorite}
              >
                <Star
                  className={`h-4 w-4 ${isFavorite ? "fill-amber-500 text-amber-500" : ""
                    }`}
                />
                {isFavorite ? "Favorited" : "Favorite"}
              </Button>

              <Button
                asChild
                variant="ghost"
                className="hidden sm:flex text-muted-foreground hover:text-foreground gap-2 font-medium h-9 px-3"
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden text-muted-foreground h-9 w-9"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl p-4 space-y-2">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-2 ${isFavorite
                ? "text-amber-500 hover:text-amber-600"
                : "text-foreground"
                }`}
              onClick={handleToggleFavorite}
            >
              <Star
                className={`h-4 w-4 ${isFavorite ? "fill-amber-500 text-amber-500" : ""
                  }`}
              />
              {isFavorite ? "Favorited" : "Favorite"}
            </Button>

            <Button
              asChild
              variant="ghost"
              className="w-full text-foreground justify-start gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <div className="py-10 px-4 text-center bg-gradient-to-b from-primary/5 to-transparent">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 flex items-center justify-center gap-3">
          <Fingerprint className="h-8 w-8 text-primary" /> RFC 4122 UUID Generator
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Instantly provision cryptographically secure Unique Identifier (UUID v4) tokens locally in your browser thread for database primary keys and configuration entities.
        </p>
      </div>

      {/* Main Workspace */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

          {/* لوحة التحكم الجانبية (Configuration Sidebar) */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <Settings className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Generator Settings</h2>
            </div>

            {/* كمية الـ UUIDs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground block">Quantity to Generate ({quantity})</label>
              <input
                type="range"
                min="1"
                max="50"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  setQuantity(val)
                  generateUUIDs(val, uppercase, brackets)
                }}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>1</span>
                <span>25</span>
                <span>50</span>
              </div>
            </div>

            {/* الخيارات المتقدمة */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-foreground block">Formatting Matrices</label>

              <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => {
                    setUppercase(e.target.checked)
                    generateUUIDs(quantity, e.target.checked, brackets)
                  }}
                  className="rounded border-border bg-background text-primary focus:ring-primary/40 h-4 w-4"
                />
                <span>Uppercase Text (`ABC-123`)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={brackets}
                  onChange={(e) => {
                    setBrackets(e.target.checked)
                    generateUUIDs(quantity, uppercase, e.target.checked)
                  }}
                  className="rounded border-border bg-background text-primary focus:ring-primary/40 h-4 w-4"
                />
                <span>Wrap in Brackets (`{'{...}'}`)</span>
              </label>
            </div>

            {/* زر التوليد اليدوي */}
            <button
              onClick={() => generateUUIDs(quantity, uppercase, brackets)}
              className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-md shadow-primary/10"
            >
              <Sparkles className="h-4 w-4" /> Regenerate Tokens
            </button>
          </div>

          {/* صندوق المخرجات الأساسي (Output Box) */}
          <div className="md:col-span-2 p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Generated UUID v4 Pool Tokens
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="h-8 px-3 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {isCopied ? 'Copied Pool' : 'Copy All'}
                </button>

                <div className="h-4 w-[1px] bg-border mx-1" />

                <button
                  onClick={() => handleDownload('txt')}
                  className="h-8 px-2.5 rounded-lg border border-border hover:bg-secondary/50 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  title="Download TXT"
                >
                  <Download className="h-3 w-3" /> <span className="text-[10px] font-mono">.TXT</span>
                </button>
                <button
                  onClick={() => handleDownload('json')}
                  className="h-8 px-2.5 rounded-lg border border-border hover:bg-secondary/50 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  title="Download JSON"
                >
                  <Download className="h-3 w-3" /> <span className="text-[10px] font-mono">.JSON</span>
                </button>
              </div>
            </div>

            {/* نافذة عرض الـ UUIDs المتولدة */}
            <div className="w-full h-[280px] rounded-xl border border-border bg-background p-4 overflow-y-auto font-mono text-sm leading-relaxed text-foreground space-y-2 select-all">
              {uuidList.map((uuid, idx) => (
                <div key={idx} className="flex items-center gap-3 py-1 px-2 hover:bg-secondary/30 rounded transition-colors group">
                  <span className="text-[10px] font-bold text-muted-foreground/50 w-5 select-none font-sans">{idx + 1}</span>
                  <span className="text-primary-foreground bg-primary/10 px-1.5 py-0.5 rounded text-[10px] font-bold font-sans tracking-wide select-none">v4</span>
                  <span className="text-foreground tracking-wide flex-1 break-all">{uuid}</span>
                </div>
              ))}
              {uuidList.length === 0 && (
                <div className="text-center py-12 text-muted-foreground/60 italic text-xs select-none">
                  No active tokens deployed. Click regenerate to provision pipelines.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Developer Info Box */}
        <div className="mt-8 p-4 rounded-xl bg-secondary/40 border border-border text-center text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          <strong>💡 Cryptographic Blueprint:</strong> Version 4 UUIDs are generated completely via random hexadecimal bit allocation hierarchies. Out of 128 total bits, 122 bits are cryptographically random, providing an astronomically low probability of collision across enterprise database deployments.
        </div>
      </div>

      {/* Modules السفلية المتناسقة لربط الموقع */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-t border-border/60 mt-12">
        <h3 className="text-sm font-bold text-center mb-6 text-muted-foreground uppercase tracking-widest">
          Optimized Developer Validation Modules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <Link href="/tools/regex-tester" className="p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all text-center flex flex-col items-center justify-center gap-2 group">
            <Code className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-bold text-foreground group-hover:text-primary">Regex Tester / Debugger</span>
            <span className="text-[10px] text-muted-foreground">Test regular expressions, trace capture groups, and analyze positions</span>
          </Link>

          <Link href="/tools/base64" className="p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all text-center flex flex-col items-center justify-center gap-2 group">
            <Binary className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-bold text-foreground group-hover:text-primary">Base64 Encoder / Decoder</span>
            <span className="text-[10px] text-muted-foreground">Instantly convert multi-byte UTF-8 streams and standard ASCII matrices</span>
          </Link>

          <Link href="/tools/hash-generator" className="p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all text-center flex flex-col items-center justify-center gap-2 group">
            <Key className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-bold text-foreground group-hover:text-primary">Cryptographic Hash Generator</span>
            <span className="text-[10px] text-muted-foreground">Compute secure MD5, SHA-1, SHA-256, and SHA-512 signatures</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function UUIDTool() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono text-xs">Loading DigitalMix Provisioning Layer...</div>}>
      <UUIDToolContent />
    </Suspense>
  )
}