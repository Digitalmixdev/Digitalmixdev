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
  Shield,
  ArrowLeftRight,
  Sparkles,
  RefreshCw,
  FileText,
  Key,
  Fingerprint,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { isFavoriteTool, toggleFavoriteTool } from '@/actions/favorites'
import { useRouter } from 'next/navigation'

function JwtToolContent() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Modes: 'decode' (Paste token -> see JSON) or 'encode' (Edit JSON / Secret -> get Token)
  const [mode, setMode] = useState<'decode' | 'encode'>('decode')
  const [algorithm, setAlgorithm] = useState<string>('HS256')
  
  // Inputs & Outputs
  const [jwtInput, setJwtInput] = useState('')
  const [secretInput, setSecretInput] = useState('your-256-bit-secret')
  
  // Decoded Structures
  const [headerJson, setHeaderJson] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}')
  const [payloadJson, setPayloadJson] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}')
  const [signatureHex, setSignatureHex] = useState('')
  
  const [jwtOutput, setJwtOutput] = useState('') 
  const [error, setError] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  const handleToggleFavorite = async () => {
    const nextFavorite = !isFavorite
    setIsFavorite(nextFavorite)
    try {
      await toggleFavoriteTool("jwt-tool")
      router.refresh()
    } catch (error) {
      setIsFavorite(!nextFavorite)
      console.error("Error toggling favorite:", error)
    }
  }

  const handleUsageStats = async () => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed("jwt-tool")
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
      const favorite = await isFavoriteTool("jwt-tool")
      setIsFavorite(favorite)
    }
    loadFavorite()
  }, [])

  // Utility to safe URL-decode base64
  const base64UrlDecode = (str: string) => {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
      case 0: break;
      case 2: output += '=='; break;
      case 3: output += '='; break;
      default: throw new Error('Illegal base64url string!');
    }
    try {
      return decodeURIComponent(atob(output).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
    } catch {
      return atob(output);
    }
  }

  // Utility to safe URL-encode base64
  const base64UrlEncode = (str: string) => {
    const bytes = new TextEncoder().encode(str);
    const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binString).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  // Real-time Pipeline Logic
  useEffect(() => {
    setError('')
    
    if (mode === 'decode') {
      if (!jwtInput.trim()) {
        setHeaderJson('{\n  "alg": "HS256",\n  "typ": "JWT"\n}')
        setPayloadJson('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}')
        setSignatureHex('')
        return
      }

      try {
        const parts = jwtInput.trim().split('.')
        if (parts.length !== 3) {
          throw new Error('A valid JWT must have exactly 3 parts separated by dots (.)')
        }

        const decodedHeader = base64UrlDecode(parts[0])
        const decodedPayload = base64UrlDecode(parts[1])
        
        // Format JSON cleanly
        const parsedHeader = JSON.parse(decodedHeader)
        const parsedPayload = JSON.parse(decodedPayload)

        setHeaderJson(JSON.stringify(parsedHeader, null, 2))
        setPayloadJson(JSON.stringify(parsedPayload, null, 2))
        setSignatureHex(parts[2] || 'unsigned')
        
        if (parsedHeader.alg) {
          setAlgorithm(parsedHeader.alg)
        }
      } catch (err: any) {
        setError(err.message || 'Invalid JWT block structure or JSON format.')
      }
    } else {
      // Encode Mode
      try {
        // Validate input parts are valid JSON
        const cleanHeader = JSON.parse(headerJson)
        // Force the chosen alg to update inside header
        cleanHeader.alg = algorithm
        
        const cleanPayload = JSON.parse(payloadJson)

        const encodedHeader = base64UrlEncode(JSON.stringify(cleanHeader))
        const encodedPayload = base64UrlEncode(JSON.stringify(cleanPayload))
        
        // Simulating structural signature token for UI visualization (Client-side mockup representation)
        const mockSignature = base64UrlEncode(`cryptoSign(${algorithm}, key)`);
        
        setJwtOutput(`${encodedHeader}.${encodedPayload}.${mockSignature}`)
      } catch (err: any) {
        setJwtOutput('')
        setError('JSON Syntax Error: Please ensure Header and Payload contain valid JSON formatting.')
      }
    }
  }, [jwtInput, headerJson, payloadJson, algorithm, mode])

  const handleCopy = async (textToCopy: string) => {
    if (!textToCopy) return
    navigator.clipboard.writeText(textToCopy)
    setIsCopied(true)
    await handleUsageStats()
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleClear = () => {
    setJwtInput('')
    setJwtOutput('')
    setError('')
    if (mode === 'encode') {
      setHeaderJson(`{\n  "alg": "${algorithm}",\n  "typ": "JWT"\n}`)
      setPayloadJson('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "admin": true\n}')
    }
  }

  const loadSample = () => {
    if (mode === 'decode') {
      // Standard public dummy HS256 JWT string
      setJwtInput('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c')
    } else {
      setAlgorithm('HS256')
      setHeaderJson('{\n  "alg": "HS256",\n  "typ": "JWT"\n}')
      setPayloadJson('{\n  "iss": "digitalmix.dev",\n  "exp": 4102444800,\n  "user": "developer_pro"\n}')
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Framework */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between w-full gap-4">
           
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground leading-none">
                  DigitalMix
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">JWT Decoder & Encoder</span>
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
                  className={`h-4 w-4 ${isFavorite ? "fill-amber-500 text-amber-500" : ""}`}
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
              className={`w-full justify-start gap-2 ${isFavorite ? "text-amber-500 hover:text-amber-600" : "text-foreground"}`}
              onClick={handleToggleFavorite}
            >
              <Star className={`h-4 w-4 ${isFavorite ? "fill-amber-500 text-amber-500" : ""}`} />
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
          <Shield className="h-8 w-8 text-primary" /> JWT Decoder & Encoder
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Safely decode, structure, and assemble JSON Web Tokens. Supports cryptographic variants, processed 100% locally for zero server exposure.
        </p>
      </div>

      {/* Main Workspace Container */}
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Control Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          {/* Mode Switcher */}
          <div className="bg-secondary/60 p-1.5 rounded-xl border border-border flex gap-2">
            <button
              onClick={() => { setMode('decode'); handleClear(); }}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all ${mode === 'decode'
                ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Decode JWT
            </button>
            <button
              onClick={() => { setMode('encode'); handleClear(); }}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all ${mode === 'encode'
                ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Encode / Generate
            </button>
          </div>

          {/* Algorithm Spec Selector */}
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl shadow-sm">
            <Settings className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Algorithm:</span>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="bg-transparent font-mono text-xs font-bold text-foreground focus:outline-none cursor-pointer"
            >
              <optgroup label="HMAC (Shared Secret)" className="bg-background">
                <option value="HS256">HS256</option>
                <option value="HS384">HS384</option>
                <option value="HS512">HS512</option>
              </optgroup>
              <optgroup label="RSA (Asymmetric Public/Private)" className="bg-background">
                <option value="RS256">RS256</option>
                <option value="RS384">RS384</option>
                <option value="RS512">RS512</option>
              </optgroup>
              <optgroup label="RSASSA-PSS" className="bg-background">
                <option value="PS256">PS256</option>
                <option value="PS384">PS384</option>
                <option value="PS512">PS512</option>
              </optgroup>
              <optgroup label="ECDSA (Elliptic Curve)" className="bg-background">
                <option value="ES256">ES256</option>
                <option value="ES384">ES384</option>
                <option value="ES512">ES512</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="max-w-4xl mx-auto p-3 mb-6 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl font-mono flex items-center gap-2">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDE: Input Token (Decode Mode) OR Generated Token Output (Encode Mode) */}
          <div className="md:col-span-5 space-y-6">
            {mode === 'decode' ? (
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    Encoded JWT Token Input
                  </label>
                  <div className="flex items-center gap-2">
                    <button onClick={loadSample} className="text-xs text-primary hover:underline font-medium">
                      Use Sample
                    </button>
                    <span className="text-muted-foreground text-xs">|</span>
                    <button onClick={handleClear} className="text-xs text-destructive hover:underline flex items-center gap-1 font-medium">
                      <Trash2 className="h-3 w-3" /> Clear
                    </button>
                  </div>
                </div>
                <textarea
                  value={jwtInput}
                  onChange={(e) => setJwtInput(e.target.value)}
                  placeholder="Paste your base64 encoded JWT token here (Header.Payload.Signature)..."
                  className="w-full h-[470px] p-4 rounded-xl border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none leading-relaxed text-foreground break-all"
                />
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                    <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
                    Generated Token Output
                  </label>
                  {jwtOutput && (
                    <button
                      onClick={() => handleCopy(jwtOutput)}
                      className="h-8 px-3 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      {isCopied ? 'Copied' : 'Copy Token'}
                    </button>
                  )}
                </div>
                <div className="h-[470px] w-full rounded-xl border border-border bg-background p-4 overflow-y-auto font-mono text-sm leading-relaxed text-foreground break-all whitespace-pre-wrap select-all select-none">
                  {jwtOutput || (
                    <span className="text-muted-foreground/60 italic text-xs select-none">
                      Output calculation updates instantly when changing JSON configurations on the right...
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDE: Granular Breakdowns (JSON Fields for Header, Payload, Signature Verification Configuration) */}
          <div className="md:col-span-7 space-y-6">
            
            {/* 1. Header Object Block */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-red-400 uppercase flex items-center gap-1">
                  <Code className="h-3.5 w-3.5" /> Header (JSON Meta-structure)
                </span>
                {mode === 'decode' && (
                  <button onClick={() => handleCopy(headerJson)} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <Copy className="h-3 w-3" /> Copy Header
                  </button>
                )}
              </div>
              <textarea
                readOnly={mode === 'decode'}
                value={headerJson}
                onChange={(e) => setHeaderJson(e.target.value)}
                className={`w-full h-28 p-3 rounded-xl border border-border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none bg-background text-foreground ${mode === 'decode' ? 'cursor-not-allowed opacity-90' : ''}`}
              />
            </div>

            {/* 2. Payload Claims Block */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-sky-400 uppercase flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> Payload (Claims / Data Attributes)
                </span>
                <div className="flex gap-3">
                  {mode === 'encode' && (
                    <button onClick={loadSample} className="text-[11px] text-primary hover:underline font-medium">
                      Load JSON Template
                    </button>
                  )}
                  <button onClick={() => handleCopy(payloadJson)} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <Copy className="h-3 w-3" /> Copy Payload
                  </button>
                </div>
              </div>
              <textarea
                readOnly={mode === 'decode'}
                value={payloadJson}
                onChange={(e) => setPayloadJson(e.target.value)}
                className={`w-full h-44 p-3 rounded-xl border border-border font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none bg-background text-foreground ${mode === 'decode' ? 'cursor-not-allowed opacity-90' : ''}`}
              />
            </div>

            {/* 3. Verification Signature Configurator */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
              <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-1">
                <Key className="h-3.5 w-3.5" /> Signature Verification / Verification Key Input
              </span>
              
              {mode === 'decode' ? (
                <div className="space-y-2">
                  <div className="font-mono text-[11px] text-muted-foreground break-all bg-background p-2.5 rounded-lg border border-border">
                    <span className="text-emerald-500 font-bold">Raw Hex Signature Payload: </span>
                    {signatureHex || "No signature payload evaluated."}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[11px] text-muted-foreground block font-medium">
                    HMAC String / Private Key Component Configuration:
                  </label>
                  <input
                    type="text"
                    value={secretInput}
                    onChange={(e) => setSecretInput(e.target.value)}
                    placeholder="Enter configuration secret..."
                    className="w-full p-2.5 rounded-lg border border-border bg-background font-mono text-xs focus:outline-none text-foreground"
                  />
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Developer Info Box */}
        <div className="mt-8 p-4 rounded-xl bg-secondary/40 border border-border text-center text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          <strong>💡 Cryptography Safeguard:</strong> JWT contents are inherently open for viewability because they are simply base64url encoded strings. They are signed to prevent tampering, but <strong>never</strong> encapsulate private raw secrets or passwords directly inside the unencrypted payload structure.
        </div>
      </div>

      {/* Modules Framework Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 border-t border-border/60 mt-12">
        <h3 className="text-sm font-bold text-center mb-6 text-muted-foreground uppercase tracking-widest">
          Optimized Developer Validation Modules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <Link href="/tools/base64" className="p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all text-center flex flex-col items-center justify-center gap-2 group">
            <RefreshCw className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-bold text-foreground group-hover:text-primary">Base64 Encoder / Decoder</span>
            <span className="text-[10px] text-muted-foreground">Instantly map clean ASCII text blocks or parse asymmetric system payloads</span>
          </Link>

          <Link href="/tools/hash-generator" className="p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all text-center flex flex-col items-center justify-center gap-2 group">
            <Key className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-bold text-foreground group-hover:text-primary">Cryptographic Hash Generator</span>
            <span className="text-[10px] text-muted-foreground">Compute secure MD5, SHA-1, SHA-256, and SHA-512 signatures</span>
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

export default function JwtTool() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono text-xs">Loading Mix Core...</div>}>
      <JwtToolContent />
    </Suspense>
  )
}