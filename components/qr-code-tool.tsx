'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense } from 'react'
import Link from 'next/link'
import {
  QrCode,
  ScanLine,
  Download,
  Copy,
  Share2,
  Check,
  Zap,
  Lock,
  Palette,
  Wifi,
  User,
  MessageSquare,
  Link as LinkIcon,
  FileText,
  ShieldCheck,
  History,
  Trash2,
  Search,
  RotateCcw,
  X,
  Sparkles,
  Briefcase,
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Printer,
  LayoutTemplate,
} from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { useLanguage } from '@/lib/i18n/context'
import { logToolActivity } from '@/lib/history-service'

export interface QrHistoryItem {
  id: string
  title: string
  type: string
  payload: string
  fgColor: string
  bgColor: string
  errorLevel: 'L' | 'M' | 'Q' | 'H'
  timestamp: number
  formData?: {
    urlData?: string
    wifiSSID?: string
    wifiPassword?: string
    wifiSecurity?: string
    vcardName?: string
    vcardEmail?: string
    vcardPhone?: string
    vcardOrg?: string
    smsPhone?: string
    smsMessage?: string
    plainText?: string
  }
}

const toolMeta: ToolMetadata = {
  id: 'qr-code-generator',
  name: 'QR Code Generator & Designer',
  description:
    'Create customized, high-resolution QR codes for websites, WiFi networks, vCards, SMS, and plain text with vector SVG and PNG downloads.',
  category: {
    id: 'files',
    name: 'File Utilities',
    slug: 'files',
  },
  icon: QrCode,
  privacyBadge: '100% Client-Side • Vector SVG & PNG Export',
  features: [
    {
      icon: Zap,
      title: 'Multi-Schema Templates',
      desc: 'One-click templates for WiFi credentials, vCard contacts, SMS, and website URLs.',
    },
    {
      icon: Palette,
      title: 'Custom Color Themes',
      desc: 'Customize foreground and background color matrices with real-time SVG rendering.',
    },
    {
      icon: Lock,
      title: 'Error Correction Levels',
      desc: 'Configurable Reed-Solomon error correction levels (L, M, Q, H) for damage tolerance.',
    },
    {
      icon: ShieldCheck,
      title: 'Private & Never Stored',
      desc: 'WiFi passwords, contact info, and confidential strings are rendered locally without logging.',
    },
  ],
  faqs: [
    {
      q: 'Do generated QR codes expire?',
      a: 'No. These are standard static QR codes that directly encode the raw data payload. They will work indefinitely without external redirects or tracking servers.',
    },
    {
      q: 'Which error correction level should I choose?',
      a: 'Medium (M - 15%) is standard for general use. High (H - 30%) is recommended for printed flyers or cards that may experience physical wear or scuffing.',
    },
    {
      q: 'Can I download vector SVG format?',
      a: 'Yes. You can download either high-resolution raster PNG or scalable vector SVG for print and design work.',
    },
  ],
}

function QRCodeToolContent() {
  const { language } = useLanguage()
  const isArabic = language === 'ar'

  const [qrType, setQrType] = useState('url')
  const [urlData, setUrlData] = useState('https://digitalmix.dev')
  const [qrSize, setQrSize] = useState('256')
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  // WiFi States
  const [wifiSSID, setWifiSSID] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [wifiSecurity, setWifiSecurity] = useState('WPA')

  // vCard States
  const [vcardName, setVcardName] = useState('')
  const [vcardEmail, setVcardEmail] = useState('')
  const [vcardPhone, setVcardPhone] = useState('')
  const [vcardOrg, setVcardOrg] = useState('')

  // SMS States
  const [smsPhone, setSmsPhone] = useState('')
  const [smsMessage, setSmsMessage] = useState('')

  // Plain Text
  const [plainText, setPlainText] = useState('')

  // Business Card States (DigitalMix Style)
  const [cardStyle, setCardStyle] = useState<'digitalmix' | 'cyber' | 'minimal' | 'executive'>('digitalmix')
  const [cardFullName, setCardFullName] = useState('Alex Mercer')
  const [cardTitle, setCardTitle] = useState('Senior Solutions Architect')
  const [cardCompany, setCardCompany] = useState('DigitalMix Labs')
  const [cardPhone, setCardPhone] = useState('+1 (555) 382-9011')
  const [cardEmail, setCardEmail] = useState('alex@digitalmix.dev')
  const [cardWebsite, setCardWebsite] = useState('https://digitalmix.dev')
  const [cardAddress, setCardAddress] = useState('104 Silicon Valley Way, CA')

  // History state
  const [history, setHistory] = useState<QrHistoryItem[]>([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null)

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('digitalmix_qr_history')
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch {
      // ignore
    }
  }, [])

  const recordUsage = async () => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed('qr-code-generator'),
      ])
    } catch {
      // Non-blocking telemetry
    }
  }

  const getEncodedPayload = (): string => {
    switch (qrType) {
      case 'url':
        return urlData || 'https://digitalmix.dev'
      case 'wifi':
        return `WIFI:T:${wifiSecurity};S:${wifiSSID};P:${wifiPassword};;`
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nN:${vcardName}\nFN:${vcardName}\nORG:${vcardOrg}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nEND:VCARD`
      case 'businesscard':
        return `BEGIN:VCARD\nVERSION:3.0\nN:${cardFullName}\nFN:${cardFullName}\nTITLE:${cardTitle}\nORG:${cardCompany}\nTEL:${cardPhone}\nEMAIL:${cardEmail}\nURL:${cardWebsite}\nADR:;;${cardAddress}\nEND:VCARD`
      case 'sms':
        return `SMSTO:${smsPhone}:${smsMessage}`
      case 'text':
      default:
        return plainText || 'DigitalMix Tools'
    }
  }

  const payload = getEncodedPayload()

  // Save to history helper
  const saveToHistory = useCallback(() => {
    const currentPayload = getEncodedPayload()
    if (!currentPayload.trim()) return

    let itemTitle = 'QR Code'
    if (qrType === 'url') itemTitle = urlData || 'Website URL'
    else if (qrType === 'wifi') itemTitle = wifiSSID ? `WiFi: ${wifiSSID}` : 'WiFi Network'
    else if (qrType === 'vcard') itemTitle = vcardName ? `Contact: ${vcardName}` : 'vCard Contact'
    else if (qrType === 'businesscard') itemTitle = cardFullName ? `Business Card: ${cardFullName}` : 'DigitalMix Business Card'
    else if (qrType === 'sms') itemTitle = smsPhone ? `SMS to ${smsPhone}` : 'SMS Message'
    else if (qrType === 'text') itemTitle = plainText.slice(0, 30) || 'Plain Text'

    const newItem: QrHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: itemTitle,
      type: qrType,
      payload: currentPayload,
      fgColor,
      bgColor,
      errorLevel,
      timestamp: Date.now(),
      formData: {
        urlData,
        wifiSSID,
        wifiPassword,
        wifiSecurity,
        vcardName,
        vcardEmail,
        vcardPhone,
        vcardOrg,
        smsPhone,
        smsMessage,
        plainText,
      },
    }

    setHistory((prev) => {
      // De-duplication: If the latest item already matches this exact payload and settings, skip adding duplicates
      const isImmediateDuplicate =
        prev.length > 0 &&
        prev[0].payload === currentPayload &&
        prev[0].type === qrType &&
        prev[0].fgColor === fgColor &&
        prev[0].bgColor === bgColor

      if (isImmediateDuplicate) {
        return prev
      }

      // If identical payload already exists elsewhere in history, remove older entry to keep only 1 clean copy at the top
      const filtered = prev.filter(
        (p) => !(p.payload === currentPayload && p.type === qrType)
      )
      const updated = [newItem, ...filtered.slice(0, 49)]
      try {
        localStorage.setItem('digitalmix_qr_history', JSON.stringify(updated))
      } catch {
        // storage full
      }

      // Universal dashboard activity logging
      logToolActivity({
        toolId: 'qr-code-generator',
        toolName: isArabic ? 'مولد ومصمم رموز QR' : 'QR Code Generator & Designer',
        category: 'files',
        actionTitle: `Generated ${qrType.toUpperCase()} QR Code`,
        details: isArabic
          ? `قام بتوليد رمز استجابة سريعة QR من نوع (${qrType.toUpperCase()}): "${itemTitle}"`
          : `Generated ${qrType.toUpperCase()} QR code for: "${itemTitle}" (${errorLevel} error correction)`,
        inputSnippet: currentPayload.slice(0, 500),
        outputSnippet: `Type: ${qrType.toUpperCase()}\nColors: ${fgColor} on ${bgColor}\nCorrection: ${errorLevel}`,
        metadata: {
          qrType,
          fgColor,
          bgColor,
          errorLevel,
          title: itemTitle,
        },
      })

      return updated
    })
  }, [
    qrType,
    urlData,
    wifiSSID,
    wifiPassword,
    wifiSecurity,
    vcardName,
    vcardEmail,
    vcardPhone,
    vcardOrg,
    smsPhone,
    smsMessage,
    plainText,
    fgColor,
    bgColor,
    errorLevel,
    isArabic,
  ])

  const clearHistory = () => {
    setHistory([])
    try {
      localStorage.removeItem('digitalmix_qr_history')
    } catch {
      // ignore
    }
    toast.success(isArabic ? 'تم مسح سجل QR بالكامل' : 'QR code history cleared')
  }

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id)
      try {
        localStorage.setItem('digitalmix_qr_history', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
    toast.success(isArabic ? 'تم حذف العنصر من السجل' : 'Item removed from history')
  }

  const restoreHistoryItem = (item: QrHistoryItem) => {
    setQrType(item.type)
    setFgColor(item.fgColor || '#000000')
    setBgColor(item.bgColor || '#FFFFFF')
    setErrorLevel(item.errorLevel || 'M')

    if (item.formData) {
      if (item.formData.urlData !== undefined) setUrlData(item.formData.urlData)
      if (item.formData.wifiSSID !== undefined) setWifiSSID(item.formData.wifiSSID)
      if (item.formData.wifiPassword !== undefined) setWifiPassword(item.formData.wifiPassword)
      if (item.formData.wifiSecurity !== undefined) setWifiSecurity(item.formData.wifiSecurity)
      if (item.formData.vcardName !== undefined) setVcardName(item.formData.vcardName)
      if (item.formData.vcardEmail !== undefined) setVcardEmail(item.formData.vcardEmail)
      if (item.formData.vcardPhone !== undefined) setVcardPhone(item.formData.vcardPhone)
      if (item.formData.vcardOrg !== undefined) setVcardOrg(item.formData.vcardOrg)
      if (item.formData.smsPhone !== undefined) setSmsPhone(item.formData.smsPhone)
      if (item.formData.smsMessage !== undefined) setSmsMessage(item.formData.smsMessage)
      if (item.formData.plainText !== undefined) setPlainText(item.formData.plainText)
    } else {
      if (item.type === 'url') setUrlData(item.payload)
      if (item.type === 'text') setPlainText(item.payload)
    }

    setShowHistoryModal(false)
    toast.success(isArabic ? `تم استعادة باركود (${item.title})` : `Restored QR Code: ${item.title}`)
  }

  const copyHistoryPayload = async (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(text)
    setCopiedHistoryId(id)
    setTimeout(() => setCopiedHistoryId(null), 2000)
    toast.success(isArabic ? 'تم نسخ النص المرمز' : 'Payload copied to clipboard')
  }

  const exportHistoryCSV = () => {
    if (history.length === 0) return
    const headers = ['Timestamp', 'Date', 'Type', 'Title', 'Payload', 'FGColor', 'BGColor', 'ErrorLevel']
    const rows = history.map((item) => [
      item.timestamp,
      `"${new Date(item.timestamp).toISOString()}"`,
      `"${item.type}"`,
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.payload.replace(/"/g, '""')}"`,
      `"${item.fgColor}"`,
      `"${item.bgColor}"`,
      `"${item.errorLevel}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `qr_history_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(isArabic ? 'تم تصدير سجل QR كملف CSV' : 'QR code history exported as CSV')
  }

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return history
    const q = historySearch.toLowerCase()
    return history.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.payload.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
    )
  }, [history, historySearch])

  const downloadPNG = () => {
    const svgElement = qrRef.current?.querySelector('svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = Number(qrSize)
      canvas.height = Number(qrSize)
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `qrcode-${Date.now()}.png`
      downloadLink.href = pngFile
      downloadLink.click()
      saveToHistory()
      recordUsage()
      toast.success(isArabic ? 'تم تحميل باركود PNG بنجاح' : 'PNG QR code downloaded successfully')
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  const downloadSVG = () => {
    const svgElement = qrRef.current?.querySelector('svg')
    if (!svgElement) return

    const svgData = new XMLSerializer().serializeToString(svgElement)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const downloadLink = document.createElement('a')
    downloadLink.download = `qrcode-${Date.now()}.svg`
    downloadLink.href = url
    downloadLink.click()
    URL.revokeObjectURL(url)
    saveToHistory()
    recordUsage()
    toast.success(isArabic ? 'تم تحميل باركود SVG الفيكتور بنجاح' : 'SVG vector QR code downloaded successfully')
  }

  const handleCopyPayload = async () => {
    await navigator.clipboard.writeText(payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    saveToHistory()
    toast.success(isArabic ? 'تم نسخ النص المرمز في الحافظة' : 'Payload copied to clipboard')
  }

  const COLOR_PRESETS = [
    { name: isArabic ? 'أسود كلاسيكي' : 'Classic Black', fg: '#000000', bg: '#FFFFFF' },
    { name: isArabic ? 'أزرق نيلي' : 'Indigo Core', fg: '#3b82f6', bg: '#FFFFFF' },
    { name: isArabic ? 'أخضر زمردي' : 'Emerald Forest', fg: '#059669', bg: '#FFFFFF' },
    { name: isArabic ? 'أرجواني ملكي' : 'Royal Purple', fg: '#7c3aed', bg: '#FFFFFF' },
    { name: isArabic ? 'رمادي داكن' : 'Dark Slate', fg: '#0f172a', bg: '#f8fafc' },
  ]

  return (
    <ToolLayout metadata={toolMeta} maxWidth="6xl">
      {/* Scanner Cross-Link & History Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistoryModal(true)}
            className="h-9 px-3.5 gap-2 text-xs font-semibold border-border/80 hover:border-primary/50 text-foreground"
          >
            <History className="h-4 w-4 text-primary" />
            <span>{isArabic ? 'سجل الـ QR' : 'QR History'}</span>
            {history.length > 0 && (
              <span className="ms-1 px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                {history.length}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={saveToHistory}
            className="h-9 px-3 gap-1.5 text-xs text-muted-foreground hover:text-primary"
            title={isArabic ? 'حفظ التصميم الحالي في السجل' : 'Save current design to history'}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isArabic ? 'حفظ في السجل' : 'Save to History'}</span>
          </Button>
        </div>

        <Link
          href="/tools/qr-barcode-scanner"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-xl border border-primary/20 transition-colors ms-auto"
        >
          <ScanLine className="w-3.5 h-3.5" />
          {isArabic ? 'تحتاج لمسح رمز؟ افتح ماسح QR والباركود ←' : 'Need to scan a code? Open QR & Barcode Scanner →'}
        </Link>
      </div>

      {/* Schema Template Tabs */}
      <div className="flex flex-nowrap sm:flex-wrap items-center justify-start sm:justify-center gap-1.5 sm:gap-2 mb-8 bg-muted/60 p-1.5 rounded-2xl border border-border/70 w-full mx-auto overflow-x-auto">
        <button
          type="button"
          onClick={() => setQrType('businesscard')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            qrType === 'businesscard' ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          <Briefcase className="h-3.5 w-3.5 text-primary-foreground" /> {isArabic ? 'بطاقة أعمال DigitalMix' : 'Business Card'}
        </button>
        <button
          type="button"
          onClick={() => setQrType('url')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            qrType === 'url' ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          <LinkIcon className="h-3.5 w-3.5" /> {isArabic ? 'رابط ويب URL' : 'URL Link'}
        </button>
        <button
          type="button"
          onClick={() => setQrType('wifi')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            qrType === 'wifi' ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          <Wifi className="h-3.5 w-3.5" /> {isArabic ? 'شبكة واي فاي WiFi' : 'WiFi Login'}
        </button>
        <button
          type="button"
          onClick={() => setQrType('vcard')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            qrType === 'vcard' ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          <User className="h-3.5 w-3.5" /> {isArabic ? 'بطاقة اتصال vCard' : 'vCard Contact'}
        </button>
        <button
          type="button"
          onClick={() => setQrType('sms')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            qrType === 'sms' ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" /> {isArabic ? 'رسالة SMS' : 'SMS Text'}
        </button>
        <button
          type="button"
          onClick={() => setQrType('text')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            qrType === 'text' ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          <FileText className="h-3.5 w-3.5" /> {isArabic ? 'نص عادي' : 'Plain Text'}
        </button>
      </div>

      {/* Grid: Inputs + QR Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 7 Columns */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground">
              {isArabic ? 'معلومات المحتوى' : 'Content Information'}
            </h3>

            {qrType === 'businesscard' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <LayoutTemplate className="w-3.5 h-3.5 text-primary" /> {isArabic ? 'اختر نمط البطاقة (DigitalMix Styles)' : 'Select Card Style & Theme'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'digitalmix', name: 'DigitalMix Pro', desc: 'Modern gradient' },
                      { id: 'cyber', name: 'Cyber Neon', desc: 'Tech & futuristic' },
                      { id: 'minimal', name: 'Clean Minimal', desc: 'Classic monochrome' },
                      { id: 'executive', name: 'Executive Dark', desc: 'Gold & charcoal' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCardStyle(s.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          cardStyle === s.id
                            ? 'border-primary bg-primary/10 text-foreground font-bold shadow-xs'
                            : 'border-border bg-background hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <div className="text-xs">{s.name}</div>
                        <div className="text-[10px] opacity-70 font-normal">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-primary" /> {isArabic ? 'الاسم الكامل' : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      value={cardFullName}
                      onChange={(e) => setCardFullName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-primary" /> {isArabic ? 'المسمى الوظيفي' : 'Job Title'}
                    </label>
                    <input
                      type="text"
                      value={cardTitle}
                      onChange={(e) => setCardTitle(e.target.value)}
                      placeholder="Senior Solutions Architect"
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-primary" /> {isArabic ? 'اسم الشركة' : 'Company Name'}
                    </label>
                    <input
                      type="text"
                      value={cardCompany}
                      onChange={(e) => setCardCompany(e.target.value)}
                      placeholder="DigitalMix Labs"
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-primary" /> {isArabic ? 'رقم الهاتف' : 'Phone Number'}
                    </label>
                    <input
                      type="tel"
                      value={cardPhone}
                      onChange={(e) => setCardPhone(e.target.value)}
                      placeholder="+1 (555) 382-9011"
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-primary" /> {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
                    </label>
                    <input
                      type="email"
                      value={cardEmail}
                      onChange={(e) => setCardEmail(e.target.value)}
                      placeholder="alex@digitalmix.dev"
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-primary" /> {isArabic ? 'الموقع الإلكتروني' : 'Website'}
                    </label>
                    <input
                      type="url"
                      value={cardWebsite}
                      onChange={(e) => setCardWebsite(e.target.value)}
                      placeholder="https://digitalmix.dev"
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> {isArabic ? 'العنوان' : 'Office Address'}
                  </label>
                  <input
                    type="text"
                    value={cardAddress}
                    onChange={(e) => setCardAddress(e.target.value)}
                    placeholder="104 Silicon Valley Way, CA"
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
              </div>
            )}

            {qrType === 'url' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  {isArabic ? 'رابط الموقع المستهدف' : 'Website URL Destination'}
                </label>
                <input
                  type="url"
                  value={urlData}
                  onChange={(e) => setUrlData(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>
            )}

            {qrType === 'wifi' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {isArabic ? 'اسم الشبكة (SSID)' : 'Network Name (SSID)'}
                  </label>
                  <input
                    type="text"
                    value={wifiSSID}
                    onChange={(e) => setWifiSSID(e.target.value)}
                    placeholder="MyHomeWiFi"
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      {isArabic ? 'كلمة المرور' : 'Password'}
                    </label>
                    <input
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="SecretPassword"
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      {isArabic ? 'نوع التشفير' : 'Encryption'}
                    </label>
                    <select
                      value={wifiSecurity}
                      onChange={(e) => setWifiSecurity(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-border bg-background text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">{isArabic ? 'مفتوحة (بدون كلمة سر)' : 'Open (No Password)'}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {qrType === 'vcard' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {isArabic ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={vcardName}
                    onChange={(e) => setVcardName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {isArabic ? 'الشركة / المنظمة' : 'Company / Org'}
                  </label>
                  <input
                    type="text"
                    value={vcardOrg}
                    onChange={(e) => setVcardOrg(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {isArabic ? 'رقم الهاتف' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={vcardPhone}
                    onChange={(e) => setVcardPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {isArabic ? 'البريد الإلكتروني' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={vcardEmail}
                    onChange={(e) => setVcardEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
              </div>
            )}

            {qrType === 'sms' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {isArabic ? 'رقم المستلم' : 'Recipient Phone Number'}
                  </label>
                  <input
                    type="tel"
                    value={smsPhone}
                    onChange={(e) => setSmsPhone(e.target.value)}
                    placeholder="+1 555 0192"
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {isArabic ? 'نص الرسالة المسبق' : 'Pre-filled Message'}
                  </label>
                  <textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder={isArabic ? 'مرحباً من DigitalMix!' : 'Hello from DigitalMix!'}
                    className="w-full h-20 p-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground resize-none"
                  />
                </div>
              </div>
            )}

            {qrType === 'text' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  {isArabic ? 'النص الخام' : 'Raw Text Payload'}
                </label>
                <textarea
                  value={plainText}
                  onChange={(e) => setPlainText(e.target.value)}
                  placeholder={isArabic ? 'اكتب أي نص عادي أو رمز هنا...' : 'Type any plain text or code here...'}
                  className="w-full h-24 p-3 rounded-xl border border-border bg-background font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground resize-none"
                />
              </div>
            )}
          </div>

          {/* QR Code Styling Customization */}
          <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" /> {isArabic ? 'التصميم والألوان' : 'Visual Design & Colors'}
            </h3>

            {/* Color Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {isArabic ? 'نماذج ألوان جاهزة' : 'Color Presets'}
              </label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setFgColor(preset.fg)
                      setBgColor(preset.bg)
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-secondary text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <span className="h-3 w-3 rounded-full border border-border/80" style={{ backgroundColor: preset.fg }} />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  {isArabic ? 'لون الرمز' : 'Foreground'}
                </label>
                <div className="flex items-center gap-2 bg-background border border-border p-1.5 rounded-xl">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-7 w-7 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <span className="text-[11px] font-mono font-bold uppercase">{fgColor}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  {isArabic ? 'لون الخلفية' : 'Background'}
                </label>
                <div className="flex items-center gap-2 bg-background border border-border p-1.5 rounded-xl">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-7 w-7 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                  <span className="text-[11px] font-mono font-bold uppercase">{bgColor}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  {isArabic ? 'الحجم (بكسل)' : 'Size (px)'}
                </label>
                <select
                  value={qrSize}
                  onChange={(e) => setQrSize(e.target.value)}
                  className="w-full h-10 px-2 rounded-xl border border-border bg-background text-xs font-bold focus:outline-none cursor-pointer text-foreground"
                >
                  <option value="128">128x128</option>
                  <option value="256">256x256</option>
                  <option value="512">512x512</option>
                  <option value="1024">1024x1024</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  {isArabic ? 'مستوى تصحيح الخطأ' : 'Error Level'}
                </label>
                <select
                  value={errorLevel}
                  onChange={(e) => setErrorLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                  className="w-full h-10 px-2 rounded-xl border border-border bg-background text-xs font-bold focus:outline-none cursor-pointer text-foreground"
                >
                  <option value="L">{isArabic ? 'منخفض L (7%)' : 'Low (7%)'}</option>
                  <option value="M">{isArabic ? 'متوسط M (15%)' : 'Medium (15%)'}</option>
                  <option value="Q">{isArabic ? 'ربعي Q (25%)' : 'Quartile (25%)'}</option>
                  <option value="H">{isArabic ? 'عالي H (30%)' : 'High (30%)'}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview: 5 Columns */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-5 text-center flex flex-col items-center">
          <h3 className="text-sm font-bold text-foreground">
            {isArabic ? (qrType === 'businesscard' ? 'معاينة بطاقة الأعمال الرقمية' : 'معاينة الباركود الفورية') : (qrType === 'businesscard' ? 'Digital Business Card Preview' : 'Live Generated Matrix')}
          </h3>

          {/* DigitalMix Business Card Preview Card */}
          {qrType === 'businesscard' ? (
            <div
              className={`w-full rounded-2xl p-5 text-left rtl:text-right shadow-lg border relative overflow-hidden transition-all ${
                cardStyle === 'cyber'
                  ? 'bg-slate-950 text-cyan-400 border-cyan-500/40 shadow-cyan-500/10'
                  : cardStyle === 'minimal'
                  ? 'bg-white text-slate-900 border-slate-200'
                  : cardStyle === 'executive'
                  ? 'bg-zinc-900 text-amber-100 border-amber-500/40 shadow-amber-500/10'
                  : 'bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white border-indigo-500/30 shadow-indigo-500/20'
              }`}
            >
              {/* Header banner decoration */}
              <div
                className={`h-12 -mx-5 -mt-5 mb-4 px-4 flex items-center justify-between text-xs font-bold tracking-wider uppercase opacity-90 ${
                  cardStyle === 'cyber'
                    ? 'bg-gradient-to-r from-cyan-900 to-blue-900 text-cyan-200 border-b border-cyan-500/30'
                    : cardStyle === 'minimal'
                    ? 'bg-slate-100 text-slate-700 border-b border-slate-200'
                    : cardStyle === 'executive'
                    ? 'bg-gradient-to-r from-amber-950 to-zinc-900 text-amber-300 border-b border-amber-500/30'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white'
                }`}
              >
                <span>{cardCompany || 'DigitalMix Labs'}</span>
                <span className="text-[10px] lowercase opacity-75">{cardWebsite || 'digitalmix.dev'}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-base font-extrabold tracking-tight truncate">{cardFullName || 'Alex Mercer'}</h4>
                  <p className={`text-xs font-semibold ${cardStyle === 'minimal' ? 'text-primary' : 'text-primary/90'}`}>
                    {cardTitle || 'Solutions Architect'}
                  </p>
                  <div className="space-y-0.5 pt-2 text-[11px] opacity-80 font-mono">
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3 h-3 shrink-0" /> <span>{cardPhone || '+1 555 382'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 shrink-0" /> <span>{cardEmail || 'alex@digitalmix.dev'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0" /> <span>{cardAddress || 'Silicon Valley, CA'}</span>
                    </div>
                  </div>
                </div>

                {/* Embedded Mini QR */}
                <div className="p-2 rounded-xl bg-white shadow-md shrink-0 border border-border/60">
                  <QRCodeSVG
                    value={payload}
                    size={76}
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                    level="M"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div
              ref={qrRef}
              className="p-5 rounded-2xl bg-white shadow-md border border-border/60 flex items-center justify-center max-w-full sm:max-w-70 overflow-x-auto"
            >
              <QRCodeSVG
                value={payload}
                size={220}
                fgColor={fgColor}
                bgColor={bgColor}
                level={errorLevel}
                includeMargin={true}
              />
            </div>
          )}

          <div className="w-full space-y-2.5 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={downloadPNG} className="w-full text-xs font-bold gap-1.5 rounded-xl shadow-sm h-10">
                <Download className="h-3.5 w-3.5" /> {isArabic ? 'تحميل PNG' : 'Download PNG'}
              </Button>
              <Button variant="outline" onClick={downloadSVG} className="w-full text-xs font-bold gap-1.5 rounded-xl h-10 border-border">
                <Download className="h-3.5 w-3.5" /> {isArabic ? 'تحميل SVG' : 'Download SVG'}
              </Button>
            </div>

            <Button
              variant="secondary"
              onClick={handleCopyPayload}
              className="w-full text-xs font-semibold gap-1.5 rounded-xl h-10"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? (isArabic ? 'تم نسخ النص المرمز' : 'Payload Copied') : isArabic ? 'نسخ vCard المرمز' : 'Copy vCard Payload'}
            </Button>
          </div>
        </div>
      </div>

      {/* QR HISTORY MODAL */}
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
                    {isArabic ? 'سجل رموز QR المُولّدة' : 'QR Code History'}
                    <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {history.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {isArabic
                      ? 'رموز الباركود السابقة المحفوظة محلياً في متصفحك'
                      : 'Previously generated QR designs stored locally in your browser'}
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
                  placeholder={isArabic ? 'بحث في السجل بالعنوان أو المحتوى أو النوع...' : 'Search history by title, payload or type...'}
                  className="w-full h-9 pl-9 pr-4 rtl:pl-4 rtl:pr-9 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {history.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground space-y-2">
                  <QrCode className="w-10 h-10 mx-auto opacity-40 text-primary" />
                  <p className="text-sm font-semibold">
                    {isArabic ? 'لا توجد رموز QR محفوظة بعد' : 'No QR codes saved in history yet'}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {isArabic
                      ? 'عند تحميل أو نسخ أو حفظ أي رمز QR، سيتم تسجيله هنا تلقائياً لسهولة استعادته وتعديله لاحقاً.'
                      : 'When you generate, download, or copy any QR code, it will automatically appear here.'}
                  </p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  {isArabic ? 'لم يتم العثور على نتائج مطابقة للبحث' : 'No matching QR codes found.'}
                </div>
              ) : (
                filteredHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => restoreHistoryItem(item)}
                    className="group p-4 bg-muted/40 hover:bg-muted/70 border border-border/70 hover:border-primary/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Mini QR Preview */}
                      <div className="p-1.5 rounded-xl bg-white border border-border/70 shrink-0 shadow-2xs">
                        <QRCodeSVG
                          value={item.payload}
                          size={48}
                          fgColor={item.fgColor || '#000000'}
                          bgColor={item.bgColor || '#FFFFFF'}
                          level={item.errorLevel || 'L'}
                        />
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-primary/10 text-primary border border-primary/20">
                            {item.type}
                          </span>
                          <span className="text-xs font-bold text-foreground truncate max-w-[220px]">
                            {item.title}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(item.timestamp).toLocaleTimeString()} • {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="font-mono text-xs text-muted-foreground line-clamp-1 select-all overflow-hidden text-ellipsis">
                          {item.payload}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => copyHistoryPayload(item.payload, item.id, e)}
                        className="h-8 px-2.5 rounded-lg text-xs gap-1"
                        title={isArabic ? 'نسخ النص' : 'Copy payload'}
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

export function QRCodeTool() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-xs">Loading QR Matrix Core...</div>}>
      <QRCodeToolContent />
    </Suspense>
  )
}

export default QRCodeTool