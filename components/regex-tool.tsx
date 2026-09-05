'use client'

import React, { useState, useEffect, Suspense } from 'react'
import {
  Code,
  Trash2,
  Copy,
  Check,
  Zap,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Layers,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { logToolActivity, registerClientToolSignature } from '@/lib/history-service'

const toolMeta: ToolMetadata = {
  id: 'regex-tester',
  name: 'RegEx Tester & Debugger',
  name_ar: 'محبر ومختبر التعابير النمطية (RegEx Tester)',
  description:
    'Test, debug, analyze, and build regular expressions with real-time match highlighting, capture group inspection, and quick cheat sheets.',
  description_ar:
    'اختبر، وقم بتصحيح، وتحليل، وبناء التعابير النمطية (Regular Expressions) مع تمييز التطابقات في الوقت الفعلي، فحص مجموعات الالتقاط، وورقة مرجعية سريعة.',
  category: {
    id: 'developer',
    name: 'Developer Tools',
    slug: 'developer',
  },
  icon: Code,
  privacyBadge: '100% Client-Side • Live Highlight Matcher',
  privacyBadge_ar: 'معالجة محلية 100% • مطابق وتمييز حي',
  features: [
    {
      icon: Zap,
      title: 'Real-Time Match Engine',
      desc: 'Visualizes capture groups and index offsets instantly as you type your pattern.',
    },
    {
      icon: Layers,
      title: 'Full Flag Controls',
      desc: 'Toggle Global (g), Case-Insensitive (i), Multiline (m), and DotAll (s) modifiers.',
    },
    {
      icon: BookOpen,
      title: 'Quick Cheat Sheet',
      desc: 'Built-in quick references for common tokens, anchors, and character classes.',
    },
    {
      icon: ShieldCheck,
      title: 'Zero Logged Data',
      desc: 'Input test strings and proprietary regex patterns are evaluated purely on your machine.',
    },
  ],
  features_ar: [
    {
      icon: Zap,
      title: 'محرك مطابقة في الوقت الفعلي',
      desc: 'يُظهر مجموعات الالتقاط ومواقع المؤشرات فوراً أثناء كتابة النمط الخاص بك.',
    },
    {
      icon: Layers,
      title: 'تحكم كامل في الأعلام (Flags)',
      desc: 'تبديل وضع الشمول Global (g)، تجاهل الأحرف الكبيرة والصغيرة (i)، الأسطر المتعددة (m)، وDotAll (s).',
    },
    {
      icon: BookOpen,
      title: 'مرجع سريع مدمج',
      desc: 'مراجع سريعة مدمجة للرموز الشائعة، الروابط، وفئات الحروف.',
    },
    {
      icon: ShieldCheck,
      title: 'صفر بيانات مسجلة',
      desc: 'يتم تقييم نصوص الاختبار وأنماط التعابير النمطية حصرياً على جهازك.',
    },
  ],
  faqs: [
    {
      q: 'What do the RegEx flags mean?',
      a: 'g (global) finds all matches rather than stopping after the first. i (case-insensitive) ignores letter casing. m (multiline) treats ^ and $ as start/end of each line. s (dotAll) allows dot (.) to match newlines.',
    },
    {
      q: 'Can this tool handle Catastrophic Backtracking?',
      a: 'Evaluations run client-side. To prevent browser lockups, avoid nested unlimited quantifiers like (a+)+ on long strings.',
    },
    {
      q: 'Are capture groups supported?',
      a: 'Yes. Any parenthesis groups in your pattern are automatically dissected into numbered capture group badges.',
    },
  ],
  faqs_ar: [
    {
      q: 'ماذا تعني أعلام التعابير النمطية (RegEx Flags)؟',
      a: 'علم g يبحث عن جميع التطابقات. علم i يتجاهل حالة الأحرف. علم m يتعامل مع ^ و $ كبداية ونهاية لكل سطر. علم s يسمح للنقطة (.) بمطابقة الأسطر الجديدة.',
    },
    {
      q: 'هل تتعامل هذه الأداة مع التراجع الكارثي (Catastrophic Backtracking)؟',
      a: 'تتم عمليات التقييم في المتصفح. لمنع تجميد المتصفح، تجنب استخدام المحددات غير المحدودة المتداخلة مثل (a+)+ مع النصوص الطويلة.',
    },
    {
      q: 'هل مجموعات الالتقاط (Capture Groups) مدعومة؟',
      a: 'نعم. أي مجموعات أقواس في نمطك يتم تقسيمها تلقائياً إلى شارات مجموعات التقاط مرقمة.',
    },
  ],
}

const PATTERN_LIBRARY = [
  {
    id: 'email',
    name: 'Email Address',
    regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: 'g',
    desc: 'Matches standard corporate and public email formats.',
    testText: 'Send invoices to finance@digitalmix.dev and cc support@agency.org immediately.',
  },
  {
    id: 'phone',
    name: 'Phone (Global E.164)',
    regex: '\\+?[1-9]\\d{1,14}',
    flags: 'g',
    desc: 'Validates E.164 international phone number formats.',
    testText: 'Call hotline at +14155552671 or global center at 442079460958.',
  },
  {
    id: 'url',
    name: 'URL / Web Link',
    regex: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
    flags: 'g',
    desc: 'Extracts safe web hyperlinks with HTTP/HTTPS schemes.',
    testText: 'Visit https://digitalmix.dev/tools/sql-formatter or check rules at http://vercel.app',
  },
  {
    id: 'ipv4',
    name: 'IPv4 Address',
    regex: '(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
    flags: 'g',
    desc: 'Validates standard IPv4 network addresses.',
    testText: 'Local gateway sits at 192.168.1.1 and public resolver sits at 8.8.8.8',
  },
]

const CHEAT_SHEET = [
  { token: '[a-z]', meaning: 'Any lowercase letter a to z' },
  { token: '\\d', meaning: 'Any numerical digit (0-9)' },
  { token: '+', meaning: 'Matches 1 or more times' },
  { token: '*', meaning: 'Matches 0 or more times' },
  { token: '?', meaning: 'Optional token (0 or 1 time)' },
  { token: '^ / $', meaning: 'Start / End of string boundary' },
  { token: '\\w', meaning: 'Alphanumeric character + _' },
  { token: '\\s', meaning: 'Whitespace (space, tab, newline)' },
]

interface MatchItem {
  text: string
  index: number
  groups: string[]
}

function RegexToolContent() {
  const [regexInput, setRegexInput] = useState('[a-z]+')
  const [testString, setTestString] = useState(
    'Hello DigitalMix Engine 2026! Let us trace your regex patterns.'
  )

  const [flagG, setFlagG] = useState(true)
  const [flagI, setFlagI] = useState(false)
  const [flagM, setFlagM] = useState(false)
  const [flagS, setFlagS] = useState(false)

  const [matches, setMatches] = useState<MatchItem[]>([])
  const [regexError, setRegexError] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  const recordUsage = async () => {
    if (!regexInput) return
    let flags = ''
    if (flagG) flags += 'g'
    if (flagI) flags += 'i'
    if (flagM) flags += 'm'
    if (flagS) flags += 's'
    const sig = `/${regexInput}/${flags}|${testString.slice(0, 100)}`
    if (!registerClientToolSignature('regex-tester', sig)) return

    try {
      await Promise.all([
        incrementToolUsage(sig),
        markToolUsed('regex-tester'),
      ])
      logToolActivity({
        toolId: 'regex-tester',
        toolName: 'RegEx Tester & Debugger',
        category: 'Developer',
        actionTitle: `Tested RegEx /${regexInput}/ (${matches.length} matches)`,
        details: `Evaluated regular expression matches against test payload.`,
        inputSnippet: `/${regexInput}/ against "${testString.substring(0, 50)}..."`,
        outputSnippet: `Found ${matches.length} matches`,
      })
    } catch {
      // Non-blocking telemetry
    }
  }

  useEffect(() => {
    if (!regexInput) {
      setMatches([])
      setRegexError('')
      return
    }

    try {
      let flags = ''
      if (flagG) flags += 'g'
      if (flagI) flags += 'i'
      if (flagM) flags += 'm'
      if (flagS) flags += 's'

      const re = new RegExp(regexInput, flags)
      setRegexError('')

      const foundMatches: MatchItem[] = []

      if (flagG) {
        let match: RegExpExecArray | null
        let iterations = 0
        while ((match = re.exec(testString)) !== null && iterations < 500) {
          iterations++
          const groups = match.slice(1).map((g) => g || '')
          foundMatches.push({
            text: match[0],
            index: match.index,
            groups,
          })
          if (match.index === re.lastIndex) re.lastIndex++
        }
      } else {
        const match = re.exec(testString)
        if (match) {
          const groups = match.slice(1).map((g) => g || '')
          foundMatches.push({
            text: match[0],
            index: match.index,
            groups,
          })
        }
      }

      setMatches(foundMatches)
    } catch (err: unknown) {
      setMatches([])
      setRegexError(err instanceof Error ? err.message : 'Invalid regular expression.')
    }
  }, [regexInput, testString, flagG, flagI, flagM, flagS])

  const handleCopyPattern = async () => {
    let flags = ''
    if (flagG) flags += 'g'
    if (flagI) flags += 'i'
    if (flagM) flags += 'm'
    if (flagS) flags += 's'

    const fullRegex = `/${regexInput}/${flags}`
    await navigator.clipboard.writeText(fullRegex)
    setIsCopied(true)
    recordUsage()
    setTimeout(() => setIsCopied(false), 2000)
  }

  const loadPattern = (item: (typeof PATTERN_LIBRARY)[0]) => {
    setRegexInput(item.regex)
    setTestString(item.testText)
    setFlagG(item.flags.includes('g'))
    setFlagI(item.flags.includes('i'))
  }

  return (
    <ToolLayout metadata={toolMeta} maxWidth="7xl">
      {/* Pattern Input & Flags Bar */}
      <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 flex items-center bg-background border border-border rounded-xl px-3 font-mono text-sm shadow-xs focus-within:ring-2 focus-within:ring-primary/40">
            <span className="text-primary font-bold mr-1.5 select-none">/</span>
            <input
              type="text"
              value={regexInput}
              onChange={(e) => setRegexInput(e.target.value)}
              placeholder="e.g. [a-zA-Z0-9._%+-]+@[a-z0-9.-]+"
              className="w-full py-2.5 bg-transparent font-mono text-sm focus:outline-none text-foreground"
            />
            <span className="text-primary font-bold ml-1.5 select-none">/</span>
          </div>

          {/* Flags Toggles */}
          <div className="flex items-center gap-1.5 bg-muted/60 p-1.5 rounded-xl border border-border shrink-0 justify-center">
            {[
              { id: 'g', label: 'g', state: flagG, toggle: () => setFlagG(!flagG), title: 'Global' },
              { id: 'i', label: 'i', state: flagI, toggle: () => setFlagI(!flagI), title: 'Case Insensitive' },
              { id: 'm', label: 'm', state: flagM, toggle: () => setFlagM(!flagM), title: 'Multiline' },
              { id: 's', label: 's', state: flagS, toggle: () => setFlagS(!flagS), title: 'DotAll' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={f.toggle}
                title={f.title}
                className={`h-8 w-8 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                  f.state ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyPattern}
            className="h-10 px-3.5 text-xs font-semibold gap-1.5 rounded-xl shrink-0"
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {isCopied ? 'Copied' : 'Copy RegEx'}
          </Button>
        </div>

        {/* Error Notice */}
        {regexError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
            ⚠️ {regexError}
          </div>
        )}
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Test String & Matches: 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Test String Box */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" /> Test String Input
              </label>
              <button
                type="button"
                onClick={() => setTestString('')}
                className="text-xs text-destructive hover:underline font-medium cursor-pointer"
              >
                Clear
              </button>
            </div>
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder="Paste your test text or data payload here..."
              className="w-full h-44 p-4 rounded-xl border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none leading-relaxed text-foreground shadow-xs"
            />
          </div>

          {/* Match Results Table */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-500" /> Match Results ({matches.length})
              </h3>
            </div>

            {matches.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground italic border border-dashed rounded-xl">
                No pattern matches found for current test string.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {matches.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-background border border-border flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[11px] shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate">
                        {m.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-muted-foreground text-[11px]">
                      <span>Index: {m.index}</span>
                      {m.groups.length > 0 && (
                        <span className="bg-muted px-1.5 py-0.5 rounded text-foreground font-semibold">
                          Groups: {m.groups.length}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Library + Cheat Sheet: 4 Columns */}
        <div className="lg:col-span-4 space-y-6">
          {/* Templates Library */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Pattern Presets
            </h3>
            <div className="space-y-2">
              {PATTERN_LIBRARY.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => loadPattern(item)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-secondary/60 text-left transition-all cursor-pointer group"
                >
                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Cheat Sheet */}
          <div className="p-5 rounded-2xl border border-border/70 bg-card shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" /> Quick Reference
            </h3>
            <div className="space-y-1.5">
              {CHEAT_SHEET.map((cs, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0"
                >
                  <code className="font-bold text-primary font-mono">{cs.token}</code>
                  <span className="text-[11px] text-muted-foreground">{cs.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}

export default function RegexTool() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-mono text-xs">Loading Regex Engine...</div>}>
      <RegexToolContent />
    </Suspense>
  )
}