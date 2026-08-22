"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'
import {
  Copy,
  Trash2,
  Download,
  Check,
  Sparkles,
  Upload,
  Minimize2,
  Sun,
  Moon,
  AlertTriangle,
  Code,
  FileText,
  Search as SearchIcon,
  Zap,
  Shield,
  UserX,
  ChevronDown,
  ChevronRight,
  Braces,
  FileCode,
  Star,
  Menu,
  X,
  LayoutDashboard
} from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { isFavoriteTool, toggleFavoriteTool } from '@/actions/favorites'
import { useRouter } from 'next/navigation'

interface JsonStats {
  lines: number
  characters: number
  keyCount: number
  maxDepth: number
  fileSizeKB: string
}

export default function JsonFormatterTool() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [inputJson, setInputJson] = useState('')
  const [outputJson, setOutputJson] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [indentSpaces, setIndentSpaces] = useState<number>(2)
  const [syntaxWarning, setSyntaxWarning] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleToggleFavorite = async () => {
    const nextFavorite = !isFavorite
    setIsFavorite(nextFavorite)

    try {
      await toggleFavoriteTool("json-formatter")
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
        markToolUsed("json-formatter")
      ]);
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadFavorite = async () => {
      const favorite = await isFavoriteTool("json-formatter")
      setIsFavorite(favorite)
    }

    loadFavorite()
  }, [])
 
  const calculateJsonStats = (jsonStr: string): JsonStats => {
    const lines = jsonStr ? jsonStr.split('\n').length : 0
    const characters = jsonStr.length
    const fileSizeKB = (characters / 1024).toFixed(2)

    let keyCount = 0
    let maxDepth = 0

    try {
      const parsed = JSON.parse(jsonStr)

      const analyzeObj = (obj: any, currentDepth: number) => {
        if (typeof obj !== 'object' || obj === null) return

        maxDepth = Math.max(maxDepth, currentDepth)

        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            keyCount++
            analyzeObj(obj[key], currentDepth + 1)
          }
        }
      }

      analyzeObj(parsed, 1)
    } catch {

    }

    return { lines, characters, keyCount, maxDepth, fileSizeKB }
  }

  const handleFormat = async () => {
    if (!inputJson.trim()) return
    try {
      const parsed = JSON.parse(inputJson.trim())
      const formatted = JSON.stringify(parsed, null, indentSpaces)
      setOutputJson(formatted)
      await handleSomething();
      setSyntaxWarning('')
    } catch (err: any) {
      setOutputJson('')
      setSyntaxWarning(`Invalid JSON Syntax: ${err.message}`)
    }
  }

  const handleMinify = async () => {
    if (!inputJson.trim()) return
    try {
      const parsed = JSON.parse(inputJson.trim())
      const minified = JSON.stringify(parsed)
      setOutputJson(minified)
      await handleSomething();
      setSyntaxWarning('')
    } catch (err: any) {
      setOutputJson('')
      setSyntaxWarning(`Invalid JSON Syntax: ${err.message}`)
    }
  }

  const handleClear = () => {
    setInputJson('')
    setOutputJson('')
    setIsCopied(false)
    setSyntaxWarning('')
  }

  const handleCopy = async () => {
    if (!outputJson) return
    try {
      await navigator.clipboard.writeText(outputJson)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed', err)
    }
  }

  const handleDownload = () => {
    if (!outputJson) return
    const element = document.createElement("a")
    const file = new Blob([outputJson], { type: 'application/json' })
    element.href = URL.createObjectURL(file)
    element.download = "formatted-data.json"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setInputJson(content)
    }
    reader.readAsText(file)
  }

  const stats = calculateJsonStats(outputJson || inputJson)

  const features = [
    { icon: Zap, title: 'Validation & Formatting', description: 'Beautify nested payloads instantly while validating raw API syntax errors dynamically.' },
    { icon: Braces, title: 'Smart Minification', description: 'Compress JSON data into a single efficient row to minimize cloud storage and network bandwith.' },
    { icon: Shield, title: 'Zero-Server Privacy', description: '100% client-side compilation context. Sensitive payloads never hit external API gateways.' },
    { icon: UserX, title: 'No Account Required', description: 'Get unthrottled access to heavy formatting engines for free without login blocks.' },
  ]

  const faqs = [
    { q: 'Is this JSON Formatter safe for production database logs?', a: 'Absolutely. All string processing and data formatting execute directly inside your client browser thread via Next.js client mechanics. No log entries or key-value schemas are transmitted externally.' },
    { q: 'What happens when a syntax validation error occurs?', a: 'The built-in system catches native V8 syntax flags, stops compilation, and returns the precise character location of missing commas, brackets, or unquoted keys.' },
    { q: 'Can I format heavy multi-megabyte configurations?', a: 'Yes. The V8 JSON engine handles large arrays and complex objects locally. Performance depends on your device RAM rather than network constraints.' },
    { q: 'Does it support customizing tab indentation?', a: 'Yes, you can dynamically switch between 2-space, 4-space, or compact tab layouts depending on your corporate styling guidelines.' },
  ]

  const relatedTools = [
    { name: 'SQL Formatter', href: '/tools/sql-formatter' },
    { name: 'CSV to JSON', href: '/tools/csv-json' },
    { name: 'Regex Tester', href: '/tools/regex-tester' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">

      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between w-full gap-4">
           
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <FileCode className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground leading-none">
                  DigitalMix
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  JSON Formatter
                </span>
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
                  <span className="sr-only">Toggle theme</span>
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

              {/* 2. زر الداشبورد بجانبه على اليمين مباشرة */}
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

              {/* زر الموبايل */}
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

        {/* قائمة الموبايل */}
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
      <div className="py-12 px-4 text-center bg-gradient-to-b from-primary/5 to-transparent">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          Free JSON Formatter & Validator
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Instantly validate, beautify, inspect, and minify raw JSON payloads. 100% client-side
          processing engineered for data privacy and optimized developer diagnostics.
        </p>
      </div>

      {/* Main Tool Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <select
              value={indentSpaces}
              onChange={(e) => setIndentSpaces(Number(e.target.value))}
              className="h-10 px-3 rounded-lg border border-border bg-secondary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value={2}>2 Spaces Indent</option>
              <option value={4}>4 Spaces Indent</option>
            </select>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              accept=".json,.txt"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-4 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload .json
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="h-10 px-4 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>

        {/* Validation Warning Banner */}
        {syntaxWarning && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-rose-500 text-sm font-semibold">Syntax Validation Error</span>
              <span className="text-rose-400/90 text-xs font-mono mt-1">{syntaxWarning}</span>
            </div>
          </div>
        )}

        {/* Textareas Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Input Raw JSON
            </label>
            <textarea
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              placeholder={`Paste your JSON configuration or API log here...\n\nExample:\n{"id":101,"user":"mix_dev","meta":{"status":"active","roles":["admin","editor"]}}`}
              className="w-full h-80 p-4 rounded-xl border border-border bg-card font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-all placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                Valid Clean Output
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!outputJson}
                  className="h-8 px-3 rounded-lg border border-border bg-secondary hover:bg-secondary/80 disabled:opacity-40 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!outputJson}
                  className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="w-full h-80 p-4 rounded-xl border border-border bg-card font-mono text-sm overflow-auto whitespace-pre">
              {outputJson ? (
                <code className="text-emerald-500 dark:text-emerald-400">{outputJson}</code>
              ) : (
                <span className="text-muted-foreground/50 italic">Beautified/Minified object tree will appear here...</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <button
            onClick={handleFormat}
            disabled={!inputJson.trim()}
            className="h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground font-semibold flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:pointer-events-none transition-all hover:-translate-y-0.5"
          >
            <Sparkles className="h-5 w-5" />
            Validate & Beautify JSON
          </button>
          <button
            onClick={handleMinify}
            disabled={!inputJson.trim()}
            className="h-12 px-8 rounded-xl border-2 border-border hover:bg-secondary font-semibold flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none transition-all hover:-translate-y-0.5"
          >
            <Minimize2 className="h-5 w-5" />
            Minify / Compress JSON
          </button>
        </div>

        {/* JSON Specific Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-16">
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-primary">{stats.lines}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Lines</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-primary">{stats.characters}</div>
            <div className="text-xs text-muted-foreground mt-1">Characters</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-emerald-500">{stats.keyCount}</div>
            <div className="text-xs text-muted-foreground mt-1">Key-Value Pairs</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-amber-500">{stats.maxDepth}</div>
            <div className="text-xs text-muted-foreground mt-1">Nesting Depth</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-rose-500">{stats.fileSizeKB} <span className="text-xs">KB</span></div>
            <div className="text-xs text-muted-foreground mt-1">Calculated Size</div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Why Use Our JSON Formatter?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors">
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left font-medium hover:bg-secondary/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {expandedFaq === idx ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Related Tools */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Related Tools</h3>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {relatedTools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="px-4 py-2 rounded-full border border-border bg-secondary hover:bg-secondary/80 hover:border-primary/50 text-sm font-medium transition-colors flex items-center gap-2"
              >
                <SearchIcon className="h-4 w-4" />
                {tool.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}