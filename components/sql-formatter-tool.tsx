"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { format } from 'sql-formatter'
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
  Menu,
  X,
  LayoutDashboard,
  Star
} from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { isFavoriteTool, toggleFavoriteTool } from '@/actions/favorites'
import { useRouter } from 'next/navigation'

type SqlDialect = 'sql' | 'mysql' | 'postgresql' | 'sqlite' | 'plsql'

interface QueryStats {
  lines: number
  characters: number
  selectCount: number
  joinCount: number
  whereCount: number
}

export default function SqlFormatterTool() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [inputSql, setInputSql] = useState('')
  const [outputSql, setOutputSql] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [dialect, setDialect] = useState<SqlDialect>('sql')
  const [syntaxWarning, setSyntaxWarning] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleToggleFavorite = async () => {
    const nextFavorite = !isFavorite
    setIsFavorite(nextFavorite)

    try {
      await toggleFavoriteTool("sql-formatter")
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
        markToolUsed("sql-formatter")
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
    const favorite = await isFavoriteTool("sql-formatter")
    setIsFavorite(favorite)
  }

  loadFavorite()
}, [])

  const dialects: { value: SqlDialect; label: string }[] = [
    { value: 'sql', label: 'Standard SQL' },
    { value: 'mysql', label: 'MySQL' },
    { value: 'postgresql', label: 'PostgreSQL' },
    { value: 'sqlite', label: 'SQLite' },
    { value: 'plsql', label: 'PL/SQL' },
  ]

  const calculateStats = (sql: string): QueryStats => {
    const lines = sql ? sql.split('\n').length : 0
    const characters = sql.length
    const selectCount = (sql.match(/\bSELECT\b/gi) || []).length
    const joinCount = (sql.match(/\bJOIN\b/gi) || []).length
    const whereCount = (sql.match(/\bWHERE\b/gi) || []).length
    return { lines, characters, selectCount, joinCount, whereCount }
  }

  const validateSqlSyntax = (sql: string): string | null => {
    const cleanSql = sql.trim();
    if (!cleanSql) return null;

    const openParens = (cleanSql.match(/\(/g) || []).length;
    const closeParens = (cleanSql.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return `Syntax Error: Mismatched parentheses. Found ${openParens} opening '(' and ${closeParens} closing ')'.`;
    }

    const singleQuotes = (cleanSql.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      return "Syntax Error: Unclosed single quote (') detected. Make sure all string literals are closed.";
    }

    const doubleQuotes = (cleanSql.match(/"/g) || []).length;
    if (doubleQuotes % 2 !== 0) {
      return "Syntax Error: Unclosed double quote (\") detected.";
    }

    const upperSql = cleanSql.toUpperCase();
    const lastWords = upperSql.split(/\s+/).filter(Boolean);
    const lastWord = lastWords[lastWords.length - 1];
    const trailingKeywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'AND', 'OR', 'INSERT', 'UPDATE', 'LIMIT'];

    if (trailingKeywords.includes(lastWord)) {
      return `Syntax Error: Incomplete statement. Query cannot end trailing with the keyword '${lastWord}'.`;
    }

    if (upperSql.includes('FROM') && upperSql.includes('SELECT')) {
      if (upperSql.indexOf('FROM') < upperSql.indexOf('SELECT')) {
        return "Syntax Error: Structure error. 'FROM' clause cannot precede 'SELECT' clause.";
      }
    }

    return null;
  };

  const handleFormat = async () => {
    if (!inputSql.trim()) return

    const validationError = validateSqlSyntax(inputSql);
    if (validationError) {
      setOutputSql('')
      setSyntaxWarning(validationError)
      return;
    }

    try {
      const formatted = format(inputSql, {
        language: dialect,
        tabWidth: 2,
        keywordCase: 'upper',
        linesBetweenQueries: 2,
      })
      setOutputSql(formatted)
      setSyntaxWarning('')
      await handleSomething();
    } catch (err: any) {
      setOutputSql('')
      setSyntaxWarning(`SQL Parser Error: ${err.message || 'Invalid SQL Structure'}`)
    }
  }

  const handleMinify = async () => {
    if (!inputSql.trim()) return
    const minified = inputSql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .trim()
    setOutputSql(minified)
    await handleSomething();
    setSyntaxWarning('')
  }

  const handleClear = () => {
    setInputSql('')
    setOutputSql('')
    setIsCopied(false)
    setSyntaxWarning('')
  }

  const handleCopy = async () => {
    if (!outputSql) return
    try {
      await navigator.clipboard.writeText(outputSql)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed', err)
    }
  }

  const handleDownload = () => {
    if (!outputSql) return
    const element = document.createElement("a")
    const file = new Blob([outputSql], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = "formatted-query.sql"
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
      setInputSql(content)
    }
    reader.readAsText(file)
  }

  const stats = calculateStats(outputSql || inputSql)

  const features = [
    { icon: Zap, title: 'Instant Formatting', description: 'Beautify your SQL queries in milliseconds with proper indentation and keyword styling.' },
    { icon: Code, title: 'Multiple Dialects', description: 'Support for MySQL, PostgreSQL, SQLite, PL/SQL, and standard SQL syntax.' },
    { icon: Shield, title: 'Secure Processing', description: '100% client-side processing. Your data never leaves your browser.' },
    { icon: UserX, title: 'No Signup Needed', description: 'Use all features instantly without creating an account or logging in.' },
  ]

  const faqs = [
    { q: 'Is this SQL formatter completely free?', a: 'Yes! Our SQL formatter is 100% free to use with no hidden fees, daily limits, or premium tiers. All features are available to everyone.' },
    { q: 'Does it support PostgreSQL and MySQL?', a: 'Absolutely. We support multiple SQL dialects including Standard SQL, MySQL, PostgreSQL, SQLite, and PL/SQL. Select your preferred dialect from the dropdown.' },
    { q: 'Is my SQL data secure?', a: 'Yes, your data is completely secure. All processing happens locally in your browser using JavaScript. Your SQL queries are never sent to any server or stored anywhere.' },
    { q: 'Can I format multiple queries at once?', a: 'Yes! You can paste multiple SQL statements and they will all be formatted with proper spacing between queries.' },
  ]

  const relatedTools = [
    { name: 'JSON Formatter', href: '/tools/json-formatter' },
    { name: 'CSV to JSON', href: '/tools/csv-json' },
    { name: 'Regex Tester', href: '/tools/regex-tester' },
  ]


  return (
    <div className="min-h-screen bg-background text-foreground">

      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between w-full gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Code className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground leading-none">
                  DigitalMix
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  SQL Formatter
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

              {/* 2. زر الداشبورد بجانبه مباشرة */}
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

              {/* زر قائمة الموبايل */}
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

        {/* قائمة الموبايل المتجاوبة */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl p-4 space-y-2">
            <Button
              variant="ghost"
              className={`w-full justify-start gap-2 ${
                isFavorite
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-foreground"
              }`}
              onClick={handleToggleFavorite}
            >
              <Star
                className={`h-4 w-4 ${
                  isFavorite ? "fill-amber-500 text-amber-500" : ""
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
      <div className="py-12 px-4 text-center bg-linear-to-b from-primary/5 to-transparent">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
          Free SQL Formatter Online
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Instantly beautify, format, and minify your SQL queries. Supports multiple dialects,
          runs 100% client-side for maximum privacy, and requires no signup.
        </p>
      </div>

      {/* Main Tool Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value as SqlDialect)}
              className="h-10 px-3 rounded-lg border border-border bg-secondary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {dialects.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              accept=".sql,.txt"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-4 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Upload className="h-4 w-4" />
              Upload .sql
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

        {/* Warning Banner */}
        {syntaxWarning && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <span className="text-amber-500 text-sm font-medium">{syntaxWarning}</span>
          </div>
        )}

        {/* Textareas Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Input SQL
            </label>
            <textarea
              value={inputSql}
              onChange={(e) => setInputSql(e.target.value)}
              placeholder={`Paste your SQL query here...\n\nExample:\nselect id, name, email from users where status = 'active' and created_at > '2024-01-01' order by name`}
              className="w-full h-80 p-4 rounded-xl border border-border bg-card font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-all placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                Formatted Output
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!outputSql}
                  className="h-8 px-3 rounded-lg border border-border bg-secondary hover:bg-secondary/80 disabled:opacity-40 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!outputSql}
                  className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="w-full h-80 p-4 rounded-xl border border-border bg-card font-mono text-sm overflow-auto whitespace-pre">
              {outputSql ? (
                <code className="text-primary">{outputSql}</code>
              ) : (
                <span className="text-muted-foreground/50 italic">Formatted SQL will appear here...</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          <button
            onClick={handleFormat}
            disabled={!inputSql.trim()}
            className="h-12 px-8 rounded-xl bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground font-semibold flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:pointer-events-none transition-all hover:-translate-y-0.5"
          >
            <Sparkles className="h-5 w-5" />
            Beautify / Format SQL
          </button>
          <button
            onClick={handleMinify}
            disabled={!inputSql.trim()}
            className="h-12 px-8 rounded-xl border-2 border-border hover:bg-secondary font-semibold flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none transition-all hover:-translate-y-0.5"
          >
            <Minimize2 className="h-5 w-5" />
            Minify SQL
          </button>
        </div>

        {/* Query Statistics */}
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
            <div className="text-2xl font-bold text-emerald-500">{stats.selectCount}</div>
            <div className="text-xs text-muted-foreground mt-1">SELECT</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-amber-500">{stats.joinCount}</div>
            <div className="text-xs text-muted-foreground mt-1">JOIN</div>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card text-center">
            <div className="text-2xl font-bold text-rose-500">{stats.whereCount}</div>
            <div className="text-xs text-muted-foreground mt-1">WHERE</div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Why Use Our SQL Formatter?</h2>
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