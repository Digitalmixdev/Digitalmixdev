'use client'

import React, { useState, useRef, useEffect, useTransition, Suspense } from 'react'
import { useTheme } from 'next-themes'
import {
  Code,
  Download,
  Copy,
  Share2,
  Sun,
  Moon,
  Menu,
  X,
  Star,
  LayoutDashboard,
  QrCode,
  Check,
  Zap,
  Lock,
  Palette,
  ChevronDown,
  ChevronRight,
  Search as SearchIcon
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { isFavoriteTool, toggleFavoriteTool } from '@/actions/favorites'
import { useRouter } from 'next/navigation'

function QRCodeToolContent() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [isFavorite, setIsFavorite] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [canShare, setCanShare] = useState(false)
  const [qrType, setQrType] = useState('url')
  const [qrData, setQrData] = useState('')
  const [qrSize, setQrSize] = useState('256')
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [copied, setCopied] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  const [wifiSSID, setWifiSSID] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [wifiSecurity, setWifiSecurity] = useState('WPA')

  const [vcardName, setVcardName] = useState('')
  const [vcardEmail, setVcardEmail] = useState('')
  const [vcardPhone, setVcardPhone] = useState('')
  const [vcardOrg, setVcardOrg] = useState('')

  const [smsPhone, setSmsPhone] = useState('')
  const [smsMessage, setSmsMessage] = useState('')

  useEffect(() => {
    setMounted(true)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      setCanShare(true)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    let isSubscribed = true

    const loadFavorite = async () => {
      try {
        const favorite = await isFavoriteTool('qr-code-generator')
        if (isSubscribed) {
          setIsFavorite(favorite)
        }
      } catch (error) {
        console.error('Error loading favorite:', error)
      }
    }
    loadFavorite()

    return () => {
      isSubscribed = false
    }
  }, [mounted])

  const handleToggleFavorite = async () => {
    const nextFavorite = !isFavorite
    setIsFavorite(nextFavorite)
    try {
      await toggleFavoriteTool('qr-code-generator')
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      setIsFavorite(!nextFavorite)
      console.error('Error toggling favorite:', error)
    }
  }

  const getQRValue = () => {
    switch (qrType) {
      case 'url':
      case 'text':
        return qrData
      case 'email':
        return qrData ? `mailto:${qrData}` : ''
      case 'phone':
        return qrData ? `tel:${qrData}` : ''
      case 'sms':
        return smsPhone ? `SMSTO:${smsPhone}:${smsMessage}` : ''
      case 'wifi':
        return wifiSSID ? `WIFI:T:${wifiSecurity};S:${wifiSSID};P:${wifiPassword};;` : ''
      case 'vcard':
        return vcardName ? `BEGIN:VCARD\nVERSION:3.0\nFN:${vcardName}\nEMAIL:${vcardEmail}\nTEL:${vcardPhone}\nORG:${vcardOrg}\nEND:VCARD` : ''
      default:
        return qrData
    }
  }

  const handleDownload = async (format: 'png' | 'svg' | 'jpeg') => {
    const qrValue = getQRValue()

    if (!qrValue) {
      toast.error('Please enter data to generate QR code')
      return
    }

    try {
      await incrementToolUsage()
      await markToolUsed('qr-code-generator')
    } catch (error) {
      console.error('Error updating stats:', error)
    }

    if (format === 'svg') {
      const svg = qrRef.current?.querySelector('svg')
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `qrcode.svg`
        link.click()
      }
    } else {
      const svg = qrRef.current?.querySelector('svg')
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
          canvas.width = parseInt(qrSize)
          canvas.height = parseInt(qrSize)
          if (ctx) {
            ctx.fillStyle = bgColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
            const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
            const link = document.createElement('a')
            link.download = `qrcode.${format === 'jpeg' ? 'jpg' : 'png'}`
            link.href = canvas.toDataURL(mimeType, 0.95)
            link.click()
          }
        }
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
      }
    }
  }

  const handleCopy = async () => {
    const qrValue = getQRValue()
    if (qrValue) {
      navigator.clipboard.writeText(qrValue)
      setCopied(true)
      toast.success('QR data copied to clipboard!')
      try {
        await incrementToolUsage()
        await markToolUsed('qr-code-generator')
      } catch (error) {
        console.error('Error updating stats:', error)
      }
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    const qrValue = getQRValue()
    if (canShare && qrValue) {
      try {
        await navigator.share({
          title: 'QR Code',
          text: `Check out this QR code: ${qrValue}`,
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    }
  }

  const features = [
    { icon: Palette, title: 'Fully Customizable', description: 'Tailor foreground and background colors, adjust dimensions, and set custom error correction levels seamlessly.' },
    { icon: Zap, title: 'Multiple Formats', description: 'Export vector-based SVGs for high-quality printing or instant PNG/JPEG files for immediate digital usage.' },
    { icon: Lock, title: '100% Client-Side', description: 'Your inputs and personal details never leave your browser frame. All generation happens locally.' },
    { icon: QrCode, title: 'Multi-Type Support', description: 'Supports standard URLs, WiFi credentials, vCards, SMS payload format, and raw text conversions.' },
  ]

  const faqs = [
    { q: 'What is Error Correction Level?', a: 'Error correction allows QR codes to be read even if they are damaged or obscured. Higher levels add more redundant data.' },
    { q: 'Will my QR codes expire?', a: 'No, all generated QR codes are static and direct. They will work forever as long as the underlying data/link stays valid.' },
    { q: 'Are my generated QR codes stored on any server?', a: 'No. Everything is rendered client-side directly within your web browser for complete data privacy.' },
  ]

  const relatedTools = [
    { name: 'Base64 Encoder/Decoder', href: '/tools/base64' },
    { name: 'JWT Decoder/Encoder', href: '/tools/jwt' },
    { name: 'UUID Generator', href: '/tools/uuid-generator' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between pt-16">
      <div>
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between w-full gap-4">

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <QrCode className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-foreground leading-none">
                    DigitalMix
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    QR Code Generator
                  </span>
                </div>
              </Link>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {mounted && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="text-muted-foreground hover:text-foreground h-9 w-9"
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className={`hidden sm:flex gap-2 font-medium h-9 px-3 ${isFavorite
                      ? "text-amber-500 hover:text-amber-600"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                  onClick={handleToggleFavorite}
                >
                  <Star
                    className={`h-4 w-4 ${isFavorite ? "fill-amber-500 text-amber-500" : ""
                      }`}
                  />
                  {isFavorite ? "Favorited" : "Favorite"}
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  className="hidden sm:flex text-muted-foreground hover:text-foreground gap-2 font-medium h-9 px-3"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden text-muted-foreground h-9 w-9"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl p-4 space-y-2">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 ${isFavorite
                    ? "text-amber-500 hover:text-amber-600"
                    : "text-foreground"
                  }`}
                onClick={handleToggleFavorite}
              >
                <Star
                  className={`h-4 w-4 ${isFavorite ? "fill-amber-500 text-amber-500" : ""
                    }`}
                />
                {isFavorite ? "Favorited" : "Favorite"}
              </Button>

              <Button
                asChild
                variant="ghost"
                className="w-full text-foreground justify-start gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>
          )}
        </header>

        {/* Hero Section */}
        <div className="pt-12 pb-12 px-4 text-center bg-linear-to-b from-primary/5 to-transparent">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Free QR Code Generator
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Create custom QR codes instantly for URLs, text, Wi-Fi credentials, vCards, and more.
            Engineered with privacy-first client-side processing.
          </p>
        </div>

        {/* Main Tool Area */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold mb-3 block">QR Code Type</label>
                <select
                  value={qrType}
                  onChange={(e) => setQrType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="url">URL / Link</option>
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="sms">SMS Message</option>
                  <option value="wifi">WiFi Network</option>
                  <option value="vcard">vCard (Contact)</option>
                </select>
              </div>

              {qrType === 'url' && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">Website URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={qrData}
                    onChange={(e) => setQrData(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}

              {qrType === 'text' && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">Text Content</label>
                  <textarea
                    placeholder="Enter your text here..."
                    value={qrData}
                    onChange={(e) => setQrData(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-24"
                  />
                </div>
              )}

              {qrType === 'email' && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">Email Address</label>
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={qrData}
                    onChange={(e) => setQrData(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}

              {qrType === 'phone' && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={qrData}
                    onChange={(e) => setQrData(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}

              {qrType === 'sms' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={smsPhone}
                      onChange={(e) => setSmsPhone(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Message</label>
                    <textarea
                      placeholder="Enter your message..."
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-20"
                    />
                  </div>
                </div>
              )}

              {qrType === 'wifi' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Network Name (SSID)</label>
                    <input
                      type="text"
                      placeholder="Your WiFi Network"
                      value={wifiSSID}
                      onChange={(e) => setWifiSSID(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Password</label>
                    <input
                      type="password"
                      placeholder="WiFi password"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Security</label>
                    <select
                      value={wifiSecurity}
                      onChange={(e) => setWifiSecurity(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">No Password</option>
                    </select>
                  </div>
                </div>
              )}

              {qrType === 'vcard' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={vcardName}
                    onChange={(e) => setVcardName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={vcardEmail}
                    onChange={(e) => setVcardEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={vcardPhone}
                    onChange={(e) => setVcardPhone(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="text"
                    placeholder="Organization"
                    value={vcardOrg}
                    onChange={(e) => setVcardOrg(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Size (px)</label>
                  <input
                    type="range"
                    min="128"
                    max="512"
                    step="32"
                    value={qrSize}
                    onChange={(e) => setQrSize(e.target.value)}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground mt-1">{qrSize}x{qrSize}</div>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Foreground Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-12 h-10 rounded-lg border border-border cursor-pointer bg-card"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-12 h-10 rounded-lg border border-border cursor-pointer bg-card"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block">Error Correction Level</label>
                  <select
                    value={errorLevel}
                    onChange={(e) => setErrorLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="L">Low (7%)</option>
                    <option value="M">Medium (15%)</option>
                    <option value="Q">Quartile (25%)</option>
                    <option value="H">High (30%)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Preview & Actions */}
            <div className="flex flex-col items-center justify-center">
              <div className="p-6 rounded-2xl border border-border bg-card shadow-lg">
                <div
                  ref={qrRef}
                  className="flex items-center justify-center p-4 rounded-xl"
                  style={{ backgroundColor: bgColor }}
                >
                  {getQRValue() ? (
                    <QRCodeSVG
                      value={getQRValue()}
                      size={parseInt(qrSize)}
                      level={errorLevel}
                      includeMargin={true}
                      fgColor={fgColor}
                      bgColor={bgColor}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground py-12 px-6">
                      <QrCode className="h-16 w-16 mx-auto opacity-30" />
                      <p className="mt-4 text-sm font-medium">Enter data to generate QR code</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 w-full max-w-sm space-y-3">
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload('png')}
                    variant="outline"
                    className="flex-1 gap-2 border-border bg-secondary hover:bg-secondary/80"
                  >
                    <Download className="h-4 w-4" />
                    PNG
                  </Button>
                  <Button
                    onClick={() => handleDownload('svg')}
                    variant="outline"
                    className="flex-1 gap-2 border-border bg-secondary hover:bg-secondary/80"
                  >
                    <Download className="h-4 w-4" />
                    SVG
                  </Button>
                  <Button
                    onClick={() => handleDownload('jpeg')}
                    variant="outline"
                    className="flex-1 gap-2 border-border bg-secondary hover:bg-secondary/80"
                  >
                    <Download className="h-4 w-4" />
                    JPEG
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCopy} variant="secondary" className="flex-1 gap-2">
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy Text'}
                  </Button>
                  {canShare && (
                    <Button onClick={handleShare} variant="secondary" className="flex-1 gap-2">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">Why Use Our Generator?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors">
                  <feature.icon className="h-10 w-10 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs */}
          <div className="mb-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full p-4 flex items-center justify-between text-left font-medium hover:bg-secondary/50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {expandedFaq === idx ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  {expandedFaq === idx && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Related Tools */}
          <div className="text-center pb-8">
            <h3 className="text-lg font-semibold mb-4">Related Tools</h3>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {relatedTools.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className="px-4 py-2 rounded-full border border-border bg-secondary hover:bg-secondary/80 hover:border-primary/50 text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <SearchIcon className="h-4 w-4" />
                  {tool.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function QRCodeTool() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono text-xs">Loading DigitalMix QR Engine...</div>}>
      <QRCodeToolContent />
    </Suspense>
  )
}