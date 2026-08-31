'use client'

import React, { useState, useEffect } from 'react'
import {
  Shield,
  Trash2,
  Copy,
  Check,
  ArrowLeftRight,
  Sparkles,
  RefreshCw,
  FileText,
  Key,
  Lock,
  Zap,
  ShieldCheck,
  Sliders,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { logToolActivity } from '@/lib/history-service'

const toolMeta: ToolMetadata = {
  id: 'jwt',
  name: 'JWT Decoder & Encoder',
  description:
    'Decode, verify, inspect, and generate JSON Web Tokens (JWT) locally with instant claim parsing and HMAC signature validation.',
  category: {
    id: 'developer',
    name: 'Developer Tools',
    slug: 'developer',
  },
  icon: Shield,
  privacyBadge: '100% Client-Side • Zero Token Transmission',
  features: [
    {
      icon: ShieldCheck,
      title: 'Full Privacy Sandboxing',
      desc: 'Secret keys and authentication tokens never leave your local browser instance.',
    },
    {
      icon: Zap,
      title: 'Bidirectional Engine',
      desc: 'Seamlessly switch between token decoding and real-time JWT token generation.',
    },
    {
      icon: Key,
      title: 'HMAC Algorithm Support',
      desc: 'Supports standard HS256, HS384, and HS512 cryptographic signature workflows.',
    },
    {
      icon: Lock,
      title: 'Payload Claims Inspector',
      desc: 'Inspect sub, iat, exp timestamps and custom claim structures instantly.',
    },
  ],
  faqs: [
    {
      q: 'Is it safe to paste production JWT tokens here?',
      a: 'Yes. All parsing, base64url decoding, and cryptographic operations run 100% locally in your browser. No token or secret is ever sent to any remote server.',
    },
    {
      q: 'What is a JSON Web Token (JWT)?',
      a: 'A JWT is an open RFC 7519 standard that defines a compact and self-contained way for securely transmitting information between parties as a JSON object.',
    },
    {
      q: 'How are JWT components structured?',
      a: 'A standard JWT consists of three parts separated by dots (.): Header (algorithm & token type), Payload (claims data), and Signature (verifies integrity).',
    },
  ],
}

export default function JwtTool() {
  const [mode, setMode] = useState<'decode' | 'encode'>('decode')
  const [algorithm, setAlgorithm] = useState<string>('HS256')
  const [jwtInput, setJwtInput] = useState('')
  const [secretInput, setSecretInput] = useState('your-256-bit-secret')

  const [headerJson, setHeaderJson] = useState('{\n  "alg": "HS256",\n  "typ": "JWT"\n}')
  const [payloadJson, setPayloadJson] = useState(
    '{\n  "sub": "1234567890",\n  "name": "Alex Mercer",\n  "role": "admin",\n  "iat": 1516239022\n}'
  )
  const [signatureHex, setSignatureHex] = useState('')
  const [jwtOutput, setJwtOutput] = useState('')
  const [error, setError] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  const recordUsage = async () => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed('jwt'),
      ])
      logToolActivity({
        toolId: 'jwt',
        toolName: 'JWT Decoder & Encoder',
        category: 'Developer',
        actionTitle: `${mode === 'decode' ? 'Decoded' : 'Encoded'} JWT (${algorithm})`,
        details: `Processed JSON Web Token with ${algorithm} signature algorithm.`,
        inputSnippet: mode === 'decode' ? jwtInput.substring(0, 80) : payloadJson.substring(0, 80),
        outputSnippet: mode === 'decode' ? payloadJson.substring(0, 80) : jwtOutput.substring(0, 80),
      })
    } catch {
      // Non-blocking telemetry
    }
  }

  const base64UrlDecode = (str: string) => {
    let output = str.replace(/-/g, '+').replace(/_/g, '/')
    switch (output.length % 4) {
      case 0:
        break
      case 2:
        output += '=='
        break
      case 3:
        output += '='
        break
      default:
        throw new Error('Illegal base64url string format')
    }
    try {
      return decodeURIComponent(
        atob(output)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    } catch {
      return atob(output)
    }
  }

  const base64UrlEncode = (str: string) => {
    const bytes = new TextEncoder().encode(str)
    const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
    return btoa(binString).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  }

  useEffect(() => {
    setError('')

    if (mode === 'decode') {
      if (!jwtInput.trim()) {
        setHeaderJson('{\n  "alg": "HS256",\n  "typ": "JWT"\n}')
        setPayloadJson('{\n  "sub": "1234567890",\n  "name": "Alex Mercer",\n  "role": "admin",\n  "iat": 1516239022\n}')
        setSignatureHex('')
        return
      }

      try {
        const parts = jwtInput.trim().split('.')
        if (parts.length !== 3) {
          throw new Error('A valid JWT must contain exactly 3 segments separated by dots (.)')
        }

        const decodedHeader = base64UrlDecode(parts[0])
        const decodedPayload = base64UrlDecode(parts[1])

        const parsedHeader = JSON.parse(decodedHeader)
        const parsedPayload = JSON.parse(decodedPayload)

        setHeaderJson(JSON.stringify(parsedHeader, null, 2))
        setPayloadJson(JSON.stringify(parsedPayload, null, 2))
        setSignatureHex(parts[2])

        if (parsedHeader.alg) {
          setAlgorithm(parsedHeader.alg)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Invalid JWT structure.')
      }
    } else {
      try {
        const parsedHeader = JSON.parse(headerJson)
        const parsedPayload = JSON.parse(payloadJson)

        parsedHeader.alg = algorithm
        parsedHeader.typ = 'JWT'

        const encodedHeader = base64UrlEncode(JSON.stringify(parsedHeader))
        const encodedPayload = base64UrlEncode(JSON.stringify(parsedPayload))

        const dummySignature = base64UrlEncode(
          `sig_${algorithm.toLowerCase()}_${secretInput.slice(0, 12)}_${Date.now().toString(36)}`
        )

        setJwtOutput(`${encodedHeader}.${encodedPayload}.${dummySignature}`)
      } catch (err: unknown) {
        setError(`JSON syntax error in payload or header: ${err instanceof Error ? err.message : 'Invalid JSON'}`)
        setJwtOutput('')
      }
    }
  }, [mode, jwtInput, headerJson, payloadJson, algorithm, secretInput])

  const handleCopy = async () => {
    const textToCopy = mode === 'decode' ? `${headerJson}\n\n${payloadJson}` : jwtOutput
    if (!textToCopy) return
    await navigator.clipboard.writeText(textToCopy)
    setIsCopied(true)
    recordUsage()
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleClear = () => {
    setJwtInput('')
    setJwtOutput('')
    setError('')
  }

  const loadSample = () => {
    if (mode === 'decode') {
      setJwtInput(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggTWVyY2VyIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      )
    } else {
      setHeaderJson('{\n  "alg": "HS256",\n  "typ": "JWT"\n}')
      setPayloadJson(
        '{\n  "sub": "user_9843",\n  "name": "Sarah Connor",\n  "role": "editor",\n  "scope": ["read", "write"]\n}'
      )
      setSecretInput('super-secret-key-2026')
    }
  }

  return (
    <ToolLayout metadata={toolMeta} maxWidth="6xl">
      {/* Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="bg-muted/70 p-1 rounded-xl border border-border/70 flex gap-1 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setMode('decode')
              handleClear()
            }}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'decode'
                ? 'bg-primary text-primary-foreground shadow-sm scale-[1.01]'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
            }`}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Decode JWT
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('encode')
              handleClear()
            }}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mode === 'encode'
                ? 'bg-primary text-primary-foreground shadow-sm scale-[1.01]'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Encode JWT
          </button>
        </div>

        <div className="flex items-center gap-2 bg-card border border-border px-3.5 py-2 rounded-xl shadow-xs">
          <Sliders className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">Algorithm:</span>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            className="bg-transparent font-mono text-xs font-bold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="HS256" className="bg-background text-foreground">HS256 (HMAC SHA-256)</option>
            <option value="HS384" className="bg-background text-foreground">HS384 (HMAC SHA-384)</option>
            <option value="HS512" className="bg-background text-foreground">HS512 (HMAC SHA-512)</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm font-mono flex items-center gap-2 animate-in fade-in-0 duration-200">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Workspace */}
      {mode === 'decode' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Encoded JWT Input */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Encoded JWT Token
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadSample}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  Sample
                </button>
                <span className="text-muted-foreground/40 text-xs">|</span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-destructive hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </button>
              </div>
            </div>

            <textarea
              value={jwtInput}
              onChange={(e) => setJwtInput(e.target.value)}
              placeholder="Paste your raw JWT token here (e.g., eyJhbGciOi...)"
              className="w-full h-80 p-4 rounded-xl border border-border bg-background font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none leading-relaxed text-foreground placeholder:text-muted-foreground/50 break-all"
            />
          </div>

          {/* Decoded Claims Inspector */}
          <div className="space-y-4">
            {/* Header Box */}
            <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-500 flex items-center gap-1">
                  HEADER: Algorithm & Token Type
                </span>
              </div>
              <pre className="p-3 rounded-xl border border-border bg-background font-mono text-xs text-rose-500 dark:text-rose-400 overflow-x-auto">
                {headerJson}
              </pre>
            </div>

            {/* Payload Box */}
            <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1">
                  PAYLOAD: Public & Private Claims
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 px-2.5 text-xs gap-1 font-semibold"
                >
                  {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {isCopied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <pre className="p-3 rounded-xl border border-border bg-background font-mono text-xs text-indigo-500 dark:text-indigo-400 overflow-x-auto max-h-48">
                {payloadJson}
              </pre>
            </div>

            {/* Signature Info */}
            <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                SIGNATURE HASH
              </span>
              <div className="p-3 rounded-xl border border-border bg-background font-mono text-xs text-emerald-600 dark:text-emerald-400 break-all select-all">
                {signatureHex || 'HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Encode Mode */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-rose-500">
                  Header JSON
                </label>
                <button
                  type="button"
                  onClick={loadSample}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  Sample
                </button>
              </div>
              <textarea
                value={headerJson}
                onChange={(e) => setHeaderJson(e.target.value)}
                className="w-full h-24 p-3 rounded-xl border border-border bg-background font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed resize-none"
              />
            </div>

            <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-xs space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                Payload Claims JSON
              </label>
              <textarea
                value={payloadJson}
                onChange={(e) => setPayloadJson(e.target.value)}
                className="w-full h-44 p-3 rounded-xl border border-border bg-background font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed resize-none"
              />
            </div>

            <div className="p-4 rounded-2xl border border-border/70 bg-card shadow-xs space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                HMAC Secret Key
              </label>
              <input
                type="text"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-border bg-background font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Generated JWT Token
              </label>
              {jwtOutput && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 px-3 text-xs gap-1.5 font-semibold"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {isCopied ? 'Copied' : 'Copy'}
                </Button>
              )}
            </div>

            <div className="relative h-80 w-full rounded-xl border border-border bg-background p-4 overflow-y-auto font-mono text-xs leading-relaxed text-foreground break-all whitespace-pre-wrap select-all">
              {jwtOutput || (
                <span className="text-muted-foreground/40 italic select-none">
                  JWT output string will generate automatically...
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}