"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useTheme } from 'next-themes'
import {
  Code,
  Trash2,
  Copy,
  Check,
  Sun,
  Moon,
  Menu,
  X,
  Star,
  LayoutDashboard,
  Binary,
  ArrowLeftRight,
  Sparkles,
  RefreshCw,
  FileText,
  Key,
  Fingerprint,
  Globe,
  Shield
} from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { isFavoriteTool, toggleFavoriteTool } from '@/actions/favorites'
import { useRouter } from 'next/navigation'

function Base64ToolContent() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // التبديل بين الوضعين: 'encode' أو 'decode'
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  // نوع الترميز: 'utf-8' أو 'ascii'
  const [encoding, setEncoding] = useState<'utf-8' | 'ascii'>('utf-8')

  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [error, setError] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  const handleToggleFavorite = async () => {
    const nextFavorite = !isFavorite
    setIsFavorite(nextFavorite)

    try {
      await toggleFavoriteTool("base64-tool")
      router.refresh()
    } catch (error) {
      setIsFavorite(!nextFavorite)
      console.error("Error toggling favorite:", error)
    }
  }

  const handleSomething = async () => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed("base64-tool")
      ]);
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadFavorite = async () => {
      const favorite = await isFavoriteTool("base64-tool")
      setIsFavorite(favorite)
    }

    loadFavorite()
  }, [])

  useEffect(() => {
    if (!inputText) {
      setOutputText('')
      setError('')
      return
    }

    try {
      setError('')
      if (mode === 'encode') {
        if (encoding === 'utf-8') {
          const bytes = new TextEncoder().encode(inputText)
          const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("")
          setOutputText(btoa(binString))
        } else {
          if (/[^\x00-\x7F]/.test(inputText)) {
            throw new Error('ASCII Encoding Error: Input contains non-ASCII characters (e.g., Arabic or Emojis). Please switch to UTF-8.')
          }
          setOutputText(btoa(inputText))
        }
      } else {
        // فك تشفير الـ Base64 
        if (encoding === 'utf-8') {
          const binString = atob(inputText.trim())
          const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0))
          setOutputText(new TextDecoder().decode(bytes))
        } else {
          const decodedAscii = atob(inputText.trim())
          if (/[^\x00-\x7F]/.test(decodedAscii)) {
            throw new Error('ASCII Decoding Error: The payload resolves to multi-byte UTF-8 structures. Please switch to UTF-8 mode.')
          }
          setOutputText(decodedAscii)
        }
      }
    } catch (err: any) {
      setOutputText('')
      if (err.message && err.message.includes('Encoding Error')) {
        setError(err.message)
      } else if (err.message && err.message.includes('Decoding Error')) {
        setError(err.message)
      } else {
        if (mode === 'decode') {
          setError('Invalid Base64 String: Please check the structure or padding (=).')
        } else {
          setError('Conversion error occurred.')
        }
      }
    }
  }, [inputText, mode, encoding])

  const handleCopy = async () => {
    if (!outputText) return
    navigator.clipboard.writeText(outputText)
    setIsCopied(true)
    await handleSomething();
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleClear = () => {
    setInputText('')
    setOutputText('')
    setError('')
  }

  const loadSample = () => {
    if (mode === 'encode') {
      setInputText(encoding === 'utf-8'
        ? 'Welcome to DigitalMix! مبرمجين المستقبل 🚀'
        : 'Welcome to DigitalMix! High-performance developer ecosystem.'
      )
    } else {
      setInputText(encoding === 'utf-8'
        ? 'V2VsY29tZSB0byBEaWdpdGFsTWl4ISDYp9mE2YXYqNix2YXYrNmK2YYg2KfZhNmF2LPYqtmC2KjZhCA🚀'
        : 'V2VsY29tZSB0byBEaWdpdGFsTWl4ISBIaWdoLXBlcmZvcm1hbmNlIGRldmVsb3BlciBlY29zeXN0ZW0u'
      )
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      {/* Header Framework */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between w-full gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Binary className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground leading-none">
                  DigitalMix
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Base64 Encoder / Decoder</span>
              </div>
            </Link>

            <div className="flex items-center gap-2 shrink-0">
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="text-muted-foreground hover:text-foreground h-9 w-9"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
      <div className="py-10 px-4 text-center bg-gradient-to-b from-primary/5 to-transparent">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 flex items-center justify-center gap-3">
          <Binary className="h-8 w-8 text-primary" /> Base64 Encoder / Decoder
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Instantly convert plain text or binary structures into safe ASCII strings, or reverse existing Base64 strings back to readable text format.
        </p>
      </div>

      {/* Main Workspace Container */}
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Control Toolbar: Mode Switcher & Encoding Selector */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          {/* Mode Tabs */}
          <div className="bg-secondary/60 p-1.5 rounded-xl border border-border flex gap-2">
            <button
              onClick={() => { setMode('encode'); handleClear(); }}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all ${mode === 'encode'
                ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Base64 Encode
            </button>
            <button
              onClick={() => { setMode('decode'); handleClear(); }}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all ${mode === 'decode'
                ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Base64 Decode
            </button>
          </div>

          {/* Encoding Selector Dropdown */}
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl shadow-sm">
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Charset:</span>
            <select
              value={encoding}
              onChange={(e) => { setEncoding(e.target.value as 'utf-8' | 'ascii'); handleClear(); }}
              className="bg-transparent font-mono text-xs font-bold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="utf-8" className="bg-background text-foreground">UTF-8 (Multi-byte / Arabic)</option>
              <option value="ascii" className="bg-background text-foreground">ASCII (Standard 7-bit)</option>
            </select>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* Input Box */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                {mode === 'encode' ? 'Plain Text Input' : 'Base64 Encoded Input'}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadSample}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Use Sample
                </button>
                <span className="text-muted-foreground text-xs">|</span>
                <button
                  onClick={handleClear}
                  className="text-xs text-destructive hover:underline flex items-center gap-1 font-medium"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={mode === 'encode' ? `Type or paste your raw text here (${encoding.toUpperCase()})...` : "Paste your Base64 payload string here (e.g., dGVzdA==)..."}
              className="w-full h-64 p-4 rounded-xl border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none leading-relaxed text-foreground"
            />
          </div>

          {/* Output Box */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4 relative">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
                {mode === 'encode' ? 'Base64 Output Payload' : 'Decoded Plain Text Output'}
              </label>
              {outputText && (
                <button
                  onClick={handleCopy}
                  className="h-8 px-3 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {isCopied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>

            <div className="relative h-64 w-full rounded-xl border border-border bg-background p-4 overflow-y-auto font-mono text-sm leading-relaxed text-foreground break-all whitespace-pre-wrap select-all">
              {outputText || (
                <span className="text-muted-foreground/60 italic text-xs select-none">
                  {error ? '' : 'Output pipeline will render conversion matrices in real-time...'}
                </span>
              )}
              {error && (
                <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl font-mono mt-2 select-none">
                  ⚠️ {error}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Developer Info Box */}
        <div className="mt-8 p-4 rounded-xl bg-secondary/40 border border-border text-center text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          <strong>💡 Developer Tip:</strong> Base64 is an encoding mechanism designed to safely carry data across networks that might corrupt raw binary or special symbols. It is <strong>not</strong> an encryption algorithm. Do not use it to secure passwords or sensitive client keys without active cryptographic layers!
        </div>
      </div> {/* Closed the Main Workspace container here correctly */}

      {/* Modules Framework Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-t border-border/60 mt-12">
        <h3 className="text-sm font-bold text-center mb-6 text-muted-foreground uppercase tracking-widest">
          Optimized Developer Validation Modules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <Link href="/tools/regex-tester" className="p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all text-center flex flex-col items-center justify-center gap-2 group">
            <Code className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-bold text-foreground group-hover:text-primary">Regex Tester / Debugger</span>
            <span className="text-[10px] text-muted-foreground">Test regular expressions, trace capture groups, and analyze positions</span>
          </Link>

          <Link href="/tools/jwt" className="p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all text-center flex flex-col items-center justify-center gap-2 group">
            <Shield className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-bold text-foreground group-hover:text-primary">JWT Decoder/Encoder</span>
            <span className="text-[10px] text-muted-foreground">Decode, Encode, verify, and generate JSON Web Tokens instantly</span>
          </Link>

          <Link href="/tools/uuid-generator" className="p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all text-center flex flex-col items-center justify-center gap-2 group">
            <Fingerprint className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-bold text-foreground group-hover:text-primary">RFC 4122 UUID Generator</span>
            <span className="text-[10px] text-muted-foreground">Instantly provision unique V4 identifier tokens for database keys</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Base64Tool() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono text-xs">Loading Mix Core...</div>}>
      <Base64ToolContent />
    </Suspense>
  )
}