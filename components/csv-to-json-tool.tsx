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
  FileSpreadsheet,
  LayoutDashboard,
  Star,
  Menu,
  X
} from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { isFavoriteTool, toggleFavoriteTool } from '@/actions/favorites'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'

interface CsvStats {
  rows: number
  columns: number
  fileSizeKB: string
}

export default function CsvToJsonTool() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(false)
  const [inputCsv, setInputCsv] = useState('')
  const [outputJson, setOutputJson] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [syntaxWarning, setSyntaxWarning] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleToggleFavorite = async () => {
    const nextFavorite = !isFavorite
    setIsFavorite(nextFavorite)

    try {
      await toggleFavoriteTool("csv-to-json-tool")
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
        markToolUsed("csv-to-json-tool")
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
      const favorite = await isFavoriteTool("csv-to-json-tool")
      setIsFavorite(favorite)
    }

    loadFavorite()
  }, [])

  // دالة التحويل الذكية والقوية باستخدام PapaParse
  const convertCsvToJson = async () => {
    if (!inputCsv.trim()) return

    // نقوم بعمل Parse للـ CSV مع تفعيل الخصائص المتقدمة
    Papa.parse(inputCsv, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      complete: async (results) => {
        // في حال وجود أخطاء حرجة أثناء المعالجة
        if (results.errors.length > 0 && results.data.length === 0) {
          setOutputJson('')
          setSyntaxWarning(`CSV Parsing Error: ${results.errors[0].message}`)
          return
        }

        // تحويل المصفوفة الناتجة إلى نص JSON منسق
        setOutputJson(JSON.stringify(results.data, null, 2))
        setSyntaxWarning('')
        await handleSomething()
      },
      error: (err) => {
        setOutputJson('')
        setSyntaxWarning(`CSV Parsing Error: ${err.message}`)
      }
    })
  }

  const handleClear = () => {
    setInputCsv('')
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
    element.download = "csv-converted.json"
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
      setInputCsv(content)
    }
    reader.readAsText(file)
  }

  // دالة حساب الإحصائيات الذكية المتوافقة مع المفسر الجديد
  const calculateCsvStats = (): CsvStats => {
    const fileSizeKB = (inputCsv.length / 1024).toFixed(2)

    if (!inputCsv.trim()) {
      return { rows: 0, columns: 0, fileSizeKB }
    }

    const parsed = Papa.parse(inputCsv, { skipEmptyLines: 'greedy' })
    const dataRows = parsed.data as string[][]

    const rows = dataRows.length > 0 ? dataRows.length - 1 : 0
    const columns = dataRows.length > 0 ? dataRows[0].length : 0

    return { rows, columns, fileSizeKB }
  }

  const stats = calculateCsvStats()

  const features = [
    { icon: Zap, title: 'Instant Conversion', description: 'Transform massive CSV datasets into clean nested JSON arrays in milliseconds.' },
    { icon: FileSpreadsheet, title: 'Smart Auto-Detection', description: 'Automatically detects delimiters (,, ;, Tab) and maps numbers and booleans dynamically.' },
    { icon: Shield, title: '100% Client-Side', description: 'Your business datasets never touch external networks or cloud data systems.' },
    { icon: UserX, title: 'No Account Block', description: 'Completely unthrottled access with no sign-up screens or layout restrictions.' },
  ]

  const faqs = [
    { q: 'How does the parser handle headers?', a: 'The tool uses the first row of your CSV data as the object keys for the output JSON array. Ensure your first row contains unique names.' },
    { q: 'Is there a file size limit for large datasets?', a: 'Processing happens locally on your browser frame thread. It easily handles datasets up to several megabytes depending on your RAM.' },
    { q: 'Can it convert semicolon or tab-separated files?', a: 'Yes! The updated engine automatically detects custom delimiters like tabs, semicolons, or standard commas.' },
  ]

  const relatedTools = [
    { name: 'JSON Formatter', href: '/tools/json-formatter' },
    { name: 'SQL Formatter', href: '/tools/sql-formatter' },
    { name: 'Regex Tester', href: '/tools/regex-tester' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between w-full gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground leading-none">
                  DigitalMix
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  CSV to JSON
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2 shrink-0">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="text-muted-foreground hover:text-foreground h-9 w-9 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent/50"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span className="sr-only">Toggle theme</span>
                </button>
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

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden text-muted-foreground hover:text-foreground h-9 w-9 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent/50"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
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
      <div className="py-12 px-4 text-center bg-gradient-to-b from-primary/5 to-transparent">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          Free CSV to JSON Converter
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Instantly convert comma-separated values (CSV) into structured JSON arrays.
          Zero server-latency compilation engineered for privacy-first workflows.
        </p>
      </div>

      {/* Main Tool Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              accept=".csv,.txt"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-4 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload .csv
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
              <span className="text-rose-500 text-sm font-semibold">Parsing Validation Error</span>
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
              Input Raw CSV
            </label>
            <textarea
              value={inputCsv}
              onChange={(e) => setInputCsv(e.target.value)}
              placeholder={`Paste your CSV rows here...\n\nExample:\nid, name, role, active\n1, Mix Dev, admin, true\n2, Jane Doe, editor, false`}
              className="w-full h-80 p-4 rounded-xl border border-border bg-card font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-all placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                Converted JSON Output
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
                <span className="text-muted-foreground/50 italic">Structured JSON array will appear here...</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={convertCsvToJson}
            disabled={!inputCsv.trim()}
            className="h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground font-semibold flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:pointer-events-none transition-all hover:-translate-y-0.5"
          >
            <Sparkles className="h-5 w-5" />
            Convert CSV to JSON
          </button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-primary">{stats.columns}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Columns</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-emerald-500">{stats.rows}</div>
            <div className="text-xs text-muted-foreground mt-1">Data Rows (Records)</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-rose-500">{stats.fileSizeKB} <span className="text-xs">KB</span></div>
            <div className="text-xs text-muted-foreground mt-1">Data Size</div>
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Why Use Our Converter?</h2>
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

        {/* FAQs */}
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

        {/* Related */}
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