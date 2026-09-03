'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  FileCode,
  Copy,
  Trash2,
  Download,
  Check,
  Sparkles,
  Upload,
  AlertTriangle,
  Zap,
  ShieldCheck,
  History,
  CheckCircle2,
  XCircle,
  FileText,
  RotateCcw,
  Wand2,
  ExternalLink,
  Info,
  Layers,
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
import { jsonrepair } from 'jsonrepair'

export interface JsonValidationError {
  line: number
  column?: number
  message: string
  snippet?: string
  suggestion?: string
  suggestion_ar?: string
}

export interface JsonValidationResult {
  isValid: boolean
  rootType: 'Object' | 'Array' | 'Primitive' | 'Unknown'
  error?: JsonValidationError
  warnings: string[]
  stats: {
    lines: number
    chars: number
    keyCount: number
    maxDepth: number
    fileSizeKB: string
  }
}

export interface JsonValidatorHistoryItem {
  id: string
  title: string
  input: string
  isValid: boolean
  rootType: string
  errorLine?: number
  timestamp: number
}

const toolMeta: ToolMetadata = {
  id: 'json-validator',
  name: 'JSON Validator',
  name_ar: 'مدقق ومحلل بيانات JSON',
  description:
    'Validate JSON syntax, pinpoint line and column error locations, auto-fix trailing commas and quoting issues, and audit JSON payloads with 100% client-side privacy.',
  description_ar:
    'قم بتدقيق وفحص صحة كود JSON، واكتشاف الأخطاء النحوية بالسطر والعمود، وإصلاح الفواصل الزائدة وعلامات التنصيص تلقائياً مع حماية خصوصيتك 100%.',
  category: {
    id: 'database',
    name: 'Database Tools',
    slug: 'database',
  },
  icon: ShieldCheck,
  privacyBadge: '100% Client-Side • Syntax & Structure Audit',
  privacyBadge_ar: 'معالجة محلية 100% • تدقيق نحوي وهيكلي',
  features: [
    {
      icon: CheckCircle2,
      title: 'Line & Column Pinpointing',
      desc: 'Detects precise syntax error coordinates in large JSON payloads.',
    },
    {
      icon: Wand2,
      title: 'One-Click Auto Fixer',
      desc: 'Automatically strips trailing commas, fixes single quotes, and quotes unquoted keys.',
    },
    {
      icon: Layers,
      title: 'Structural Payload Matrix',
      desc: 'Analyzes root payload type, total object key counts, nest depth, and size.',
    },
    {
      icon: ShieldCheck,
      title: '100% Client-Side Privacy',
      desc: 'All validation and parsing executes locally in your browser memory.',
    },
  ],
  features_ar: [
    {
      icon: CheckCircle2,
      title: 'تحديد موقع الخطأ بالسطر والعمود',
      desc: 'يحدد موقع أخطاء الصياغة بدقة متناهية في ملفات JSON المعقدة.',
    },
    {
      icon: Wand2,
      title: 'إصلاح تلقائي بنقرة واحدة',
      desc: 'إزالة الفواصل الزائدة تلقائياً وتصحيح علامات التنصيص المفردة والمفاتيح غير المعرفة.',
    },
    {
      icon: Layers,
      title: 'مصفوفة وتحليل الهيكل',
      desc: 'تحليل نوع الحمولة الأصلية، إجمالي المفاتيح، أقصى عمق للتداخل وحجم الملف.',
    },
    {
      icon: ShieldCheck,
      title: 'خصوصية محلية 100%',
      desc: 'جميع عمليات الفحص والتصحيح تعمل حصرياً داخل متصفحك المحلي.',
    },
  ],
  faqs: [
    {
      q: 'Why is my JSON showing an invalid syntax error?',
      a: 'The most common causes are missing commas between object properties, trailing commas before closing braces/brackets, single quotes, unquoted keys, or unclosed brackets.',
    },
    {
      q: 'How does the Auto-Fix feature work?',
      a: 'Auto-Fix inserts missing commas between properties/elements, strips comments, removes trailing commas, converts single quotes to double quotes, closes unclosed brackets, and wraps unquoted keys.',
    },
    {
      q: 'Does JSON Validator send my JSON payload anywhere?',
      a: 'No. All parsing and validation algorithms run 100% locally in your web browser. Your data never leaves your device.',
    },
  ],
  faqs_ar: [
    {
      q: 'لماذا تظهر بيانات JSON الخاصة بي كغير صالحة؟',
      a: 'الأسباب الأكثر شيوعاً هي نسيان الفواصل بين الخصائص، وجود فواصل زائدة قبل إغلاق الأقواس، استخدام علامات تنصيص مفردة بدلاً من المزدوجة، أو عدم وضع علامات تنصيص حول المفاتيح.',
    },
    {
      q: 'كيف تعمل خاصية الإصلاح التلقائي (Auto-Fix)؟',
      a: 'تقوم الخاصية بإضافة الفواصل المفقودة بين الخصائص والعناصر تلقائياً، إزالة الفواصل الزائدة والتعليقات، تحويل الاقتباسات المفردة لمزدوجة، وإصلاح الأقواس غير المغلقة بنقرة واحدة.',
    },
    {
      q: 'هل يتم إرسال بيانات JSON إلى أي خادم خارجي؟',
      a: 'لا، كل الخوارزميات تتم داخل متصفحك المحلي بنسبة 100% وبدون أي نقل عبر الشبكة.',
    },
  ],
  relatedTools: [
    {
      id: 'csv-json',
      name: 'CSV to JSON Converter',
      href: '/tools/csv-json',
      description: 'Convert Excel CSV data into clean structured JSON arrays with automatic type detection.',
    },
    {
      id: 'json-formatter',
      name: 'JSON Formatter',
      href: '/tools/json-formatter',
      description: 'Format, beautify, structure, and minify JSON data with custom indentation and tree view.',
    },
    {
      id: 'sql-formatter',
      name: 'SQL Formatter',
      href: '/tools/sql-formatter',
      description: 'Format, beautify, and minify SQL queries instantly with dialect support.',
    },
  ],
}

const SAMPLE_PAYLOADS = [
  {
    label: 'Valid Complex API Payload',
    label_ar: 'حمولة معقدة سليمة',
    json: `{
  "status": "success",
  "code": 200,
  "data": {
    "user": {
      "id": "usr_9921",
      "name": "Jane Doe",
      "roles": ["admin", "developer"],
      "settings": {
        "notifications": true,
        "theme": "dark"
      }
    },
    "metrics": [
      { "day": "Mon", "value": 142 },
      { "day": "Tue", "value": 189 }
    ]
  }
}`,
  },
  {
    label: 'Missing Commas Error',
    label_ar: 'خطأ فواصل مفقودة',
    json: `{
  "status": "success",
  "code": 200,
  "data": {
    "user": {
      "id": "usr_9921",
      "name": "Jane Doe",
      "roles": ["admin", "developer"],
      "settings": {
        "notifications": true,
        "theme": "dark"
      }
    }
    "metrics": [
      { "day": "Mon", "value": 142 },
      { "day": "Tue", "value": 189 }
    ]
  }
}`,
  },
  {
    label: 'Trailing Commas Error',
    label_ar: 'خطأ فواصل زائدة',
    json: `{
  "product_id": 1024,
  "title": "Wireless Keyboard",
  "tags": ["hardware", "usb",],
  "in_stock": true,
}`,
  },
  {
    label: 'Single Quotes & Unquoted Keys',
    label_ar: 'مفاتيح واقتباسات غير قياسية',
    json: `{
  name: 'DigitalMix Tools',
  version: '2.5.0',
  active: true,
}`,
  },
  {
    label: 'Unclosed Brackets Error',
    label_ar: 'أقواس غير مغلقة',
    json: `{
  "items": [
    { "id": 1, "name": "Item A" },
    { "id": 2, "name": "Item B" }
  `,
  },
]

// Helper function to measure structural matrix
function measureJsonStats(obj: any, raw: string): { keyCount: number; maxDepth: number } {
  let keyCount = 0
  let maxDepth = 0

  function traverse(item: any, currentDepth: number) {
    if (currentDepth > maxDepth) maxDepth = currentDepth

    if (item && typeof item === 'object') {
      if (Array.isArray(item)) {
        for (const element of item) {
          traverse(element, currentDepth + 1)
        }
      } else {
        const keys = Object.keys(item)
        keyCount += keys.length
        for (const k of keys) {
          traverse(item[k], currentDepth + 1)
        }
      }
    }
  }

  traverse(obj, 1)
  return { keyCount, maxDepth }
}

// Extract line and column from Native Error
function parseJsonError(err: Error, raw: string): JsonValidationError {
  const msg = err.message || 'Invalid JSON syntax'
  const lines = raw.split('\n')

  let line = 1
  let column = 1

  // Extract position from standard V8 error message: e.g. "at position 142" or "line 3 column 12"
  const lineColMatch = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i)
  const posMatch = msg.match(/position\s+(\d+)/i)

  if (lineColMatch) {
    line = parseInt(lineColMatch[1], 10)
    column = parseInt(lineColMatch[2], 10)
  } else if (posMatch) {
    const pos = parseInt(posMatch[1], 10)
    let count = 0
    for (let i = 0; i < lines.length; i++) {
      if (count + lines[i].length + 1 >= pos) {
        line = i + 1
        column = pos - count + 1
        break
      }
      count += lines[i].length + 1
    }
  }

  // Suggestion analysis
  let suggestion = 'Check for missing closing braces/brackets, quotes, or trailing commas.'
  let suggestion_ar = 'تحقق من الأقواس غير المغلقة، أو علامات التنصيص، أو الفواصل المفقودة أو الزائدة.'

  if (/trailing comma/i.test(msg) || /Unexpected token \}/i.test(msg) || /Unexpected token \]/i.test(msg)) {
    suggestion = 'Remove the trailing comma before closing bracket or brace.'
    suggestion_ar = 'قم بإزالة الفاصلة الزائدة قبل القوس الختامي.'
  } else if (
    /Expected ',' or '\}'/i.test(msg) ||
    /Expected ',' or '\]'/i.test(msg) ||
    /Expected ','/i.test(msg) ||
    /after property value/i.test(msg)
  ) {
    suggestion = "Missing comma (',') between object properties or array elements. Click 'Auto Fix' to add it automatically."
    suggestion_ar = "فاصلة مفقودة (',') بين خصائص الكائن أو عناصر المصفوفة. اضغط على 'إصلاح تلقائي' لإضافتها وتنسيق الكود فورياً."
  } else if (/Unexpected token/i.test(msg) && /'/.test(raw)) {
    suggestion = 'JSON requires double quotes (") for keys and string values, not single quotes (\').'
    suggestion_ar = 'تتطلب معايير JSON استخدام علامات تنصيص مزدوجة (") بدلاً من المفردة (\').'
  } else if (/Expected double-quoted property name/i.test(msg)) {
    suggestion = 'Object keys must be enclosed in double quotes (").'
    suggestion_ar = 'يجب وضع أسماء المفاتيح داخل علامات تنصيص مزدوجة (").'
  }

  const snippet = lines[line - 1] ? lines[line - 1].trim() : ''

  return {
    line,
    column,
    message: msg,
    snippet,
    suggestion,
    suggestion_ar,
  }
}

export function validateJsonPayload(raw: string): JsonValidationResult {
  const trimmed = raw.trim()
  const linesCount = raw ? raw.split('\n').length : 0
  const fileSizeKB = (new Blob([raw]).size / 1024).toFixed(2)

  if (!trimmed) {
    return {
      isValid: true,
      rootType: 'Unknown',
      warnings: [],
      stats: { lines: 0, chars: 0, keyCount: 0, maxDepth: 0, fileSizeKB: '0.00' },
    }
  }

  const warnings: string[] = []

  // Check for common non-standard features before parse
  if (/\/\//.test(raw) || /\/\*/.test(raw)) {
    warnings.push('JSON contains JavaScript comments (// or /* */) which are non-standard in pure JSON.')
  }
  if (/,\s*[\}\]]/.test(raw)) {
    warnings.push('Trailing comma detected before closing brace or bracket.')
  }
  if (/:\s*'[^']*'/.test(raw) || /'\s*:\s*/.test(raw)) {
    warnings.push('Single quotes used instead of required double quotes.')
  }

  try {
    const parsed = JSON.parse(raw)
    let rootType: 'Object' | 'Array' | 'Primitive' = 'Primitive'
    if (parsed && typeof parsed === 'object') {
      rootType = Array.isArray(parsed) ? 'Array' : 'Object'
    }

    const { keyCount, maxDepth } = measureJsonStats(parsed, raw)

    return {
      isValid: true,
      rootType,
      warnings,
      stats: {
        lines: linesCount,
        chars: raw.length,
        keyCount,
        maxDepth,
        fileSizeKB,
      },
    }
  } catch (err: any) {
    const errorDetails = parseJsonError(err, raw)

    return {
      isValid: false,
      rootType: 'Unknown',
      error: errorDetails,
      warnings,
      stats: {
        lines: linesCount,
        chars: raw.length,
        keyCount: 0,
        maxDepth: 0,
        fileSizeKB,
      },
    }
  }
}

export function JsonValidatorTool() {
  const { t, language } = useLanguage()
  const isAr = language === 'ar'

  const [jsonInput, setJsonInput] = useState<string>(SAMPLE_PAYLOADS[0].json)
  const [copied, setCopied] = useState<boolean>(false)
  const [history, setHistory] = useState<JsonValidatorHistoryItem[]>([])
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor')

  // Load history from localStorage
  useEffect(() => {
    const stored = getToolHistoryFromActivities('json-validator')
    if (stored && stored.length > 0) {
      const parsed: JsonValidatorHistoryItem[] = stored.map((item) => {
        const meta = (typeof item.metadata === 'object' && item.metadata !== null ? item.metadata : {}) as Record<string, any>
        return {
          id: item.id,
          title: item.actionTitle || 'JSON Validation',
          input: item.inputSnippet || meta?.input || '',
          isValid: meta?.isValid ?? true,
          rootType: meta?.rootType || 'Unknown',
          errorLine: meta?.errorLine,
          timestamp: new Date(item.createdAt).getTime(),
        }
      })
      setHistory(parsed)
    }
  }, [])

  // Register AI tool input getter
  useEffect(() => {
    registerToolInputGetter('json-validator', () => jsonInput)
  }, [jsonInput])

  // Memoized Validation Result
  const validationResult = useMemo(() => {
    return validateJsonPayload(jsonInput)
  }, [jsonInput])

  // Log activity on validation
  const handleValidate = useCallback(() => {
    if (!jsonInput.trim()) return
    markToolUsed('json-validator')
    incrementToolUsage()

    const res = validateJsonPayload(jsonInput)
    const newHistItem: JsonValidatorHistoryItem = {
      id: Date.now().toString(),
      title: `${res.rootType} Payload (${res.isValid ? 'Valid' : 'Syntax Error'})`,
      input: jsonInput,
      isValid: res.isValid,
      rootType: res.rootType,
      errorLine: res.error?.line,
      timestamp: Date.now(),
    }

    logToolActivity({
      toolId: 'json-validator',
      toolName: 'JSON Validator',
      category: 'database',
      actionTitle: `${res.rootType} Payload (${res.isValid ? 'Valid' : 'Syntax Error'})`,
      details: `${res.rootType} JSON validation (${res.isValid ? 'Valid' : 'Invalid'})`,
      inputSnippet: jsonInput.slice(0, 300),
      metadata: {
        input: jsonInput,
        isValid: res.isValid,
        rootType: res.rootType,
        errorLine: res.error?.line,
      },
    })

    setHistory((prev) => [newHistItem, ...prev.filter((h) => h.input !== jsonInput).slice(0, 19)])
  }, [jsonInput])

  // Copy to clipboard
  const handleCopy = () => {
    if (!jsonInput.trim()) return
    navigator.clipboard.writeText(jsonInput)
    setCopied(true)
    toast.success(isAr ? 'تم نسخ كود JSON' : 'JSON payload copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  // Auto-Fix JSON Algorithm (Missing commas, trailing commas, unquoted keys, single quotes, unclosed brackets, comments)
  const handleAutoFix = () => {
    if (!jsonInput.trim()) return

    try {
      // 1. Primary: jsonrepair handles missing commas, brackets, quotes, trailing commas, comments
      const repaired = jsonrepair(jsonInput)
      const parsed = JSON.parse(repaired)
      const formatted = JSON.stringify(parsed, null, 2)
      setJsonInput(formatted)
      toast.success(
        isAr
          ? 'تم إصلاح أخطاء الصياغة وإضافة الفواصل المفقودة وتنسيق JSON بنجاح!'
          : 'Auto-fixed syntax, missing commas & formatted JSON successfully!'
      )
    } catch {
      // 2. Pre-processing heuristic + jsonrepair fallback
      let fixed = jsonInput

      // Remove JS Comments
      fixed = fixed.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1')

      // Fix missing commas between closing brace/bracket/quote/value and next key/element
      // e.g. } \n "key": or true \n "key":
      fixed = fixed.replace(/(\}|\]|"|true|false|null|\d+)(\s*)(\r?\n\s*)(["{\[])/g, '$1,$2$3$4')

      // Remove trailing commas before } or ]
      fixed = fixed.replace(/,(\s*[\}\]])/g, '$1')

      // Convert single quoted keys and values to double quotes
      fixed = fixed.replace(/(')([^'\\]*(\\.[^'\\]*)*)(')(\s*:)/g, '"$2"$5')
      fixed = fixed.replace(/(:\s*)(')([^'\\]*(\\.[^'\\]*)*)(')/g, '$1"$3"')

      // Quote unquoted alphanumeric property keys: key: -> "key":
      fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_$]+)(\s*:)/g, '$1"$2"$3')

      try {
        const repaired = jsonrepair(fixed)
        const parsed = JSON.parse(repaired)
        setJsonInput(JSON.stringify(parsed, null, 2))
        toast.success(
          isAr
            ? 'تم إصلاح أخطاء الصياغة وإضافة الفواصل المفقودة بنجاح!'
            : 'Auto-fixed syntax errors & missing commas successfully!'
        )
      } catch {
        try {
          const parsed = JSON.parse(fixed)
          setJsonInput(JSON.stringify(parsed, null, 2))
          toast.success(
            isAr
              ? 'تم إصلاح أخطاء الصياغة وتنسيق JSON بنجاح!'
              : 'Auto-fixed syntax errors & formatted JSON successfully!'
          )
        } catch {
          setJsonInput(fixed)
          toast.info(
            isAr
              ? 'تم تطبيق بعض الإصلاحات، يرجى مراجعة هيكل البيانات'
              : 'Applied partial fixes, please review payload structure'
          )
        }
      }
    }

    handleValidate()
  }

  // Download JSON File
  const handleDownload = () => {
    if (!jsonInput.trim()) return
    const blob = new Blob([jsonInput], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `validated-payload.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(isAr ? 'تم تحميل ملف JSON' : 'Downloaded JSON file')
  }

  // Clear Input
  const handleClear = () => {
    setJsonInput('')
    toast.info(isAr ? 'تم تفريغ المحرر' : 'Cleared editor')
  }

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        setJsonInput(content)
        toast.success(isAr ? 'تم تحميل ملف JSON بنجاح' : 'Loaded JSON file')
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
              <ShieldCheck className="h-3.5 w-3.5" />
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

          <Link href="/tools/json-formatter">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs font-semibold">
              <FileCode className="h-3.5 w-3.5 text-primary" />
              {isAr ? 'منسق ومجمل JSON' : 'JSON Formatter'}
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Button>
          </Link>
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
                  {isAr ? 'لا يوجد سجلات تدقيق سابقة' : 'No validation history records yet.'}
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
                            <CheckCircle2 className="h-3 w-3" /> Valid {item.rootType}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                            <XCircle className="h-3 w-3" /> Syntax Error {item.errorLine ? `(Line ${item.errorLine})` : ''}
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
                          setJsonInput(item.input)
                          setActiveTab('editor')
                        }}
                        className="h-8 rounded-lg text-xs gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {isAr ? 'استعادة' : 'Load Payload'}
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
            {/* Left Column: Input Textarea */}
            <div className="lg:col-span-7 space-y-4">
              {/* Sample Payloads */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground mr-1">
                  {isAr ? 'نماذج جاهزة:' : 'Samples:'}
                </span>
                {SAMPLE_PAYLOADS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setJsonInput(sample.json)
                      toast.info(isAr ? `تم تحميل: ${sample.label_ar}` : `Loaded: ${sample.label}`)
                    }}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-border/60 bg-muted/30 hover:bg-primary/10 hover:border-primary/30 transition-all text-foreground"
                  >
                    {isAr ? sample.label_ar : sample.label}
                  </button>
                ))}
              </div>

              {/* Code Container */}
              <div className="relative rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                <div className="flex items-center justify-between px-3.5 py-2 bg-muted/40 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      {isAr ? 'مدخلات JSON للتدقيق' : 'JSON Payload Input'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".json,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border border-border/60 hover:bg-secondary text-muted-foreground transition-all">
                        <Upload className="h-3 w-3" />
                        {isAr ? 'رفع ملف' : 'Upload .json'}
                      </span>
                    </label>

                    {jsonInput && (
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
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={
                    isAr
                      ? 'الصق كود JSON هنا لفحص الصحة واكتشاف أخطاء الأقواس والاقتباسات والفواصل...'
                      : 'Paste your JSON payload here to validate syntax, brackets, single quotes, and trailing commas...'
                  }
                  rows={14}
                  className="w-full bg-transparent p-4 font-mono text-xs sm:text-sm text-foreground focus:outline-none resize-y min-h-[320px] leading-relaxed"
                  spellCheck={false}
                />

                {/* Bottom Bar */}
                <div className="flex flex-wrap items-center justify-between p-3 bg-muted/20 border-t border-border/60 gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleAutoFix}
                      variant="secondary"
                      size="sm"
                      disabled={!jsonInput.trim()}
                      className="rounded-xl text-xs gap-1.5 font-bold hover:bg-primary/10 hover:text-primary transition-all shadow-xs"
                      title={isAr ? 'إصلاح الفواصل المفقودة والزائدة والأقواس والاقتباسات تلقائياً' : 'Auto-fix missing commas, trailing commas, brackets & quotes'}
                    >
                      <Wand2 className="h-3.5 w-3.5 text-primary" />
                      {isAr ? 'إصلاح تلقائي' : 'Auto Fix'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      size="sm"
                      disabled={!jsonInput.trim()}
                      className="rounded-xl text-xs gap-1"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ' : 'Copy'}
                    </Button>

                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      size="sm"
                      disabled={!jsonInput.trim()}
                      className="rounded-xl text-xs gap-1"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {isAr ? 'تنزيل' : 'Download'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Audit Status Report */}
            <div className="lg:col-span-5 space-y-4">
              {/* Validation Status Banner */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  !jsonInput.trim()
                    ? 'border-border/60 bg-card'
                    : validationResult.isValid
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-destructive/30 bg-destructive/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  {!jsonInput.trim() ? (
                    <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  ) : validationResult.isValid ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-foreground">
                        {!jsonInput.trim()
                          ? isAr
                            ? 'جاهز للفحص'
                            : 'Ready to Validate'
                          : validationResult.isValid
                          ? isAr
                            ? 'كود JSON صحيح ومطابق للمواصفات'
                            : 'Valid JSON Payload'
                          : isAr
                          ? 'خطأ في صياغة JSON'
                          : 'Syntax Error Detected'}
                      </h4>

                      {jsonInput.trim() && validationResult.isValid && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {validationResult.rootType}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {!jsonInput.trim()
                        ? isAr
                          ? 'أدخل بيانات JSON الخاصة بك لمراجعتها والتحقق من سلامة الهيكل.'
                          : 'Enter a JSON string to audit formatting, quotes, and structure.'
                        : validationResult.isValid
                        ? isAr
                          ? 'يمكن تحليل الحجم وقراءة الشجرة بأمان ودون أخطاء.'
                          : 'Successfully parsed structure with standard JSON engines.'
                        : isAr
                        ? `تم العثور على خطأ صياغة يمنع تحليل البيانات.`
                        : `Syntax error prevents payload parsing.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Details Card */}
              {validationResult.error && (
                <div className="p-4 rounded-2xl border border-destructive/30 bg-destructive/10 space-y-3">
                  <div className="flex items-center justify-between border-b border-destructive/20 pb-2">
                    <h5 className="text-xs font-bold text-destructive flex items-center gap-1.5 uppercase tracking-wider">
                      <XCircle className="h-4 w-4" />
                      {isAr ? 'موقع الخطأ بدقة:' : 'Error Location:'}
                    </h5>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-destructive bg-destructive/20 px-2 py-0.5 rounded-md">
                        Line {validationResult.error.line}, Col {validationResult.error.column || 1}
                      </span>
                      <Button
                        onClick={handleAutoFix}
                        size="sm"
                        variant="outline"
                        className="h-6 text-[11px] font-bold gap-1 rounded-lg border-destructive/40 hover:bg-destructive/10 text-destructive hover:text-destructive transition-colors cursor-pointer"
                      >
                        <Wand2 className="h-3 w-3" />
                        {isAr ? 'إصلاح تلقائي' : 'Auto Fix'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">
                      {validationResult.error.message}
                    </p>
                    {validationResult.error.snippet && (
                      <pre className="text-xs font-mono bg-background/80 p-2 rounded-lg border border-destructive/20 overflow-x-auto text-destructive">
                        {validationResult.error.snippet}
                      </pre>
                    )}
                  </div>

                  {(validationResult.error.suggestion || validationResult.error.suggestion_ar) && (
                    <div className="pt-2 border-t border-destructive/20 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        💡 <span className="font-semibold text-foreground">{isAr ? 'نصيحة للإصلاح:' : 'Suggestion:'}</span>{' '}
                        {isAr
                          ? validationResult.error.suggestion_ar || validationResult.error.suggestion
                          : validationResult.error.suggestion}
                      </div>
                      <Button
                        onClick={handleAutoFix}
                        size="sm"
                        variant="outline"
                        className="h-6 text-[11px] font-bold gap-1 rounded-lg border-destructive/40 hover:bg-destructive/10 text-destructive hover:text-destructive transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
                      >
                        <Wand2 className="h-3 w-3" />
                        {isAr ? 'إصلاح تلقائي' : 'Auto Fix'}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Warnings List */}
              {validationResult.warnings.length > 0 && (
                <div className="space-y-2">
                  {validationResult.warnings.map((warn, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-medium text-amber-700 dark:text-amber-400 flex items-start gap-2"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{warn}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Structural Stats Matrix */}
              {jsonInput.trim() && (
                <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-3">
                  <h5 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    {isAr ? 'مصفوفة إحصائيات الحمولة' : 'Payload Matrix Stats'}
                  </h5>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block">
                        {isAr ? 'إجمالي الأسطر:' : 'Total Lines:'}
                      </span>
                      <span className="font-extrabold text-foreground text-sm">
                        {validationResult.stats.lines}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                      <span className="text-[10px] text-muted-foreground block">
                        {isAr ? 'حجم البيانات:' : 'Payload Size:'}
                      </span>
                      <span className="font-extrabold text-foreground text-sm">
                        {validationResult.stats.fileSizeKB} KB
                      </span>
                    </div>

                    {validationResult.isValid && (
                      <>
                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                          <span className="text-[10px] text-muted-foreground block">
                            {isAr ? 'عدد المفاتيح:' : 'Object Keys:'}
                          </span>
                          <span className="font-extrabold text-primary text-sm">
                            {validationResult.stats.keyCount}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/40">
                          <span className="text-[10px] text-muted-foreground block">
                            {isAr ? 'عمق التداخل:' : 'Nest Depth:'}
                          </span>
                          <span className="font-extrabold text-primary text-sm">
                            {validationResult.stats.maxDepth}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {validationResult.isValid && (
                    <div className="pt-2">
                      <Link href="/tools/json-formatter">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full rounded-xl text-xs font-bold gap-1.5 hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          <FileCode className="h-3.5 w-3.5 text-primary" />
                          {isAr ? 'تنسيق وعرض الكود بالشجرة (Tree View)' : 'Format & View in Tree Mode'}
                        </Button>
                      </Link>
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

export default JsonValidatorTool
