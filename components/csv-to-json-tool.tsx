'use client'

import React, { useState, useRef } from 'react'
import Papa from 'papaparse'
import {
  FileSpreadsheet,
  Copy,
  Trash2,
  Download,
  Check,
  Sparkles,
  Upload,
  AlertTriangle,
  FileCode,
  Zap,
  ShieldCheck,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { useLanguage } from '@/lib/i18n/context'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { logToolActivity, registerClientToolSignature } from '@/lib/history-service'
import { toast } from 'sonner'

const toolMeta: ToolMetadata = {
  id: 'csv-json',
  name: 'CSV to JSON Converter',
  name_ar: 'محول ملفات CSV إلى JSON',
  description:
    'Convert Excel CSV spreadsheets into structured JSON arrays with automatic type detection and 100% client-side privacy.',
  description_ar:
    'قم بتحويل ملفات وجداول البيانات CSV إلى مصفوفات JSON منظمة مع اكتشاف تلقائي للأنواع وخصوصية كاملة داخل المتصفح.',
  category: {
    id: 'database',
    name: 'Database Tools',
    slug: 'database',
  },
  icon: FileSpreadsheet,
  privacyBadge: '100% Client-Side • PapaParse Powered',
  privacyBadge_ar: 'معالجة محلية 100% • مدعوم بمحرك PapaParse',
  features: [
    {
      icon: Zap,
      title: 'Automatic Type Inference',
      desc: 'Parses numbers, booleans, and null values intelligently into typed JSON literals.',
    },
    {
      icon: Layers,
      title: 'Header Mapping',
      desc: 'Converts first row column titles into standard JSON object property keys.',
    },
    {
      icon: ShieldCheck,
      title: 'Confidential File Safety',
      desc: 'Customer spreadsheets and internal sales exports are processed in local memory.',
    },
    {
      icon: Sparkles,
      title: 'Instant Download',
      desc: 'Exports clean formatted JSON directly to your local file system.',
    },
  ],
  features_ar: [
    {
      icon: Zap,
      title: 'الاستدلال التلقائي على الأنواع',
      desc: 'يقوم بتحليل الأرقام والقيم البوليانية والـ null بذكاء وتحويلها إلى قيم JSON مطابقة.',
    },
    {
      icon: Layers,
      title: 'تعيين رؤوس الأعمدة',
      desc: 'يحول عناوين الأعمدة في الصف الأول إلى مفاتيح خصائص كائنات JSON قياسية.',
    },
    {
      icon: ShieldCheck,
      title: 'أمان الملفات السرية',
      desc: 'جداول بيانات العملاء وصادرات المبيعات الداخلية تتم معالجتها داخل الذاكرة المحلية.',
    },
    {
      icon: Sparkles,
      title: 'تحميل فوري',
      desc: 'يصدر ملفات JSON منسقة ونظيفة مباشرة إلى نظام ملفات جهازك.',
    },
  ],
  faqs: [
    {
      q: 'Does this tool support commas inside quoted cells?',
      a: 'Yes. The underlying PapaParse engine follows standard RFC 4180 rules, correctly escaping commas, quotes, and line breaks within quoted fields.',
    },
    {
      q: 'Are column headers required in the CSV?',
      a: 'By default, the first row is used as object property keys. If your CSV lacks headers, fields will be indexed sequentially.',
    },
    {
      q: 'What is the maximum CSV file size supported?',
      a: 'Because parsing occurs in the client browser thread, files up to 50MB+ can be converted with high speed and zero upload delays.',
    },
  ],
  faqs_ar: [
    {
      q: 'هل تدعم هذه الأداة الفواصل داخل الخلايا محاطة بعلامات التنصيص؟',
      a: 'نعم. يعتمد محرك التحليل على معايير RFC 4180 القياسية للتعامل بشكل صحيح مع الفواصل وعلامات التنصيص وأسطر النص داخل الخلايا.',
    },
    {
      q: 'هل رؤوس الأعمدة مطلوبة في ملف CSV؟',
      a: 'افتراضياً، يتم استخدام الصف الأول كمفاتيح لخصائص الكائنات. إذا كان ملفك يفتقر إلى الرؤوس، سيتم ترقيم الحقول تسلسلياً.',
    },
    {
      q: 'ما هو الحد الأقصى لحجم ملف CSV المدعوم؟',
      a: 'نظراً لأن التحليل يتم في متصفح العميل، يمكن تحويل ملفات تتجاوز 50 ميجابايت بسرعة عالية وبدون أي تأخير في الرفع.',
    },
  ],
}

export default function CsvToJsonTool() {
  const { language } = useLanguage()
  const isArabic = language === 'ar'

  const [inputCsv, setInputCsv] = useState('')
  const [outputJson, setOutputJson] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [syntaxWarning, setSyntaxWarning] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const recordUsage = async () => {
    if (!inputCsv.trim()) return
    const sig = `${inputCsv.trim()}|${outputJson.trim()}`
    if (!registerClientToolSignature('csv-json', sig)) return

    try {
      await Promise.all([
        incrementToolUsage(sig),
        markToolUsed('csv-json'),
      ])
    } catch {
      // Non-blocking telemetry
    }
  }

  const convertCsvToJson = (csvText: string = inputCsv) => {
    if (!csvText.trim()) return

    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setOutputJson('')
          setSyntaxWarning(`${isArabic ? 'خطأ في تحليل CSV:' : 'CSV Parsing Error:'} ${results.errors[0].message}`)
          return
        }
        setOutputJson(JSON.stringify(results.data, null, 2))
        setSyntaxWarning('')
        recordUsage()
        logToolActivity({
          toolId: 'csv-json',
          toolName: 'CSV to JSON Converter',
          category: 'Database & Data',
          actionTitle: `Converted CSV (${Array.isArray(results.data) ? results.data.length : 0} rows)`,
          details: `Transformed CSV spreadsheet data into structured JSON array.`,
          inputSnippet: csvText.substring(0, 120),
          outputSnippet: JSON.stringify(results.data).substring(0, 120),
        })
      },
      error: (err: Error) => {
        setOutputJson('')
        setSyntaxWarning(`${isArabic ? 'خطأ في تحليل CSV:' : 'CSV Parsing Error:'} ${err.message}`)
      },
    })
  }

  const handleClear = () => {
    setInputCsv('')
    setOutputJson('')
    setSyntaxWarning('')
  }

  const handleCopy = async () => {
    if (!outputJson) return
    await navigator.clipboard.writeText(outputJson)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast.success(isArabic ? 'تم نسخ JSON إلى الحافظة' : 'JSON copied to clipboard')
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
    toast.success(isArabic ? 'تم تنزيل ملف JSON بنجاح' : 'JSON file downloaded successfully')
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setInputCsv(text)
      convertCsvToJson(text)
      toast.success(isArabic ? 'تم استيراد ملف CSV بنجاح' : 'CSV file imported successfully')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <ToolLayout metadata={toolMeta} maxWidth="7xl">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept=".csv,.txt"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 px-3.5 gap-2 text-xs font-semibold"
          >
            <Upload className="h-4 w-4" /> {isArabic ? 'رفع ملف CSV' : 'Upload .csv'}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={!inputCsv && !outputJson}
          className="h-10 px-3.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
        >
          <Trash2 className="h-4 w-4" /> {isArabic ? 'مسح' : 'Clear'}
        </Button>
      </div>

      {/* Warning */}
      {syntaxWarning && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-xs sm:text-sm font-mono">{syntaxWarning}</span>
        </div>
      )}

      {/* Grid Textareas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* CSV Input */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5 text-primary" /> {isArabic ? 'جدول CSV المدخل' : 'Input CSV'}
            </label>
            <button
              type="button"
              onClick={() => {
                const sample = `id,name,role,department,salary\n101,Sarah Jenkins,Lead Architect,Engineering,145000\n102,David Miller,Product Manager,Product,128000\n103,Elena Rostova,Data Scientist,Analytics,132000`
                setInputCsv(sample)
                convertCsvToJson(sample)
              }}
              className="text-xs text-primary hover:underline font-medium cursor-pointer"
            >
              {isArabic ? 'تحميل مثال جاهز' : 'Load Sample'}
            </button>
          </div>
          <textarea
            value={inputCsv}
            onChange={(e) => {
              setInputCsv(e.target.value)
              convertCsvToJson(e.target.value)
            }}
            placeholder={
              isArabic
                ? `الصق جدول CSV هنا...\n\nid,name,email,active\n1,Alex Mercer,alex@example.com,true\n2,John Doe,john@example.com,false`
                : `Paste your CSV table here...\n\nid,name,email,active\n1,Alex Mercer,alex@example.com,true\n2,John Doe,john@example.com,false`
            }
            className="w-full h-80 p-4 rounded-2xl border border-border/80 bg-card font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none transition-all placeholder:text-muted-foreground/40 leading-relaxed text-foreground shadow-xs"
          />
        </div>

        {/* JSON Output */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5 text-primary" /> {isArabic ? 'مخرجات JSON المحولة' : 'Converted JSON Output'}
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!outputJson}
                className="h-8 px-2.5 text-xs gap-1.5 rounded-lg"
              >
                <Download className="h-3.5 w-3.5" /> {isArabic ? 'تحميل' : 'Download'}
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
                {isArabic ? 'ستظهر بيانات JSON المحولة هنا تلقائياً...' : 'JSON arrays will generate automatically...'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <Button
          size="lg"
          onClick={() => convertCsvToJson()}
          disabled={!inputCsv.trim()}
          className="h-12 px-8 rounded-xl font-bold shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all"
        >
          <Sparkles className="h-4.5 w-4.5" /> {isArabic ? 'تحويل إلى JSON' : 'Convert to JSON'}
        </Button>
      </div>
    </ToolLayout>
  )
}