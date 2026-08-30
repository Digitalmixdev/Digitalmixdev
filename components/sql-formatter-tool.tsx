'use client'

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react'
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
  History,
  ArrowRight,
  Search,
  RotateCcw,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { useLanguage } from '@/lib/i18n/context'
import { logToolActivity } from '@/lib/history-service'

type SqlDialect = 'sql' | 'mysql' | 'postgresql' | 'sqlite' | 'plsql'

interface QueryStats {
  lines: number
  characters: number
  selectCount: number
  joinCount: number
  whereCount: number
}

export interface SqlHistoryItem {
  id: string
  title: string
  input: string
  output: string
  dialect: SqlDialect
  type: 'format' | 'minify'
  timestamp: number
  stats: {
    lines: number
    characters: number
    selectCount: number
    joinCount: number
    whereCount: number
  }
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
  const { language } = useLanguage()
  const isArabic = language === 'ar'

  const [inputSql, setInputSql] = useState('')
  const [outputSql, setOutputSql] = useState('')
  const [dialect, setDialect] = useState<SqlDialect>('sql')
  const [isCopied, setIsCopied] = useState(false)
  const [syntaxWarning, setSyntaxWarning] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // History State
  const [history, setHistory] = useState<SqlHistoryItem[]>([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null)

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('digitalmix_sql_history')
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch {
      // ignore
    }
  }, [])

  // Save item to history
  const saveToHistory = useCallback(
    (input: string, output: string, usedDialect: SqlDialect, type: 'format' | 'minify') => {
      if (!input.trim() || !output.trim()) return

      const cleanFirstLine = input
        .trim()
        .replace(/\n+/g, ' ')
        .slice(0, 50)
      const title = cleanFirstLine || (type === 'format' ? 'Formatted SQL Query' : 'Minified SQL Query')

      const calculatedStats = calculateStats(output)

      setHistory((prev) => {
        // Avoid immediate duplicate
        if (prev.length > 0 && prev[0].input === input && prev[0].type === type && Date.now() - prev[0].timestamp < 3000) {
          return prev
        }

        const newItem: SqlHistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title,
          input,
          output,
          dialect: usedDialect,
          type,
          timestamp: Date.now(),
          stats: {
            lines: calculatedStats.lines,
            characters: calculatedStats.characters,
            selectCount: calculatedStats.selectCount,
            joinCount: calculatedStats.joinCount,
            whereCount: calculatedStats.whereCount,
          },
        }

        // De-duplication: if top item already has this exact output & dialect & type, skip duplicate
        if (
          prev.length > 0 &&
          prev[0].output === output &&
          prev[0].dialect === usedDialect &&
          prev[0].type === type
        ) {
          return prev
        }

        const filtered = prev.filter(
          (p) => !(p.output === output && p.dialect === usedDialect && p.type === type)
        )
        const updated = [newItem, ...filtered.slice(0, 49)]
        try {
          localStorage.setItem('digitalmix_sql_history', JSON.stringify(updated))
        } catch {
          // storage quota exceeded
        }

        // Universal dashboard activity logging
        logToolActivity({
          toolId: 'sql-formatter',
          toolName: isArabic ? 'منسق ومجمل استعلامات SQL' : 'SQL Formatter & Beautifier',
          category: 'database',
          actionTitle: type === 'format' ? 'Formatted SQL Query' : 'Minified SQL Query',
          details: isArabic
            ? `قام بتنسيق استعلام SQL لقاعدة بيانات ${usedDialect.toUpperCase()} (${calculatedStats.lines} أسطر، ${calculatedStats.characters} حرف)`
            : `Formatted ${usedDialect.toUpperCase()} SQL query (${calculatedStats.lines} lines, ${calculatedStats.characters} characters)`,
          inputSnippet: input.slice(0, 500),
          outputSnippet: output.slice(0, 500),
          metadata: {
            dialect: usedDialect,
            type,
            lines: calculatedStats.lines,
            characters: calculatedStats.characters,
            selectCount: calculatedStats.selectCount,
            joinCount: calculatedStats.joinCount,
            whereCount: calculatedStats.whereCount,
          },
        })

        return updated
      })
    },
    [isArabic]
  )

  const clearHistory = () => {
    setHistory([])
    try {
      localStorage.removeItem('digitalmix_sql_history')
    } catch {
      // ignore
    }
    toast.success(isArabic ? 'تم مسح سجل الاستعلامات بالكامل' : 'SQL history cleared successfully')
  }

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id)
      try {
        localStorage.setItem('digitalmix_sql_history', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
    toast.success(isArabic ? 'تم حذف العنصر من السجل' : 'Item removed from history')
  }

  const restoreHistoryItem = (item: SqlHistoryItem) => {
    setInputSql(item.input)
    setOutputSql(item.output)
    setDialect(item.dialect)
    setSyntaxWarning('')
    setShowHistoryModal(false)
    toast.success(
      isArabic
        ? `تم استعادة الاستعلام (${item.dialect.toUpperCase()})`
        : `Restored query into editor (${item.dialect.toUpperCase()})`
    )
  }

  const copyHistoryQuery = async (query: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(query)
    setCopiedHistoryId(id)
    setTimeout(() => setCopiedHistoryId(null), 2000)
    toast.success(isArabic ? 'تم نسخ الاستعلام' : 'Query copied to clipboard')
  }

  const exportHistoryCSV = () => {
    if (history.length === 0) return
    const headers = ['Timestamp', 'Date', 'Dialect', 'Type', 'Lines', 'Characters', 'Title', 'Input SQL', 'Output SQL']
    const rows = history.map((item) => [
      item.timestamp,
      `"${new Date(item.timestamp).toISOString()}"`,
      `"${item.dialect}"`,
      `"${item.type}"`,
      item.stats.lines,
      item.stats.characters,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.input.replace(/"/g, '""')}"`,
      `"${item.output.replace(/"/g, '""')}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `sql_history_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(isArabic ? 'تم تصدير سجل الاستعلامات كملف CSV' : 'SQL history exported as CSV')
  }

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return history
    const q = historySearch.toLowerCase()
    return history.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.input.toLowerCase().includes(q) ||
        item.output.toLowerCase().includes(q) ||
        item.dialect.toLowerCase().includes(q)
    )
  }, [history, historySearch])

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
      saveToHistory(inputSql, formatted, dialect, 'format')
      recordUsage()
      toast.success(isArabic ? 'تم تنسيق استعلام SQL بنجاح' : 'SQL query formatted successfully')
    } catch (err: unknown) {
      setSyntaxWarning(`Formatting notice: ${err instanceof Error ? err.message : 'Could not parse SQL input'}`)
      setOutputSql(inputSql)
      saveToHistory(inputSql, inputSql, dialect, 'format')
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
    saveToHistory(inputSql, minified, dialect, 'minify')
    recordUsage()
    toast.success(isArabic ? 'تم ضغط استعلام SQL' : 'SQL query minified')
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
    toast.success(isArabic ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard')
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
    toast.success(isArabic ? 'تم تحميل ملف SQL' : 'SQL file downloaded')
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
            {isArabic ? 'رفع .sql' : 'Upload .sql'}
          </Button>

          {/* History Modal Trigger Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistoryModal(true)}
            className="h-10 px-3.5 gap-2 text-xs font-semibold border-border/80 hover:border-primary/50 text-foreground"
          >
            <History className="h-4 w-4 text-primary" />
            <span>{isArabic ? 'السجل' : 'History'}</span>
            {history.length > 0 && (
              <span className="ms-1 px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                {history.length}
              </span>
            )}
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
          {isArabic ? 'مسح الكل' : 'Clear'}
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
              {isArabic ? 'استعلام SQL المدخل' : 'Input SQL Query'}
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
              {isArabic ? 'تحميل مثال جاهز' : 'Load Example'}
            </button>
          </div>
          <textarea
            value={inputSql}
            onChange={(e) => setInputSql(e.target.value)}
            placeholder={
              isArabic
                ? `الصق استعلام SQL هنا...\n\nمثال:\nselect id, name, email from users where status = 'active' and created_at > '2026-01-01' order by name`
                : `Paste your SQL query here...\n\nExample:\nselect id, name, email from users where status = 'active' and created_at > '2026-01-01' order by name`
            }
            className="w-full h-80 p-4 rounded-2xl border border-border/80 bg-card font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none transition-all placeholder:text-muted-foreground/40 leading-relaxed text-foreground shadow-xs"
          />
        </div>

        {/* Output Textarea */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Code className="h-3.5 w-3.5 text-primary" />
              {isArabic ? 'النتيجة بعد التنسيق' : 'Formatted Result'}
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
                {isArabic ? 'تحميل' : 'Download'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                disabled={!outputSql}
                className="h-8 px-3 text-xs gap-1.5 rounded-lg font-semibold"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {isCopied ? (isArabic ? 'تم النسخ' : 'Copied') : isArabic ? 'نسخ' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="w-full h-80 p-4 rounded-2xl border border-border/80 bg-card font-mono text-sm overflow-auto whitespace-pre leading-relaxed text-foreground shadow-xs">
            {outputSql ? (
              <code>{outputSql}</code>
            ) : (
              <span className="text-muted-foreground/40 italic select-none text-xs">
                {isArabic ? 'سيظهر استعلام SQL المنسق هنا...' : 'Formatted SQL query will render here...'}
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
          {isArabic ? 'تنسيق وتجميل SQL' : 'Beautify / Format SQL'}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={handleMinify}
          disabled={!inputSql.trim()}
          className="h-12 px-8 rounded-xl font-bold hover:bg-secondary transition-all"
        >
          <Minimize2 className="h-4.5 w-4.5" />
          {isArabic ? 'ضغط وتصغير SQL' : 'Minify SQL'}
        </Button>
      </div>

      {/* Query Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs">
          <div className="text-2xl font-extrabold text-primary">{stats.lines}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">
            {isArabic ? 'إجمالي الأسطر' : 'Total Lines'}
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs">
          <div className="text-2xl font-extrabold text-primary">{stats.characters}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">
            {isArabic ? 'عدد الحروف' : 'Characters'}
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs">
          <div className="text-2xl font-extrabold text-emerald-500">{stats.selectCount}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">
            {isArabic ? 'جمل SELECT' : 'SELECT Clauses'}
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs">
          <div className="text-2xl font-extrabold text-amber-500">{stats.joinCount}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">
            {isArabic ? 'جمل JOIN' : 'JOIN Statements'}
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs col-span-2 sm:col-span-1">
          <div className="text-2xl font-extrabold text-rose-500">{stats.whereCount}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">
            {isArabic ? 'شروط WHERE' : 'WHERE Conditions'}
          </div>
        </div>
      </div>

      {/* SQL HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    {isArabic ? 'سجل استعلامات SQL' : 'SQL Query History'}
                    <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {history.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {isArabic
                      ? 'الاستعلامات السابقة المحفوظة محلياً في متصفحك'
                      : 'Previously formatted queries stored safely in your browser'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportHistoryCSV}
                      className="rounded-xl text-xs h-8"
                    >
                      <Download size={13} className="me-1" />
                      CSV
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearHistory}
                      className="rounded-xl text-xs h-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 size={13} className="me-1" />
                      {isArabic ? 'مسح الكل' : 'Clear All'}
                    </Button>
                  </>
                )}
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Search filter if items exist */}
            {history.length > 3 && (
              <div className="relative">
                <Search size={14} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder={isArabic ? 'بحث في السجل بالاسم أو الاستعلام...' : 'Search history by query text or dialect...'}
                  className="w-full h-9 pl-9 pr-4 rtl:pl-4 rtl:pr-9 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {history.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground space-y-2">
                  <Database className="w-10 h-10 mx-auto opacity-40 text-primary" />
                  <p className="text-sm font-semibold">
                    {isArabic ? 'لا توجد استعلامات محفوظة بعد' : 'No SQL queries saved in history yet'}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {isArabic
                      ? 'عند تنسيق أو ضغط أي استعلام SQL، سيتم حفظه هنا تلقائياً لسهولة الرجوع إليه.'
                      : 'When you format or minify any SQL statement, it will automatically appear here.'}
                  </p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  {isArabic ? 'لم يتم العثور على نتائج مطابقة للبحث' : 'No matching queries found.'}
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => restoreHistoryItem(item)}
                    className="group p-4 bg-muted/40 hover:bg-muted/70 border border-border/70 hover:border-primary/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer shadow-xs"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-md uppercase border border-primary/20">
                          {item.dialect}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            item.type === 'minify'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}
                        >
                          {item.type === 'minify' ? 'Minified' : 'Formatted'}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(item.timestamp).toLocaleTimeString()} • {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({item.stats.lines} {isArabic ? 'سطر' : 'lines'}, {item.stats.characters} {isArabic ? 'حرف' : 'chars'})
                        </span>
                      </div>

                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-background/90 p-3 rounded-xl border border-border/60 font-mono text-xs text-foreground max-h-36 sm:max-h-48 overflow-y-auto overflow-x-auto whitespace-pre leading-relaxed select-all scrollbar-thin shadow-inner"
                      >
                        <code>{item.output || item.input}</code>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => copyHistoryQuery(item.output || item.input, item.id, e)}
                        className="h-8 px-2.5 rounded-lg text-xs gap-1"
                        title={isArabic ? 'نسخ الاستعلام' : 'Copy Query'}
                      >
                        {copiedHistoryId === item.id ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                        <span className="hidden sm:inline">{isArabic ? 'نسخ' : 'Copy'}</span>
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => restoreHistoryItem(item)}
                        className="h-8 px-3 rounded-lg text-xs font-semibold gap-1"
                      >
                        <RotateCcw size={13} />
                        <span>{isArabic ? 'استعادة' : 'Restore'}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title={isArabic ? 'حذف' : 'Delete'}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}