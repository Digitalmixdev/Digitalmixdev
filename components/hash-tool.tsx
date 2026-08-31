'use client'

import React, { useState, useEffect, Suspense } from 'react'
import {
  Key,
  Trash2,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  Lock,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { logToolActivity } from '@/lib/history-service'

import md5 from 'crypto-js/md5'

const toolMeta: ToolMetadata = {
  id: 'hash-generator',
  name: 'Cryptographic Hash Generator',
  description:
    'Compute secure message digests and cryptographic checksums including MD5, SHA-1, SHA-256, and SHA-512 in real-time with Web Crypto API.',
  category: {
    id: 'developer',
    name: 'Developer Tools',
    slug: 'developer',
  },
  icon: Key,
  privacyBadge: '100% Client-Side • Web Crypto Subsystem',
  features: [
    {
      icon: Zap,
      title: 'Hardware-Accelerated Digestion',
      desc: 'Powered by native browser crypto.subtle runtime for microsecond execution.',
    },
    {
      icon: Lock,
      title: 'Multi-Algorithm Suite',
      desc: 'Simultaneously generates MD5, SHA-1, SHA-256, and SHA-512 hash values.',
    },
    {
      icon: ShieldCheck,
      title: 'Zero Leakage Guarantee',
      desc: 'Input secrets, API keys, and string payloads are never logged or stored remotely.',
    },
    {
      icon: Key,
      title: 'Checksum Integrity',
      desc: 'Ideal for verifying file downloads, data integrity checksums, and password hashing.',
    },
  ],
  faqs: [
    {
      q: 'What is a cryptographic hash function?',
      a: 'A cryptographic hash is a mathematical algorithm that maps arbitrary length data into a fixed-length string of characters (a digest). Even a single bit change in the input produces a completely different hash output.',
    },
    {
      q: 'Can a hash be decrypted back to plain text?',
      a: 'No. Cryptographic hashes are one-way functions by design and cannot be reversed or decrypted. Verification works by hashing the candidate text and comparing digests.',
    },
    {
      q: 'Which hash algorithm is most secure?',
      a: 'SHA-256 and SHA-512 are modern industry standards and collision resistant. MD5 and SHA-1 are cryptographically broken for security, but remain useful for quick checksums.',
    },
  ],
}

function HashToolContent() {
  const [inputText, setInputText] = useState('')
  const [copiedAlgo, setCopiedAlgo] = useState<string | null>(null)
  const [uppercase, setUppercase] = useState(false)
  const [hashes, setHashes] = useState({
    md5: '',
    sha1: '',
    sha256: '',
    sha512: '',
  })

  const recordUsage = async (algoName = 'Hashes') => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed('hash-generator'),
      ])
      logToolActivity({
        toolId: 'hash-generator',
        toolName: 'Cryptographic Hash Generator',
        category: 'Developer',
        actionTitle: `Generated ${algoName.toUpperCase()}`,
        details: `Calculated hash digests for string input.`,
        inputSnippet: inputText.substring(0, 100),
        outputSnippet: hashes.sha256 || hashes.md5 || '',
      })
    } catch {
      // Non-blocking telemetry
    }
  }

  // Pure JS MD5 algorithm implementation
  // const calculateMD5 = (str: string) => {
  //   let k = [
  //     0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
  //     0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
  //     0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
  //     0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
  //     0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
  //     0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
  //     0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
  //     0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  //   ]
  //   let r = [
  //     7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  //     5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  //     4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  //     6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  //   ]
  //   let words: number[] = []
  //   let byteLength = str.length
  //   for (let i = 0; i < byteLength; i++) {
  //     words[i >> 2] |= (str.charCodeAt(i) & 0xff) << ((i % 4) * 8)
  //   }
  //   words[byteLength >> 2] |= 0x80 << ((byteLength % 4) * 8)
  //   let arrayLength = (((byteLength + 8) >> 6) + 1) * 16
  //   while (words.length < arrayLength) words.push(0)
  //   words[arrayLength - 2] = byteLength * 8
  //   let h0 = 0x67452301,
  //     h1 = 0xefcdab89,
  //     h2 = 0x98badcfe,
  //     h3 = 0x10325476
  //   for (let i = 0; i < words.length; i += 16) {
  //     let a = h0,
  //       b = h1,
  //       c = h2,
  //       d = h3
  //     for (let j = 0; j < 64; j++) {
  //       let f = 0,
  //         g = 0
  //       if (j < 16) {
  //         f = (b & c) | (~b & d)
  //         g = j
  //       } else if (j < 32) {
  //         f = (d & b) | (~d & c)
  //         g = (5 * j + 1) % 16
  //       } else if (j < 48) {
  //         f = b ^ c ^ d
  //         g = (3 * j + 5) % 16
  //       } else {
  //         f = c ^ (b | ~d)
  //         g = (7 * j) % 16
  //       }
  //       let temp = d
  //       d = c
  //       c = b
  //       b = (b + (((a + f + k[j] + words[i + g]) << r[j]) | ((a + f + k[j] + words[i + g]) >>> (32 - r[j])))) | 0
  //       a = temp
  //     }
  //     h0 = (h0 + a) | 0
  //     h1 = (h1 + b) | 0
  //     h2 = (h2 + c) | 0
  //     h3 = (h3 + d) | 0
  //   }
  //   let result = [h0, h1, h2, h3]
  //   return result
  //     .map((v) => {
  //       let s = ''
  //       for (let i = 0; i < 4; i++) s += ((v >>> (i * 8)) & 0xff).toString(16).padStart(2, '0')
  //       return s
  //     })
  //     .join('')
  // }

  useEffect(() => {
    if (!inputText) {
      setHashes({ md5: '', sha1: '', sha256: '', sha512: '' })
      return
    }

    const computeAllHashes = async () => {
      try {
        const md5Val = md5(inputText).toString()
        const encoder = new TextEncoder()
        const data = encoder.encode(inputText)

        const [sha1Buffer, sha256Buffer, sha512Buffer] = await Promise.all([
          crypto.subtle.digest('SHA-1', data),
          crypto.subtle.digest('SHA-256', data),
          crypto.subtle.digest('SHA-512', data),
        ])

        const bufferToHex = (buffer: ArrayBuffer) => {
          return Array.from(new Uint8Array(buffer))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
        }

        setHashes({
          md5: md5Val,
          sha1: bufferToHex(sha1Buffer),
          sha256: bufferToHex(sha256Buffer),
          sha512: bufferToHex(sha512Buffer),
        })
      } catch (err) {
        console.error('Error generating hashes:', err)
      }
    }

    computeAllHashes()
  }, [inputText])

  const copyHash = async (algo: string, val: string) => {
    if (!val) return
    const formatted = uppercase ? val.toUpperCase() : val.toLowerCase()
    await navigator.clipboard.writeText(formatted)
    setCopiedAlgo(algo)
    recordUsage(algo)
    setTimeout(() => setCopiedAlgo(null), 2000)
  }

  const handleCopyAll = async () => {
    if (!hashes.sha256) return
    const text = `MD5: ${hashes.md5}\nSHA-1: ${hashes.sha1}\nSHA-256: ${hashes.sha256}\nSHA-512: ${hashes.sha512}`
    await navigator.clipboard.writeText(uppercase ? text.toUpperCase() : text)
    setCopiedAlgo('all')
    recordUsage('All Hashes')
    setTimeout(() => setCopiedAlgo(null), 2000)
  }

  return (
    <ToolLayout metadata={toolMeta} maxWidth="6xl">
      {/* Input Box */}
      <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />
            Plain Text String
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
              />
              UPPERCASE
            </label>
            <span className="text-muted-foreground/30 text-xs">|</span>
            <button
              type="button"
              onClick={() => setInputText('DigitalMix High-Performance Developer Hub 2026')}
              className="text-xs text-primary hover:underline font-medium cursor-pointer"
            >
              Sample
            </button>
            <span className="text-muted-foreground/30 text-xs">|</span>
            <button
              type="button"
              onClick={() => setInputText('')}
              className="text-xs text-destructive hover:underline font-medium flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          </div>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type or paste any text string here to compute hashes..."
          className="w-full h-32 p-4 rounded-xl border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed text-foreground resize-none"
        />

        {hashes.sha256 && (
          <div className="flex justify-end pt-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyAll}
              className="text-xs font-semibold gap-1.5 rounded-lg"
            >
              {copiedAlgo === 'all' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedAlgo === 'all' ? 'All Hashes Copied' : 'Copy All Message Digests'}
            </Button>
          </div>
        )}
      </div>

      {/* Generated Hashes List */}
      <div className="space-y-4">
        {[
          { id: 'md5', label: 'MD5 (128-bit)', val: hashes.md5, badge: 'Legacy / Checksums' },
          { id: 'sha1', label: 'SHA-1 (160-bit)', val: hashes.sha1, badge: 'Git / Legacy' },
          { id: 'sha256', label: 'SHA-256 (256-bit)', val: hashes.sha256, badge: 'Industry Standard' },
          { id: 'sha512', label: 'SHA-512 (512-bit)', val: hashes.sha512, badge: 'High Security' },
        ].map((item) => {
          const displayVal = uppercase ? item.val.toUpperCase() : item.val.toLowerCase()
          return (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-border/70 bg-card shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {item.badge}
                  </span>
                </div>

                {displayVal && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyHash(item.id, item.val)}
                    className="h-7 px-2.5 text-xs font-semibold gap-1 text-primary hover:bg-primary/10"
                  >
                    {copiedAlgo === item.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    {copiedAlgo === item.id ? 'Copied' : 'Copy'}
                  </Button>
                )}
              </div>

              <div className="p-3 rounded-xl border border-border bg-background font-mono text-xs text-foreground break-all select-all min-h-10.5 flex items-center">
                {displayVal ? (
                  displayVal
                ) : (
                  <span className="text-muted-foreground/40 italic select-none">
                    Hash will compute in real-time...
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </ToolLayout>
  )
}

export default function HashTool() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-xs">Loading Hash Engine...</div>}>
      <HashToolContent />
    </Suspense>
  )
}