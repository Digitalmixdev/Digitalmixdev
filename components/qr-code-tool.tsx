'use client'

import React, { useState, useRef, useEffect, Suspense } from 'react'
import {
  QrCode,
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
} from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'

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
      case 'sms':
        return `SMSTO:${smsPhone}:${smsMessage}`
      case 'text':
      default:
        return plainText || 'DigitalMix Tools'
    }
  }

  const payload = getEncodedPayload()

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
      recordUsage()
      toast.success('PNG QR code downloaded successfully')
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
    recordUsage()
    toast.success('SVG vector QR code downloaded successfully')
  }

  const handleCopyPayload = async () => {
    await navigator.clipboard.writeText(payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Payload copied to clipboard')
  }

  const COLOR_PRESETS = [
    { name: 'Classic Black', fg: '#000000', bg: '#FFFFFF' },
    { name: 'Indigo Core', fg: '#3b82f6', bg: '#FFFFFF' },
    { name: 'Emerald Forest', fg: '#059669', bg: '#FFFFFF' },
    { name: 'Royal Purple', fg: '#7c3aed', bg: '#FFFFFF' },
    { name: 'Dark Slate', fg: '#0f172a', bg: '#f8fafc' },
  ]

  return (
    <ToolLayout metadata={toolMeta} maxWidth="6xl">
      {/* Schema Template Tabs */}
      <div className="flex flex-nowrap sm:flex-wrap items-center justify-start sm:justify-center gap-1.5 sm:gap-2 mb-8 bg-muted/60 p-1.5 rounded-2xl border border-border/70 w-full mx-auto overflow-x-auto">
        <button
          type="button"
          onClick={() => setQrType('url')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            qrType === 'url' ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          <LinkIcon className="h-3.5 w-3.5" /> URL Link
        </button>
        <button
          type="button"
          onClick={() => setQrType('wifi')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            qrType === 'wifi' ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          <Wifi className="h-3.5 w-3.5" /> WiFi Login
        </button>
        <button
          type="button"
          onClick={() => setQrType('vcard')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            qrType === 'vcard' ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          <User className="h-3.5 w-3.5" /> vCard Contact
        </button>
        <button
          type="button"
          onClick={() => setQrType('sms')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            qrType === 'sms' ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5" /> SMS Text
        </button>
        <button
          type="button"
          onClick={() => setQrType('text')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            qrType === 'text' ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
          }`}
        >
          <FileText className="h-3.5 w-3.5" /> Plain Text
        </button>
      </div>

      {/* Grid: Inputs + QR Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 7 Columns */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground">Content Information</h3>

            {qrType === 'url' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Website URL Destination</label>
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
                  <label className="text-xs font-semibold text-muted-foreground">Network Name (SSID)</label>
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
                    <label className="text-xs font-semibold text-muted-foreground">Password</label>
                    <input
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="SecretPassword"
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Encryption</label>
                    <select
                      value={wifiSecurity}
                      onChange={(e) => setWifiSecurity(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-border bg-background text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">Open (No Password)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {qrType === 'vcard' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    value={vcardName}
                    onChange={(e) => setVcardName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Company / Org</label>
                  <input
                    type="text"
                    value={vcardOrg}
                    onChange={(e) => setVcardOrg(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Phone</label>
                  <input
                    type="tel"
                    value={vcardPhone}
                    onChange={(e) => setVcardPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Email</label>
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
                  <label className="text-xs font-semibold text-muted-foreground">Recipient Phone Number</label>
                  <input
                    type="tel"
                    value={smsPhone}
                    onChange={(e) => setSmsPhone(e.target.value)}
                    placeholder="+1 555 0192"
                    className="w-full h-11 px-3 rounded-xl border border-border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Pre-filled Message</label>
                  <textarea
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Hello from DigitalMix!"
                    className="w-full h-20 p-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground resize-none"
                  />
                </div>
              </div>
            )}

            {qrType === 'text' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Raw Text Payload</label>
                <textarea
                  value={plainText}
                  onChange={(e) => setPlainText(e.target.value)}
                  placeholder="Type any plain text or code here..."
                  className="w-full h-24 p-3 rounded-xl border border-border bg-background font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground resize-none"
                />
              </div>
            )}
          </div>

          {/* QR Code Styling Customization */}
          <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" /> Visual Design & Colors
            </h3>

            {/* Color Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Color Presets</label>
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
                <label className="text-xs font-semibold text-muted-foreground">Foreground</label>
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
                <label className="text-xs font-semibold text-muted-foreground">Background</label>
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
                <label className="text-xs font-semibold text-muted-foreground">Size (px)</label>
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
                <label className="text-xs font-semibold text-muted-foreground">Error Level</label>
                <select
                  value={errorLevel}
                  onChange={(e) => setErrorLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                  className="w-full h-10 px-2 rounded-xl border border-border bg-background text-xs font-bold focus:outline-none cursor-pointer text-foreground"
                >
                  <option value="L">Low (7%)</option>
                  <option value="M">Medium (15%)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="H">High (30%)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview: 5 Columns */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-5 text-center flex flex-col items-center">
          <h3 className="text-sm font-bold text-foreground">Live Generated Matrix</h3>

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
                <Download className="h-3.5 w-3.5" /> Download PNG
              </Button>
              <Button variant="outline" onClick={downloadSVG} className="w-full text-xs font-bold gap-1.5 rounded-xl h-10 border-border">
                <Download className="h-3.5 w-3.5" /> Download SVG
              </Button>
            </div>

            <Button
              variant="secondary"
              onClick={handleCopyPayload}
              className="w-full text-xs font-semibold gap-1.5 rounded-xl h-10"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Payload Copied' : 'Copy Raw Encoded Text'}
            </Button>
          </div>
        </div>
      </div>
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