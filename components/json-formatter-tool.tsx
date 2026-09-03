'use client'

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import {
  FileCode,
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
  Wand2,
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
import { autoRepairJson, diagnoseJsonIssue } from '@/lib/json-repair-helper'

interface JsonStats {
  lines: number
  characters: number
  keyCount: number
  maxDepth: number
  fileSizeKB: string
}

export interface JsonHistoryItem {
  id: string
  title: string
  input: string
  output: string
  indentSpaces: number
  type: 'format' | 'minify'
  timestamp: number
  stats: JsonStats
}

const toolMeta: ToolMetadata = {
  id: 'json-formatter',
  name: 'JSON Formatter & Validator',
  name_ar: 'منسق ومتحقق بيانات JSON',
  description:
    'Format, validate, parse, and minify JSON data instantly with syntax error highlighting and structural statistics.',
  description_ar:
    'قم بتنسيق والتحقق من وتحليل وضغط بيانات JSON فوراً مع تمييز أخطاء بناء الجسمل وإحصائيات الهيكل.',
  category: {
    id: 'database',
    name: 'Database Tools',
    slug: 'database',
  },
  icon: FileCode,
  privacyBadge: '100% Client-Side • Tree Depth & Key Stats',
  privacyBadge_ar: 'معالجة محلية 100% • إحصائيات المفاتيح وعمق الهيكل',
  features: [
    {
      icon: Sparkles,
      title: 'Structural Validation',
      desc: 'Pinpoints syntax errors, unclosed brackets, and illegal trailing commas.',
    },
    {
      icon: Layers,
      title: 'Deep Matrix Stats',
      desc: 'Measures total keys, maximum nest depth, lines, and payload size.',
    },
    {
      icon: ShieldCheck,
      title: 'Client-Side Privacy',
      desc: 'All JSON parsing runs strictly inside your local browser memory.',
    },
    {
      icon: Minimize2,
      title: 'Instant Minification',
      desc: 'Strip unnecessary whitespaces for compact API network payloads.',
    },
  ],
  features_ar: [
    {
      icon: Sparkles,
      title: 'التحقق من الهيكل والبناء',
      desc: 'يحدد بدقة أخطاء بناء الجملة، الأقواس غير المغلقة، والفواصل الزائدة غير القانونية.',
    },
    {
      icon: Layers,
      title: 'إحصائيات مصفوفة عميقة',
      desc: 'يقيس إجمالي المفاتيح، أقصى عمق للتداخل، الأسطر، وحجم الحمولة.',
    },
    {
      icon: ShieldCheck,
      title: 'خصوصية المتصفح المحلي',
      desc: 'جميع عمليات تحليل JSON تعمل حصرياً داخل ذاكرة متصفحك المحلي.',
    },
    {
      icon: Minimize2,
      title: 'ضغط فوري للبيانات',
      desc: 'إزالة المسافات والأسطر غير الضرورية لإنتاج حمولة شبكية مضغوطة لواجهات البرمجة.',
    },
  ],
  faqs: [
    {
      q: 'Why is my JSON showing an invalid syntax error?',
      a: 'Common reasons include trailing commas in arrays/objects, unquoted keys, single quotes instead of double quotes, or missing closing brackets/braces.',
    },
    {
      q: 'Can I format large JSON files?',
      a: 'Yes. The tool processes JSON directly using native browser V8 JSON engines, easily handling megabyte-scale files smoothly without uploading to a server.',
    },
    {
      q: 'How does the Minify function work?',
      a: 'Minify parses the structured data and outputs a condensed one-line string with all indentation, linebreaks, and spacing removed.',
    },
  ],
  faqs_ar: [
    {
      q: 'لماذا تظهر بيانات JSON الخاصة بي خطأ في البناء؟',
      a: 'الأسباب الشائعة تشمل الفواصل الزائدة في المصفوفات/الكائنات، المفاتيح غير المحاطة بعلامات تنصيص، استخدام علامات التنصيص المفردة بدلاً من المزدوجة، أو الأقواس الناقصة.',
    },
    {
      q: 'هل يمكنني تنسيق ملفات JSON الكبيرة؟',
      a: 'نعم. تعتمد الأداة على محرك متصفحك المحلي للتعامل مع ملفات بحجم ميجابايت بسلاسة ودون أي رفع للخادم.',
    },
    {
      q: 'كيف تعمل وظيفة ضغط البيانات (Minify)؟',
      a: 'تقوم وظيفة الضغط بتحليل البيانات الهيكلية وإخراج نص مكثف في سطر واحد مع إزالة كافة المسافات والمسافات البادئة.',
    },
  ],
}

export default function JsonFormatterTool() {
  const { language } = useLanguage()
  const isArabic = language === 'ar'

  const [inputJson, setInputJson] = useState('')
  const [outputJson, setOutputJson] = useState('')
  const [indentSpaces, setIndentSpaces] = useState<number>(2)
  const [isCopied, setIsCopied] = useState(false)
  const [syntaxWarning, setSyntaxWarning] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Register current input with privacy-first AI Assistant bus
  useEffect(() => {
    return registerToolInputGetter('json-formatter', () => inputJson)
  }, [inputJson])

  // History State
  const [history, setHistory] = useState<JsonHistoryItem[]>([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null)

  // Sync JSON history with local storage & central activity history
  const syncJsonHistoryState = useCallback(() => {
    try {
      let localJson: JsonHistoryItem[] = []
      const saved = localStorage.getItem('digitalmix_json_history')
      if (saved) {
        localJson = JSON.parse(saved)
      }

      const activityItems = getToolHistoryFromActivities('json-formatter')
      const convertedFromActivities: JsonHistoryItem[] = activityItems
        .map((act) => {
          const meta = act.metadata as any
          return {
            id: act.id,
            title: act.actionTitle || 'JSON Data',
            input: act.inputSnippet || '',
            output: act.outputSnippet || '',
            indentSpaces: meta?.indentSpaces || 2,
            type: (meta?.type || 'format') as 'format' | 'minify',
            timestamp: new Date(act.createdAt).getTime(),
            stats: {
              lines: meta?.lines || 1,
              characters: meta?.characters || 0,
              keyCount: meta?.keyCount || 0,
              maxDepth: meta?.maxDepth || 1,
              fileSizeKB: meta?.fileSizeKB || '0.00',
            },
          } as JsonHistoryItem
        })
        .filter((item) => item.input || item.output)

      const map = new Map<string, JsonHistoryItem>()
      convertedFromActivities.forEach((item) => map.set(item.id, item))
      localJson.forEach((item) => {
        if (!map.has(item.id)) {
          const exists = Array.from(map.values()).some((existing) => existing.output === item.output)
          if (!exists) map.set(item.id, item)
        }
      })

      const merged = Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp)
      setHistory(merged)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    syncJsonHistoryState()

    const handleUpdate = () => {
      syncJsonHistoryState()
    }

    window.addEventListener('digitalmix_history_updated', handleUpdate)
    return () => {
      window.removeEventListener('digitalmix_history_updated', handleUpdate)
    }
  }, [syncJsonHistoryState])

  const calculateJsonStats = (jsonStr: string): JsonStats => {
    const lines = jsonStr ? jsonStr.split('\n').length : 0
    const characters = jsonStr.length
    const fileSizeKB = (characters / 1024).toFixed(2)

    let keyCount = 0
    let maxDepth = 0

    try {
      const parsed = JSON.parse(jsonStr)

      const analyzeObj = (obj: unknown, currentDepth: number) => {
        if (typeof obj !== 'object' || obj === null) return
        maxDepth = Math.max(maxDepth, currentDepth)
        const record = obj as Record<string, unknown>
        for (const key in record) {
          if (Object.prototype.hasOwnProperty.call(record, key)) {
            keyCount++
            analyzeObj(record[key], currentDepth + 1)
          }
        }
      }

      analyzeObj(parsed, 1)
    } catch {
      // ignore parsing error during stats calculation
    }

    return { lines, characters, keyCount, maxDepth, fileSizeKB }
  }

  // Save item to history
  const saveToHistory = useCallback(
    (input: string, output: string, spaces: number, type: 'format' | 'minify') => {
      if (!input.trim() || !output.trim()) return

      const cleanPreview = input
        .trim()
        .replace(/\n+/g, ' ')
        .slice(0, 50)
      const title = cleanPreview || (type === 'format' ? 'Formatted JSON Data' : 'Minified JSON Data')

      const calculatedStats = calculateJsonStats(output)

      setHistory((prev) => {
        // Avoid immediate duplicate
        if (prev.length > 0 && prev[0].input === input && prev[0].type === type && Date.now() - prev[0].timestamp < 3000) {
          return prev
        }

        const newItem: JsonHistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title,
          input,
          output,
          indentSpaces: spaces,
          type,
          timestamp: Date.now(),
          stats: calculatedStats,
        }

        // De-duplication: if top item already has this exact output & type, skip duplicate
        if (
          prev.length > 0 &&
          prev[0].output === output &&
          prev[0].type === type &&
          prev[0].indentSpaces === spaces
        ) {
          return prev
        }

        const filtered = prev.filter(
          (p) => !(p.output === output && p.type === type && p.indentSpaces === spaces)
        )
        const updated = [newItem, ...filtered.slice(0, 49)]
        try {
          localStorage.setItem('digitalmix_json_history', JSON.stringify(updated))
        } catch {
          // storage quota exceeded
        }

        // Universal dashboard activity logging
        logToolActivity({
          toolId: 'json-formatter',
          toolName: isArabic ? 'منسق ومدقق بيانات JSON' : 'JSON Formatter & Validator',
          category: 'database',
          actionTitle: type === 'format' ? 'Formatted JSON Data' : 'Minified JSON Data',
          details: isArabic
            ? `قام بتنسيق وفحص بيانات JSON (${calculatedStats.keyCount} مفتاح، عمق ${calculatedStats.maxDepth} مستويات، بحجم ${calculatedStats.fileSizeKB} KB)`
            : `Formatted and validated JSON payload (${calculatedStats.keyCount} keys, depth ${calculatedStats.maxDepth}, size ${calculatedStats.fileSizeKB} KB)`,
          inputSnippet: input.slice(0, 500),
          outputSnippet: output.slice(0, 500),
          metadata: {
            indentSpaces: spaces,
            type,
            lines: calculatedStats.lines,
            characters: calculatedStats.characters,
            keyCount: calculatedStats.keyCount,
            maxDepth: calculatedStats.maxDepth,
            fileSizeKB: calculatedStats.fileSizeKB,
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
      localStorage.removeItem('digitalmix_json_history')
    } catch {
      // ignore
    }
    toast.success(isArabic ? 'تم مسح سجل JSON بالكامل' : 'JSON history cleared successfully')
  }

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteActivityItem(id)
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id)
      try {
        localStorage.setItem('digitalmix_json_history', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
    toast.success(isArabic ? 'تم حذف العنصر من السجل' : 'Item removed from history')
  }

  const restoreHistoryItem = (item: JsonHistoryItem) => {
    setInputJson(item.input)
    setOutputJson(item.output)
    setIndentSpaces(item.indentSpaces || 2)
    setSyntaxWarning('')
    setShowHistoryModal(false)
    toast.success(
      isArabic
        ? `تم استعادة بيانات JSON (${item.type === 'format' ? 'منسقة' : 'مضغوطة'})`
        : `Restored JSON into editor (${item.type === 'format' ? 'Formatted' : 'Minified'})`
    )
  }

  const copyHistoryJson = async (jsonStr: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(jsonStr)
    setCopiedHistoryId(id)
    setTimeout(() => setCopiedHistoryId(null), 2000)
    toast.success(isArabic ? 'تم نسخ JSON' : 'JSON copied to clipboard')
  }

  const exportHistoryCSV = () => {
    if (history.length === 0) return
    const headers = ['Timestamp', 'Date', 'Type', 'IndentSpaces', 'Keys', 'MaxDepth', 'SizeKB', 'Title', 'Input JSON', 'Output JSON']
    const rows = history.map((item) => [
      item.timestamp,
      `"${new Date(item.timestamp).toISOString()}"`,
      `"${item.type}"`,
      item.indentSpaces,
      item.stats.keyCount,
      item.stats.maxDepth,
      `"${item.stats.fileSizeKB}"`,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.input.replace(/"/g, '""')}"`,
      `"${item.output.replace(/"/g, '""')}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `json_history_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(isArabic ? 'تم تصدير سجل JSON كملف CSV' : 'JSON history exported as CSV')
  }

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return history
    const q = historySearch.toLowerCase()
    return history.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.input.toLowerCase().includes(q) ||
        item.output.toLowerCase().includes(q)
    )
  }, [history, historySearch])

  const recordUsage = async () => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed('json-formatter'),
      ])
    } catch {
      // Non-blocking telemetry
    }
  }

  const handleFormat = () => {
    if (!inputJson.trim()) return
    try {
      const parsed = JSON.parse(inputJson.trim())
      const formatted = JSON.stringify(parsed, null, indentSpaces)
      setOutputJson(formatted)
      setSyntaxWarning('')
      saveToHistory(inputJson, formatted, indentSpaces, 'format')
      recordUsage()
      toast.success(isArabic ? 'تم تنسيق وتجميل JSON بنجاح' : 'JSON formatted successfully')
    } catch (err: unknown) {
      // Check if auto-repair can resolve it or diagnose
      const diagnosis = diagnoseJsonIssue(err instanceof Error ? err : new Error(String(err)), inputJson)
      setOutputJson('')
      setSyntaxWarning(
        `${isArabic ? 'خطأ صياغة JSON:' : 'Invalid JSON Syntax:'} ${diagnosis.message}. ${isArabic ? diagnosis.suggestion_ar : diagnosis.suggestion}`
      )
    }
  }

  const handleAutoFix = () => {
    if (!inputJson.trim()) return
    const repairResult = autoRepairJson(inputJson, indentSpaces)
    if (repairResult.success) {
      setInputJson(repairResult.output)
      setOutputJson(repairResult.output)
      setSyntaxWarning('')
      saveToHistory(inputJson, repairResult.output, indentSpaces, 'format')
      recordUsage()
      toast.success(
        isArabic
          ? 'تم إصلاح أخطاء الصياغة بنجاح!'
          : 'Auto-fixed syntax issues successfully!'
      )
    } else {
      if (repairResult.output && repairResult.output !== inputJson) {
        setInputJson(repairResult.output)
      }
      toast.info(
        isArabic
          ? 'تم تطبيق بعض الإصلاحات الجزئية، يرجى مراجعة هيكل البيانات'
          : 'Applied partial fixes, please review payload structure'
      )
    }
  }

  const handleMinify = () => {
    if (!inputJson.trim()) return
    try {
      const parsed = JSON.parse(inputJson.trim())
      const minified = JSON.stringify(parsed)
      setOutputJson(minified)
      setSyntaxWarning('')
      saveToHistory(inputJson, minified, indentSpaces, 'minify')
      recordUsage()
      toast.success(isArabic ? 'تم ضغط وتصغير JSON' : 'JSON minified successfully')
    } catch (err: unknown) {
      const diagnosis = diagnoseJsonIssue(err instanceof Error ? err : new Error(String(err)), inputJson)
      setOutputJson('')
      setSyntaxWarning(
        `${isArabic ? 'خطأ صياغة JSON:' : 'Invalid JSON Syntax:'} ${diagnosis.message}. ${isArabic ? diagnosis.suggestion_ar : diagnosis.suggestion}`
      )
    }
  }

  const handleClear = () => {
    setInputJson('')
    setOutputJson('')
    setSyntaxWarning('')
  }

  const handleCopy = async () => {
    if (!outputJson) return
    await navigator.clipboard.writeText(outputJson)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast.success(isArabic ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard')
  }

  const handleDownload = () => {
    if (!outputJson) return
    const blob = new Blob([outputJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(isArabic ? 'تم تحميل ملف JSON' : 'JSON file downloaded')
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setInputJson(text)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const stats = useMemo(() => calculateJsonStats(outputJson || inputJson), [outputJson, inputJson])

  return (
    <ToolLayout metadata={toolMeta} maxWidth="7xl">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-xl shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground">{isArabic ? 'المسافة:' : 'Indent:'}</span>
            <select
              value={indentSpaces}
              onChange={(e) => setIndentSpaces(Number(e.target.value))}
              className="bg-transparent font-mono text-xs font-bold text-foreground focus:outline-none cursor-pointer"
            >
              <option value={2} className="bg-background text-foreground">{isArabic ? 'مسافتان (2)' : '2 Spaces'}</option>
              <option value={4} className="bg-background text-foreground">{isArabic ? '4 مسافات (4)' : '4 Spaces'}</option>
            </select>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept=".json,.txt"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 px-3.5 gap-2 text-xs font-semibold"
          >
            <Upload className="h-4 w-4" />
            {isArabic ? 'رفع .json' : 'Upload .json'}
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
          disabled={!inputJson && !outputJson}
          className="h-10 px-3.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
        >
          <Trash2 className="h-4 w-4" />
          {isArabic ? 'مسح الكل' : 'Clear'}
        </Button>
      </div>

      {/* Syntax Warning Banner */}
      {syntaxWarning && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex flex-wrap items-center justify-between gap-3 animate-in fade-in-0 duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="text-xs sm:text-sm font-mono font-medium break-all">{syntaxWarning}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="default"
              onClick={handleAutoFix}
              className="rounded-xl text-xs gap-1.5 font-bold shadow-xs"
            >
              <Wand2 className="h-3.5 w-3.5" />
              {isArabic ? 'إصلاح تلقائي' : 'Auto Fix'}
            </Button>
            <Link href="/tools/json-validator">
              <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5 font-bold border-destructive/30 hover:bg-destructive/10">
                <ShieldCheck className="h-3.5 w-3.5 text-destructive" />
                {isArabic ? 'افحص الكود بـ مدقق JSON' : 'Debug with JSON Validator'}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Textareas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Input Textarea */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              {isArabic ? 'بيانات JSON المدخلة' : 'Input JSON Payload'}
            </label>
            <button
              type="button"
              onClick={() =>
                setInputJson(
                  JSON.stringify(
                    {
                      project: "DigitalMix",
                      version: "2026.1",
                      description: "Enterprise Developer Ecosystem",
                      features: ["100% Client-Side", "Multi-Dialect SQL", "JSON Validator"],
                      stats: { users: 15400, uptime: 99.98, active: true },
                    },
                    null,
                    0
                  )
                )
              }
              className="text-xs text-primary hover:underline font-medium cursor-pointer"
            >
              {isArabic ? 'تحميل مثال جاهز' : 'Load Example'}
            </button>
          </div>
          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder={
              isArabic
                ? `الصق نص JSON هنا...\n\nمثال:\n{"name": "DigitalMix", "tools": ["sql", "json", "jwt"]}`
                : `Paste your JSON payload string here...\n\nExample:\n{"name": "DigitalMix", "tools": ["sql", "json", "jwt"]}`
            }
            className="w-full h-80 p-4 rounded-2xl border border-border/80 bg-card font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none transition-all placeholder:text-muted-foreground/40 leading-relaxed text-foreground shadow-xs"
          />
        </div>

        {/* Output Textarea */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5 text-primary" />
              {isArabic ? 'نتيجة JSON المنسقة' : 'Formatted JSON Output'}
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!outputJson}
                className="h-8 px-2.5 text-xs gap-1.5 rounded-lg"
              >
                <Download className="h-3.5 w-3.5" />
                {isArabic ? 'تحميل' : 'Download'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                disabled={!outputJson}
                className="h-8 px-3 text-xs gap-1.5 rounded-lg font-semibold"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {isCopied ? (isArabic ? 'تم النسخ' : 'Copied') : isArabic ? 'نسخ' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="w-full h-80 p-4 rounded-2xl border border-border/80 bg-card font-mono text-sm overflow-auto whitespace-pre leading-relaxed text-foreground shadow-xs">
            {outputJson ? (
              <code>{outputJson}</code>
            ) : (
              <span className="text-muted-foreground/40 italic select-none text-xs">
                {isArabic ? 'ستظهر بيانات JSON المنسقة هنا...' : 'Formatted JSON structure will appear here...'}
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
          disabled={!inputJson.trim()}
          className="h-12 px-8 rounded-xl font-bold shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all"
        >
          <Sparkles className="h-4.5 w-4.5" />
          {isArabic ? 'تنسيق وتجميل JSON' : 'Beautify / Format JSON'}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={handleMinify}
          disabled={!inputJson.trim()}
          className="h-12 px-8 rounded-xl font-bold hover:bg-secondary transition-all"
        >
          <Minimize2 className="h-4.5 w-4.5" />
          {isArabic ? 'ضغط وتصغير JSON' : 'Minify JSON'}
        </Button>
      </div>

      {/* JSON Diagnostics Statistics */}
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
          <div className="text-2xl font-extrabold text-emerald-500">{stats.keyCount}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">
            {isArabic ? 'مفاتيح الكائنات' : 'Total Object Keys'}
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs">
          <div className="text-2xl font-extrabold text-amber-500">{stats.maxDepth}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">
            {isArabic ? 'أقصى عمق للشجرة' : 'Max Tree Depth'}
          </div>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs col-span-2 sm:col-span-1">
          <div className="text-2xl font-extrabold text-blue-500">{stats.fileSizeKB} KB</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">
            {isArabic ? 'الحجم المقدر' : 'Estimated Size'}
          </div>
        </div>
      </div>

      {/* JSON HISTORY MODAL */}
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
                    {isArabic ? 'سجل بيانات JSON' : 'JSON History'}
                    <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {history.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {isArabic
                      ? 'البيانات المنسقة والمضغوطة السابقة المحفوظة محلياً'
                      : 'Previously formatted & validated payloads stored in your browser'}
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
                  placeholder={isArabic ? 'بحث في السجل بنص JSON...' : 'Search history by JSON text or properties...'}
                  className="w-full h-9 pl-9 pr-4 rtl:pl-4 rtl:pr-9 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {history.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground space-y-2">
                  <FileCode className="w-10 h-10 mx-auto opacity-40 text-primary" />
                  <p className="text-sm font-semibold">
                    {isArabic ? 'لا توجد بيانات JSON محفوظة بعد' : 'No JSON entries saved in history yet'}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {isArabic
                      ? 'عند تنسيق أو ضغط أي كود JSON، سيتم حفظه هنا تلقائياً لسهولة الرجوع إليه وتصديره.'
                      : 'When you format or minify any JSON payload, it will automatically appear here.'}
                  </p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  {isArabic ? 'لم يتم العثور على نتائج مطابقة للبحث' : 'No matching JSON records found.'}
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
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            item.type === 'minify'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}
                        >
                          {item.type === 'minify' ? 'Minified' : `Formatted (${item.indentSpaces || 2}sp)`}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(item.timestamp).toLocaleTimeString()} • {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({item.stats?.keyCount || 0} {isArabic ? 'مفاتيح' : 'keys'}, {item.stats?.fileSizeKB || '0'} KB)
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
                        onClick={(e) => copyHistoryJson(item.output || item.input, item.id, e)}
                        className="h-8 px-2.5 rounded-lg text-xs gap-1"
                        title={isArabic ? 'نسخ JSON' : 'Copy JSON'}
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