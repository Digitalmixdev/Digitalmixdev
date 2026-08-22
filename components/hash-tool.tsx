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
  LayoutDashboard,
  Key,
  Star,
  Sparkles,
  ShieldAlert,
  Binary,
  Fingerprint
} from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { isFavoriteTool, toggleFavoriteTool } from '@/actions/favorites'
import { useRouter } from 'next/navigation'

function HashToolContent() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [inputText, setInputText] = useState('')
  const [copiedAlgo, setCopiedAlgo] = useState<string | null>(null)

  // مصفوفة لتخزين قيم الـ Hashes المختلفة
  const [hashes, setHashes] = useState({
    md5: '',
    sha1: '',
    sha256: '',
    sha512: ''
  })

  const handleToggleFavorite = async () => {
    const nextFavorite = !isFavorite
    setIsFavorite(nextFavorite)

    try {
      await toggleFavoriteTool("hash-tool")
      router.refresh()
    } catch (error: unknown) {
      setIsFavorite(!nextFavorite)
      console.error("Error toggling favorite:", error)
    }
  }

  const handleSomething = async () => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed("hash-tool") 
      ]);
    } catch (error: unknown) {
      console.error("Error updating stats:", error);
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadFavorite = async () => {
      const favorite = await isFavoriteTool("hash-tool")
      setIsFavorite(favorite)
    }

    loadFavorite()
  }, [])


  // دالة لتوليد الـ MD5 باستخدام الـ Crypto API البديلة (لأن المتصفحات لا تدعم MD5 أصلياً في Web Crypto)
  const calculateMD5 = (str: string) => {
    let k = [
      0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
      0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
      0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
      0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
      0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
      0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
      0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
      0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
    ];
    let r = [
      7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
      5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
      4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
      6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
    ];
    let words: number[] = [];
    let byteLength = str.length;
    for (let i = 0; i < byteLength; i++) {
      words[i >> 2] |= (str.charCodeAt(i) & 0xff) << ((i % 4) * 8);
    }
    words[byteLength >> 2] |= 0x80 << ((byteLength % 4) * 8);
    let arrayLength = (((byteLength + 8) >> 6) + 1) * 16;
    while (words.length < arrayLength) words.push(0);
    words[arrayLength - 2] = byteLength * 8;
    let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476;
    for (let i = 0; i < words.length; i += 16) {
      let a = h0, b = h1, c = h2, d = h3;
      for (let j = 0; j < 64; j++) {
        let f = 0, g = 0;
        if (j < 16) { f = (b & c) | (~b & d); g = j; }
        else if (j < 32) { f = (d & b) | (~d & c); g = (5 * j + 1) % 16; }
        else if (j < 48) { f = b ^ c ^ d; g = (3 * j + 5) % 16; }
        else { f = c ^ (b | ~d); g = (7 * j) % 16; }
        let temp = d;
        d = c;
        c = b;
        b = (b + ((a + f + k[j] + words[i + g]) << r[j] | (a + f + k[j] + words[i + g]) >>> (32 - r[j]))) | 0;
        a = temp;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    }
    let result = [h0, h1, h2, h3];
    return result.map(v => {
      let s = '';
      for (let i = 0; i < 4; i++) s += ((v >>> (i * 8)) & 0xff).toString(16).padStart(2, '0');
      return s;
    }).join('');
  }

  // حساب الـ Hashes بشكل فوري عند تغيير النص الأساسي
  useEffect(() => {
    if (!inputText) {
      setHashes({ md5: '', sha1: '', sha256: '', sha512: '' })
      return
    }

    const generateHashes = async () => {
      try {
        const msgUint8 = new TextEncoder().encode(inputText)

        // 1. حساب SHA-1 (using explicit window runtime reference target maps)
        const hashBufferSha1 = await window.crypto.subtle.digest('SHA-1', msgUint8)
        const sha1 = Array.from(new Uint8Array(hashBufferSha1)).map(b => b.toString(16).padStart(2, '0')).join('')

        // 2. حساب SHA-256
        const hashBufferSha256 = await window.crypto.subtle.digest('SHA-256', msgUint8)
        const sha256 = Array.from(new Uint8Array(hashBufferSha256)).map(b => b.toString(16).padStart(2, '0')).join('')

        // 3. حساب SHA-512
        const hashBufferSha512 = await window.crypto.subtle.digest('SHA-512', msgUint8)
        const sha512 = Array.from(new Uint8Array(hashBufferSha512)).map(b => b.toString(16).padStart(2, '0')).join('')

        // 4. حساب MD5
        const md5 = calculateMD5(inputText)

        setHashes({ md5, sha1, sha256, sha512 })
      } catch (err) {
        console.error("Cryptographic engine initialization failure:", err)
      }
    }

    generateHashes()
  }, [inputText])

  const handleCopy = async (text: string, algo: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedAlgo(algo)
    await handleSomething();
    setTimeout(() => setCopiedAlgo(null), 2000)
  }

  const handleClear = () => {
    setInputText('')
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
                <Key className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground leading-none">
                  DigitalMix
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Crypto Hash Generator</span>
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
              className={`w-full justify-start gap-2 ${
                isFavorite
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-foreground"
              }`}
              onClick={handleToggleFavorite}
            >
              <Star
                className={`h-4 w-4 ${
                  isFavorite ? "fill-amber-500 text-amber-500" : ""
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
          <Key className="h-8 w-8 text-primary" /> Cryptographic Hash Generator
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Compute secure message digests instantly in your browser thread. Ideal for checksum validation, integrity auditing, and digital signatures.
        </p>
      </div>

      {/* Main Workspace */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Input Text Block */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Source String Input
            </label>
            {inputText && (
              <button
                onClick={handleClear}
                className="text-xs text-destructive hover:underline flex items-center gap-1 font-medium"
              >
                <Trash2 className="h-3 w-3" /> Clear Input
              </button>
            )}
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste your data string here to generate hashes in real-time..."
            className="w-full h-32 p-4 rounded-xl border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none leading-relaxed text-foreground"
          />
        </div>

        {/* Output Pipeline Grid */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold tracking-wider text-muted-foreground uppercase px-1">
            Generated Cipher Matrices
          </h2>

          {[
            { id: 'md5', name: 'MD5', value: hashes.md5, length: '128-bit', desc: 'Commonly used for legacy file verification. Vulnerable to collisions.', warning: true },
            { id: 'sha1', name: 'SHA-1', value: hashes.sha1, length: '160-bit', desc: 'Deprecated architectural checksum standard.', warning: true },
            { id: 'sha256', name: 'SHA-256', value: hashes.sha256, length: '256-bit', desc: 'Secure industry standard for data verification and blockchain systems.', warning: false },
            { id: 'sha512', name: 'SHA-512', value: hashes.sha512, length: '512-bit', desc: 'Ultra-secure high-bit signature for absolute cryptographic operations.', warning: false }
          ].map((item) => (
            <div key={item.id} className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-border/80">
              <div className="space-y-1 min-w-[120px]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-tight text-foreground">{item.name}</span>
                  <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded font-mono text-muted-foreground">{item.length}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-tight max-w-xs">{item.desc}</p>
              </div>

              <div className="flex-1 font-mono text-xs bg-background p-3 rounded-lg border border-border break-all min-h-[42px] flex items-center text-foreground relative group select-all">
                {item.value ? (
                  <span className={item.warning ? 'text-muted-foreground/90' : 'text-primary font-medium'}>
                    {item.value}
                  </span>
                ) : (
                  <span className="text-muted-foreground/40 italic text-[11px]">Awaiting source input execution matrix...</span>
                )}

                {item.value && item.warning && (
                  <span className="absolute right-3 top-3 md:top-auto flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-sans select-none">
                    <ShieldAlert className="h-2.5 w-2.5" /> Weak
                  </span>
                )}
              </div>

              <Button
                disabled={!item.value}
                onClick={() => handleCopy(item.value, item.id)}
                variant="outline"
                size="sm"
                className="h-9 w-full md:w-24 gap-1.5 text-xs font-medium self-end md:self-center"
              >
                {copiedAlgo === item.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copiedAlgo === item.id ? 'Copied' : 'Copy'}
              </Button>
            </div>
          ))}
        </div>

        {/* Informative Guidance Footer */}
        <div className="p-4 rounded-xl bg-secondary/40 border border-border text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto text-center">
          <strong>🔒 Security Enforcement Vector:</strong> Cryptographic hashes are one-way evaluation pipelines. They can verify integrity but cannot be reversed. To protect user passwords inside databases, always ensure you incorporate modern salting practices (`bcrypt` / `argon2`) rather than standard raw hex hashes!
        </div>
      </div>

      {/* Navigational Validation Matrix Links */}
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

          <Link href="/tools/base64" className="p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all text-center flex flex-col items-center justify-center gap-2 group">
            <Binary className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-bold text-foreground group-hover:text-primary">Base64 Encoder / Decoder</span>
            <span className="text-[10px] text-muted-foreground">Instantly map binary arrays or standard strings to ASCII formats</span>
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

export default function HashTool() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono text-xs">Loading Mix Core...</div>}>
      <HashToolContent />
    </Suspense>
  )
}