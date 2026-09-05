'use client'

import React, { useState, useEffect, useMemo, useTransition } from 'react'
import {
  Binary,
  ArrowLeftRight,
  Copy,
  Check,
  Trash2,
  Download,
  Sparkles,
  Zap,
  ShieldCheck,
  Code2,
  AlertTriangle,
  Info,
  Sliders,
  RotateCcw,
  Eye,
  Hash,
  Activity,
  Maximize2,
  Minimize2,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { useLanguage } from '@/lib/i18n/context'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { logToolActivity } from '@/lib/history-service'
import { toast } from 'sonner'

const toolMeta: ToolMetadata = {
  id: 'binary-translator',
  name: 'Binary Translator (Text ↔ Binary)',
  name_ar: 'مترجم النظام الثنائي (نص ↔ ثنائي)',
  description:
    'Translate plain text to binary code and binary back to text, byte by byte with bit-level inspection, multi-byte UTF-8 support, and real-time statistics.',
  description_ar:
    'تحويل النصوص العادية إلى لغة الآلة الثنائية (0 و 1) والعكس بايت ببايت مع فحص مفصل لقيم البتات ودعم كامل للغة العربية والإيموجي.',
  category: {
    id: 'developer',
    name: 'Developer Tools',
    slug: 'developer',
  },
  icon: Binary,
  privacyBadge: '100% Client-Side • Byte-by-Byte Precision',
  privacyBadge_ar: 'معالجة محلية 100% • دقة متناهية بايت ببايت',
  features: [
    {
      icon: Zap,
      title: 'Bidirectional Translation',
      desc: 'Seamlessly convert from text to binary and decode binary back to plain text byte by byte.',
    },
    {
      icon: Binary,
      title: 'Byte-by-Byte Inspector',
      desc: 'Inspect individual bytes, hex, decimal, octal, and 8-bit place values ($128 \\dots 1$).',
    },
    {
      icon: ShieldCheck,
      title: 'Full UTF-8 & Multi-Byte',
      desc: 'Flawlessly translates international scripts, Arabic, and emojis with 100% local privacy.',
    },
    {
      icon: Code2,
      title: 'Flexible Delimiters & Formats',
      desc: 'Choose between spaces, commas, dashes, newlines, or 0b prefixes with 7-bit, 8-bit, or 16-bit widths.',
    },
  ],
  features_ar: [
    {
      icon: Zap,
      title: 'تحويل ثنائي الاتجاه فوري',
      desc: 'تحويل سلس من النصوص إلى النظام الثنائي ومن الثنائي إلى نصوص مقروءة بايت ببايت.',
    },
    {
      icon: Binary,
      title: 'فاحص البايتات التفاعلي',
      desc: 'فحص كل بايت ومطابقته مع النظام السداسي عشري والعشري والثماني وقيم البتات المكانية.',
    },
    {
      icon: ShieldCheck,
      title: 'دعم كامل لـ UTF-8 واللغة العربية',
      desc: 'معالجة دقيقة للرموز التعبيرية والأحرف العربية متعددة البايتات محلياً في متصفحك.',
    },
    {
      icon: Code2,
      title: 'فواصل وتنسيقات مخصصة',
      desc: 'خيارات فواصل متنوعة (مسافات، فواصل، شُرط، أسطر جديدة) مع دعم بادئة 0b وعرض 8 أو 7 أو 16 بت.',
    },
  ],
  faqs: [
    {
      q: 'How does text to binary translation work byte by byte?',
      a: 'Computers represent every character as numbers in memory. In UTF-8 and ASCII, each character or multi-byte segment is stored as one or more 8-bit bytes (values from 0 to 255). This tool converts each byte into an 8-digit sequence of zeros and ones.',
    },
    {
      q: 'How does binary to text decoding handle Arabic or Emojis?',
      a: 'English ASCII characters use single 8-bit bytes, while Arabic letters require 2 bytes and emojis typically require 4 bytes in standard UTF-8 encoding. Our translator uses a native UTF-8 streaming decoder so all international characters decode flawlessly.',
    },
    {
      q: 'What is the purpose of the 0b prefix and byte delimiters?',
      a: 'The "0b" prefix is the universal syntax in languages like JavaScript, Python, and C++ to denote binary literals (e.g. 0b01000001 = 65 = "A"). Delimiters like spaces make 8-bit bytes readable to humans.',
    },
    {
      q: 'Is my text or binary data transmitted to any server?',
      a: 'No. All conversions, bit calculations, and byte parsing run 100% locally in your browser using client-side JavaScript APIs (TextEncoder/TextDecoder). No data is ever uploaded.',
    },
  ],
  faqs_ar: [
    {
      q: 'كيف يعمل التحويل من نص إلى نظام ثنائي بايت ببايت؟',
      a: 'تتعامل الحواسيب مع الحروف كأرقام مخزنة في الذاكرة. في ترميز UTF-8 و ASCII، يتم تمثيل كل رمز ببايت واحد أو عدة بايتات (8 بت لكل بايت بقيم بين 0 و 255). تقوم الأداة بتحويل كل بايت إلى 8 أرقام ثنائية مكونة من 0 و 1.',
    },
    {
      q: 'كيف يتعامل فك الترميز مع الحروف العربية والإيموجي؟',
      a: 'الأحرف الإنجليزية تستخدم عادةً بايتاً واحداً، بينما تتطلب الأحرف العربية بايتين وتتطلب الرموز التعبيرية 4 بايتات في ترميز UTF-8 القياسي. أداتنا تستخدم مفكك UTF-8 أصلي يدعم كافة اللغات بدقة تامة.',
    },
    {
      q: 'ما هي أهمية بادئة 0b والفواصل بين البايتات؟',
      a: 'تُستخدم البادئة 0b في لغات البرمجة (مثل بايثون وجافاسكريبت و C++) للدلالة على الأرقام الثنائية. وتساعد الفواصل (مثل المسافات) في تسهيل قراءة البايتات للبشر.',
    },
    {
      q: 'هل يتم إرسال بياناتي أو نصوصي إلى أي خادم؟',
      a: 'أبداً. كافة عمليات التحويل وتفكيك البتات وحساب القيم تتم محلياً بنسبة 100% داخل متصفحك عبر واجهات TextEncoder و TextDecoder دون إرسال أي بايت لخوادم خارجية.',
    },
  ],
}

type DelimiterType = 'space' | 'none' | 'comma' | 'hyphen' | 'newline'
type BitWidthType = 8 | 7 | 16
type CharsetType = 'utf-8' | 'ascii'

interface ByteInspectorItem {
  index: number
  charLabel: string
  decimal: number
  hex: string
  octal: string
  binary: string
  bits: number[]
  highNibble: string
  lowNibble: string
  onesCount: number
}

const BIT_WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1]

export default function BinaryTranslatorTool() {
  const { language } = useLanguage()
  const isAr = language === 'ar'
  const [, startTransition] = useTransition()

  // Primary State
  const [mode, setMode] = useState<'text-to-binary' | 'binary-to-text'>('text-to-binary')
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [encoding, setEncoding] = useState<CharsetType>('utf-8')
  const [delimiter, setDelimiter] = useState<DelimiterType>('space')
  const [bitWidth, setBitWidth] = useState<BitWidthType>(8)
  const [includePrefix, setIncludePrefix] = useState(false)
  const [selectedByteIndex, setSelectedByteIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'editor' | 'inspector'>('editor')

  // Validation / Diagnostics
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [warningMsg, setWarningMsg] = useState<string | null>(null)
  const [nonBinaryCount, setNonBinaryCount] = useState<number>(0)
  const [isCopied, setIsCopied] = useState(false)

  // Record Telemetry Usage
  const recordUsage = async () => {
    try {
      await Promise.all([incrementToolUsage(), markToolUsed('binary-translator')])
      logToolActivity({
        toolId: 'binary-translator',
        toolName: 'Binary Translator',
        category: 'Developer',
        actionTitle: `${mode === 'text-to-binary' ? 'Translated Text to Binary' : 'Decoded Binary to Text'}`,
        details: `Charset: ${encoding.toUpperCase()}, Delimiter: ${delimiter}, Bit Width: ${bitWidth}-bit`,
        inputSnippet: inputText.substring(0, 100),
        outputSnippet: outputText.substring(0, 100),
      })
    } catch {
      // Non-blocking telemetry
    }
  }

  // Core Conversion Engine
  useEffect(() => {
    setErrorMsg(null)
    setWarningMsg(null)
    setNonBinaryCount(0)

    if (!inputText) {
      setOutputText('')
      return
    }

    try {
      if (mode === 'text-to-binary') {
        // Text to Binary Byte-by-Byte
        let bytes: Uint8Array

        if (encoding === 'utf-8') {
          const encoder = new TextEncoder()
          bytes = encoder.encode(inputText)
        } else {
          // ASCII mode
          const asciiBytes: number[] = []
          for (let i = 0; i < inputText.length; i++) {
            const code = inputText.charCodeAt(i)
            if (code > 127) {
              setWarningMsg(
                isAr
                  ? 'تم رصد أحرف غير متوافقة مع ASCII القياسي (تم اقتطاعها لـ 7 بت أو يرجى التحويل إلى UTF-8).'
                  : 'Non-ASCII characters detected in ASCII mode. Switch to UTF-8 for full international support.',
              )
            }
            asciiBytes.push(code & (bitWidth === 7 ? 0x7f : 0xff))
          }
          bytes = new Uint8Array(asciiBytes)
        }

        const separator =
          delimiter === 'space'
            ? ' '
            : delimiter === 'comma'
              ? ', '
              : delimiter === 'hyphen'
                ? '-'
                : delimiter === 'newline'
                  ? '\n'
                  : ''

        const binaryChunks: string[] = []
        for (let i = 0; i < bytes.length; i++) {
          const b = bytes[i]
          let binStr = b.toString(2).padStart(bitWidth, '0')
          if (includePrefix) {
            binStr = `0b${binStr}`
          }
          binaryChunks.push(binStr)
        }

        setOutputText(binaryChunks.join(separator))
      } else {
        // Binary to Text Byte-by-Byte
        // 1. Diagnostics: check for invalid characters
        const cleanedForScan = inputText.replace(/0b/gi, '').replace(/[\s,_\-\n\r\t]/g, '')
        const invalidChars = cleanedForScan.replace(/[01]/g, '')
        if (invalidChars.length > 0) {
          setNonBinaryCount(invalidChars.length)
          setErrorMsg(
            isAr
              ? `تم اكتشاف ${invalidChars.length} رمز غير ثنائي في النص (مثل: "${invalidChars.slice(0, 5)}"). الأرقام الثنائية تقبل 0 و 1 فقط.`
              : `Found ${invalidChars.length} non-binary character(s) (e.g. "${invalidChars.slice(0, 5)}"). Binary accepts only 0s and 1s.`,
          )
        }

        // 2. Tokenize binary chunks
        let chunks: string[] = []
        const hasDelimiters = /[\s,_\-\n\r\t]/.test(inputText.trim())

        if (hasDelimiters) {
          // Split by delimiters
          const rawParts = inputText
            .replace(/0b/gi, '')
            .split(/[\s,_\-\n\r\t]+/)
            .filter((p) => p.length > 0)

          for (const part of rawParts) {
            // Keep only 0 and 1
            const binOnly = part.replace(/[^01]/g, '')
            if (binOnly.length > 0) {
              chunks.push(binOnly)
            }
          }
        } else {
          // Continuous bitstream
          const rawBits = inputText.replace(/0b/gi, '').replace(/[^01]/g, '')
          const targetWidth = bitWidth
          for (let i = 0; i < rawBits.length; i += targetWidth) {
            chunks.push(rawBits.slice(i, i + targetWidth))
          }
        }

        if (chunks.length === 0) {
          setOutputText('')
          return
        }

        // Check for partial / uneven chunks
        let unevenFound = false
        const parsedBytes: number[] = []

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i]
          if (chunk.length < bitWidth && i === chunks.length - 1) {
            unevenFound = true
          }
          const val = parseInt(chunk, 2)
          if (!isNaN(val)) {
            parsedBytes.push(val)
          }
        }

        if (unevenFound) {
          setWarningMsg(
            isAr
              ? 'تنبيه: البايت الأخير يحتوي على عدد بتات أقل من الحجم المحدد (يمكنك النقر على "تعبئة بالأصفار").'
              : 'Notice: The final binary chunk has fewer bits than the specified byte width. Consider using "Auto-Pad".',
          )
        }

        // Decode to string
        if (encoding === 'utf-8') {
          const uint8 = new Uint8Array(parsedBytes)
          const decoder = new TextDecoder('utf-8', { fatal: false })
          const decoded = decoder.decode(uint8)
          setOutputText(decoded)
        } else {
          const decoded = parsedBytes.map((b) => String.fromCharCode(b & 0x7f)).join('')
          setOutputText(decoded)
        }
      }
    } catch (err: unknown) {
      setOutputText('')
      setErrorMsg(err instanceof Error ? err.message : 'Translation error occurred.')
    }
  }, [inputText, mode, encoding, delimiter, bitWidth, includePrefix, isAr])

  // Compute Byte Inspector Items
  const byteInspectorData = useMemo<ByteInspectorItem[]>(() => {
    if (!inputText && !outputText) return []

    let sourceBytes: Uint8Array

    try {
      if (mode === 'text-to-binary') {
        sourceBytes = new TextEncoder().encode(inputText)
      } else {
        // Binary to Text: parse bytes from input
        const rawBits = inputText.replace(/0b/gi, '')
        const tokens = /[\s,_\-\n\r\t]/.test(rawBits.trim())
          ? rawBits.split(/[\s,_\-\n\r\t]+/).filter((t) => t.length > 0)
          : rawBits.match(/.{1,8}/g) || []

        const nums = tokens.map((t) => parseInt(t.replace(/[^01]/g, ''), 2)).filter((n) => !isNaN(n))
        sourceBytes = new Uint8Array(nums)
      }

      // Limit inspection to first 250 bytes for ultra-fluid rendering
      const maxInspect = Math.min(sourceBytes.length, 250)
      const items: ByteInspectorItem[] = []

      for (let i = 0; i < maxInspect; i++) {
        const val = sourceBytes[i]
        const bin = val.toString(2).padStart(8, '0')
        const bitsArr = bin.split('').map((b) => Number(b))
        const ones = bitsArr.filter((b) => b === 1).length

        // Printable label
        let charLabel = ''
        if (val === 32) charLabel = '[SPACE]'
        else if (val === 10) charLabel = '\\n [LF]'
        else if (val === 13) charLabel = '\\r [CR]'
        else if (val === 9) charLabel = '\\t [TAB]'
        else if (val >= 33 && val <= 126) charLabel = String.fromCharCode(val)
        else charLabel = `0x${val.toString(16).toUpperCase()}`

        items.push({
          index: i + 1,
          charLabel,
          decimal: val,
          hex: `0x${val.toString(16).toUpperCase().padStart(2, '0')}`,
          octal: `0${val.toString(8).padStart(3, '0')}`,
          binary: bin,
          bits: bitsArr,
          highNibble: bin.slice(0, 4),
          lowNibble: bin.slice(4, 8),
          onesCount: ones,
        })
      }

      return items
    } catch {
      return []
    }
  }, [inputText, outputText, mode])

  // Statistics Calculation
  const stats = useMemo(() => {
    let charCount = 0
    let byteCount = 0
    let totalBits = 0
    let onesCount = 0
    let zerosCount = 0

    if (mode === 'text-to-binary') {
      charCount = inputText.length
      const bytes = new TextEncoder().encode(inputText)
      byteCount = bytes.length
      totalBits = byteCount * bitWidth

      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i]
        const bin = b.toString(2)
        for (let j = 0; j < bin.length; j++) {
          if (bin[j] === '1') onesCount++
        }
      }
      zerosCount = totalBits - onesCount
    } else {
      charCount = outputText.length
      const cleaned = inputText.replace(/0b/gi, '').replace(/[^01]/g, '')
      totalBits = cleaned.length
      byteCount = Math.ceil(totalBits / bitWidth)

      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === '1') onesCount++
        else if (cleaned[i] === '0') zerosCount++
      }
    }

    const onesPercent = totalBits > 0 ? Math.round((onesCount / totalBits) * 100) : 0
    const zerosPercent = totalBits > 0 ? 100 - onesPercent : 0

    return {
      charCount,
      byteCount,
      totalBits,
      onesCount,
      zerosCount,
      onesPercent,
      zerosPercent,
    }
  }, [inputText, outputText, mode, bitWidth])

  // Swap translation direction
  const handleSwap = () => {
    startTransition(() => {
      const nextInput = outputText
      setMode((prev) => (prev === 'text-to-binary' ? 'binary-to-text' : 'text-to-binary'))
      setInputText(nextInput)
      setSelectedByteIndex(null)
    })
  }

  // Copy to clipboard
  const handleCopy = async () => {
    if (!outputText) return
    await navigator.clipboard.writeText(outputText)
    setIsCopied(true)
    recordUsage()
    toast.success(isAr ? 'تم نسخ المخرجات بنجاح إلى الحافظة!' : 'Copied output to clipboard!')
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Clear everything
  const handleClear = () => {
    setInputText('')
    setOutputText('')
    setErrorMsg(null)
    setWarningMsg(null)
    setSelectedByteIndex(null)
  }

  // Download output
  const handleDownload = () => {
    if (!outputText) return
    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = mode === 'text-to-binary' ? 'binary-output.bin.txt' : 'decoded-text.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    recordUsage()
    toast.success(isAr ? 'تم تحميل الملف بنجاح!' : 'File downloaded successfully!')
  }

  // Invert Bits (NOT Operation: 0->1, 1->0)
  const handleInvertBits = () => {
    if (mode === 'binary-to-text') {
      const inverted = inputText
        .split('')
        .map((c) => (c === '0' ? '1' : c === '1' ? '0' : c))
        .join('')
      setInputText(inverted)
      toast.info(isAr ? 'تم عكس البتات (عكس 0 و 1)' : 'Inverted binary bits (NOT operation)')
    } else {
      // Invert output binary
      const inverted = outputText
        .split('')
        .map((c) => (c === '0' ? '1' : c === '1' ? '0' : c))
        .join('')
      setOutputText(inverted)
      toast.info(isAr ? 'تم عكس بتات المخرجات' : 'Inverted output bits')
    }
  }

  // Auto-pad incomplete binary
  const handleAutoPad = () => {
    if (mode !== 'binary-to-text' || !inputText) return

    const rawParts = inputText
      .replace(/0b/gi, '')
      .split(/([\s,_\-\n\r\t]+)/)
      .map((part) => {
        const isDelimiter = /[\s,_\-\n\r\t]+/.test(part)
        if (isDelimiter) return part
        const binOnly = part.replace(/[^01]/g, '')
        if (binOnly.length === 0) return ''
        return binOnly.padStart(bitWidth, '0')
      })
      .join('')

    setInputText(rawParts)
    toast.success(isAr ? 'تمت تعبئة البايتات بالأصفار لتصبح كاملة' : 'Padded chunks to full byte width with leading zeros')
  }

  // Clean invalid characters
  const handleStripInvalid = () => {
    if (!inputText) return
    const cleaned = inputText.replace(/[^01\s,_\-\n\r\t]/g, '')
    setInputText(cleaned)
    toast.success(isAr ? 'تم حذف كافة الرموز غير الثنائية' : 'Removed all non-binary characters')
  }

  // Load sample texts
  const handleLoadSample = (sampleType: 'hello' | 'arabic' | 'code' | 'binary') => {
    if (sampleType === 'hello') {
      setMode('text-to-binary')
      setInputText('Hello World! ⚡')
    } else if (sampleType === 'arabic') {
      setMode('text-to-binary')
      setInputText('مرحبا بالعالم 🚀')
    } else if (sampleType === 'code') {
      setMode('text-to-binary')
      setInputText('Binary 2026')
    } else if (sampleType === 'binary') {
      setMode('binary-to-text')
      setInputText('01001000 01100101 01101100 01101100 01101111 00100001')
    }
  }

  return (
    <ToolLayout metadata={toolMeta} maxWidth="6xl">
      <div className="space-y-6">
        {/* Top Control Bar: Mode Switcher, Presets & Action Buttons */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-border/60 pb-5">
          {/* Mode Switcher */}
          <div className="bg-muted/80 p-1 rounded-xl border border-border/70 flex gap-1 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setMode('text-to-binary')
                setSelectedByteIndex(null)
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'text-to-binary'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isAr ? 'نص ← ثنائي (Text to Binary)' : 'Text to Binary'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('binary-to-text')
                setSelectedByteIndex(null)
              }}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'binary-to-text'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {isAr ? 'ثنائي ← نص (Binary to Text)' : 'Binary to Text'}
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
              <Sliders className="h-3 w-3" />
              {isAr ? 'نماذج جاهزة:' : 'Presets:'}
            </span>
            <button
              type="button"
              onClick={() => handleLoadSample('hello')}
              className="text-xs px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-accent/40 font-medium transition-colors"
            >
              Hello World!
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('arabic')}
              className="text-xs px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-accent/40 font-medium transition-colors"
            >
              مرحبا بالعالم 🚀
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('code')}
              className="text-xs px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-accent/40 font-medium transition-colors"
            >
              Binary 2026
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('binary')}
              className="text-xs px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-accent/40 font-medium transition-colors font-mono text-primary"
            >
              01001000...
            </button>
          </div>
        </div>

        {/* Configuration Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-card/60 p-4 rounded-2xl border border-border/80">
          {/* Character Encoding */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-primary" />
              {isAr ? 'ترميز المحارف (Encoding):' : 'Character Encoding:'}
            </label>
            <select
              value={encoding}
              onChange={(e) => setEncoding(e.target.value as CharsetType)}
              className="w-full h-8 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="utf-8">UTF-8 (Multi-Byte / International / Emojis)</option>
              <option value="ascii">ASCII (Standard 7/8-bit)</option>
            </select>
          </div>

          {/* Byte Separator / Delimiter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-primary" />
              {isAr ? 'فاصل البايتات (Delimiter):' : 'Byte Separator:'}
            </label>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value as DelimiterType)}
              className="w-full h-8 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="space">{isAr ? 'مسافة (Space)' : 'Space (01001000 01100101)'}</option>
              <option value="none">{isAr ? 'بدون فاصل (Continuous)' : 'None (Continuous Stream)'}</option>
              <option value="comma">{isAr ? 'فاصلة (,)' : 'Comma (, )'}</option>
              <option value="hyphen">{isAr ? 'شَرطة (-)' : 'Hyphen (-)'}</option>
              <option value="newline">{isAr ? 'سطر جديد (Newline)' : 'Newline (One per line)'}</option>
            </select>
          </div>

          {/* Bit Width (Padding) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Binary className="h-3.5 w-3.5 text-primary" />
              {isAr ? 'عرض البت (Bit Width):' : 'Bit Width:'}
            </label>
            <select
              value={bitWidth}
              onChange={(e) => setBitWidth(Number(e.target.value) as BitWidthType)}
              className="w-full h-8 rounded-lg border border-border/80 bg-background px-2.5 text-xs font-semibold text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value={8}>{isAr ? '8-بت (1 بايت قياسي)' : '8-bit (Standard 1 Byte)'}</option>
              <option value={7}>{isAr ? '7-بت (ASCII قياسي)' : '7-bit (Standard ASCII)'}</option>
              <option value={16}>{isAr ? '16-بت (2 بايت UTF-16)' : '16-bit (2 Bytes)'}</option>
            </select>
          </div>

          {/* Extra Flags (0b prefix & Invert) */}
          <div className="space-y-1.5 flex flex-col justify-between">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-primary" />
              {isAr ? 'خيارات إضافية:' : 'Options:'}
            </label>
            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer text-foreground select-none">
                <input
                  type="checkbox"
                  checked={includePrefix}
                  onChange={(e) => setIncludePrefix(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary/30 h-3.5 w-3.5"
                />
                <span>0b Prefix</span>
              </label>

              <button
                type="button"
                onClick={handleInvertBits}
                disabled={!inputText && !outputText}
                title={isAr ? 'عكس كل بت (0 يصبح 1 و 1 يصبح 0)' : 'Invert bits (NOT logic: 0 to 1, 1 to 0)'}
                className="text-[11px] px-2 py-0.5 rounded border border-border hover:bg-accent/40 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              >
                {isAr ? 'عكس البتات' : 'Invert Bits'}
              </button>
            </div>
          </div>
        </div>

        {/* View Tabs: Main Workspace vs Byte Inspector */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <Button
            variant={activeTab === 'editor' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('editor')}
            className="rounded-xl gap-2 text-xs font-semibold"
          >
            <FileText className="h-3.5 w-3.5" />
            {isAr ? 'محرر التحويل' : 'Translator Workspace'}
          </Button>

          <Button
            variant={activeTab === 'inspector' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('inspector')}
            className="rounded-xl gap-2 text-xs font-semibold relative"
          >
            <Eye className="h-3.5 w-3.5" />
            {isAr ? 'فاحص البايتات التفاعلي' : 'Byte-by-Byte Inspector'}
            {byteInspectorData.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-primary/20 text-primary text-[10px] font-bold rounded-full">
                {byteInspectorData.length} {isAr ? 'بايت' : 'bytes'}
              </span>
            )}
          </Button>
        </div>

        {/* Diagnostic Alert Banners */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            {nonBinaryCount > 0 && mode === 'binary-to-text' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStripInvalid}
                className="h-7 px-2 text-[11px] font-semibold"
              >
                {isAr ? 'حذف الرموز الخاطئة' : 'Strip Invalid'}
              </Button>
            )}
          </div>
        )}

        {warningMsg && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0" />
              <span>{warningMsg}</span>
            </div>
            {mode === 'binary-to-text' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoPad}
                className="h-7 px-2 text-[11px] font-semibold border-amber-500/40 hover:bg-amber-500/20"
              >
                {isAr ? 'تعبئة بالأصفار (Pad 0s)' : 'Auto-Pad 0s'}
              </Button>
            )}
          </div>
        )}

        {activeTab === 'editor' ? (
          /* Main Two-Column Translation Workspace */
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Input Box */}
              <div className="lg:col-span-6 p-5 rounded-2xl border border-border/70 bg-card shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                    {mode === 'text-to-binary' ? (
                      <>
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        {isAr ? 'النص المدخل (Plain Text)' : 'Plain Text Input'}
                      </>
                    ) : (
                      <>
                        <Binary className="h-3.5 w-3.5 text-primary" />
                        {isAr ? 'النص الثنائي المدخل (Binary Code)' : 'Binary Input (0s & 1s)'}
                      </>
                    )}
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={!inputText}
                      className="text-xs text-destructive hover:underline flex items-center gap-1 font-medium cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 className="h-3 w-3" />
                      {isAr ? 'مسح' : 'Clear'}
                    </button>
                  </div>
                </div>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    mode === 'text-to-binary'
                      ? isAr
                        ? 'اكتب أو الصق أي نص عادي هنا ليتم تحويله إلى كود ثنائي بايت ببايت...'
                        : 'Type or paste plain text here to translate into binary code byte by byte...'
                      : isAr
                        ? 'الصق الأرقام الثنائية هنا (مثل: 01001000 01100101)...'
                        : 'Paste binary digits here (e.g. 01001000 01100101 01101100)...'
                  }
                  className="w-full h-72 p-4 rounded-xl border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none leading-relaxed text-foreground placeholder:text-muted-foreground/50"
                  spellCheck={false}
                />

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>
                    {isAr ? 'عدد الأحرف: ' : 'Characters: '}
                    <strong className="text-foreground">{inputText.length}</strong>
                  </span>
                  {mode === 'binary-to-text' && (
                    <span>
                      {isAr ? 'إجمالي البتات: ' : 'Total Bits: '}
                      <strong className="text-foreground">{inputText.replace(/[^01]/g, '').length}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Center Swap Action Button (Desktop & Mobile) */}
              <div className="hidden lg:flex lg:col-span-12 justify-center -my-9 z-10">
                <Button
                  onClick={handleSwap}
                  variant="outline"
                  size="sm"
                  className="rounded-full h-10 w-10 p-0 shadow-md bg-background border-border hover:border-primary/50 hover:bg-accent/40"
                  title={isAr ? 'تبديل اتجاه التحويل ونقل المخرجات للمدخلات' : 'Swap translation direction'}
                >
                  <ArrowLeftRight className="h-4 w-4 text-primary" />
                </Button>
              </div>

              {/* Right Column: Output Box */}
              <div className="lg:col-span-6 p-5 rounded-2xl border border-border/70 bg-card shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                    {mode === 'text-to-binary' ? (
                      <>
                        <Binary className="h-3.5 w-3.5 text-primary" />
                        {isAr ? 'النتيجة بالنظام الثنائي (Binary Output)' : 'Binary Output (Byte-by-Byte)'}
                      </>
                    ) : (
                      <>
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        {isAr ? 'النص الناتج بعد فك التشفير' : 'Decoded Plain Text Output'}
                      </>
                    )}
                  </label>

                  {outputText && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCopy}
                        className="h-8 px-2.5 text-xs gap-1.5 font-medium rounded-lg"
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        {isCopied ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ' : 'Copy'}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                        className="h-8 px-2.5 text-xs gap-1.5 font-medium rounded-lg"
                        title={isAr ? 'تنزيل النتيجة كملف' : 'Download result'}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {isAr ? 'تنزيل' : 'Download'}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="relative h-72 w-full rounded-xl border border-border bg-background p-4 overflow-y-auto font-mono text-sm leading-relaxed text-foreground break-all whitespace-pre-wrap select-all">
                  {outputText ? (
                    outputText
                  ) : (
                    <span className="text-muted-foreground/50 italic text-xs select-none">
                      {isAr ? 'ستظهر النتيجة المترجمة هنا فورياً...' : 'Translated output will appear here in real-time...'}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>
                    {isAr ? 'حجم المخرجات: ' : 'Output Size: '}
                    <strong className="text-foreground">
                      {mode === 'text-to-binary'
                        ? `${stats.byteCount} ${isAr ? 'بايت' : 'bytes'} (${stats.totalBits} bits)`
                        : `${stats.charCount} ${isAr ? 'حرف' : 'chars'}`}
                    </strong>
                  </span>

                  {outputText && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('inspector')}
                      className="text-primary hover:underline font-semibold flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      {isAr ? 'فحص البايتات بالتفصيل ←' : 'Inspect Bytes →'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live Statistics & Bit Distribution Panel */}
            <div className="p-5 rounded-2xl border border-border/80 bg-card/60 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                  <Activity className="h-4 w-4 text-primary" />
                  <span>{isAr ? 'إحصائيات البت والبايت اللحظية' : 'Live Bit & Byte Telemetry'}</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {isAr ? 'حسابات دقيقة 100%' : '100% Deterministic Math'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-background border border-border/70 space-y-1">
                  <div className="text-[11px] text-muted-foreground font-semibold">
                    {isAr ? 'إجمالي الأحرف' : 'Total Characters'}
                  </div>
                  <div className="text-lg font-bold text-foreground font-mono">{stats.charCount}</div>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border/70 space-y-1">
                  <div className="text-[11px] text-muted-foreground font-semibold">
                    {isAr ? 'إجمالي البايتات (Bytes)' : 'Total Bytes'}
                  </div>
                  <div className="text-lg font-bold text-foreground font-mono">{stats.byteCount}</div>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border/70 space-y-1">
                  <div className="text-[11px] text-muted-foreground font-semibold">
                    {isAr ? 'إجمالي البتات (Bits)' : 'Total Bits'}
                  </div>
                  <div className="text-lg font-bold text-primary font-mono">{stats.totalBits}</div>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border/70 space-y-1">
                  <div className="text-[11px] text-muted-foreground font-semibold">
                    {isAr ? 'توزيع الآحاد والأصفار (1s / 0s)' : '1s vs 0s Ratio'}
                  </div>
                  <div className="text-sm font-bold text-foreground font-mono flex items-center gap-2">
                    <span className="text-emerald-500">1: {stats.onesCount}</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-blue-500">0: {stats.zerosCount}</span>
                  </div>
                </div>
              </div>

              {/* Bit Density Progress Bar */}
              {stats.totalBits > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {isAr ? 'البتات المفعلة (1s): ' : 'Active Bits (1s): '} {stats.onesPercent}%
                    </span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {isAr ? 'البتات الفارغة (0s): ' : 'Zero Bits (0s): '} {stats.zerosPercent}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 transition-all duration-300"
                      style={{ width: `${stats.onesPercent}%` }}
                      title={`1s: ${stats.onesCount} bits`}
                    />
                    <div
                      className="bg-blue-500 transition-all duration-300"
                      style={{ width: `${stats.zerosPercent}%` }}
                      title={`0s: ${stats.zerosCount} bits`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Byte-by-Byte Visual Inspector View */
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Binary className="h-4 w-4 text-primary" />
                    {isAr ? 'فاحص ومحلل البايتات التفصيلي' : 'Byte-by-Byte Structure & Bit Breakdown'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr
                      ? 'انقر على أي بايت لفحص تفكيكه الرياضي وقيم أوزان البتات المكانية (128، 64، 32، 16، 8، 4، 2، 1).'
                      : 'Click any byte card to inspect its mathematical place value decomposition ($128 \\dots 1$) and nibbles.'}
                  </p>
                </div>

                <div className="text-xs font-semibold text-muted-foreground">
                  {isAr ? 'معروض أول ' : 'Showing first '}
                  <strong className="text-foreground">{byteInspectorData.length}</strong>
                  {isAr ? ' بايت' : ' bytes'}
                </div>
              </div>

              {byteInspectorData.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs italic">
                  {isAr
                    ? 'لا توجد بيانات للفحص حالياً. الرجاء إدخال نص أو كود ثنائي في المحرر أولاً.'
                    : 'No bytes to inspect. Please enter text or binary code in the editor first.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[520px] overflow-y-auto p-1">
                  {byteInspectorData.map((item) => {
                    const isSelected = selectedByteIndex === item.index
                    return (
                      <div
                        key={item.index}
                        onClick={() => setSelectedByteIndex(isSelected ? null : item.index)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40'
                            : 'border-border bg-background/80 hover:border-primary/40 hover:bg-card'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            #{item.index}
                          </span>
                          <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-secondary text-primary">
                            {item.charLabel}
                          </span>
                        </div>

                        {/* Binary Bits Visual Chips */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-0.5">
                            {item.bits.map((bit, bIdx) => (
                              <div
                                key={bIdx}
                                className={`flex-1 h-6 rounded flex items-center justify-center font-mono text-[11px] font-bold transition-all ${
                                  bit === 1
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'bg-muted/60 text-muted-foreground border border-border/40'
                                }`}
                                title={`Bit ${7 - bIdx} (Weight ${BIT_WEIGHTS[bIdx]}): ${bit}`}
                              >
                                {bit}
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between text-[9px] text-muted-foreground/60 font-mono px-0.5">
                            <span>128</span>
                            <span>64</span>
                            <span>32</span>
                            <span>16</span>
                            <span>8</span>
                            <span>4</span>
                            <span>2</span>
                            <span>1</span>
                          </div>
                        </div>

                        {/* Decimal, Hex, Octal */}
                        <div className="grid grid-cols-3 gap-1 text-[11px] font-mono pt-1 border-t border-border/50 text-center">
                          <div>
                            <span className="text-[9px] text-muted-foreground block">DEC</span>
                            <span className="font-bold text-foreground">{item.decimal}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-foreground block">HEX</span>
                            <span className="font-bold text-primary">{item.hex}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-muted-foreground block">OCT</span>
                            <span className="font-bold text-foreground">{item.octal}</span>
                          </div>
                        </div>

                        {/* Expanded Mathematical Place Value Calculation */}
                        {isSelected && (
                          <div className="pt-2 border-t border-primary/20 space-y-1.5 text-[11px] text-foreground">
                            <div className="text-[10px] font-bold text-primary">
                              {isAr ? 'الحساب الرياضي للبتات:' : 'Active Bit Place Weights:'}
                            </div>
                            <div className="font-mono text-[10px] bg-background/80 p-2 rounded border border-border">
                              {item.bits
                                .map((bit, idx) => (bit === 1 ? `${BIT_WEIGHTS[idx]}` : null))
                                .filter(Boolean)
                                .join(' + ') || '0'}{' '}
                              = <strong className="text-primary">{item.decimal}</strong>
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>
                                {isAr ? 'النيبل العلوي: ' : 'High Nibble: '}
                                <code className="text-foreground">{item.highNibble}</code>
                              </span>
                              <span>
                                {isAr ? 'النيبل السفلي: ' : 'Low Nibble: '}
                                <code className="text-foreground">{item.lowNibble}</code>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
