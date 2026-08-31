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
  CreditCard,
  Bookmark,
  Save,
  FolderOpen,
  Globe,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Layers,
  Eye,
  Sliders,
  FileDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { useLanguage } from '@/lib/i18n/context'
import { logToolActivity } from '@/lib/history-service'

export interface CardThemeConfig {
  id: string
  name: string
  nameAr: string
  bgStart: string
  bgEnd: string
  textColor: string
  mutedColor: string
  accentColor: string
  borderColor: string
  qrBg: string
  qrFg: string
}

export const CARD_THEMES: CardThemeConfig[] = [
  {
    id: 'digitalmix',
    name: 'DigitalMix Pro',
    nameAr: 'ديجيتال ميكس برو',
    bgStart: '#0f172a',
    bgEnd: '#1e1b4b',
    textColor: '#ffffff',
    mutedColor: '#94a3b8',
    accentColor: '#38bdf8',
    borderColor: '#3b82f6',
    qrBg: '#ffffff',
    qrFg: '#0f172a',
  },
  {
    id: 'cyber',
    name: 'Cyber Neon',
    nameAr: 'سايبر نيون',
    bgStart: '#020617',
    bgEnd: '#082f49',
    textColor: '#22d3ee',
    mutedColor: '#38bdf8',
    accentColor: '#06b6d4',
    borderColor: '#0284c7',
    qrBg: '#ffffff',
    qrFg: '#020617',
  },
  {
    id: 'minimal',
    name: 'Clean Minimal',
    nameAr: 'مينيمل كلاسيكي',
    bgStart: '#ffffff',
    bgEnd: '#f8fafc',
    textColor: '#0f172a',
    mutedColor: '#64748b',
    accentColor: '#4f46e5',
    borderColor: '#e2e8f0',
    qrBg: '#ffffff',
    qrFg: '#0f172a',
  },
  {
    id: 'executive',
    name: 'Executive Dark',
    nameAr: 'تنفيذي فاخر',
    bgStart: '#18181b',
    bgEnd: '#09090b',
    textColor: '#fef3c7',
    mutedColor: '#a1a1aa',
    accentColor: '#f59e0b',
    borderColor: '#78350f',
    qrBg: '#ffffff',
    qrFg: '#18181b',
  },
  {
    id: 'custom',
    name: 'Custom Palette',
    nameAr: 'ألوان مخصصة بالكامل',
    bgStart: '#1e1b4b',
    bgEnd: '#312e81',
    textColor: '#ffffff',
    mutedColor: '#c7d2fe',
    accentColor: '#818cf8',
    borderColor: '#4338ca',
    qrBg: '#ffffff',
    qrFg: '#1e1b4b',
  },
]

export interface SavedBusinessCard {
  id: string
  name: string
  createdAt: number
  data: {
    vcardName: string
    vcardTitle: string
    vcardOrg: string
    vcardPhone: string
    vcardEmail: string
    vcardWebsite: string
    vcardAddress: string
    cardTheme: string
    cardBgStart: string
    cardBgEnd: string
    cardTextColor: string
    cardAccentColor: string
    cardBorderColor: string
    cardLayout: 'split-right' | 'split-left' | 'badge-top'
    cardBorderRadius: 'rounded' | 'pill' | 'sharp'
    showLogo: boolean
  }
}

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
    vcardTitle?: string
    vcardEmail?: string
    vcardPhone?: string
    vcardOrg?: string
    vcardWebsite?: string
    vcardAddress?: string
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

  // vCard & Digital Business Card States
  const [cardStyle, setCardStyle] = useState<'digitalmix' | 'cyber' | 'minimal' | 'executive'>('digitalmix')
  const [cardFullName, setCardFullName] = useState('Alex Mercer')
  const [cardTitle, setCardTitle] = useState('Senior Solutions Architect')
  const [cardCompany, setCardCompany] = useState('DigitalMix Labs')
  const [cardPhone, setCardPhone] = useState('+1 (555) 382-9011')
  const [cardEmail, setCardEmail] = useState('alex@digitalmix.dev')
  const [cardWebsite, setCardWebsite] = useState('https://digitalmix.dev')
  const [cardAddress, setCardAddress] = useState('104 Silicon Valley Way, CA')

  // Compatible alias getters / setters
  const vcardName = cardFullName
  const setVcardName = setCardFullName
  const vcardTitle = cardTitle
  const setVcardTitle = setCardTitle
  const vcardOrg = cardCompany
  const setVcardOrg = setCardCompany
  const vcardPhone = cardPhone
  const setVcardPhone = setCardPhone
  const vcardEmail = cardEmail
  const setVcardEmail = setCardEmail
  const vcardWebsite = cardWebsite
  const setVcardWebsite = setCardWebsite
  const vcardAddress = cardAddress
  const setVcardAddress = setCardAddress

  // Business Card Customizer States
  const [cardTheme, setCardTheme] = useState<string>('digitalmix')
  const [cardBgStart, setCardBgStart] = useState('#0f172a')
  const [cardBgEnd, setCardBgEnd] = useState('#1e1b4b')
  const [cardTextColor, setCardTextColor] = useState('#ffffff')
  const [cardAccentColor, setCardAccentColor] = useState('#38bdf8')
  const [cardBorderColor, setCardBorderColor] = useState('#3b82f6')
  const [cardLayout, setCardLayout] = useState<'split-right' | 'split-left' | 'badge-top'>('split-right')
  const [cardBorderRadius, setCardBorderRadius] = useState<'rounded' | 'pill' | 'sharp'>('rounded')
  const [showLogo, setShowLogo] = useState(true)
  const [activePreviewMode, setActivePreviewMode] = useState<'qr' | 'card'>('card')
  const [isGeneratingCard, setIsGeneratingCard] = useState(false)

  // Saved Business Cards (Templates)
  const [savedCards, setSavedCards] = useState<SavedBusinessCard[]>([])
  const [showSavedCardsModal, setShowSavedCardsModal] = useState(false)
  const [showSaveCardModal, setShowSaveCardModal] = useState(false)
  const [newCardPresetName, setNewCardPresetName] = useState('')

  // SMS States
  const [smsPhone, setSmsPhone] = useState('')
  const [smsMessage, setSmsMessage] = useState('')

  // Plain Text
  const [plainText, setPlainText] = useState('')

  // History state
  const [history, setHistory] = useState<QrHistoryItem[]>([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historySearch, setHistorySearch] = useState('')
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null)

  // Load history & saved cards from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('digitalmix_qr_history')
      if (saved) {
        setHistory(JSON.parse(saved))
      }
      const savedCardsData = localStorage.getItem('digitalmix_saved_business_cards')
      if (savedCardsData) {
        setSavedCards(JSON.parse(savedCardsData))
      }
    } catch {
      // ignore
    }
  }, [])

  // Sync theme changes to custom color pickers and visual styles
  const applyCardTheme = (themeId: string) => {
    setCardTheme(themeId)
    if (themeId === 'cyber' || themeId === 'minimal' || themeId === 'executive' || themeId === 'digitalmix') {
      setCardStyle(themeId)
    }
    const found = CARD_THEMES.find((t) => t.id === themeId)
    if (found && themeId !== 'custom') {
      setCardBgStart(found.bgStart)
      setCardBgEnd(found.bgEnd)
      setCardTextColor(found.textColor)
      setCardAccentColor(found.accentColor)
      setCardBorderColor(found.borderColor)
    }
  }

  // Active theme configuration
  const currentThemeConfig = useMemo<CardThemeConfig>(() => {
    if (cardTheme === 'custom') {
      return {
        id: 'custom',
        name: 'Custom',
        nameAr: 'مخصص',
        bgStart: cardBgStart,
        bgEnd: cardBgEnd,
        textColor: cardTextColor,
        mutedColor: cardTextColor + 'aa',
        accentColor: cardAccentColor,
        borderColor: cardBorderColor,
        qrBg: '#ffffff',
        qrFg: '#0f172a',
      }
    }
    const found = CARD_THEMES.find((t) => t.id === cardTheme)
    return found || CARD_THEMES[0]
  }, [cardTheme, cardBgStart, cardBgEnd, cardTextColor, cardAccentColor, cardBorderColor])

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
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `N:${vcardName || 'Contact'}`,
          `FN:${vcardName || 'Contact'}`,
          vcardOrg ? `ORG:${vcardOrg}` : '',
          vcardTitle ? `TITLE:${vcardTitle}` : '',
          vcardPhone ? `TEL:${vcardPhone}` : '',
          vcardEmail ? `EMAIL:${vcardEmail}` : '',
          vcardWebsite ? `URL:${vcardWebsite}` : '',
          vcardAddress ? `ADR:;;${vcardAddress};;;;` : '',
          'END:VCARD',
        ]
          .filter(Boolean)
          .join('\n')
      case 'sms':
        return `SMSTO:${smsPhone}:${smsMessage}`
      case 'text':
      default:
        return plainText || 'DigitalMix Tools'
    }
  }

  const payload = getEncodedPayload()

  // Save current card as custom preset
  const handleSaveCustomCard = () => {
    const cardTitle = newCardPresetName.trim() || vcardName || (isArabic ? 'بطاقة مخصصة' : 'Custom Card')
    const newCard: SavedBusinessCard = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: cardTitle,
      createdAt: Date.now(),
      data: {
        vcardName,
        vcardTitle,
        vcardOrg,
        vcardPhone,
        vcardEmail,
        vcardWebsite,
        vcardAddress,
        cardTheme,
        cardBgStart,
        cardBgEnd,
        cardTextColor,
        cardAccentColor,
        cardBorderColor,
        cardLayout,
        cardBorderRadius,
        showLogo,
      },
    }

    const updated = [newCard, ...savedCards.filter((c) => c.name !== cardTitle)]
    setSavedCards(updated)
    try {
      localStorage.setItem('digitalmix_saved_business_cards', JSON.stringify(updated))
    } catch {
      // ignore
    }
    setShowSaveCardModal(false)
    setNewCardPresetName('')
    toast.success(isArabic ? `تم حفظ البطاقة (${cardTitle}) بنجاح!` : `Saved custom card: "${cardTitle}"`)
  }

  const handleLoadSavedCard = (card: SavedBusinessCard) => {
    setQrType('vcard')
    setActivePreviewMode('card')
    setVcardName(card.data.vcardName || '')
    setVcardTitle(card.data.vcardTitle || '')
    setVcardOrg(card.data.vcardOrg || '')
    setVcardPhone(card.data.vcardPhone || '')
    setVcardEmail(card.data.vcardEmail || '')
    setVcardWebsite(card.data.vcardWebsite || '')
    setVcardAddress(card.data.vcardAddress || '')
    setCardTheme(card.data.cardTheme || 'midnight')
    setCardBgStart(card.data.cardBgStart || '#0f172a')
    setCardBgEnd(card.data.cardBgEnd || '#1e293b')
    setCardTextColor(card.data.cardTextColor || '#f8fafc')
    setCardAccentColor(card.data.cardAccentColor || '#38bdf8')
    setCardBorderColor(card.data.cardBorderColor || '#334155')
    setCardLayout(card.data.cardLayout || 'split-right')
    setCardBorderRadius(card.data.cardBorderRadius || 'rounded')
    setShowLogo(card.data.showLogo !== false)
    setShowSavedCardsModal(false)
    toast.success(isArabic ? `تم استعادة البطاقة: ${card.name}` : `Loaded custom card: ${card.name}`)
  }

  const handleDeleteSavedCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = savedCards.filter((c) => c.id !== id)
    setSavedCards(updated)
    try {
      localStorage.setItem('digitalmix_saved_business_cards', JSON.stringify(updated))
    } catch {
      // ignore
    }
    toast.success(isArabic ? 'تم حذف البطاقة من القوالب' : 'Card template deleted')
  }

  // Save to history helper
  const saveToHistory = useCallback(() => {
    const currentPayload = getEncodedPayload()
    if (!currentPayload.trim()) return

    let itemTitle = 'QR Code'
    if (qrType === 'url') itemTitle = urlData || 'Website URL'
    else if (qrType === 'wifi') itemTitle = wifiSSID ? `WiFi: ${wifiSSID}` : 'WiFi Network'
    else if (qrType === 'vcard') itemTitle = vcardName ? `Contact: ${vcardName}` : 'vCard Contact'
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

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    if (w < 2 * r) r = w / 2
    if (h < 2 * r) r = h / 2
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  const downloadBusinessCardPNG = async () => {
    try {
      setIsGeneratingCard(true)
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 700
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas 2D context not available')

      const radius = cardBorderRadius === 'pill' ? 44 : cardBorderRadius === 'sharp' ? 0 : 26

      // 1. Draw base clipping & gradient background
      ctx.save()
      drawRoundedRect(ctx, 0, 0, 1200, 700, radius)
      ctx.clip()

      const bgGrad = ctx.createLinearGradient(0, 0, 1200, 700)
      bgGrad.addColorStop(0, currentThemeConfig.bgStart)
      bgGrad.addColorStop(1, currentThemeConfig.bgEnd)
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, 1200, 700)

      // 2. Decorative geometric accents
      ctx.fillStyle = currentThemeConfig.accentColor + '18'
      ctx.beginPath()
      ctx.arc(1140, 80, 260, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(80, 640, 190, 0, Math.PI * 2)
      ctx.fill()

      // 3. Card Outer Border
      ctx.strokeStyle = currentThemeConfig.borderColor
      ctx.lineWidth = 4
      drawRoundedRect(ctx, 2, 2, 1196, 696, radius)
      ctx.stroke()
      ctx.restore()

      // 4. Render QR Code SVG to Image
      const svgElement = qrRef.current?.querySelector('svg')
      let qrImg: HTMLImageElement | null = null
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement)
        const qrDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
        qrImg = new Image()
        await new Promise<void>((resolve) => {
          if (!qrImg) return resolve()
          qrImg.onload = () => resolve()
          qrImg.onerror = () => resolve()
          qrImg.src = qrDataUrl
        })
      }

      // 5. Layout rendering
      const isSplitLeft = cardLayout === 'split-left'
      const isBadgeTop = cardLayout === 'badge-top'

      if (isBadgeTop) {
        // Centered Badge Top Layout
        let topY = 60
        if (qrImg) {
          const qrBoxSize = 220
          const qrX = (1200 - qrBoxSize) / 2
          ctx.fillStyle = '#ffffff'
          drawRoundedRect(ctx, qrX, topY, qrBoxSize, qrBoxSize, 20)
          ctx.fill()
          ctx.drawImage(qrImg, qrX + 12, topY + 12, 196, 196)
          topY += qrBoxSize + 40
        }

        // Full Name
        ctx.fillStyle = currentThemeConfig.textColor
        ctx.font = 'bold 40px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(vcardName || 'Your Full Name', 600, topY)

        // Title & Org
        topY += 34
        if (vcardTitle || vcardOrg) {
          ctx.fillStyle = currentThemeConfig.accentColor
          ctx.font = '600 22px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
          const subtitle = [vcardTitle, vcardOrg].filter(Boolean).join(' • ')
          ctx.fillText(subtitle, 600, topY)
        }

        // Contact info horizontal pills
        topY += 46
        const contacts = [
          vcardPhone ? `Tel: ${vcardPhone}` : '',
          vcardEmail ? `Email: ${vcardEmail}` : '',
          vcardWebsite ? `Web: ${vcardWebsite.replace(/^https?:\/\//, '')}` : '',
          vcardAddress ? `Loc: ${vcardAddress}` : '',
        ].filter(Boolean)

        ctx.font = '500 17px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
        ctx.fillStyle = currentThemeConfig.textColor
        const contactText = contacts.slice(0, 3).join('   |   ')
        ctx.fillText(contactText, 600, topY)
      } else {
        // Horizontal Layout (Split Right or Split Left)
        const qrBoxSize = 260
        const qrX = isSplitLeft ? 90 : 850
        const qrY = 175

        if (qrImg) {
          ctx.fillStyle = '#ffffff'
          drawRoundedRect(ctx, qrX, qrY, qrBoxSize, qrBoxSize, 22)
          ctx.fill()
          ctx.drawImage(qrImg, qrX + 15, qrY + 15, 230, 230)

          ctx.fillStyle = currentThemeConfig.mutedColor
          ctx.font = '600 13px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(
            isArabic ? 'امسح لحفظ جهة الاتصال' : 'Scan to Save Contact',
            qrX + qrBoxSize / 2,
            qrY + qrBoxSize + 28
          )
        }

        // Details Side
        const textX = isSplitLeft ? 400 : 90
        ctx.textAlign = 'left'

        let curY = 110
        if (showLogo && vcardName) {
          const initials = vcardName
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase()

          ctx.fillStyle = currentThemeConfig.accentColor
          drawRoundedRect(ctx, textX, curY - 34, 52, 52, 14)
          ctx.fill()

          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 22px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(initials, textX + 26, curY + 1)
          ctx.textAlign = 'left'

          curY += 52
        }

        // Full Name
        ctx.fillStyle = currentThemeConfig.textColor
        ctx.font = 'bold 42px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
        ctx.fillText(vcardName || 'Your Full Name', textX, curY)

        // Job Title
        if (vcardTitle) {
          curY += 34
          ctx.fillStyle = currentThemeConfig.accentColor
          ctx.font = '600 22px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
          ctx.fillText(vcardTitle, textX, curY)
        }

        // Company / Org
        if (vcardOrg) {
          curY += 28
          ctx.fillStyle = currentThemeConfig.textColor
          ctx.font = 'bold 20px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
          ctx.fillText(vcardOrg, textX, curY)
        }

        // Contact info list
        const contactItems = [
          vcardPhone ? { label: 'Phone', value: vcardPhone } : null,
          vcardEmail ? { label: 'Email', value: vcardEmail } : null,
          vcardWebsite ? { label: 'Website', value: vcardWebsite.replace(/^https?:\/\//, '') } : null,
          vcardAddress ? { label: 'Location', value: vcardAddress } : null,
        ].filter(Boolean)

        if (contactItems.length > 0) {
          // Divider Line
          curY += 24
          ctx.strokeStyle = currentThemeConfig.borderColor
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(textX, curY)
          ctx.lineTo(textX + 420, curY)
          ctx.stroke()

          curY += 36
          contactItems.forEach((item) => {
            if (!item) return
            ctx.fillStyle = currentThemeConfig.accentColor
            ctx.font = 'bold 15px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
            ctx.fillText(`• ${item.label}:`, textX, curY)

            ctx.fillStyle = currentThemeConfig.textColor
            ctx.font = '500 16px system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
            ctx.fillText(item.value, textX + 105, curY)
            curY += 28
          })
        }
      }

      // Convert Canvas to Blob / PNG and Download
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      const downloadLink = document.createElement('a')
      const cleanName = (vcardName || 'business-card').toLowerCase().replace(/[^a-z0-9]/g, '-')
      downloadLink.download = `${cleanName}-card-${Date.now()}.png`
      downloadLink.href = dataUrl
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)

      saveToHistory()
      recordUsage()
      toast.success(isArabic ? 'تم تحميل بطاقة الأعمال بنجاح!' : 'Business Card downloaded successfully!')
    } catch (err) {
      console.error('Business card export error:', err)
      toast.error(isArabic ? 'حدث خطأ أثناء إنشاء البطاقة' : 'Failed to generate business card image')
    } finally {
      setIsGeneratingCard(false)
    }
  }

  const downloadVCardFile = () => {
    try {
      const vcardData = getEncodedPayload()
      const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const safeName = (vcardName || 'contact').toLowerCase().replace(/[^a-z0-9]/g, '-')
      link.href = url
      link.download = `${safeName}.vcf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      saveToHistory()
      recordUsage()
      toast.success(isArabic ? 'تم تحميل ملف جهة الاتصال (.vcf)' : 'vCard contact file (.vcf) downloaded')
    } catch {
      toast.error('Failed to download vCard file')
    }
  }

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
          onClick={() => {
            setQrType('url')
            setActivePreviewMode('qr')
          }}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            qrType === 'url' ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          <LinkIcon className="h-3.5 w-3.5" /> {isArabic ? 'رابط ويب URL' : 'URL Link'}
        </button>
        <button
          type="button"
          onClick={() => {
            setQrType('wifi')
            setActivePreviewMode('qr')
          }}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            qrType === 'wifi' ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          <Wifi className="h-3.5 w-3.5" /> {isArabic ? 'شبكة واي فاي WiFi' : 'WiFi Login'}
        </button>
        <button
          type="button"
          onClick={() => {
            setQrType('vcard')
            setActivePreviewMode('card')
          }}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            qrType === 'vcard' ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" /> {isArabic ? 'بطاقة أعمال vCard' : 'vCard Business Card'}
        </button>
        <button
          type="button"
          onClick={() => {
            setQrType('sms')
            setActivePreviewMode('qr')
          }}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            qrType === 'sms' ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" /> {isArabic ? 'رسالة SMS' : 'SMS Text'}
        </button>
        <button
          type="button"
          onClick={() => {
            setQrType('text')
            setActivePreviewMode('qr')
          }}
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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                {qrType === 'vcard' ? <CreditCard className="h-4 w-4 text-primary" /> : <Palette className="h-4 w-4 text-primary" />}
                {qrType === 'vcard'
                  ? isArabic
                    ? 'بيانات بطاقة الأعمال (vCard Details)'
                    : 'Business Card Contact Information'
                  : isArabic
                    ? 'معلومات المحتوى'
                    : 'Content Information'}
              </h3>
            </div>

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
              <div className="space-y-4">
                {/* Quick Examples / Presets */}
                <div className="p-3 bg-muted/40 rounded-xl border border-border/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles size={13} className="text-primary" />
                      {isArabic ? 'أمثلة ونماذج سريعة:' : 'Quick Card Examples:'}
                    </span>
                    {(vcardName || vcardPhone || vcardEmail || vcardOrg || vcardTitle || vcardWebsite || vcardAddress) && (
                      <button
                        type="button"
                        onClick={() => {
                          setVcardName('')
                          setVcardTitle('')
                          setVcardOrg('')
                          setVcardPhone('')
                          setVcardEmail('')
                          setVcardWebsite('')
                          setVcardAddress('')
                          toast.success(isArabic ? 'تم مسح كافة الحقول' : 'Cleared all fields')
                        }}
                        className="text-[11px] font-semibold text-destructive hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} />
                        {isArabic ? 'مسح كافة الحقول' : 'Clear All Fields'}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setVcardName('Alex Mercer')
                        setVcardTitle('Senior Solutions Architect')
                        setVcardOrg('DigitalMix Labs')
                        setVcardPhone('+1 (555) 382-9011')
                        setVcardEmail('alex@digitalmix.dev')
                        setVcardWebsite('https://digitalmix.dev')
                        setVcardAddress('104 Silicon Valley Way, CA')
                        applyCardTheme('digitalmix')
                        toast.success(isArabic ? 'تم تطبيق نموذج Alex Mercer' : 'Loaded Alex Mercer preset')
                      }}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-background border border-border/80 hover:border-primary/50 text-foreground hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      Alex Mercer (Tech)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVcardName('Sarah Jenkins')
                        setVcardTitle('VP of Growth & Strategy')
                        setVcardOrg('Nova Ventures')
                        setVcardPhone('+1 (555) 789-2044')
                        setVcardEmail('sarah@novaventures.io')
                        setVcardWebsite('https://novaventures.io')
                        setVcardAddress('New York, NY • USA')
                        applyCardTheme('minimal')
                        toast.success(isArabic ? 'تم تطبيق نموذج Sarah Jenkins' : 'Loaded Sarah Jenkins preset')
                      }}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-background border border-border/80 hover:border-primary/50 text-foreground hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      Sarah Jenkins (Growth)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVcardName('Dr. Marcus Chen')
                        setVcardTitle('Medical Director & Founder')
                        setVcardOrg('OmniHealth AI')
                        setVcardPhone('+1 (555) 492-1188')
                        setVcardEmail('marcus@omnihealth.org')
                        setVcardWebsite('https://omnihealth.org')
                        setVcardAddress('Boston, MA • USA')
                        applyCardTheme('executive')
                        toast.success(isArabic ? 'تم تطبيق نموذج Dr. Marcus Chen' : 'Loaded Dr. Marcus Chen preset')
                      }}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-background border border-border/80 hover:border-primary/50 text-foreground hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      Dr. Marcus Chen (Executive)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <User size={13} className="text-primary" /> {isArabic ? 'الاسم الكامل' : 'Full Name'}
                      </label>
                      {vcardName && (
                        <button
                          type="button"
                          onClick={() => setVcardName('')}
                          className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5 cursor-pointer"
                        >
                          <X size={11} /> {isArabic ? 'حذف' : 'Clear'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={vcardName}
                        onChange={(e) => setVcardName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full h-11 px-3 pe-8 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                      />
                      {vcardName && (
                        <button
                          type="button"
                          onClick={() => setVcardName('')}
                          className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                          title={isArabic ? 'مسح الحقل' : 'Clear'}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Job Title */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Briefcase size={13} className="text-primary" /> {isArabic ? 'المسمى الوظيفي (اختياري)' : 'Job Title / Role (Optional)'}
                      </label>
                      {vcardTitle && (
                        <button
                          type="button"
                          onClick={() => setVcardTitle('')}
                          className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5 cursor-pointer"
                        >
                          <X size={11} /> {isArabic ? 'حذف' : 'Clear'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={vcardTitle}
                        onChange={(e) => setVcardTitle(e.target.value)}
                        placeholder="Senior Full-Stack Engineer"
                        className="w-full h-11 px-3 pe-8 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                      />
                      {vcardTitle && (
                        <button
                          type="button"
                          onClick={() => setVcardTitle('')}
                          className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                          title={isArabic ? 'مسح الحقل' : 'Clear'}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Company / Organization */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Layers size={13} className="text-primary" /> {isArabic ? 'الشركة / المؤسسة (اختياري)' : 'Company / Organization (Optional)'}
                      </label>
                      {vcardOrg && (
                        <button
                          type="button"
                          onClick={() => setVcardOrg('')}
                          className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5 cursor-pointer"
                        >
                          <X size={11} /> {isArabic ? 'حذف' : 'Clear'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={vcardOrg}
                        onChange={(e) => setVcardOrg(e.target.value)}
                        placeholder="Acme Technologies"
                        className="w-full h-11 px-3 pe-8 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                      />
                      {vcardOrg && (
                        <button
                          type="button"
                          onClick={() => setVcardOrg('')}
                          className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                          title={isArabic ? 'مسح الحقل' : 'Clear'}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Phone size={13} className="text-primary" /> {isArabic ? 'رقم الهاتف (اختياري)' : 'Phone Number (Optional)'}
                      </label>
                      {vcardPhone && (
                        <button
                          type="button"
                          onClick={() => setVcardPhone('')}
                          className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5 cursor-pointer"
                        >
                          <X size={11} /> {isArabic ? 'حذف الرقم' : 'Clear'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="tel"
                        value={vcardPhone}
                        onChange={(e) => setVcardPhone(e.target.value)}
                        placeholder="+1 (555) 234-5678"
                        className="w-full h-11 px-3 pe-8 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                      />
                      {vcardPhone && (
                        <button
                          type="button"
                          onClick={() => setVcardPhone('')}
                          className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                          title={isArabic ? 'حذف رقم الهاتف من البطاقة' : 'Remove phone number from card'}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Mail size={13} className="text-primary" /> {isArabic ? 'البريد الإلكتروني (اختياري)' : 'Email Address (Optional)'}
                      </label>
                      {vcardEmail && (
                        <button
                          type="button"
                          onClick={() => setVcardEmail('')}
                          className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5 cursor-pointer"
                        >
                          <X size={11} /> {isArabic ? 'حذف' : 'Clear'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        value={vcardEmail}
                        onChange={(e) => setVcardEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full h-11 px-3 pe-8 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                      />
                      {vcardEmail && (
                        <button
                          type="button"
                          onClick={() => setVcardEmail('')}
                          className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                          title={isArabic ? 'مسح البريد' : 'Clear'}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Website URL */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Globe size={13} className="text-primary" /> {isArabic ? 'الموقع الإلكتروني (اختياري)' : 'Website URL (Optional)'}
                      </label>
                      {vcardWebsite && (
                        <button
                          type="button"
                          onClick={() => setVcardWebsite('')}
                          className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5 cursor-pointer"
                        >
                          <X size={11} /> {isArabic ? 'حذف' : 'Clear'}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="url"
                        value={vcardWebsite}
                        onChange={(e) => setVcardWebsite(e.target.value)}
                        placeholder="https://johndoe.dev"
                        className="w-full h-11 px-3 pe-8 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                      />
                      {vcardWebsite && (
                        <button
                          type="button"
                          onClick={() => setVcardWebsite('')}
                          className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                          title={isArabic ? 'مسح الموقع' : 'Clear'}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address / Location */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <MapPin size={13} className="text-primary" /> {isArabic ? 'الموقع / العنوان (اختياري)' : 'Address / Location (Optional)'}
                    </label>
                    {vcardAddress && (
                      <button
                        type="button"
                        onClick={() => setVcardAddress('')}
                        className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5 cursor-pointer"
                      >
                        <X size={11} /> {isArabic ? 'حذف' : 'Clear'}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={vcardAddress}
                      onChange={(e) => setVcardAddress(e.target.value)}
                      placeholder="San Francisco, CA • USA"
                      className="w-full h-11 px-3 pe-8 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                    {vcardAddress && (
                      <button
                        type="button"
                        onClick={() => setVcardAddress('')}
                        className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-destructive cursor-pointer"
                        title={isArabic ? 'مسح العنوان' : 'Clear'}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
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

          {/* DEDICATED BUSINESS CARD CUSTOMIZER (when in vCard mode) */}
          {qrType === 'vcard' ? (
            <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" /> {isArabic ? 'تخصيص ثيم وتصميم البطاقة' : 'Card Theme & Visual Customizer'}
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                  {isArabic ? 'تخصيص كامل 100%' : 'Full Customization'}
                </span>
              </div>

              {/* Theme Presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  {isArabic ? 'نماذج وثيمات البطاقة الجاهزة' : 'Card Color Themes'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {CARD_THEMES.map((theme) => {
                    const isSelected = cardTheme === theme.id
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => applyCardTheme(theme.id)}
                        className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer flex flex-col gap-2 ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/30 bg-primary/5 shadow-xs'
                            : 'border-border/70 bg-background hover:bg-muted/50'
                        }`}
                      >
                        <div
                          className="h-7 w-full rounded-lg border border-border/50 flex items-center justify-end px-2"
                          style={{
                            background: `linear-gradient(135deg, ${theme.bgStart}, ${theme.bgEnd})`,
                          }}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-white/60"
                            style={{ backgroundColor: theme.accentColor }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground truncate">
                          {isArabic ? theme.nameAr : theme.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Theme Pickers (if custom selected) */}
              {cardTheme === 'custom' && (
                <div className="p-4 bg-muted/40 rounded-xl border border-border/70 space-y-3 animate-in fade-in">
                  <div className="text-xs font-bold text-foreground">
                    {isArabic ? 'تخصيص ألوان البطاقة يدوياً' : 'Custom Palette Colors'}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">BG Gradient 1</label>
                      <div className="flex items-center gap-1.5 bg-background border border-border p-1 rounded-lg">
                        <input
                          type="color"
                          value={cardBgStart}
                          onChange={(e) => setCardBgStart(e.target.value)}
                          className="h-6 w-6 rounded-md border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-[10px] font-mono font-bold uppercase">{cardBgStart}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">BG Gradient 2</label>
                      <div className="flex items-center gap-1.5 bg-background border border-border p-1 rounded-lg">
                        <input
                          type="color"
                          value={cardBgEnd}
                          onChange={(e) => setCardBgEnd(e.target.value)}
                          className="h-6 w-6 rounded-md border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-[10px] font-mono font-bold uppercase">{cardBgEnd}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Text Color</label>
                      <div className="flex items-center gap-1.5 bg-background border border-border p-1 rounded-lg">
                        <input
                          type="color"
                          value={cardTextColor}
                          onChange={(e) => setCardTextColor(e.target.value)}
                          className="h-6 w-6 rounded-md border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-[10px] font-mono font-bold uppercase">{cardTextColor}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Accent Color</label>
                      <div className="flex items-center gap-1.5 bg-background border border-border p-1 rounded-lg">
                        <input
                          type="color"
                          value={cardAccentColor}
                          onChange={(e) => {
                            setCardAccentColor(e.target.value)
                            setCardBorderColor(e.target.value + '66')
                          }}
                          className="h-6 w-6 rounded-md border-0 cursor-pointer bg-transparent"
                        />
                        <span className="text-[10px] font-mono font-bold uppercase">{cardAccentColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Layout & Style Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {isArabic ? 'تنسيق البطاقة' : 'Card Layout'}
                  </label>
                  <select
                    value={cardLayout}
                    onChange={(e) => setCardLayout(e.target.value as any)}
                    className="w-full h-10 px-2.5 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none cursor-pointer text-foreground"
                  >
                    <option value="split-right">{isArabic ? 'باركود يمين • نصوص يسار' : 'QR on Right • Details Left'}</option>
                    <option value="split-left">{isArabic ? 'باركود يسار • نصوص يمين' : 'QR on Left • Details Right'}</option>
                    <option value="badge-top">{isArabic ? 'شارة باركود علوية بالمنتصف' : 'Centered Top Badge'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {isArabic ? 'انحناء الحواف' : 'Border Radius'}
                  </label>
                  <select
                    value={cardBorderRadius}
                    onChange={(e) => setCardBorderRadius(e.target.value as any)}
                    className="w-full h-10 px-2.5 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none cursor-pointer text-foreground"
                  >
                    <option value="rounded">{isArabic ? 'حواف منحنية أنيقة' : 'Smooth Rounded'}</option>
                    <option value="pill">{isArabic ? 'حواف دائرية كبيرة' : 'Modern Pill'}</option>
                    <option value="sharp">{isArabic ? 'حواف حادة كلاسيكية' : 'Sharp Modern'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {isArabic ? 'رمز الحروف الأولى' : 'Monogram Avatar'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLogo(!showLogo)}
                    className={`w-full h-10 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      showLogo
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    <span>{showLogo ? (isArabic ? 'الشارة مفعلة' : 'Avatar ON') : isArabic ? 'الشارة مخفية' : 'Avatar OFF'}</span>
                    <Check size={14} className={showLogo ? 'opacity-100' : 'opacity-0'} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Standard QR Code Styling Customization (for URL, WiFi, SMS, Text) */
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
          )}
        </div>

        {/* Right Preview Column: 5 Columns */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-5 flex flex-col items-center">
          {/* Preview View Mode Switcher */}
          <div className="w-full flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" /> {isArabic ? 'المعاينة الحية' : 'Live Preview'}
            </h3>

            {qrType === 'vcard' && (
              <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActivePreviewMode('card')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    activePreviewMode === 'card'
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isArabic ? 'بطاقة أعمال' : 'Business Card'}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewMode('qr')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    activePreviewMode === 'qr'
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isArabic ? 'رمز QR فقط' : 'QR Matrix'}
                </button>
              </div>
            )}
          </div>

          {/* DigitalMix Business Card Preview Card */}
          {qrType === 'vcard' && activePreviewMode === 'card' ? (
            <div className="w-full space-y-4">
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
                  <span>{cardCompany || vcardOrg || 'DigitalMix Labs'}</span>
                  <span className="text-[10px] lowercase opacity-75">
                    {(cardWebsite || vcardWebsite || 'https://digitalmix.dev').replace(/^https?:\/\//, '')}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-base font-extrabold tracking-tight truncate">
                      {cardFullName || vcardName || 'Alex Mercer'}
                    </h4>
                    <p className={`text-xs font-semibold ${cardStyle === 'minimal' ? 'text-primary' : 'text-primary/90'}`}>
                      {cardTitle || vcardTitle || 'Solutions Architect'}
                    </p>
                    <div className="space-y-0.5 pt-2 text-[11px] opacity-80 font-mono">
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3 h-3 shrink-0" /> <span>{cardPhone || vcardPhone || '+1 (555) 382-9011'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 shrink-0" /> <span>{cardEmail || vcardEmail || 'alex@digitalmix.dev'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0" /> <span>{cardAddress || vcardAddress || '104 Silicon Valley Way, CA'}</span>
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

              {/* Business Card Action Buttons */}
              <div className="w-full space-y-2 pt-1">
                <Button
                  onClick={downloadBusinessCardPNG}
                  disabled={isGeneratingCard}
                  className="w-full text-xs font-bold gap-2 rounded-xl shadow-md h-11 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                >
                  <FileDown className="h-4 w-4" />
                  {isGeneratingCard
                    ? isArabic
                      ? 'جاري إنشاء البطاقة...'
                      : 'Generating Card...'
                    : isArabic
                      ? 'تحميل بطاقة الأعمال عالية الدقة (PNG)'
                      : 'Download Business Card (PNG)'}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={downloadVCardFile}
                    className="w-full text-xs font-semibold gap-1.5 rounded-xl h-9 border-border cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {isArabic ? 'تحميل جهة الاتصال (.vcf)' : 'Download .VCF File'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowSaveCardModal(true)}
                    className="w-full text-xs font-semibold gap-1.5 rounded-xl h-9 border-border text-foreground cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5 text-amber-500" />
                    {isArabic ? 'حفظ هذا التصميم' : 'Save Custom Card'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* STANDARD QR CODE MATRIX PREVIEW */
            <div className="w-full space-y-4 flex flex-col items-center">
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

              <div className="w-full space-y-2.5 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={downloadPNG} className="w-full text-xs font-bold gap-1.5 rounded-xl shadow-sm h-10">
                    <Download className="h-3.5 w-3.5" /> {isArabic ? 'تحميل PNG' : 'Download PNG'}
                  </Button>
                  <Button variant="outline" onClick={downloadSVG} className="w-full text-xs font-bold gap-1.5 rounded-xl h-10 border-border">
                    <Download className="h-3.5 w-3.5" /> {isArabic ? 'تحميل SVG' : 'Download SVG'}
                  </Button>
                </div>

                {qrType === 'vcard' && (
                  <Button
                    variant="outline"
                    onClick={downloadBusinessCardPNG}
                    disabled={isGeneratingCard}
                    className="w-full text-xs font-bold gap-1.5 rounded-xl h-10 border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    {isArabic ? 'تحميل بطاقة الأعمال (PNG)' : 'Download Business Card'}
                  </Button>
                )}

                <Button
                  variant="secondary"
                  onClick={handleCopyPayload}
                  className="w-full text-xs font-semibold gap-1.5 rounded-xl h-10"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? (isArabic ? 'تم نسخ النص المرمز' : 'Payload Copied') : isArabic ? 'نسخ النص المرمز' : 'Copy Raw Encoded Text'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden SVG Anchor for Canvas Export */}
      <div className="hidden">
        <div ref={qrRef}>
          <QRCodeSVG
            value={payload}
            size={400}
            fgColor={qrType === 'vcard' ? '#000000' : fgColor}
            bgColor={qrType === 'vcard' ? '#FFFFFF' : bgColor}
            level={errorLevel}
            includeMargin={false}
          />
        </div>
      </div>

      {/* SAVE CUSTOM CARD MODAL */}
      {showSaveCardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <Bookmark size={18} />
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {isArabic ? 'حفظ بطاقة الأعمال المخصصة' : 'Save Custom Card Template'}
                </h3>
              </div>
              <button
                onClick={() => setShowSaveCardModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                {isArabic ? 'اسم القالب للرجوع إليه لاحقاً' : 'Template Title / Name'}
              </label>
              <input
                type="text"
                value={newCardPresetName}
                onChange={(e) => setNewCardPresetName(e.target.value)}
                placeholder={vcardName ? `${vcardName}'s Card` : 'e.g. Work Tech Card'}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                {isArabic
                  ? 'سيتم حفظ كافة البيانات والألوان والتنسيقات في متصفحك للوصول إليها في أي وقت.'
                  : 'Saves your complete contact details, colors, and layout locally in your browser.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowSaveCardModal(false)}
                className="rounded-xl text-xs"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                onClick={handleSaveCustomCard}
                className="rounded-xl text-xs font-bold gap-1.5"
              >
                <Save size={14} />
                {isArabic ? 'حفظ القالب' : 'Save Template'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SAVED BUSINESS CARDS LIBRARY MODAL */}
      {showSavedCardsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <FolderOpen size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    {isArabic ? 'مكتبة بطاقات الأعمال المحفوظة' : 'Saved Custom Cards Library'}
                    <span className="text-xs font-semibold px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">
                      {savedCards.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {isArabic
                      ? 'قوالبك وتصاميمك المخصصة المحفوظة لاستخدامها وتنزيلها لاحقاً'
                      : 'Your saved business card designs ready to restore or download anytime'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSavedCardsModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {savedCards.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground space-y-2">
                  <CreditCard className="w-10 h-10 mx-auto opacity-40 text-amber-500" />
                  <p className="text-sm font-semibold">
                    {isArabic ? 'لا توجد بطاقات محفوظة بعد' : 'No custom cards saved yet'}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {isArabic
                      ? 'قم بتخصيص معلوماتك وثيم البطاقة ثم اضغط "حفظ كقالب بطاقة" للرجوع إليها وتنزيلها لاحقاً.'
                      : 'Customize your contact details and theme, then click "Save as Custom Card" to reuse it anytime.'}
                  </p>
                </div>
              ) : (
                savedCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleLoadSavedCard(card)}
                    className="group p-4 bg-muted/40 hover:bg-muted/70 border border-border/70 hover:border-primary/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Mini Card Color Pill */}
                      <div
                        className="h-12 w-16 rounded-xl border border-white/20 shrink-0 flex items-center justify-center font-bold text-[11px] shadow-sm text-white"
                        style={{
                          background: `linear-gradient(135deg, ${card.data.cardBgStart || '#0f172a'}, ${card.data.cardBgEnd || '#1e293b'})`,
                        }}
                      >
                        {card.data.vcardName?.slice(0, 2).toUpperCase() || 'ID'}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-foreground truncate max-w-[220px]">
                            {card.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-primary/10 text-primary border border-primary/20">
                            {card.data.cardTheme || 'Theme'}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(card.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="text-xs text-muted-foreground truncate">
                          {[card.data.vcardName, card.data.vcardTitle, card.data.vcardOrg].filter(Boolean).join(' • ') || 'Custom Contact Card'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleLoadSavedCard(card)}
                        className="h-8 px-3 rounded-lg text-xs font-semibold gap-1"
                      >
                        <RotateCcw size={13} />
                        <span>{isArabic ? 'تطبيق القالب' : 'Load Card'}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteSavedCard(card.id, e)}
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