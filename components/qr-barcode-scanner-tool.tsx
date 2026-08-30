'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  ScanLine,
  Camera,
  Upload,
  Clipboard,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Flashlight,
  Sparkles,
  Wifi,
  User,
  Mail,
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  Barcode,
  Globe,
  FileText,
  Search,
  Trash2,
  Download,
  History,
  QrCode,
  ShieldCheck,
  Layers,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
  Share2,
  AlertTriangle,
  HelpCircle,
  Unlock,
  Settings,
  Maximize2,
  Play,
} from 'lucide-react'
import { toast } from 'sonner'
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScannerState } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { useLanguage } from '@/lib/i18n/context'

const toolMeta: ToolMetadata = {
  id: 'qr-barcode-scanner',
  name: 'QR & Barcode Scanner',
  description:
    'Scan QR codes, UPC, EAN, and 1D/2D barcodes in real time using your live webcam/camera, image file uploads, or clipboard paste.',
  category: {
    id: 'files',
    name: 'File Utilities',
    slug: 'files',
  },
  icon: ScanLine,
  privacyBadge: '100% Client-Side • In-Browser Camera & File Processing',
  features: [
    {
      icon: Camera,
      title: 'Live Camera & Torch Control',
      desc: 'High-speed camera streaming with front/rear switching, hardware flashlight, and continuous multi-scan support.',
    },
    {
      icon: Layers,
      title: 'Universal 1D & 2D Barcodes',
      desc: 'Supports QR Code, Aztec, Data Matrix, PDF417, EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, ITF, and Codabar.',
    },
    {
      icon: Sparkles,
      title: 'Smart Payload Parsing',
      desc: 'Instant recognition of URLs, WiFi passwords, vCard contacts, SMS, phone calls, geolocation, and product codes.',
    },
    {
      icon: ShieldCheck,
      title: 'Private & Secure',
      desc: 'Camera video frames and uploaded images are processed entirely in local browser memory with zero server uploads.',
    },
  ],
  faqs: [
    {
      q: 'Are images or camera video frames sent to your server?',
      a: 'No. The entire decoding pipeline runs 100% locally in your browser using WebAssembly and HTML5 Canvas. Your camera stream and files never leave your device.',
    },
    {
      q: 'Which barcode formats are recognized?',
      a: 'We support all major 2D codes (QR Code, Micro QR, Data Matrix, Aztec, PDF417) and 1D retail & logistics barcodes (EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, Code 93, ITF, Codabar).',
    },
    {
      q: 'Can I scan screenshots or images from my clipboard?',
      a: 'Yes! Simply press Ctrl+V / Cmd+V anywhere on the page or click "Paste Image" to immediately decode copied screenshots or image files.',
    },
    {
      q: 'Can I scan WiFi QR codes and connect easily?',
      a: 'Yes! WiFi QR codes are automatically parsed into the Network SSID, Security Type (WPA/WPA2/WEP), and Password, with a one-click password copy button.',
    },
  ],
}

export type ScanResultType =
  | 'url'
  | 'wifi'
  | 'vcard'
  | 'email'
  | 'phone'
  | 'sms'
  | 'geo'
  | 'calendar'
  | 'product'
  | 'text'

export interface ParsedPayload {
  type: ScanResultType
  raw: string
  format?: string
  timestamp: number
  details: Record<string, any>
}

export interface ScanHistoryItem {
  id: string
  raw: string
  format: string
  type: ScanResultType
  timestamp: number
  title: string
}

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.AZTEC,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.MAXICODE,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.PDF_417,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
]

// Play pleasant synthetic beep using Web Audio API
function playScanBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1) // A6

    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  } catch (err) {
    // AudioContext may be blocked before user interaction
  }
}

// Payload Parser
function parseScanPayload(rawText: string, formatName: string): ParsedPayload {
  const text = rawText.trim()
  const timestamp = Date.now()

  // 1. WiFi Format: WIFI:T:WPA;S:MyNetwork;P:MyPassword;H:false;;
  if (text.toUpperCase().startsWith('WIFI:')) {
    const ssidMatch = text.match(/S:([^;]*)/i)
    const passMatch = text.match(/P:([^;]*)/i)
    const typeMatch = text.match(/T:([^;]*)/i)
    const hiddenMatch = text.match(/H:([^;]*)/i)

    return {
      type: 'wifi',
      raw: text,
      format: formatName,
      timestamp,
      details: {
        ssid: ssidMatch ? ssidMatch[1] : 'Unknown Network',
        password: passMatch ? passMatch[1] : '',
        authType: typeMatch ? typeMatch[1].toUpperCase() : 'WPA/WPA2',
        hidden: hiddenMatch ? hiddenMatch[1].toLowerCase() === 'true' : false,
      },
    }
  }

  // 2. vCard / MeCard
  if (text.startsWith('BEGIN:VCARD') || text.startsWith('MECARD:')) {
    const isVcard = text.startsWith('BEGIN:VCARD')
    let name = ''
    let phone = ''
    let email = ''
    let org = ''
    let title = ''
    let url = ''
    let note = ''
    let address = ''

    if (isVcard) {
      const fnMatch = text.match(/FN:(.*?)(\r?\n|$)/i)
      const nMatch = text.match(/N:(.*?)(\r?\n|$)/i)
      const telMatch = text.match(/TEL.*?:(.*?)(\r?\n|$)/i)
      const emailMatch = text.match(/EMAIL.*?:(.*?)(\r?\n|$)/i)
      const orgMatch = text.match(/ORG:(.*?)(\r?\n|$)/i)
      const titleMatch = text.match(/TITLE:(.*?)(\r?\n|$)/i)
      const urlMatch = text.match(/URL:(.*?)(\r?\n|$)/i)
      const noteMatch = text.match(/NOTE:(.*?)(\r?\n|$)/i)
      const adrMatch = text.match(/ADR.*?:(.*?)(\r?\n|$)/i)

      name = fnMatch ? fnMatch[1].trim() : nMatch ? nMatch[1].replace(/;/g, ' ').trim() : ''
      phone = telMatch ? telMatch[1].trim() : ''
      email = emailMatch ? emailMatch[1].trim() : ''
      org = orgMatch ? orgMatch[1].trim() : ''
      title = titleMatch ? titleMatch[1].trim() : ''
      url = urlMatch ? urlMatch[1].trim() : ''
      note = noteMatch ? noteMatch[1].trim() : ''
      address = adrMatch ? adrMatch[1].replace(/;/g, ', ').trim() : ''
    } else {
      // MECARD:N:Doe,John;TEL:123456;EMAIL:john@doe.com;;
      const nMatch = text.match(/N:([^;]*)/i)
      const telMatch = text.match(/TEL:([^;]*)/i)
      const emailMatch = text.match(/EMAIL:([^;]*)/i)
      const orgMatch = text.match(/ORG:([^;]*)/i)
      const urlMatch = text.match(/URL:([^;]*)/i)
      const noteMatch = text.match(/NOTE:([^;]*)/i)
      const adrMatch = text.match(/ADR:([^;]*)/i)

      name = nMatch ? nMatch[1].replace(/,/g, ' ').trim() : ''
      phone = telMatch ? telMatch[1].trim() : ''
      email = emailMatch ? emailMatch[1].trim() : ''
      org = orgMatch ? orgMatch[1].trim() : ''
      url = urlMatch ? urlMatch[1].trim() : ''
      note = noteMatch ? noteMatch[1].trim() : ''
      address = adrMatch ? adrMatch[1].replace(/,/g, ', ').trim() : ''
    }

    return {
      type: 'vcard',
      raw: text,
      format: formatName,
      timestamp,
      details: {
        name: name || 'Contact',
        phone,
        email,
        org,
        title,
        url,
        note,
        address,
      },
    }
  }

  // 3. Email (mailto: or raw email)
  if (text.toLowerCase().startsWith('mailto:') || /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(text)) {
    let email = text.replace(/^mailto:/i, '')
    let subject = ''
    let body = ''

    if (email.includes('?')) {
      const parts = email.split('?')
      email = parts[0]
      const params = new URLSearchParams(parts[1])
      subject = params.get('subject') || ''
      body = params.get('body') || ''
    }

    return {
      type: 'email',
      raw: text,
      format: formatName,
      timestamp,
      details: { email, subject, body },
    }
  }

  // 4. Phone Number (tel: or direct phone pattern)
  if (text.toLowerCase().startsWith('tel:') || /^(\+?\d{1,4}[-.\s]?)?(\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}$/.test(text.replace(/\s+/g, '')) && text.length >= 7 && text.length <= 16 && /^\+?\d/.test(text)) {
    const phone = text.replace(/^tel:/i, '').trim()
    return {
      type: 'phone',
      raw: text,
      format: formatName,
      timestamp,
      details: { phone },
    }
  }

  // 5. SMS (sms: or smsto:)
  if (text.toLowerCase().startsWith('sms:') || text.toLowerCase().startsWith('smsto:')) {
    const clean = text.replace(/^sms(to)?:/i, '')
    let phone = clean
    let message = ''

    if (clean.includes('?')) {
      const parts = clean.split('?')
      phone = parts[0]
      const params = new URLSearchParams(parts[1])
      message = params.get('body') || ''
    } else if (clean.includes(':')) {
      const parts = clean.split(':')
      phone = parts[0]
      message = parts.slice(1).join(':')
    }

    return {
      type: 'sms',
      raw: text,
      format: formatName,
      timestamp,
      details: { phone, message },
    }
  }

  // 6. Geolocation (geo:lat,lng)
  if (text.toLowerCase().startsWith('geo:')) {
    const coords = text.replace(/^geo:/i, '').split('?')[0].split(',')
    const lat = coords[0] ? parseFloat(coords[0]) : null
    const lng = coords[1] ? parseFloat(coords[1]) : null

    return {
      type: 'geo',
      raw: text,
      format: formatName,
      timestamp,
      details: { lat, lng, full: text.replace(/^geo:/i, '') },
    }
  }

  // 7. Calendar Event (iCalendar / VEVENT)
  if (text.startsWith('BEGIN:VCALENDAR') || text.startsWith('BEGIN:VEVENT')) {
    const summary = text.match(/SUMMARY:(.*?)(\r?\n|$)/i)
    const location = text.match(/LOCATION:(.*?)(\r?\n|$)/i)
    const desc = text.match(/DESCRIPTION:(.*?)(\r?\n|$)/i)
    const dtstart = text.match(/DTSTART.*?:(.*?)(\r?\n|$)/i)
    const dtend = text.match(/DTEND.*?:(.*?)(\r?\n|$)/i)

    return {
      type: 'calendar',
      raw: text,
      format: formatName,
      timestamp,
      details: {
        title: summary ? summary[1].trim() : 'Calendar Event',
        location: location ? location[1].trim() : '',
        description: desc ? desc[1].trim() : '',
        start: dtstart ? dtstart[1].trim() : '',
        end: dtend ? dtend[1].trim() : '',
      },
    }
  }

  // 8. URL (http, https, or standard domain format)
  if (/^https?:\/\//i.test(text) || /^(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?$/i.test(text)) {
    let fullUrl = text
    if (!/^https?:\/\//i.test(fullUrl)) {
      fullUrl = `https://${fullUrl}`
    }

    let hostname = ''
    try {
      hostname = new URL(fullUrl).hostname
    } catch {
      hostname = text
    }

    return {
      type: 'url',
      raw: text,
      format: formatName,
      timestamp,
      details: { url: fullUrl, hostname },
    }
  }

  // 9. Product Barcode (EAN, UPC, ISBN, etc.)
  const is1DBarcode = [
    'EAN_13',
    'EAN_8',
    'UPC_A',
    'UPC_E',
    'CODE_128',
    'CODE_39',
    'CODE_93',
    'ITF',
    'CODABAR',
  ].some((f) => formatName.toUpperCase().includes(f))

  if (is1DBarcode || (/^\d{8,14}$/.test(text) && !text.includes('\n'))) {
    return {
      type: 'product',
      raw: text,
      format: formatName,
      timestamp,
      details: {
        code: text,
        format: formatName,
        googleSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(text)}`,
        amazonSearchUrl: `https://www.amazon.com/s?k=${encodeURIComponent(text)}`,
        openFoodFactsUrl: `https://world.openfoodfacts.org/product/${encodeURIComponent(text)}`,
      },
    }
  }

  // 10. Default Plain Text / JSON / Data
  let isJson = false
  let parsedJsonObj: any = null
  try {
    if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
      parsedJsonObj = JSON.parse(text)
      isJson = true
    }
  } catch {
    // not valid JSON
  }

  return {
    type: 'text',
    raw: text,
    format: formatName,
    timestamp,
    details: {
      charCount: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      lineCount: text.split('\n').length,
      isJson,
      jsonFormatted: isJson ? JSON.stringify(parsedJsonObj, null, 2) : null,
    },
  }
}

export function QRCodeScannerTool() {
  const { t, language } = useLanguage()
  const isArabic = language === 'ar'

  const [activeTab, setActiveTab] = useState<'camera' | 'file' | 'paste'>('camera')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [vibrateEnabled, setVibrateEnabled] = useState(true)
  const [continuousScan, setContinuousScan] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isLoadingCamera, setIsLoadingCamera] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt')
  const [showPermissionGuide, setShowPermissionGuide] = useState(false)
  const [isInIframe, setIsInIframe] = useState(false)

  // Current Scan Result
  const [scanResult, setScanResult] = useState<ParsedPayload | null>(null)
  const [copiedRaw, setCopiedRaw] = useState(false)
  const [copiedDetailKey, setCopiedDetailKey] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // File Upload State
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null)

  // Scan History State
  const [history, setHistory] = useState<ScanHistoryItem[]>([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const readerElementId = 'dm-html5-qr-reader'

  // Detect iframe and query camera permission status on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        setIsInIframe(window.self !== window.top)
      } catch {
        setIsInIframe(true)
      }

      if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
        navigator.permissions
          .query({ name: 'camera' as any })
          .then((status) => {
            setPermissionStatus(status.state as any)
            status.onchange = () => {
              setPermissionStatus(status.state as any)
              if (status.state === 'granted') {
                setCameraError(null)
              }
            }
          })
          .catch(() => {
            // Not all browsers support querying camera permission directly
          })
      }
    }
  }, [])

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('digitalmix_scan_history')
      if (saved) {
        setHistory(JSON.parse(saved))
      }
    } catch {
      // ignore
    }
  }, [])

  // Save history to localStorage
  const saveToHistory = useCallback((payload: ParsedPayload) => {
    setHistory((prev) => {
      // Avoid duplicate consecutive identical items in 3 seconds
      if (prev.length > 0 && prev[0].raw === payload.raw && Date.now() - prev[0].timestamp < 3000) {
        return prev
      }

      let title = payload.raw.slice(0, 40)
      if (payload.type === 'wifi') title = `WiFi: ${payload.details.ssid}`
      else if (payload.type === 'url') title = payload.details.hostname || payload.raw
      else if (payload.type === 'vcard') title = `Contact: ${payload.details.name}`
      else if (payload.type === 'email') title = `Email: ${payload.details.email}`
      else if (payload.type === 'phone') title = `Phone: ${payload.details.phone}`
      else if (payload.type === 'sms') title = `SMS: ${payload.details.phone}`
      else if (payload.type === 'product') title = `Barcode: ${payload.details.code}`
      else if (payload.type === 'calendar') title = `Event: ${payload.details.title}`

      const newItem: ScanHistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        raw: payload.raw,
        format: payload.format || 'QR_CODE',
        type: payload.type,
        timestamp: payload.timestamp,
        title,
      }

      const updated = [newItem, ...prev.slice(0, 49)]
      try {
        localStorage.setItem('digitalmix_scan_history', JSON.stringify(updated))
      } catch {
        // localStorage full/quota
      }
      return updated
    })
  }, [])

  // Handle Scan Success Callback
  const handleDecodedText = useCallback(
    (decodedText: string, decodedResult: any) => {
      const formatName = decodedResult?.result?.format?.formatName || 'QR_CODE'
      const parsed = parseScanPayload(decodedText, formatName)

      setScanResult(parsed)
      saveToHistory(parsed)

      // Audio & Haptic Feedback
      if (soundEnabled) {
        playScanBeep()
      }
      if (vibrateEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([60, 40, 60])
      }

      toast.success(isArabic ? 'تم التعرف على الرمز بنجاح!' : 'Code decoded successfully!')

      // Increment Usage Action
      try {
        incrementToolUsage()
        markToolUsed('qr-barcode-scanner')
      } catch {
        // non-blocking
      }

      // If continuous scan is false, stop camera scanning
      if (!continuousScan && html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
            html5QrCodeRef.current.pause(true)
          }
        } catch {
          // ignore
        }
      }
    },
    [soundEnabled, vibrateEnabled, continuousScan, saveToHistory, isArabic]
  )

  // Categorize camera error for informative guidance
  const handleCameraError = useCallback((err: any) => {
    setIsCameraActive(false)
    const errName = err?.name || ''
    const errMsg = (err?.message || '').toLowerCase()

    if (
      errName === 'NotAllowedError' ||
      errName === 'PermissionDeniedError' ||
      errMsg.includes('permission') ||
      errMsg.includes('denied') ||
      errMsg.includes('dismissed')
    ) {
      setPermissionStatus('denied')
      setCameraError(
        isArabic
          ? 'تم رفض أو حظر إذن الكاميرا. يرجى النقر على أيقونة القفل أو الكاميرا في شريط العنوان بالمتصفح، والسماح بالوصول للكاميرا ثم النقر على زر طلب الإذن أدناه.'
          : 'Camera permission was denied or dismissed. Click the lock/camera icon in your browser address bar to allow access, then click "Grant Camera Permission" below.'
      )
    } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError' || errMsg.includes('not found')) {
      setCameraError(
        isArabic
          ? 'لم يتم العثور على أي كاميرا متصلة بالجهاز. يمكنك مسح الرموز برفع صورة أو لصق لقطة الشاشة.'
          : 'No camera device found on your system. You can still scan by uploading an image or pasting from clipboard.'
      )
    } else if (errName === 'NotReadableError' || errName === 'TrackStartError' || errMsg.includes('in use') || errMsg.includes('already')) {
      setCameraError(
        isArabic
          ? 'الكاميرا قيد الاستخدام بواسطة برنامج آخر (مثل Zoom أو Teams). يرجى إغلاقه وإعادة المحاولة.'
          : 'Camera is currently occupied by another app (e.g. Zoom, Teams). Close the other app and retry.'
      )
    } else if (errName === 'OverconstrainedError' || errMsg.includes('constraint')) {
      setCameraError(
        isArabic
          ? 'الكاميرا لا تدعم الإعدادات الحالية. تم التحويل التلقائي للكاميرا المتاحة.'
          : 'Selected camera constraint could not be satisfied. Retrying with default device.'
      )
    } else {
      setCameraError(
        err?.message ||
          (isArabic
            ? 'تعذر تشغيل الكاميرا. يرجى التأكد من توصيل الكاميرا ومنح الإذن للمتصفح.'
            : 'Unable to start camera stream. Please check camera connection and permissions.')
      )
    }
  }, [isArabic])

  // Initialize or start camera with multi-tier fallback
  const startCamera = useCallback(async () => {
    setIsLoadingCamera(true)
    setCameraError(null)

    // Check navigator.mediaDevices support
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setIsLoadingCamera(false)
      const msg = isArabic
        ? 'واجهة الكاميرا غير مدعومة في هذا المتصفح أو تتطلب اتصالاً آمناً (HTTPS).'
        : 'Camera API is not supported in this browser or requires a secure HTTPS connection.'
      setCameraError(msg)
      return
    }

    try {
      // Clean up previous scanner instance
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
            await html5QrCodeRef.current.stop()
          }
          html5QrCodeRef.current.clear()
        } catch {
          // ignore
        }
      }

      // Check DOM element
      const readerElem = document.getElementById(readerElementId)
      if (!readerElem) {
        console.warn('Camera reader container not mounted')
        setIsLoadingCamera(false)
        return
      }

      const html5QrCode = new Html5Qrcode(readerElementId, {
        formatsToSupport: SUPPORTED_FORMATS,
        verbose: false,
      })
      html5QrCodeRef.current = html5QrCode

      // Discover camera devices
      let deviceList: { id: string; label: string }[] = []
      try {
        const devices = await Html5Qrcode.getCameras()
        if (devices && devices.length > 0) {
          deviceList = devices.map((d, idx) => ({
            id: d.id,
            label: d.label || (isArabic ? `كاميرا ${idx + 1}` : `Camera ${idx + 1}`),
          }))
          setCameras(deviceList)
          if (!selectedCameraId) {
            setSelectedCameraId(devices[0].id)
          }
        }
      } catch (devErr) {
        console.warn('Could not enumerate cameras yet:', devErr)
      }

      const scanConfig = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minDim = Math.min(viewfinderWidth, viewfinderHeight)
          return {
            width: Math.floor(minDim * 0.75),
            height: Math.floor(minDim * 0.75),
          }
        },
        aspectRatio: 1.0,
      }

      const onSuccess = (decodedText: string, result: any) => handleDecodedText(decodedText, result)
      const onScanFailure = () => {
        // silent frame ignore
      }

      let isStarted = false

      // Try 1: Exact Selected ID or facingMode
      try {
        const cameraConfig = selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : { facingMode }
        await html5QrCode.start(cameraConfig, scanConfig, onSuccess, onScanFailure)
        isStarted = true
      } catch (err1: any) {
        console.warn('Initial camera start failed, testing fallback config:', err1)

        // If explicitly permission denied, rethrow immediately
        if (err1?.name === 'NotAllowedError' || err1?.name === 'PermissionDeniedError') {
          throw err1
        }

        // Try 2: Alternative facingMode (environment <-> user)
        try {
          const altMode = facingMode === 'environment' ? 'user' : 'environment'
          await html5QrCode.start({ facingMode: altMode }, scanConfig, onSuccess, onScanFailure)
          setFacingMode(altMode)
          isStarted = true
        } catch (err2) {
          console.warn('FacingMode fallback failed, attempting device list fallback:', err2)

          // Try 3: First available device ID
          if (deviceList.length > 0) {
            try {
              await html5QrCode.start({ deviceId: { exact: deviceList[0].id } }, scanConfig, onSuccess, onScanFailure)
              setSelectedCameraId(deviceList[0].id)
              isStarted = true
            } catch (err3) {
              console.warn('Device ID fallback failed:', err3)
            }
          }

          // Try 4: General user camera
          if (!isStarted) {
            await html5QrCode.start({ facingMode: 'user' }, scanConfig, onSuccess, onScanFailure)
            isStarted = true
          }
        }
      }

      if (isStarted) {
        setIsCameraActive(true)
        setPermissionStatus('granted')
        setCameraError(null)

        // Check for torch capability
        try {
          const capabilities = html5QrCode.getRunningTrackCapabilities()
          if (capabilities && (capabilities as any).torch) {
            setTorchSupported(true)
          } else {
            setTorchSupported(false)
          }
        } catch {
          setTorchSupported(false)
        }
      }
    } catch (err: any) {
      console.error('Camera start failure:', err)
      handleCameraError(err)
    } finally {
      setIsLoadingCamera(false)
    }
  }, [selectedCameraId, facingMode, handleDecodedText, isArabic, handleCameraError])

  // Explicit user gesture trigger to prompt permission and start camera
  const requestCameraPermission = async () => {
    setIsLoadingCamera(true)
    setCameraError(null)
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error(isArabic ? 'المتصفح لا يدعم الوصول للكاميرا' : 'Camera access is not supported by your browser')
      }

      // Explicitly prompt user via getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      })

      // Clean up test stream
      stream.getTracks().forEach((track) => track.stop())
      setPermissionStatus('granted')
      setCameraError(null)

      // Start html5QrCode
      await startCamera()
    } catch (err: any) {
      console.error('Explicit permission request error:', err)
      handleCameraError(err)
    } finally {
      setIsLoadingCamera(false)
    }
  }

  // Stop camera
  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
          await html5QrCodeRef.current.stop()
        }
        html5QrCodeRef.current.clear()
      } catch (err) {
        console.warn('Error stopping camera:', err)
      }
    }
    setIsCameraActive(false)
    setTorchOn(false)
  }, [])

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !torchSupported) return
    try {
      const nextTorch = !torchOn
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any],
      })
      setTorchOn(nextTorch)
      toast.success(nextTorch ? 'Flashlight ON' : 'Flashlight OFF')
    } catch (err) {
      toast.error('Flashlight not supported on this device stream')
    }
  }

  // Switch Facing Mode (Front / Back)
  const toggleFacingMode = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(nextMode)
    setSelectedCameraId('')
    if (isCameraActive) {
      await stopCamera()
      setTimeout(() => {
        setFacingMode(nextMode)
      }, 100)
    }
  }

  // Resume paused camera scan
  const resumeScan = () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.getState() === Html5QrcodeScannerState.PAUSED) {
          html5QrCodeRef.current.resume()
        } else if (!isCameraActive) {
          startCamera()
        }
      } catch {
        startCamera()
      }
    } else {
      startCamera()
    }
    setScanResult(null)
  }

  // Cleanup on unmount or tab change
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  // Global Clipboard Paste Listener (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            setActiveTab('file')
            processImageFile(file)
            break
          }
        }
      }
    }

    window.addEventListener('paste', handleGlobalPaste)
    return () => {
      window.removeEventListener('paste', handleGlobalPaste)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Process uploaded image file
  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(isArabic ? 'يرجى اختيار ملف صورة صالح' : 'Please select a valid image file')
      return
    }

    setIsProcessingFile(true)
    const previewUrl = URL.createObjectURL(file)
    setUploadedFilePreview(previewUrl)

    try {
      // Use Html5Qrcode file scanner
      const tempScanner = new Html5Qrcode('dm-file-scanner-temp', {
        formatsToSupport: SUPPORTED_FORMATS,
        verbose: false,
      })

      const decodedText = await tempScanner.scanFile(file, true)
      const parsed = parseScanPayload(decodedText, 'QR_CODE / BARCODE')

      setScanResult(parsed)
      saveToHistory(parsed)

      if (soundEnabled) playScanBeep()
      toast.success(isArabic ? 'تم فك تشفير الرمز بنجاح!' : 'Barcode/QR Code decoded successfully!')

      try {
        incrementToolUsage()
        markToolUsed('qr-barcode-scanner')
      } catch {
        // non-blocking
      }
    } catch (scanErr: any) {
      console.warn('File decode attempt 1 failed:', scanErr)
      toast.error(
        isArabic
          ? 'لم يتم العثور على رمز QR أو باركود واضح في هذه الصورة. يرجى تجربة صورة أوضح أو بزاوية مستقيمة.'
          : 'No valid QR code or barcode found in this image. Please try a clearer or higher-contrast photo.'
      )
    } finally {
      setIsProcessingFile(false)
    }
  }

  // Paste from Clipboard Button handler
  const handlePasteButtonClick = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        toast.error(
          isArabic
            ? 'المتصفح لا يدعم القراءة المباشرة من الحافظة. يرجى الضغط على Ctrl+V للصق.'
            : 'Clipboard read not supported directly. Please press Ctrl+V / Cmd+V to paste.'
        )
        return
      }

      const clipboardItems = await navigator.clipboard.read()
      let imageFound = false

      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const file = new File([blob], 'clipboard-screenshot.png', { type: imageType })
          setActiveTab('file')
          processImageFile(file)
          imageFound = true
          break
        }
      }

      if (!imageFound) {
        toast.info(
          isArabic
            ? 'لم يتم العثور على صورة في الحافظة. قم بنسخ لقطة شاشة أولاً ثم الصقها هنا.'
            : 'No image found in clipboard. Copy a screenshot first, then paste here.'
        )
      }
    } catch (err) {
      toast.error(
        isArabic
          ? 'يرجى منح إذن قراءة الحافظة أو استخدام اختصار Ctrl+V للصق.'
          : 'Please allow clipboard permissions or press Ctrl+V to paste directly.'
      )
    }
  }

  // Copy helpers
  const copyToClipboard = (text: string, detailKey?: string) => {
    navigator.clipboard.writeText(text)
    if (detailKey) {
      setCopiedDetailKey(detailKey)
      setTimeout(() => setCopiedDetailKey(null), 2000)
    } else {
      setCopiedRaw(true)
      setTimeout(() => setCopiedRaw(false), 2000)
    }
    toast.success(isArabic ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard!')
  }

  // Download Contact (.vcf)
  const downloadVCard = (details: any) => {
    const vcfLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${details.name || ''}`,
      details.phone ? `TEL;TYPE=CELL:${details.phone}` : '',
      details.email ? `EMAIL:${details.email}` : '',
      details.org ? `ORG:${details.org}` : '',
      details.title ? `TITLE:${details.title}` : '',
      details.url ? `URL:${details.url}` : '',
      details.address ? `ADR;TYPE=WORK:;;${details.address};;;;` : '',
      details.note ? `NOTE:${details.note}` : '',
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\r\n')

    const blob = new Blob([vcfLines], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(details.name || 'contact').replace(/\s+/g, '_')}.vcf`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Contact vCard (.vcf) downloaded')
  }

  // Download Calendar (.ics)
  const downloadIcs = (details: any) => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DigitalMix//QR Calendar//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${details.title || 'Event'}`,
      details.location ? `LOCATION:${details.location}` : '',
      details.description ? `DESCRIPTION:${details.description}` : '',
      details.start ? `DTSTART:${details.start}` : '',
      details.end ? `DTEND:${details.end}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .filter(Boolean)
      .join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(details.title || 'event').replace(/\s+/g, '_')}.ics`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Calendar event (.ics) downloaded')
  }

  // Export scan history to CSV
  const exportHistoryCSV = () => {
    if (history.length === 0) return
    const headers = ['Timestamp', 'Type', 'Format', 'Title', 'Raw Content']
    const rows = history.map((item) => [
      new Date(item.timestamp).toISOString(),
      item.type,
      item.format,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${item.raw.replace(/"/g, '""')}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `digitalmix-scan-history-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Scan history exported to CSV')
  }

  // Delete single history item
  const deleteHistoryItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id)
      try {
        localStorage.setItem('digitalmix_scan_history', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
    toast.success(isArabic ? 'تم حذف هذا العنصر من السجل' : 'Item removed from history')
  }

  // Clear history
  const clearHistory = () => {
    setHistory([])
    try {
      localStorage.removeItem('digitalmix_scan_history')
    } catch {
      // ignore
    }
    toast.success(isArabic ? 'تم مسح سجل المسح' : 'Scan history cleared')
  }

  return (
    <ToolLayout metadata={toolMeta}>
      {/* Hidden container for temp file decoding */}
      <div id="dm-file-scanner-temp" className="hidden" />

      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Top Control Bar & Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-card border border-border/80 rounded-2xl shadow-xs">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/40">
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'camera'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Camera size={16} className={activeTab === 'camera' ? 'text-primary' : ''} />
              {isArabic ? 'الكاميرا المباشرة' : 'Live Camera'}
            </button>

            <button
              onClick={() => setActiveTab('file')}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'file'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Upload size={16} className={activeTab === 'file' ? 'text-primary' : ''} />
              {isArabic ? 'رفع صورة' : 'Upload Image'}
            </button>

            <button
              onClick={() => {
                setActiveTab('paste')
                handlePasteButtonClick()
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'paste'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clipboard size={16} className={activeTab === 'paste' ? 'text-primary' : ''} />
              {isArabic ? 'لصق لقطة شاشة' : 'Paste Image'}
            </button>
          </div>

          {/* Quick Settings: Sound & Continuous & History */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-9 px-2.5 rounded-xl border-border/70 text-xs font-medium"
              title={soundEnabled ? 'Mute Beep' : 'Enable Beep Sound'}
            >
              {soundEnabled ? (
                <Volume2 size={15} className="text-emerald-500" />
              ) : (
                <VolumeX size={15} className="text-muted-foreground" />
              )}
              <span className="hidden sm:inline ms-1.5">
                {soundEnabled ? (isArabic ? 'الصوت مفعّل' : 'Beep On') : isArabic ? 'صامت' : 'Muted'}
              </span>
            </Button>

            <Button
              variant={continuousScan ? 'default' : 'outline'}
              size="sm"
              onClick={() => setContinuousScan(!continuousScan)}
              className={`h-9 px-3 rounded-xl text-xs font-semibold ${
                continuousScan
                  ? 'bg-primary text-primary-foreground'
                  : 'border-border/70 text-muted-foreground'
              }`}
            >
              <RefreshCw size={14} className={continuousScan ? 'animate-spin' : ''} />
              <span className="hidden sm:inline ms-1.5">
                {continuousScan
                  ? isArabic
                    ? 'مسح مستمر'
                    : 'Continuous'
                  : isArabic
                    ? 'مسح فردي'
                    : 'Single Scan'}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistoryModal(true)}
              className="h-9 px-3 rounded-xl border border-border/60 hover:bg-muted text-xs font-medium relative"
            >
              <History size={15} className="text-primary" />
              <span className="hidden sm:inline ms-1.5">{isArabic ? 'السجل' : 'History'}</span>
              {history.length > 0 && (
                <span className="ms-1 px-1.5 py-0.2 bg-primary/20 text-primary text-[10px] font-bold rounded-full">
                  {history.length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* MAIN SCANNING AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Scanner Viewport (Left / Top Column) */}
          <div className="lg:col-span-6 space-y-4">
            {activeTab === 'camera' && (
              <div className="bg-card border border-border/80 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
                {/* Camera Viewport Wrapper */}
                <div className="relative aspect-square w-full max-w-md mx-auto rounded-2xl overflow-hidden bg-black/90 border border-border/50 shadow-inner flex items-center justify-center">
                  {/* The Reader Video Mount */}
                  <div id={readerElementId} className="w-full h-full object-cover" />

                  {/* Laser Scan Guide Overlay */}
                  {isCameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                      {/* Scanning Target Box */}
                      <div className="relative w-4/5 h-4/5 border-2 border-dashed border-primary/60 rounded-2xl overflow-hidden flex items-center justify-center bg-primary/5 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                        {/* 4 Corner Markers */}
                        <div className="absolute top-2 start-2 w-5 h-5 border-t-4 border-s-4 border-primary rounded-tl-sm" />
                        <div className="absolute top-2 end-2 w-5 h-5 border-t-4 border-e-4 border-primary rounded-tr-sm" />
                        <div className="absolute bottom-2 start-2 w-5 h-5 border-b-4 border-s-4 border-primary rounded-bl-sm" />
                        <div className="absolute bottom-2 end-2 w-5 h-5 border-b-4 border-e-4 border-primary rounded-br-sm" />

                        {/* Animated Laser Line */}
                        <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444] animate-[bounce_2s_infinite]" />
                      </div>
                    </div>
                  )}

                  {/* Idle / Not Active Overlay */}
                  {!isCameraActive && !isLoadingCamera && !cameraError && (
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-xs flex flex-col items-center justify-center gap-4 p-6 text-center z-10">
                      <div className="p-4 bg-primary/10 text-primary rounded-2xl">
                        <Camera size={36} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-foreground">
                          {isArabic ? 'الكاميرا متوقفة حالياً' : 'Camera is currently stopped'}
                        </h4>
                        <p className="text-xs text-muted-foreground max-w-xs">
                          {isArabic
                            ? 'انقر لتشغيل الكاميرا والسماح بالإذن لمسح الأكواد مباشرة.'
                            : 'Click to start camera and grant permission to scan barcodes directly.'}
                        </p>
                      </div>
                      <Button onClick={requestCameraPermission} className="rounded-xl shadow-md">
                        <Play size={16} className="me-2" />
                        {isArabic ? 'تشغيل وسماح الكاميرا' : 'Allow & Start Camera'}
                      </Button>
                    </div>
                  )}

                  {/* Loading or Initializing State Overlay */}
                  {isLoadingCamera && (
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-6 text-center z-10">
                      <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-semibold text-foreground">
                        {isArabic ? 'جاري تهيئة الكاميرا والتحقق من الإذن...' : 'Initializing camera & checking permissions...'}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        {isArabic
                          ? 'إذا ظهرت نافذة المتصفح، يرجى النقر على "سماح" (Allow)'
                          : 'If prompted by your browser, please click "Allow"'}
                      </p>
                    </div>
                  )}

                  {/* Camera Error / Permission Denied Overlay */}
                  {cameraError && !isLoadingCamera && (
                    <div className="absolute inset-0 bg-background/95 flex flex-col items-center justify-center gap-3 p-6 text-center z-10 overflow-y-auto">
                      <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl">
                        <AlertTriangle size={30} />
                      </div>
                      <h4 className="font-bold text-sm text-foreground">
                        {isArabic ? 'إذن الكاميرا مطلوب' : 'Camera Permission Required'}
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">{cameraError}</p>

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <Button size="sm" onClick={requestCameraPermission} className="rounded-xl">
                          <Unlock size={14} className="me-1.5" />
                          {isArabic ? 'طلب الإذن وإعادة التشغيل' : 'Grant Permission & Start'}
                        </Button>

                        {isInIframe && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(window.location.href, '_blank')}
                            className="rounded-xl border-border/80"
                          >
                            <Maximize2 size={14} className="me-1.5" />
                            {isArabic ? 'فتح بنافذة مستقلة' : 'Open in New Tab'}
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveTab('file')}
                          className="rounded-xl text-xs text-primary"
                        >
                          <Upload size={14} className="me-1.5" />
                          {isArabic ? 'استخدام رفع صورة بدلاً من ذلك' : 'Upload Image Instead'}
                        </Button>
                      </div>

                      <button
                        onClick={() => setShowPermissionGuide(!showPermissionGuide)}
                        className="text-[11px] text-primary underline underline-offset-4 hover:opacity-80 transition-opacity mt-1 flex items-center gap-1"
                      >
                        <HelpCircle size={12} />
                        {isArabic ? 'كيفية تفعيل إذن الكاميرا في المتصفح؟' : 'How to enable camera permissions?'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Permission Guide Collapse Panel */}
                {showPermissionGuide && (
                  <div className="p-4 bg-muted/70 border border-border/80 rounded-2xl text-xs space-y-3">
                    <div className="flex items-center justify-between font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Settings size={14} className="text-primary" />
                        {isArabic ? 'دليل تفعيل إذن الكاميرا' : 'Camera Permission Steps'}
                      </span>
                      <button
                        onClick={() => setShowPermissionGuide(false)}
                        className="text-muted-foreground hover:text-foreground text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <ul className="space-y-2 text-muted-foreground leading-relaxed list-disc list-inside">
                      <li>
                        <strong>Google Chrome / Edge:</strong>{' '}
                        {isArabic
                          ? 'انقر على أيقونة القفل 🔒 أو الكاميرا في شريط العنوان أعلى الصفحة -> اختر "أذونات الموقع" أو فعّل الكاميرا -> ثم أعد تحميل الصفحة.'
                          : 'Click the lock 🔒 or camera icon in the address bar -> toggle Camera to "Allow" -> reload the page.'}
                      </li>
                      <li>
                        <strong>Apple Safari (Mac / iPhone):</strong>{' '}
                        {isArabic
                          ? 'على Mac: اختر Safari -> إعدادات هذا الموقع -> الكاميرا: سماح. على iPhone: الإعدادات -> Safari -> الكاميرا -> سماح.'
                          : 'On Mac: Safari -> Settings for This Website -> Camera: Allow. On iPhone: Settings -> Safari -> Camera -> Allow.'}
                      </li>
                      <li>
                        <strong>Mozilla Firefox:</strong>{' '}
                        {isArabic
                          ? 'انقر على أيقونة الأذونات بجانب شريط العنوان -> احذف الحظر عن الكاميرا -> أعد المحاولة.'
                          : 'Click the permissions icon next to the address bar -> clear blocked camera permission -> reload.'}
                      </li>
                    </ul>
                  </div>
                )}

                {/* Camera Hardware Controls */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {/* Front/Back Switcher */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFacingMode}
                    className="rounded-xl border-border/70 text-xs font-semibold"
                  >
                    <RotateCcw size={14} className="me-1.5 text-primary" />
                    {facingMode === 'environment'
                      ? isArabic
                        ? 'الكاميرا الخلفية'
                        : 'Rear Camera'
                      : isArabic
                        ? 'الكاميرا الأمامية'
                        : 'Front Camera'}
                  </Button>

                  {/* Torch / Flashlight Button */}
                  {torchSupported && (
                    <Button
                      variant={torchOn ? 'default' : 'outline'}
                      size="sm"
                      onClick={toggleTorch}
                      className="rounded-xl border-border/70 text-xs font-semibold"
                    >
                      <Flashlight size={14} className={`me-1.5 ${torchOn ? 'text-amber-300' : ''}`} />
                      {torchOn ? (isArabic ? 'الفلاش يعمل' : 'Torch ON') : isArabic ? 'تشغيل الفلاش' : 'Torch OFF'}
                    </Button>
                  )}

                  {/* Camera Selector Dropdown (if multiple) */}
                  {cameras.length > 1 && (
                    <select
                      value={selectedCameraId}
                      onChange={(e) => {
                        setSelectedCameraId(e.target.value)
                        if (isCameraActive) {
                          stopCamera().then(() => startCamera())
                        }
                      }}
                      className="bg-muted border border-border/70 text-foreground text-xs rounded-xl px-3 py-2 outline-hidden"
                    >
                      {cameras.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Stop / Resume Camera Toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isCameraActive ? stopCamera : requestCameraPermission}
                    className="rounded-xl border-border/70 text-xs font-semibold"
                  >
                    {isCameraActive ? (
                      <>
                        <EyeOff size={14} className="me-1.5 text-amber-500" />
                        {isArabic ? 'إيقاف مؤقت' : 'Pause Camera'}
                      </>
                    ) : (
                      <>
                        <Eye size={14} className="me-1.5 text-emerald-500" />
                        {isArabic ? 'تشغيل الكاميرا' : 'Start Camera'}
                      </>
                    )}
                  </Button>

                  {/* Open in full tab helper for iframe */}
                  {isInIframe && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="rounded-xl text-xs text-muted-foreground hover:text-foreground"
                      title={isArabic ? 'فتح في نافذة جديدة' : 'Open scanner in new window'}
                    >
                      <Maximize2 size={13} className="me-1" />
                      {isArabic ? 'نافذة جديدة' : 'New Tab'}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* File Upload Tab */}
            {activeTab === 'file' && (
              <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-6">
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      processImageFile(e.dataTransfer.files[0])
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-primary bg-primary/10 scale-[0.99]'
                      : 'border-border/80 hover:border-primary/50 hover:bg-muted/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processImageFile(e.target.files[0])
                      }
                    }}
                    className="hidden"
                  />

                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <Upload size={30} className={isProcessingFile ? 'animate-bounce' : ''} />
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-1.5">
                    {isProcessingFile
                      ? isArabic
                        ? 'جاري فك تشفير الصورة...'
                        : 'Decoding Barcode / QR Code...'
                      : isArabic
                        ? 'انقر لاختيار صورة أو اسحبها هنا'
                        : 'Choose an image or drop it here'}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
                    {isArabic
                      ? 'يدعم صور PNG, JPG, WebP, GIF, SVG, BMP المأخوذة من الكاميرا أو لقطات الشاشة'
                      : 'Supports PNG, JPG, WebP, GIF, SVG, and BMP images or screenshots'}
                  </p>
                </div>

                {/* Uploaded File Preview */}
                {uploadedFilePreview && (
                  <div className="relative rounded-2xl border border-border/70 overflow-hidden max-h-60 bg-muted/30 flex items-center justify-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadedFilePreview}
                      alt="Uploaded preview"
                      className="max-h-56 object-contain rounded-xl shadow-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Paste from Clipboard Tab */}
            {activeTab === 'paste' && (
              <div className="bg-card border border-border/80 rounded-3xl p-8 sm:p-10 shadow-sm text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Clipboard size={32} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold text-foreground">
                    {isArabic ? 'الصق لقطة الشاشة مباشرة' : 'Paste Screenshot or Copied Image'}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    {isArabic
                      ? 'التقط لقطة شاشة لأي باركود أو رمز QR واضغط Ctrl + V (أو Cmd + V على ماك) في أي مكان على هذه الصفحة لفك تشفيره فوراً.'
                      : 'Take a screenshot or copy any barcode/QR image to your clipboard and press Ctrl + V (or Cmd + V) anywhere on this page.'}
                  </p>
                </div>

                <div className="pt-2 flex justify-center">
                  <Button
                    onClick={handlePasteButtonClick}
                    size="lg"
                    className="rounded-xl px-6 font-bold shadow-md shadow-primary/20"
                  >
                    <Clipboard size={18} className="me-2" />
                    {isArabic ? 'قراءة الصورة من الحافظة' : 'Paste from Clipboard'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Decoded Result Panel (Right / Bottom Column) */}
          <div className="lg:col-span-6 space-y-6">
            {scanResult ? (
              <div className="bg-card border border-primary/30 rounded-3xl p-6 shadow-md space-y-6 animate-in fade-in zoom-in-95 duration-200">
                {/* Result Header */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold uppercase rounded-full tracking-wider">
                        {scanResult.format || 'QR CODE'}
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[11px] font-bold uppercase rounded-full">
                        {scanResult.type.toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-foreground pt-1">
                      {isArabic ? 'نتيجة المسح والبيانات' : 'Decoded Barcode Content'}
                    </h2>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resumeScan}
                    className="rounded-xl text-xs font-semibold border-border/80"
                  >
                    <RotateCcw size={14} className="me-1.5 text-primary" />
                    {isArabic ? 'مسح جديد' : 'Scan Next'}
                  </Button>
                </div>

                {/* Intelligent Dynamic Card Render */}

                {/* 1. URL Result */}
                {scanResult.type === 'url' && (
                  <div className="p-4 bg-muted/40 border border-border/70 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <Globe size={18} />
                      <span>{isArabic ? 'رابط موقع إنترنت' : 'Website URL'}</span>
                    </div>
                    <p className="font-mono text-sm break-all text-foreground bg-background p-3 rounded-xl border border-border/60">
                      {scanResult.details.url}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={scanResult.details.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-xs"
                      >
                        <ExternalLink size={14} />
                        {isArabic ? 'فتح الرابط في تبويب جديد' : 'Open Link in New Tab'}
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(scanResult.details.url, 'url')}
                        className="rounded-xl text-xs"
                      >
                        {copiedDetailKey === 'url' ? <Check size={14} className="text-emerald-500 me-1.5" /> : <Copy size={14} className="me-1.5" />}
                        {isArabic ? 'نسخ الرابط' : 'Copy URL'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* 2. WiFi Network Result */}
                {scanResult.type === 'wifi' && (
                  <div className="p-4 bg-muted/40 border border-border/70 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <Wifi size={18} />
                      <span>{isArabic ? 'بيانات شبكة واي فاي (WiFi)' : 'WiFi Network Credentials'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-background p-3 rounded-xl border border-border/60 space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          {isArabic ? 'اسم الشبكة (SSID)' : 'Network Name (SSID)'}
                        </span>
                        <p className="font-bold text-sm text-foreground">{scanResult.details.ssid}</p>
                      </div>

                      <div className="bg-background p-3 rounded-xl border border-border/60 space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          {isArabic ? 'نوع التشفير' : 'Security'}
                        </span>
                        <p className="font-semibold text-xs text-foreground">
                          {scanResult.details.authType || 'WPA/WPA2'}
                        </p>
                      </div>
                    </div>

                    {scanResult.details.password && (
                      <div className="bg-background p-3 rounded-xl border border-border/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {isArabic ? 'كلمة المرور (Password)' : 'Password'}
                          </span>
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                            {showPassword ? (isArabic ? 'إخفاء' : 'Hide') : isArabic ? 'إظهار' : 'Show'}
                          </button>
                        </div>
                        <p className="font-mono font-bold text-sm text-foreground">
                          {showPassword ? scanResult.details.password : '••••••••••••'}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {scanResult.details.password && (
                        <Button
                          size="sm"
                          onClick={() => copyToClipboard(scanResult.details.password, 'wifi_pass')}
                          className="rounded-xl text-xs font-bold"
                        >
                          {copiedDetailKey === 'wifi_pass' ? (
                            <Check size={14} className="me-1.5" />
                          ) : (
                            <Copy size={14} className="me-1.5" />
                          )}
                          {isArabic ? 'نسخ كلمة المرور' : 'Copy Password'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. vCard / Contact Result */}
                {scanResult.type === 'vcard' && (
                  <div className="p-4 bg-muted/40 border border-border/70 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <User size={18} />
                      <span>{isArabic ? 'بطاقة اتصال (vCard Contact)' : 'vCard Contact'}</span>
                    </div>

                    <div className="bg-background p-4 rounded-xl border border-border/60 space-y-2">
                      <h3 className="font-bold text-base text-foreground">{scanResult.details.name}</h3>
                      {scanResult.details.title && (
                        <p className="text-xs text-muted-foreground">{scanResult.details.title}</p>
                      )}
                      {scanResult.details.org && (
                        <p className="text-xs text-muted-foreground font-semibold">{scanResult.details.org}</p>
                      )}

                      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {scanResult.details.phone && (
                          <div className="flex items-center gap-1.5 text-foreground">
                            <Phone size={13} className="text-primary shrink-0" />
                            <a href={`tel:${scanResult.details.phone}`} className="hover:underline font-mono">
                              {scanResult.details.phone}
                            </a>
                          </div>
                        )}
                        {scanResult.details.email && (
                          <div className="flex items-center gap-1.5 text-foreground">
                            <Mail size={13} className="text-primary shrink-0" />
                            <a href={`mailto:${scanResult.details.email}`} className="hover:underline font-mono">
                              {scanResult.details.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => downloadVCard(scanResult.details)}
                        className="rounded-xl text-xs font-bold"
                      >
                        <Download size={14} className="me-1.5" />
                        {isArabic ? 'تحميل جهة الاتصال (.vcf)' : 'Download Contact (.vcf)'}
                      </Button>
                      {scanResult.details.phone && (
                        <a
                          href={`tel:${scanResult.details.phone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border/70 text-foreground text-xs font-semibold rounded-xl hover:bg-muted/80 transition-colors"
                        >
                          <Phone size={13} />
                          {isArabic ? 'اتصال' : 'Call'}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Product Barcode Result (EAN/UPC) */}
                {scanResult.type === 'product' && (
                  <div className="p-4 bg-muted/40 border border-border/70 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <Barcode size={18} />
                      <span>{isArabic ? 'باركود منتج وتجارة' : 'Product Barcode Identifier'}</span>
                    </div>

                    <div className="bg-background p-4 rounded-xl border border-border/60 text-center space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {scanResult.format || 'GTIN / EAN / UPC'}
                      </span>
                      <p className="font-mono font-extrabold text-2xl tracking-widest text-foreground">
                        {scanResult.details.code}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={scanResult.details.googleSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-xs"
                      >
                        <Search size={14} />
                        {isArabic ? 'بحث في جوجل' : 'Search on Google'}
                      </a>
                      <a
                        href={scanResult.details.amazonSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors shadow-xs"
                      >
                        <Search size={14} />
                        {isArabic ? 'بحث في أمازون' : 'Search on Amazon'}
                      </a>
                      <a
                        href={scanResult.details.openFoodFactsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-muted border border-border/70 text-foreground text-xs font-semibold rounded-xl hover:bg-muted/80 transition-colors"
                      >
                        <Globe size={14} />
                        Open Food Facts
                      </a>
                    </div>
                  </div>
                )}

                {/* 5. Email & Phone & SMS & Geo */}
                {scanResult.type === 'email' && (
                  <div className="p-4 bg-muted/40 border border-border/70 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <Mail size={18} />
                      <span>{isArabic ? 'عنوان بريد إلكتروني' : 'Email Message'}</span>
                    </div>
                    <p className="font-mono text-sm text-foreground bg-background p-3 rounded-xl border border-border/60">
                      {scanResult.details.email}
                    </p>
                    <a
                      href={`mailto:${scanResult.details.email}?subject=${encodeURIComponent(
                        scanResult.details.subject || ''
                      )}&body=${encodeURIComponent(scanResult.details.body || '')}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      <Mail size={14} />
                      {isArabic ? 'إرسال بريد إلكتروني' : 'Send Email'}
                    </a>
                  </div>
                )}

                {scanResult.type === 'phone' && (
                  <div className="p-4 bg-muted/40 border border-border/70 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <Phone size={18} />
                      <span>{isArabic ? 'رقم هاتف' : 'Phone Number'}</span>
                    </div>
                    <p className="font-mono font-bold text-lg text-foreground bg-background p-3 rounded-xl border border-border/60">
                      {scanResult.details.phone}
                    </p>
                    <a
                      href={`tel:${scanResult.details.phone}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      <Phone size={14} />
                      {isArabic ? 'اتصال الآن' : 'Call Now'}
                    </a>
                  </div>
                )}

                {scanResult.type === 'geo' && (
                  <div className="p-4 bg-muted/40 border border-border/70 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <MapPin size={18} />
                      <span>{isArabic ? 'إحداثيات موقع جغرافي' : 'Geolocation Coordinates'}</span>
                    </div>
                    <p className="font-mono text-sm text-foreground bg-background p-3 rounded-xl border border-border/60">
                      {scanResult.details.lat}, {scanResult.details.lng}
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${scanResult.details.lat},${scanResult.details.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors"
                    >
                      <ExternalLink size={14} />
                      {isArabic ? 'فتح في خرائط جوجل' : 'Open in Google Maps'}
                    </a>
                  </div>
                )}

                {scanResult.type === 'calendar' && (
                  <div className="p-4 bg-muted/40 border border-border/70 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                      <Calendar size={18} />
                      <span>{isArabic ? 'حدث تقويم' : 'Calendar Event'}</span>
                    </div>
                    <div className="bg-background p-3 rounded-xl border border-border/60 space-y-1">
                      <p className="font-bold text-sm text-foreground">{scanResult.details.title}</p>
                      {scanResult.details.location && (
                        <p className="text-xs text-muted-foreground">{scanResult.details.location}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => downloadIcs(scanResult.details)}
                      className="rounded-xl text-xs font-bold"
                    >
                      <Download size={14} className="me-1.5" />
                      {isArabic ? 'تحميل ملف التقويم (.ics)' : 'Download Event (.ics)'}
                    </Button>
                  </div>
                )}

                {/* Raw Payload Block */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {isArabic ? 'النص والمحتوى الخام' : 'Raw Scanned Payload'}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {scanResult.raw.length} {isArabic ? 'حرف' : 'chars'}
                    </span>
                  </div>

                  <div className="relative">
                    <textarea
                      readOnly
                      value={
                        scanResult.details.jsonFormatted || scanResult.raw
                      }
                      rows={5}
                      className="w-full font-mono text-xs p-3.5 bg-muted/50 border border-border/70 rounded-xl text-foreground outline-hidden resize-y leading-relaxed"
                    />
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={() => copyToClipboard(scanResult.raw)}
                      className="rounded-xl text-xs font-bold shadow-xs"
                    >
                      {copiedRaw ? (
                        <Check size={14} className="me-1.5" />
                      ) : (
                        <Copy size={14} className="me-1.5" />
                      )}
                      {isArabic ? 'نسخ النص بالكامل' : 'Copy Full Payload'}
                    </Button>

                    <Link
                      href={`/tools/qr-code-generator`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-muted border border-border/70 text-foreground text-xs font-semibold rounded-xl hover:bg-muted/80 transition-colors"
                    >
                      <QrCode size={14} className="text-primary" />
                      {isArabic ? 'توليد QR لهذا النص' : 'Open in QR Generator'}
                    </Link>
                  </div>

                  <span className="text-[11px] text-muted-foreground">
                    {new Date(scanResult.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ) : (
              /* Idle Placeholder state */
              <div className="bg-card border border-border/80 rounded-3xl p-8 sm:p-12 shadow-sm text-center space-y-4 flex flex-col items-center justify-center min-h-[380px]">
                <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground border border-border/60">
                  <ScanLine size={32} />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-base font-bold text-foreground">
                    {isArabic ? 'في انتظار مسح أي رمز أو باركود' : 'Ready to Scan Barcodes & QR Codes'}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isArabic
                      ? 'وجّه الكاميرا نحو الرمز، أو ارفع ملف صورة، أو الصق لقطة شاشة من الحافظة لعرض البيانات فك التشفير تلقائياً.'
                      : 'Point your camera at a barcode, drop an image file, or paste a screenshot to instantly view decoded contents.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RECENT SCAN HISTORY MODAL / DRAWER */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <History size={20} className="text-primary" />
                  <h3 className="text-lg font-bold text-foreground">
                    {isArabic ? 'سجل عمليات المسح الأخيرة' : 'Recent Scan History'}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    {history.length}
                  </span>
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
                        {isArabic ? 'مسح' : 'Clear'}
                      </Button>
                    </>
                  )}
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="text-muted-foreground hover:text-foreground text-sm font-bold px-2 py-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* History items scroll area */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {history.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    {isArabic ? 'لا توجد عمليات مسح سابقة محفوظة' : 'No scans saved in history yet.'}
                  </div>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-muted/40 hover:bg-muted/70 border border-border/60 rounded-2xl flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.2 bg-primary/10 text-primary rounded-md uppercase">
                            {item.format}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.timestamp).toLocaleTimeString()} • {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-mono text-xs font-semibold text-foreground truncate">
                          {item.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const parsed = parseScanPayload(item.raw, item.format)
                            setScanResult(parsed)
                            setShowHistoryModal(false)
                          }}
                          className="h-8 px-2.5 rounded-lg text-xs text-primary"
                          title={isArabic ? 'استعادة وعرض' : 'View / Restore'}
                        >
                          <ArrowRight size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item.raw)}
                          className="h-8 px-2 rounded-lg text-muted-foreground hover:text-foreground"
                          title={isArabic ? 'نسخ النص' : 'Copy'}
                        >
                          <Copy size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="h-8 px-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title={isArabic ? 'حذف هذا العنصر' : 'Delete item'}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
