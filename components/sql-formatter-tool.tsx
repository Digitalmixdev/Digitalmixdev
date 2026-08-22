'use client'

import React, { useState, useRef, useMemo } from 'react'
import { format } from 'sql-formatter'
import {
  Database,
  Code,
  Copy,
  Trash2,
  Download,
  Check,
  Sparkles,
  Upload,
  Minimize2,
  AlertTriangle,
  FileText,
  Zap,
  ShieldCheck,
  Lock,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'

type SqlDialect = 'sql' | 'mysql' | 'postgresql' | 'sqlite' | 'plsql'

interface QueryStats {
  lines: number
  characters: number
  selectCount: number
  joinCount: number
  whereCount: number
}

const toolMeta: ToolMetadata = {
  id: 'sql-formatter',
  name: 'SQL Formatter & Beautifier',
  description:
    'Instantly beautify, format, parse, and minify your SQL queries. Supports standard SQL, PostgreSQL, MySQL, SQLite, and PL/SQL with 100% client-side privacy.',
  category: {
    id: 'database',
    name: 'Database Tools',
    slug: 'database',
  },
  icon: Database,
  privacyBadge: '100% Client-Side • Multi-Dialect Support',
  features: [
    {
      icon: Sparkles,
      title: 'Dialect-Aware Formatting',
      desc: 'Accurately formats queries for PostgreSQL, MySQL, SQLite, and PL/SQL.',
    },
    {
      icon: Zap,
      title: 'Query Tokenizer & Stats',
      desc: 'Instant visual metrics for query length, SELECT, JOIN, and WHERE clauses.',
    },
    {
      icon: ShieldCheck,
      title: 'Zero Data Transmission',
      desc: 'Sensitive database schemas and table structures never leave your browser.',
    },
    {
      icon: Minimize2,
      title: 'Minifier & Beautifier',
      desc: 'Easily switch between human-readable indentation and minified one-liners.',
    },
  ],
  faqs: [
    {
      q: 'Which SQL dialects are supported?',
      a: 'We support Standard ANSI SQL, PostgreSQL, MySQL, SQLite, and Oracle PL/SQL. You can choose your preferred dialect from the dropdown selector.',
    },
    {
      q: 'Does this tool store or log my database queries?',
      a: 'No. Formatting is executed entirely in your local browser runtime. No database credentials, table names, or SQL statements are sent to our servers.',
    },
    {
      q: 'Can I upload and download .sql script files?',
      a: 'Yes. Use the Upload button to read SQL scripts directly from your filesystem, and click Download to save formatted results.',
    },
  ],
}

const DIALECTS: { value: SqlDialect; label: string }[] = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'plsql', label: 'PL/SQL' },
]

export default function SqlFormatterTool() {
  const [inputSql, setInputSql] = useState('')
  const [outputSql, setOutputSql] = useState('')
  const [dialect, setDialect] = useState<SqlDialect>('sql')
  const [isCopied, setIsCopied] = useState(false)
  const [syntaxWarning, setSyntaxWarning] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const recordUsage = async () => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed('sql-formatter'),
      ])
    } catch {
      // Non-blocking telemetry
    }
  }

  const calculateStats = (sql: string): QueryStats => {
    const lines = sql ? sql.split('\n').length : 0
    const characters = sql.length
    const selectCount = (sql.match(/\bSELECT\b/gi) || []).length
    const joinCount = (sql.match(/\bJOIN\b/gi) || []).length
    const whereCount = (sql.match(/\bWHERE\b/gi) || []).length
    return { lines, characters, selectCount, joinCount, whereCount }
  }

  const validateSqlSyntax = (sql: string): string | null => {
    const cleanSql = sql.trim()
    if (!cleanSql) return null

    const openParens = (cleanSql.match(/\(/g) || []).length
    const closeParens = (cleanSql.match(/\)/g) || []).length
    if (openParens !== closeParens) {
      return `Syntax Notice: Mismatched parentheses (${openParens} opening '(' vs ${closeParens} closing ')').`
    }

    const singleQuotes = (cleanSql.match(/'/g) || []).length
    if (singleQuotes % 2 !== 0) {
      return "Syntax Notice: Unclosed single quote (') detected in string literal."
    }

    return null
  }

  const handleFormat = () => {
    if (!inputSql.trim()) return

    const warning = validateSqlSyntax(inputSql)
    setSyntaxWarning(warning || '')

    try {
      const formatted = format(inputSql, {
        language: dialect === 'plsql' ? 'plsql' : dialect,
        tabWidth: 2,
        keywordCase: 'upper',
        linesBetweenQueries: 2,
      })
      setOutputSql(formatted)
      recordUsage()
    } catch (err: unknown) {
      setSyntaxWarning(`Formatting notice: ${err instanceof Error ? err.message : 'Could not parse SQL input'}`)
      setOutputSql(inputSql)
    }
  }

  const handleMinify = () => {
    if (!inputSql.trim()) return
    const minified = inputSql
      .replace(/\s+/g, ' ')
      .replace(/\s*([,;()=><])\s*/g, '$1')
      .trim()
    setOutputSql(minified)
    setSyntaxWarning('')
    recordUsage()
  }

  const handleClear = () => {
    setInputSql('')
    setOutputSql('')
    setSyntaxWarning('')
  }

  const handleCopy = async () => {
    if (!outputSql) return
    await navigator.clipboard.writeText(outputSql)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!outputSql) return
    const blob = new Blob([outputSql], { type: 'text/sql' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `query-${Date.now()}.sql`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setInputSql(text)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const stats = useMemo(() => calculateStats(outputSql || inputSql), [outputSql, inputSql])

  return (
    <ToolLayout metadata={toolMeta} maxWidth="7xl">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={dialect}
            onChange={(e) => setDialect(e.target.value as SqlDialect)}
            className="h-10 px-3.5 rounded-xl border border-border bg-card text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer shadow-xs"
          >
            {DIALECTS.map((d) => (
              <option key={d.value} value={d.value} className="bg-background text-foreground">
                {d.label}
              </option>
            ))}
          </select>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept=".sql,.txt"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 px-3.5 gap-2 text-xs font-semibold"
          >
            <Upload className="h-4 w-4" />
            Upload .sql
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={!inputSql && !outputSql}
          className="h-10 px-3.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </Button>
      </div>

      {/* Syntax Warning Banner */}
      {syntaxWarning && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 animate-in fade-in-0 duration-200">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">
            {syntaxWarning}
          </span>
        </div>
      )}

      {/* Textareas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Input Textarea */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Input SQL Query
            </label>
            <button
              type="button"
              onClick={() =>
                setInputSql(
                  `SELECT u.id, u.name, u.email, COUNT(o.id) AS total_orders, SUM(o.amount) AS total_spent\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.status = 'active' AND u.created_at >= '2026-01-01'\nGROUP BY u.id, u.name, u.email\nHAVING COUNT(o.id) > 5\nORDER BY total_spent DESC\nLIMIT 50;`
                )
              }
              className="text-xs text-primary hover:underline font-medium cursor-pointer"
            >
              Load Example
            </button>
          </div>
          <textarea
            value={inputSql}
            onChange={(e) => setInputSql(e.target.value)}
            placeholder={`Paste your SQL query here...\n\nExample:\nselect id, name, email from users where status = 'active' and created_at > '2026-01-01' order by name`}
            className="w-full h-80 p-4 rounded-2xl border border-border/80 bg-card font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none transition-all placeholder:text-muted-foreground/40 leading-relaxed text-foreground shadow-xs"
          />
        </div>

        {/* Output Textarea */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5 text-primary" />
              Formatted Result
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!outputSql}
                className="h-8 px-2.5 text-xs gap-1.5 rounded-lg"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                disabled={!outputSql}
                className="h-8 px-3 text-xs gap-1.5 rounded-lg font-semibold"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {isCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="w-full h-80 p-4 rounded-2xl border border-border/80 bg-card font-mono text-sm overflow-auto whitespace-pre leading-relaxed text-foreground shadow-xs">
            {outputSql ? (
              <code>{outputSql}</code>
            ) : (
              <span className="text-muted-foreground/40 italic select-none text-xs">
                Formatted SQL query will render here...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
        <Button
          size="lg"
          onClick={handleFormat}
          disabled={!inputSql.trim()}
          className="h-12 px-8 rounded-xl font-bold shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all"
        >
          <Sparkles className="h-4.5 w-4.5" />
          Beautify / Format SQL
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={handleMinify}
          disabled={!inputSql.trim()}
          className="h-12 px-8 rounded-xl font-bold hover:bg-secondary transition-all"
        >
          <Minimize2 className="h-4.5 w-4.5" />
          Minify SQL
        </Button>
      </div>

      {/* Query Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs">
          <div className="text-2xl font-extrabold text-primary">{stats.lines}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">Total Lines</div>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs">
          <div className="text-2xl font-extrabold text-primary">{stats.characters}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">Characters</div>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs">
          <div className="text-2xl font-extrabold text-emerald-500">{stats.selectCount}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">SELECT Clauses</div>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs">
          <div className="text-2xl font-extrabold text-amber-500">{stats.joinCount}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">JOIN Statements</div>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs col-span-2 sm:col-span-1">
          <div className="text-2xl font-extrabold text-rose-500">{stats.whereCount}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">WHERE Conditions</div>
        </div>
      </div>
    </ToolLayout>
  )
}