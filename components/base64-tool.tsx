'use client'

import React, { useState, useEffect } from 'react'
import {
  Binary,
  Trash2,
  Copy,
  Check,
  ArrowLeftRight,
  Sparkles,
  RefreshCw,
  FileText,
  Globe,
  Zap,
  ShieldCheck,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { logToolActivity } from '@/lib/history-service'

const toolMeta: ToolMetadata = {
  id: 'base64',
  name: 'Base64 Encoder / Decoder',
  description:
    'Instantly convert plain text or binary structures into safe ASCII strings, or reverse existing Base64 strings back to readable text format.',
  category: {
    id: 'developer',
    name: 'Developer Tools',
    slug: 'developer',
  },
  icon: Binary,
  privacyBadge: '100% Client-Side • UTF-8 & ASCII Supported',
  features: [
    {
      icon: Zap,
      title: 'Real-Time Pipeline',
      desc: 'Instant bidirectional encoding and decoding as you type.',
    },
    {
      icon: Globe,
      title: 'Full UTF-8 Support',
      desc: 'Flawlessly handles multi-byte characters, Arabic, and emojis.',
    },
    {
      icon: ShieldCheck,
      title: '100% Local Processing',
      desc: 'Never uploads or stores your payloads on external servers.',
    },
    {
      icon: Lock,
      title: 'Safe ASCII Export',
      desc: 'Generates standard RFC 4648 compliant Base64 strings.',
    },
  ],
  faqs: [
    {
      q: 'What is Base64 encoding used for?',
      a: 'Base64 encoding is designed to safely transmit binary data or special characters over text-based protocols (such as JSON, XML, or email MIME) that might otherwise corrupt raw binary or control bytes.',
    },
    {
      q: 'Is Base64 considered encryption?',
      a: 'No. Base64 is an encoding format, not an encryption algorithm. Anyone can decode Base64 back into its original form without a secret key. Never use Base64 alone to secure sensitive data.',
    },
    {
      q: 'Why do I see an error when decoding?',
      a: 'Decoding errors usually occur when the input is not valid Base64 (contains invalid characters, missing padding =, or resolving to invalid multi-byte character sequences). Check the character set switch if decoding international text.',
    },
  ],
}

export default function Base64Tool() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [encoding, setEncoding] = useState<'utf-8' | 'ascii'>('utf-8')
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const [error, setError] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  const recordUsage = async () => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed('base64'),
      ])
      logToolActivity({
        toolId: 'base64',
        toolName: 'Base64 Encoder / Decoder',
        category: 'Developer',
        actionTitle: `${mode === 'encode' ? 'Encoded' : 'Decoded'} Base64 String`,
        details: `Converted string using ${encoding.toUpperCase()} charset.`,
        inputSnippet: inputText.substring(0, 100),
        outputSnippet: outputText.substring(0, 100),
      })
    } catch {
      // Non-blocking telemetry
    }
  }

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
          const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
          setOutputText(btoa(binString))
        } else {
          if (/[^\x00-\x7F]/.test(inputText)) {
            throw new Error('Input contains non-ASCII characters. Please switch charset to UTF-8.')
          }
          setOutputText(btoa(inputText))
        }
      } else {
        if (encoding === 'utf-8') {
          const binString = atob(inputText.trim())
          const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0))
          setOutputText(new TextDecoder().decode(bytes))
        } else {
          const decodedAscii = atob(inputText.trim())
          if (/[^\x00-\x7F]/.test(decodedAscii)) {
            throw new Error('Payload contains multi-byte UTF-8 structures. Please switch to UTF-8.')
          }
          setOutputText(decodedAscii)
        }
      }
    } catch (err: unknown) {
      setOutputText('')
      const errMsg = err instanceof Error ? err.message : 'Conversion error occurred.'
      if (errMsg.includes('switch to UTF-8')) {
        setError(errMsg)
      } else if (mode === 'decode') {
        setError('Invalid Base64 string: Please check structure, padding (=), or encoding.')
      } else {
        setError(errMsg)
      }
    }
  }, [inputText, mode, encoding])

  const handleCopy = async () => {
    if (!outputText) return
    await navigator.clipboard.writeText(outputText)
    setIsCopied(true)
    recordUsage()
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleClear = () => {
    setInputText('')
    setOutputText('')
    setError('')
  }

  const loadSample = () => {
    if (mode === 'encode') {
      setInputText(
        encoding === 'utf-8'
          ? 'Welcome to DigitalMix! مبرمجين المستقبل 🚀'
          : 'Welcome to DigitalMix! High-performance developer ecosystem.',
      )
    } else {
      setInputText(
        encoding === 'utf-8'
          ? 'V2VsY29tZSB0byBEaWdpdGFsTWl4ISDYp9mE2YXYqNix2YXYrNmK2YYg2KfZhNmF2LPYqtmC2KjZhCA🚀'
          : 'V2VsY29tZSB0byBEaWdpdGFsTWl4ISBIaWdoLXBlcmZvcm1hbmNlIGRldmVsb3BlciBlY29zeXN0ZW0u',
      )
    }
  }

  return (
    <ToolLayout metadata={toolMeta} maxWidth="5xl">
      {/* Control Toolbar: Mode Switcher & Encoding Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {/* Mode Switcher */}
        <div className="bg-muted/70 p-1 rounded-xl border border-border/70 flex gap-1 w-full sm:w-auto">
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
            Encode
          </button>
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
            Decode
          </button>
        </div>

        {/* Charset Selector */}
        <div className="flex items-center gap-2 bg-card border border-border px-3.5 py-2 rounded-xl shadow-xs">
          <Globe className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">Charset:</span>
          <select
            value={encoding}
            onChange={(e) => {
              setEncoding(e.target.value as 'utf-8' | 'ascii')
              handleClear()
            }}
            className="bg-transparent font-mono text-xs font-bold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="utf-8" className="bg-background text-foreground">
              UTF-8 (Multi-byte / Arabic / Emojis)
            </option>
            <option value="ascii" className="bg-background text-foreground">
              ASCII (Standard 7-bit)
            </option>
          </select>
        </div>
      </div>

      {/* Workspace Textareas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Input Box */}
        <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              {mode === 'encode' ? 'Plain Text Input' : 'Base64 Encoded Input'}
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
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === 'encode'
                ? `Type or paste your raw text here (${encoding.toUpperCase()})...`
                : 'Paste your Base64 payload string here (e.g., dGVzdA==)...'
            }
            className="w-full h-64 p-4 rounded-xl border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none leading-relaxed text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Output Box */}
        <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <ArrowLeftRight className="h-3.5 w-3.5 text-primary" />
              {mode === 'encode' ? 'Base64 Output' : 'Decoded Plain Text Output'}
            </label>
            {outputText && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className="h-8 px-3 text-xs gap-1.5 font-medium rounded-lg"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {isCopied ? 'Copied' : 'Copy'}
              </Button>
            )}
          </div>

          <div className="relative h-64 w-full rounded-xl border border-border bg-background p-4 overflow-y-auto font-mono text-sm leading-relaxed text-foreground break-all whitespace-pre-wrap select-all">
            {outputText ? (
              outputText
            ) : (
              <span className="text-muted-foreground/50 italic text-xs select-none">
                {error ? '' : 'Output will appear here in real-time...'}
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
    </ToolLayout>
  )
}