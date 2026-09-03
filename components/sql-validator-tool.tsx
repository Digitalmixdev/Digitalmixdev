'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Database,
  Code,
  Copy,
  Trash2,
  Download,
  Check,
  Upload,
  AlertTriangle,
  Zap,
  History,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Wand2,
  ExternalLink,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { useLanguage } from '@/lib/i18n/context'
import { logToolActivity, deleteActivityItem, getToolHistoryFromActivities } from '@/lib/history-service'
import { registerToolInputGetter } from '@/lib/ai/tool-input-bus'
import Link from 'next/link'

import {
  validateSqlCode,
  autoFixSqlCode,
  type SqlDialect,
  type SqlValidationError,
  type SqlValidationResult,
} from '@/lib/sql-validator-engine'

export type { SqlDialect, SqlValidationError, SqlValidationResult }
export { validateSqlCode, autoFixSqlCode }

export interface SqlValidatorHistoryItem {
  id: string
  title: string
  input: string
  dialect: SqlDialect
  isValid: boolean
  errorCount: number
  warningCount: number
  timestamp: number
}

const toolMeta: ToolMetadata = {
  id: 'sql-validator',
  name: 'SQL Validator',
  name_ar: 'مدقق ومحلل استعلامات SQL',
  description:
    'Validate SQL query syntax, detect errors, verify clause structures, check quote/bracket balance, and audit database queries with 100% client-side privacy.',
  description_ar:
    'قم بتدقيق وفحص صحة استعلامات SQL، واكتشاف الأخطاء النحوية والأقواس المفقودة والجداول والمخاطر، مع حماية كاملة لخصوصيتك 100%.',
  category: {
    id: 'database',
    name: 'Database Tools',
    slug: 'database',
  },
  icon: CheckCircle2,
  privacyBadge: '100% Client-Side • Multi-Dialect Syntax Audit',
  privacyBadge_ar: 'معالجة محلية 100% • تدقيق نحوي متعدد اللهجات',
  features: [
    {
      icon: CheckCircle2,
      title: 'Multi-Dialect Syntax Check',
      desc: 'Validates syntax for ANSI SQL, PostgreSQL, MySQL, SQLite, PL/SQL, and T-SQL.',
    },
    {
      icon: Zap,
      title: 'Real-time Error Detection',
      desc: 'Pinpoints unclosed quotes, missing parentheses, misspelled keywords, and structural flaws.',
    },
    {
      icon: AlertTriangle,
      title: 'Query Risk & Safety Audit',
      desc: 'Alerts you to dangerous queries like DELETE or UPDATE without WHERE clauses.',
    },
    {
      icon: Wand2,
      title: 'One-Click Auto Fixer',
      desc: 'Automatically corrects keyword casing, misspelled syntax, and cleans up formatting.',
    },
  ],
  features_ar: [
    {
      icon: CheckCircle2,
      title: 'تدقيق نحوي متعدد اللهجات',
      desc: 'فحص صحة الأكواد لـ PostgreSQL و MySQL و SQLite و PL/SQL و T-SQL.',
    },
    {
      icon: Zap,
      title: 'اكتشاف الأخطاء فورياً',
      desc: 'تحديد الأقواس المفتوحة، الاقتباسات المفقودة، والكلمات المفتاحية المكتوبة بأسلوب خاطئ.',
    },
    {
      icon: AlertTriangle,
      title: 'تدقيق الأمان والمخاطر',
      desc: 'تنبيهك فوراً عند وجود استعلامات خطيرة مثل DELETE أو UPDATE بدون شرط WHERE.',
    },
    {
      icon: Wand2,
      title: 'إصلاح تلقائي بنقرة واحدة',
      desc: 'تصحيح حالة الأحرف للكلمات المفتاحية وإصلاح الأخطاء الإملائية الشائعة فورياً.',
    },
  ],
  faqs: [
    {
      q: 'Which SQL dialects are supported by the SQL Validator?',
      a: 'We support Standard ANSI SQL, PostgreSQL, MySQL / MariaDB, SQLite, Oracle (PL/SQL), and Microsoft SQL Server (T-SQL).',
    },
    {
      q: 'Does SQL Validator send my queries to any external server?',
      a: 'No. All parsing, syntax checks, and validation logic execute 100% locally in your browser runtime. Your queries and schema structures remain strictly private.',
    },
    {
      q: 'Can I fix my SQL query after validating?',
      a: 'Yes! Click the "Auto Fix" button to automatically fix misspelled keywords, function typos, punctuation mistakes, and syntax errors in-place without altering your layout.',
    },
  ],
  faqs_ar: [
    {
      q: 'ما هي لغات ولهجات SQL المدعومة؟',
      a: 'ندعم SQL القياسية ANSI، PostgreSQL، MySQL، SQLite، Oracle PL/SQL، و Microsoft SQL Server (T-SQL).',
    },
    {
      q: 'هل تقوم الأداة بإرسال استعلاماتي إلى أي خوادم خارجية؟',
      a: 'لا. كل عمليات الفحص والتدقيق تتم بنسبة 100% داخل متصفحك المحلي دون أي نقل للبيانات عبر الشبكة.',
    },
    {
      q: 'هل يمكنني إصلاح الاستعلام بعد الفحص؟',
      a: 'نعم! اضغط على زر "إصلاح تلقائي" لتصحيح الأخطاء الإملائية، وتعديل الترقيم، وضبط الاستعلام فورياً مع الحفاظ على تنسيقك.',
    },
  ],
}

const SAMPLE_QUERIES: { label: string; label_ar: string; dialect: SqlDialect; sql: string }[] = [
  {
    label: 'Valid Complex Query',
    label_ar: 'استعلام معقد صحيح',
    dialect: 'postgresql',
    sql: `SELECT u.id, u.name, COUNT(o.id) AS total_orders, SUM(o.amount) AS total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active' AND o.created_at >= '2025-01-01'
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 2
ORDER BY total_spent DESC
LIMIT 50;`,
  },
  {
    label: 'Syntax Error (Unclosed Bracket)',
    label_ar: 'خطأ نصوص (قوس غير مغلق)',
    dialect: 'sql',
    sql: `SELECT id, name, email
FROM users
WHERE age IN (18, 21, 25, 30
ORDER BY name ASC;`,
  },
  {
    label: 'Dangerous UPDATE (Missing WHERE)',
    label_ar: 'تحديث خطير (بدون WHERE)',
    dialect: 'mysql',
    sql: `UPDATE users
SET status = 'suspended', login_attempts = 0;`,
  },
  {
    label: 'Misspelled Keywords',
    label_ar: 'أخطاء إملائية بالكلمات',
    dialect: 'sql',
    sql: `SEELCT id, title, price
FORM products
WHER price > 100
ORDRE BY price DESC;`,
  },
]

export function SqlValidatorTool() {
  const { language } = useLanguage()
  const isAr = language === 'ar'

  const [sqlInput, setSqlInput] = useState<string>('')
  const [dialect, setDialect] = useState<SqlDialect>('postgresql')
  const [copied, setCopied] = useState<boolean>(false)
  const [history, setHistory] = useState<SqlValidatorHistoryItem[]>([])
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor')

  // Load history from localStorage
  useEffect(() => {
    const stored = getToolHistoryFromActivities('sql-validator')
    if (stored && stored.length > 0) {
      const parsed: SqlValidatorHistoryItem[] = stored.map((item) => {
        const meta = (typeof item.metadata === 'object' && item.metadata !== null ? item.metadata : {}) as Record<string, any>
        return {
          id: item.id,
          title: item.actionTitle || 'SQL Validation',
          input: item.inputSnippet || meta?.input || '',
          dialect: (meta?.dialect as SqlDialect) || 'sql',
          isValid: meta?.isValid ?? true,
          errorCount: meta?.errorCount || 0,
          warningCount: meta?.warningCount || 0,
          timestamp: new Date(item.createdAt).getTime(),
        }
      })
      setHistory(parsed)
    }
  }, [])

  // Register AI tool input getter
  useEffect(() => {
    registerToolInputGetter('sql-validator', () => sqlInput)
  }, [sqlInput])

  // Validation Result Memo
  const validationResult = useMemo(() => {
    return validateSqlCode(sqlInput, dialect)
  }, [sqlInput, dialect])

  // Log activity on validation
  const handleValidate = useCallback(() => {
    if (!sqlInput.trim()) return
    markToolUsed('sql-validator')
    incrementToolUsage()

    const res = validateSqlCode(sqlInput, dialect)
    const newHistItem: SqlValidatorHistoryItem = {
      id: Date.now().toString(),
      title: `${res.statementType} Query (${dialect.toUpperCase()})`,
      input: sqlInput,
      dialect,
      isValid: res.isValid,
      errorCount: res.errors.length,
      warningCount: res.warnings.length,
      timestamp: Date.now(),
    }

    logToolActivity({
      toolId: 'sql-validator',
      toolName: 'SQL Validator',
      category: 'database',
      actionTitle: `${res.statementType} Query (${dialect.toUpperCase()})`,
      details: `${res.statementType} query validated in ${dialect.toUpperCase()} (${res.isValid ? 'Valid' : 'Errors found'})`,
      inputSnippet: sqlInput.slice(0, 300),
      metadata: {
        input: sqlInput,
        dialect,
        isValid: res.isValid,
        errorCount: res.errors.length,
        warningCount: res.warnings.length,
        statementType: res.statementType,
      },
    })

    setHistory((prev) => [newHistItem, ...prev.filter((h) => h.input !== sqlInput).slice(0, 19)])
  }, [sqlInput, dialect])

  // Copy to clipboard
  const handleCopy = () => {
    if (!sqlInput.trim()) return
    navigator.clipboard.writeText(sqlInput)
    setCopied(true)
    toast.success(isAr ? 'تم نسخ استعلام SQL' : 'SQL Query copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  // Auto-Fix (Fixes typos, syntax, and punctuation in-place WITHOUT formatting)
  const handleAutoFix = () => {
    if (!sqlInput.trim()) return

    const { fixedSql, fixCount } = autoFixSqlCode(sqlInput, dialect)

    if (fixCount > 0) {
      toast.success(
        isAr
          ? `تم الإصلاح التلقائي بنجاح (${fixCount} أخطاء تم تصحيحها)!`
          : `Auto-fixed ${fixCount} issue(s) successfully without reformatting!`
      )
    } else {
      toast.info(
        isAr
          ? 'لم يتم العثور على أخطاء إملائية أو ترقيم تحتاج لإصلاح.'
          : 'No typo or punctuation fixes needed in this query.'
      )
    }

    setSqlInput(fixedSql)
  }

  // Download SQL File
  const handleDownload = () => {
    if (!sqlInput.trim()) return
    const blob = new Blob([sqlInput], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `validated-query-${dialect}.sql`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(isAr ? 'تم تحميل ملف SQL' : 'Downloaded SQL file')
  }

  // Clear Input
  const handleClear = () => {
    setSqlInput('')
    toast.info(isAr ? 'تم تفريغ المحرر' : 'Cleared editor')
  }

  // Upload File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        setSqlInput(content)
        toast.success(isAr ? 'تم تحميل استعلام SQL من الملف' : 'Loaded SQL from file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <ToolLayout metadata={toolMeta}>
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'editor' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('editor')}
              className="rounded-xl gap-2 text-xs font-semibold"
            >
              <Code className="h-3.5 w-3.5" />
              {isAr ? 'محرر التدقيق' : 'Validator Editor'}
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('history')}
              className="rounded-xl gap-2 text-xs font-semibold relative"
            >
              <History className="h-3.5 w-3.5" />
              {isAr ? 'سجل التدقيق' : 'Validation History'}
              {history.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-primary/20 text-primary text-[10px] font-bold rounded-full">
                  {history.length}
                </span>
              )}
            </Button>
          </div>

          {/* Dialect Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
              {isAr ? 'قاعدة البيانات / اللهجة:' : 'SQL Dialect:'}
            </span>
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value as SqlDialect)}
              className="h-9 rounded-xl border border-border/80 bg-background px-3 py-1 text-xs font-semibold text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL / MariaDB</option>
              <option value="sql">Standard ANSI SQL</option>
              <option value="sqlite">SQLite</option>
              <option value="plsql">Oracle (PL/SQL)</option>
              <option value="tsql">MS SQL Server (T-SQL)</option>
            </select>
          </div>
        </div>

        {activeTab === 'history' ? (
          /* History View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                {isAr ? 'سجل الفحوصات السابقة' : 'Recent Validations'}
              </h3>
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    history.forEach((h) => deleteActivityItem(h.id))
                    setHistory([])
                    toast.success(isAr ? 'تم مسح سجل التدقيق' : 'Cleared history')
                  }}
                  className="text-xs text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  {isAr ? 'مسح السجل' : 'Clear All'}
                </Button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border/60 rounded-2xl bg-muted/20">
                <History className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-muted-foreground">
                  {isAr ? 'لا يوجد استعلامات مسجلة في السجل بعد' : 'No validation history records yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-border/70 bg-card hover:bg-accent/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {item.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                            <XCircle className="h-3 w-3" /> Syntax Error ({item.errorCount})
                          </span>
                        )}
                        <span className="text-xs font-bold text-foreground">{item.title}</span>
                      </div>
                      <pre className="text-xs font-mono text-muted-foreground truncate max-w-xl bg-muted/40 p-1.5 rounded-lg">
                        {item.input}
                      </pre>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSqlInput(item.input)
                          setDialect(item.dialect)
                          setActiveTab('editor')
                        }}
                        className="h-8 rounded-lg text-xs gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {isAr ? 'استعادة' : 'Load Query'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Editor & Validator Main View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Editor & Controls */}
            <div className="lg:col-span-7 space-y-4">
              {/* Sample Queries Bar */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground mr-1">
                  {isAr ? 'نماذج جاهزة:' : 'Samples:'}
                </span>
                {SAMPLE_QUERIES.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSqlInput(sample.sql)
                      setDialect(sample.dialect)
                      toast.info(isAr ? `تم تحميل: ${sample.label_ar}` : `Loaded sample: ${sample.label}`)
                    }}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-border/60 bg-muted/30 hover:bg-primary/10 hover:border-primary/30 transition-all text-foreground"
                  >
                    {isAr ? sample.label_ar : sample.label}
                  </button>
                ))}
              </div>

              {/* Code Textarea Container */}
              <div className="relative rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                <div className="flex items-center justify-between px-3.5 py-2 bg-muted/40 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      {isAr ? 'استعلام SQL للتدقيق' : 'SQL Query Input'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".sql,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border border-border/60 hover:bg-secondary text-muted-foreground transition-all">
                        <Upload className="h-3 w-3" />
                        {isAr ? 'رفع ملف' : 'Upload .sql'}
                      </span>
                    </label>

                    {sqlInput && (
                      <button
                        onClick={handleClear}
                        className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-destructive/10 text-destructive transition-all"
                      >
                        <Trash2 className="h-3 w-3 inline mr-0.5" />
                        {isAr ? 'مسح' : 'Clear'}
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={sqlInput}
                  onChange={(e) => setSqlInput(e.target.value)}
                  placeholder={
                    isAr
                      ? 'الصق استعلام SQL هنا لتدقيقه واكتشاف الأخطاء النحوية والهيكلية...'
                      : 'Paste your SQL query here to validate syntax, quotes, clauses, and structure...'
                  }
                  rows={14}
                  className="w-full bg-transparent p-4 font-mono text-xs sm:text-sm text-foreground focus:outline-none resize-y min-h-[320px] leading-relaxed"
                  spellCheck={false}
                />

                {/* Bottom Action Bar */}
                <div className="flex flex-wrap items-center justify-between p-3 bg-muted/20 border-t border-border/60 gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleAutoFix}
                      variant="secondary"
                      size="sm"
                      disabled={!sqlInput.trim()}
                      className="rounded-xl text-xs gap-1.5 font-bold hover:bg-primary/10 hover:text-primary transition-all shadow-xs"
                      title={isAr ? 'إصلاح الأخطاء الإملائية وعلامات الترقيم تلقائياً دون إعادة تنسيق' : 'Auto-fix typos, invalid colons, and syntax errors without reformatting'}
                    >
                      <Wand2 className="h-3.5 w-3.5 text-primary" />
                      {isAr ? 'إصلاح تلقائي' : 'Auto Fix'}
                    </Button>

                    <Link href={`/tools/sql-formatter`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-xs gap-1 font-semibold text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {isAr ? 'منسق SQL' : 'SQL Formatter'}
                      </Button>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      size="sm"
                      disabled={!sqlInput.trim()}
                      className="rounded-xl text-xs gap-1"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ' : 'Copy'}
                    </Button>

                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      size="sm"
                      disabled={!sqlInput.trim()}
                      className="rounded-xl text-xs gap-1"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {isAr ? 'تنزيل' : 'Download'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Validation Status & Audit Report */}
            <div className="lg:col-span-5 space-y-4">
              {/* Overall Status Banner */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  !sqlInput.trim()
                    ? 'border-border/60 bg-card'
                    : validationResult.isValid
                    ? validationResult.hasWarnings
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-destructive/30 bg-destructive/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  {!sqlInput.trim() ? (
                    <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  ) : validationResult.isValid ? (
                    validationResult.hasWarnings ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    )
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-foreground">
                        {!sqlInput.trim()
                          ? isAr
                            ? 'جاهز للفحص'
                            : 'Ready to Validate'
                          : validationResult.isValid
                          ? validationResult.hasWarnings
                            ? isAr
                              ? 'الاستعلام صحيح مع تحذيرات'
                              : 'Valid Query (with Risk Warnings)'
                            : isAr
                            ? 'الاستعلام صحيح 100%'
                            : 'Valid SQL Syntax'
                          : isAr
                          ? 'تم اكتشاف أخطاء نحوية'
                          : 'Syntax Errors Found'}
                      </h4>

                      {sqlInput.trim() && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {validationResult.statementType}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {!sqlInput.trim()
                        ? isAr
                          ? 'أدخل استعلام SQL الخاص بك لمراجعته وتدقيق الأخطاء الهيكلية.'
                          : 'Enter a SQL query to audit syntax, quotes, and structure.'
                        : validationResult.isValid
                        ? isAr
                          ? `لم يتم العثور على أخطاء قاتلة. تم الفحص على لهجة ${dialect.toUpperCase()}.`
                          : `No syntax errors detected for ${dialect.toUpperCase()} dialect.`
                        : isAr
                        ? `تمت إتاحة ${validationResult.errors.length} أخطاء تحتاج إلى تصحيح.`
                        : `Found ${validationResult.errors.length} syntax error(s) that need attention.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Errors List */}
              {validationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5" />
                      {isAr ? 'الأخطاء النحوية:' : 'Syntax Errors:'} ({validationResult.errors.length})
                    </h5>
                  </div>
                  <div className="space-y-2">
                    {validationResult.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-xs space-y-1"
                      >
                        <div className="font-bold text-destructive flex items-center justify-between">
                          <span>{err.message}</span>
                          <span className="text-[10px] bg-destructive/20 px-1.5 py-0.5 rounded text-destructive">
                            Line {err.line}
                          </span>
                        </div>
                        {err.suggestion && (
                          <p className="text-muted-foreground text-[11px] font-medium">
                            💡 <span className="font-semibold text-foreground">Suggestion:</span> {err.suggestion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings List */}
              {validationResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {isAr ? 'تحذيرات الأمان والمخاطر:' : 'Safety & Risk Alerts:'} ({validationResult.warnings.length})
                  </h5>
                  <div className="space-y-2">
                    {validationResult.warnings.map((warn, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs space-y-1"
                      >
                        <div className="font-bold text-amber-600 dark:text-amber-400">
                          {warn.message}
                        </div>
                        {warn.suggestion && (
                          <p className="text-muted-foreground text-[11px]">
                            👉 {warn.suggestion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clauses Detected & Tables Breakdown */}
              {sqlInput.trim() && (
                <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-3">
                  <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {isAr ? 'تحليل هيكل الاستعلام والجداول' : 'Clause & Table Breakdown'}
                  </h5>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground">SELECT</span>
                      <span className={validationResult.clauseBreakdown.select ? 'font-bold text-emerald-500' : 'text-muted-foreground/40'}>
                        {validationResult.clauseBreakdown.select ? 'Yes' : 'No'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground">FROM</span>
                      <span className={validationResult.clauseBreakdown.from ? 'font-bold text-emerald-500' : 'text-muted-foreground/40'}>
                        {validationResult.clauseBreakdown.from ? 'Yes' : 'No'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground">JOIN</span>
                      <span className={validationResult.clauseBreakdown.join ? 'font-bold text-emerald-500' : 'text-muted-foreground/40'}>
                        {validationResult.clauseBreakdown.join ? 'Yes' : 'No'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground">WHERE</span>
                      <span className={validationResult.clauseBreakdown.where ? 'font-bold text-emerald-500' : 'text-muted-foreground/40'}>
                        {validationResult.clauseBreakdown.where ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  {validationResult.tablesDetected.length > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        {isAr ? 'الجداول المكتشفة:' : 'Tables Detected:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {validationResult.tablesDetected.map((tbl, i) => (
                          <span
                            key={i}
                            className="text-[11px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20"
                          >
                            {tbl}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}

export default SqlValidatorTool
