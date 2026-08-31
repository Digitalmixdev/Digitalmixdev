'use client'

import React, { useState, useEffect, Suspense } from 'react'
import {
  Fingerprint,
  Copy,
  Check,
  Download,
  RefreshCw,
  Zap,
  ShieldCheck,
  Lock,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { logToolActivity } from '@/lib/history-service'

const toolMeta: ToolMetadata = {
  id: 'uuid-generator',
  name: 'UUID v4 Token Generator',
  name_ar: 'مولد رموز UUID الإصدار 4',
  description:
    'Generate bulk cryptographically secure RFC 4122 Version 4 UUID tokens in real-time with format customization and TXT/JSON download.',
  description_ar:
    'قم بتوليد رموز UUID الإصدار 4 المتوافقة مع معيار RFC 4122 والآمنة تشفيرياً دفعة واحدة في الوقت الفعلي مع تخصيص التنسيق والتحميل كملف TXT أو JSON.',
  category: {
    id: 'developer',
    name: 'Developer Tools',
    slug: 'developer',
  },
  icon: Fingerprint,
  privacyBadge: '100% Client-Side • CSPRNG Random Engine',
  privacyBadge_ar: 'معالجة محلية 100% • محرك عشوائي آمن CSPRNG',
  features: [
    {
      icon: Zap,
      title: 'Cryptographic Entropy',
      desc: 'Powered by crypto.randomUUID for cryptographically secure pseudo-randomness (CSPRNG).',
    },
    {
      icon: Layers,
      title: 'Bulk Token Generation',
      desc: 'Provision up to 100 RFC 4122 unique UUIDs simultaneously in a single click.',
    },
    {
      icon: ShieldCheck,
      title: 'Zero Server Knowledge',
      desc: 'Identifiers are generated strictly inside local memory and never stored externally.',
    },
    {
      icon: Lock,
      title: 'Developer Format Options',
      desc: 'Easily toggle uppercase casing, bracket wrappers {}, and clean export formats.',
    },
  ],
  features_ar: [
    {
      icon: Zap,
      title: 'إنتروبيا التشفير الآمن',
      desc: 'مدعوم بواسطة crypto.randomUUID لتوليد عشوائية آمنة تشفيرياً (CSPRNG).',
    },
    {
      icon: Layers,
      title: 'توليد الرموز دفعة واحدة',
      desc: 'إنشاء ما يصل إلى 100 رمز UUID فريد متوافق مع RFC 4122 بنقرة زر واحدة.',
    },
    {
      icon: ShieldCheck,
      title: 'صفر معرفة للخادم',
      desc: 'يتم إنشاء المعرفات حصرياً داخل الذاكرة المحلية ولا يتم تخزينها خارجياً أبداً.',
    },
    {
      icon: Lock,
      title: 'خيارات تنسيق للمطورين',
      desc: 'تبديل الحروف الكبيرة، الأقواس المحيطة {}، وتنسيقات التصدير النظيفة بسهولة.',
    },
  ],
  faqs: [
    {
      q: 'What is a UUID Version 4?',
      a: 'A Version 4 UUID is a 128-bit universally unique identifier generated using random numbers. With 122 random bits of entropy, collision probability is infinitesimally low.',
    },
    {
      q: 'Are the generated UUIDs safe for database primary keys?',
      a: 'Yes. RFC 4122 UUID v4 tokens generated via Web Crypto CSPRNG are standard for PostgreSQL, MongoDB, MySQL, and distributed microservices architectures.',
    },
    {
      q: 'Can I download generated UUIDs in bulk?',
      a: 'Yes. You can copy the complete list to your clipboard or download them as a .txt or .json document.',
    },
  ],
  faqs_ar: [
    {
      q: 'ما هو معرف UUID الإصدار 4؟',
      a: 'معرف UUID v4 هو معرف فريد عالمياً بطول 128 بت يتم إنشاؤه باستخدام الأرقام العشوائية. مع وجود 122 بت عشوائي، فإن احتمال التداخل معدوم تقريباً.',
    },
    {
      q: 'هل رموز UUID المولدة آمنة للمفاتيح الأساسية في قواعد البيانات؟',
      a: 'نعم. رموز UUID v4 المعيارية المتوافقة مع RFC 4122 هي المعيار لقواعد بيانات PostgreSQL و MongoDB و MySQL وهندسة الخدمات المصغرة.',
    },
    {
      q: 'هل يمكنني تنزيل رموز UUID المولدة دفعة واحدة؟',
      a: 'نعم. يمكنك نسخ القائمة الكاملة إلى الحافظة أو تنزيلها كملف مستند TXT أو JSON.',
    },
  ],
}

function UUIDToolContent() {
  const [quantity, setQuantity] = useState<number>(5)
  const [uppercase, setUppercase] = useState<boolean>(false)
  const [brackets, setBrackets] = useState<boolean>(false)
  const [uuidList, setUuidList] = useState<string[]>([])
  const [isCopied, setIsCopied] = useState(false)

  const recordUsage = async (count = quantity) => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed('uuid-generator'),
      ])
      logToolActivity({
        toolId: 'uuid-generator',
        toolName: 'UUID v4 Token Generator',
        category: 'Developer',
        actionTitle: `Generated ${count} UUIDs (v4)`,
        details: `Generated cryptographically secure UUID v4 tokens.`,
        outputSnippet: uuidList.slice(0, 3).join('\n'),
      })
    } catch {
      // Non-blocking telemetry
    }
  }

  const cryptoUUID = (): string => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID()
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  const generateUUIDs = (qty = quantity, upper = uppercase, bkt = brackets) => {
    const list: string[] = []
    const targetQty = Math.min(Math.max(qty, 1), 100)

    for (let i = 0; i < targetQty; i++) {
      let id = cryptoUUID()
      if (upper) id = id.toUpperCase()
      if (bkt) id = `{${id}}`
      list.push(id)
    }
    setUuidList(list)
  }

  useEffect(() => {
    generateUUIDs(quantity, uppercase, brackets)
  }, [])

  const handleCopy = async () => {
    if (uuidList.length === 0) return
    await navigator.clipboard.writeText(uuidList.join('\n'))
    setIsCopied(true)
    recordUsage()
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleDownload = (format: 'txt' | 'json') => {
    if (uuidList.length === 0) return
    let content = ''
    let mimeType = 'text/plain'
    const filename = `uuids-${Date.now()}.${format}`

    if (format === 'json') {
      content = JSON.stringify({ count: uuidList.length, uuids: uuidList }, null, 2)
      mimeType = 'application/json'
    } else {
      content = uuidList.join('\n')
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    recordUsage()
  }

  return (
    <ToolLayout metadata={toolMeta} maxWidth="5xl">
      {/* Controls Box */}
      <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-xl shadow-xs">
              <span className="text-xs font-semibold text-muted-foreground">Quantity:</span>
              <select
                value={quantity}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setQuantity(val)
                  generateUUIDs(val, uppercase, brackets)
                }}
                className="bg-transparent font-mono text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              >
                {[1, 5, 10, 25, 50, 100].map((n) => (
                  <option key={n} value={n} className="bg-background text-foreground">
                    {n} {n === 1 ? 'UUID' : 'UUIDs'}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => {
                  setUppercase(e.target.checked)
                  generateUUIDs(quantity, e.target.checked, brackets)
                }}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              UPPERCASE
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={brackets}
                onChange={(e) => {
                  setBrackets(e.target.checked)
                  generateUUIDs(quantity, uppercase, e.target.checked)
                }}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              Braces {'{ }'}
            </label>
          </div>

          <Button
            size="sm"
            onClick={() => generateUUIDs(quantity, uppercase, brackets)}
            className="gap-2 text-xs font-bold rounded-xl shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Re-generate
          </Button>
        </div>
      </div>

      {/* UUID Results Container */}
      <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Generated UUID Tokens ({uuidList.length})
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload('txt')}
              className="h-8 px-2.5 text-xs gap-1.5 rounded-lg"
            >
              <Download className="h-3 w-3" /> TXT
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload('json')}
              className="h-8 px-2.5 text-xs gap-1.5 rounded-lg"
            >
              <Download className="h-3 w-3" /> JSON
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-3 text-xs gap-1.5 font-semibold rounded-lg"
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {isCopied ? 'Copied' : 'Copy All'}
            </Button>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-background font-mono text-xs sm:text-sm leading-relaxed text-foreground space-y-1.5 max-h-96 overflow-y-auto select-all">
          {uuidList.map((id, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between hover:bg-secondary/40 px-2 py-1 rounded-lg transition-colors group"
            >
              <span className="text-foreground">{id}</span>
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation()
                  await navigator.clipboard.writeText(id)
                  setIsCopied(true)
                  setTimeout(() => setIsCopied(false), 2000)
                }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity text-xs cursor-pointer"
                title="Copy single UUID"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </ToolLayout>
  )
}

export default function UUIDTool() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-xs">Loading UUID Generator...</div>}>
      <UUIDToolContent />
    </Suspense>
  )
}