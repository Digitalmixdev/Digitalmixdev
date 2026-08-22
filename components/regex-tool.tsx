"use client"

import React, { useState, useEffect, Suspense } from 'react'
import { useTheme } from 'next-themes'
import {
  Code,
  Trash2,
  Copy,
  Check,
  Save,
  BookOpen,
  Zap,
  Sun,
  Moon,
  Info,
  Sparkles,
  Bookmark,
  Menu,
  X,
  Star,
  LayoutDashboard,
  Binary,
  Key,
  Fingerprint
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { isFavoriteTool, toggleFavoriteTool } from '@/actions/favorites'

const REGEX_TABS_DATA = {
  email: {
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: { g: true, i: false, m: false, s: false },
    testText: 'Send invoices to finance@digitalmix.com and cc support@agency.org immediately.'
  },
  phone: {
    pattern: '\\+?[1-9]\\d{1,14}',
    flags: { g: true, i: false, m: false, s: false },
    testText: 'Call our hotline at +14155552671 or global center at 442079460958.'
  },
  url: {
    pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
    flags: { g: true, i: false, m: false, s: false },
    testText: 'Visit https://digitalmix.com/tools/sql-formatter or check browse rules at http://vercel.app'
  },
  password: {
    pattern: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).{8,}',
    flags: { g: true, i: false, m: false, s: false },
    testText: 'Testing passwords: weakpass, MixedCase123!, and secure_Admin2026#'
  },
  ipv4: {
    pattern: '(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
    flags: { g: true, i: false, m: false, s: false },
    testText: 'Local gateway is 192.168.1.1 and public resolver dns node sits at 8.8.8.8'
  }
}

const PATTERN_LIBRARY = [
  {
    id: 'email',
    name: 'Email Address',
    regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    flags: 'g',
    desc: 'Matches standard corporate and public email formats.',
    testText: 'Send invoices to finance@digitalmix.com and cc support@agency.org immediately.'
  },
  {
    id: 'phone',
    name: 'Phone Number (Global)',
    regex: '\\+?[1-9]\\d{1,14}',
    flags: 'g',
    desc: 'Validates E.164 international phone number frameworks.',
    testText: 'Call our hotline at +14155552671 or global center at 442079460958.'
  },
  {
    id: 'url',
    name: 'URL / Hyperlink',
    regex: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
    flags: 'g',
    desc: 'Extracts safe web hyperlinks with HTTP/HTTPS schemes.',
    testText: 'Visit https://digitalmix.com/tools/sql-formatter or check browse rules at http://vercel.app'
  },
  {
    id: 'password',
    name: 'Strong Password',
    regex: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).{8,}',
    flags: 'g',
    desc: 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.',
    testText: 'Testing passwords: weakpass, MixedCase123!, and secure_Admin2026#'
  },
  {
    id: 'ipv4',
    name: 'IPv4 Address',
    regex: '(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)',
    flags: 'g',
    desc: 'Validates standard internet protocol version 4 routing strings.',
    testText: 'Local gateway is 192.168.1.1 and public resolver dns node sits at 8.8.8.8'
  }
]

const CHEAT_SHEET = [
  { token: '[a-z]', meaning: 'Any lowercase character from a to z' },
  { token: '\\d', meaning: 'Any numerical digit from 0 to 9' },
  { token: '+', meaning: 'Matches 1 or more times of the preceding token' },
  { token: '*', meaning: 'Matches 0 or more times of the preceding token' },
  { token: '?', meaning: 'Makes the preceding token optional (0 or 1 time)' },
  { token: '^', meaning: 'Indicates the absolute start of a boundary line' },
  { token: '$', meaning: 'Indicates the absolute termination of a boundary line' },
  { token: '\\w', meaning: 'Any alphanumeric word character plus underscore' },
]

interface MatchItem {
  text: string
  index: number
  groups: string[]
}

function RegexToolContent() {
  const { theme, setTheme } = useTheme()
  const [isFavorite, setIsFavorite] = useState(false)
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  const [regexInput, setRegexInput] = useState('[a-z]+')
  const [testString, setTestString] = useState('Hello DigitalMix Engine 2026! Let us trace your input matrices.')

  const [flagG, setFlagG] = useState(true)
  const [flagI, setFlagI] = useState(false)
  const [flagM, setFlagM] = useState(false)
  const [flagS, setFlagS] = useState(false)

  const [matches, setMatches] = useState<MatchItem[]>([])
  const [regexError, setRegexError] = useState('')
  const [explanation, setExplanation] = useState<string[]>([])
  const [isCopied, setIsCopied] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleToggleFavorite = async () => {
    const nextFavorite = !isFavorite
    setIsFavorite(nextFavorite)

    try {
      await toggleFavoriteTool("regex-tool")
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
        markToolUsed("regex-tool")
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
      const favorite = await isFavoriteTool("regex-tool")
      setIsFavorite(favorite)
    }

    loadFavorite()
  }, [])

  useEffect(() => {
    const currentTab = searchParams.get('tab')
    if (currentTab && currentTab in REGEX_TABS_DATA) {
      const targetData = REGEX_TABS_DATA[currentTab as keyof typeof REGEX_TABS_DATA]
      setRegexInput(targetData.pattern)
      setTestString(targetData.testText)
      setFlagG(targetData.flags.g)
      setFlagI(targetData.flags.i)
      setFlagM(targetData.flags.m)
      setFlagS(targetData.flags.s)
    }
  }, [searchParams])

  useEffect(() => {
    if (!regexInput) {
      setMatches([])
      setRegexError('')
      setExplanation(['Enter a regex pattern to see architectural parsing rules.'])
      return
    }

    try {
      let flags = ''
      if (flagG) flags += 'g'
      if (flagI) flags += 'i'
      if (flagM) flags += 'm'
      if (flagS) flags += 's'

      const regex = new RegExp(regexInput, flags)
      setRegexError('')

      const foundMatches: MatchItem[] = []
      let match

      if (flagG) {
        let lastIdx = -1
        while ((match = regex.exec(testString)) !== null) {
          if (regex.lastIndex === lastIdx) {
            regex.lastIndex++
            continue
          }
          lastIdx = regex.lastIndex

          foundMatches.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1)
          })
        }
      } else {
        match = regex.exec(testString)
        if (match) {
          foundMatches.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1)
          })
        }
      }
      setMatches(foundMatches)
      generateExplanation(regexInput)

    } catch (err: any) {
      setRegexError(err.message)
      setMatches([])
    }
  }, [regexInput, testString, flagG, flagI, flagM, flagS])

  const generateExplanation = (pattern: string) => {
    const steps: string[] = []

    if (/\[a-z\]/.test(pattern)) steps.push('• [a-z] ➡️ Matches lowercase alphabetical characters (a through z).')
    if (/\[A-Z\]/.test(pattern)) steps.push('• [A-Z] ➡️ Matches uppercase alphabetical characters (A through Z).')
    if (/\[a-zA-Z\]/.test(pattern)) steps.push('• [a-zA-Z] ➡️ Case-insensitive alphabetical character set.')
    if (/\\d/.test(pattern)) steps.push('• \\d ➡️ Evaluates and isolates any numerical digit symbol between 0-9.')
    if (/\+/.test(pattern)) steps.push('• + Quantifier ➡️ Matches 1 or more occurrences of the preceding token.')
    if (/\*/.test(pattern)) steps.push('• * Quantifier ➡️ Matches 0 or more occurrences of the preceding sequence.')
    if (/\?/.test(pattern)) steps.push('• ? Quantifier ➡️ Declares the preceding character token optional.')
    if (/\^/.test(pattern)) steps.push('• ^ Anchor ➡️ Enforces validation starting directly from line beginning.')
    if (/\$/.test(pattern)) steps.push('• $ Anchor ➡️ Confirms structural termination matching line boundaries.')
    if (/@/.test(pattern)) steps.push('• @ Literal ➡️ Matches the literal symbol "@" explicitly.')

    if (steps.length === 0) {
      steps.push('• Literal Sequence ➡️ Evaluates precise word matches character by character.')
    }
    setExplanation(steps)
  }

  const renderHighlightedText = () => {
    if (matches.length === 0 || !regexInput) return testString

    let lastIndex = 0
    const parts: React.ReactNode[] = []
    const sortedMatches = [...matches].sort((a, b) => a.index - b.index)

    sortedMatches.forEach((match, idx) => {
      if (match.index > lastIndex) {
        parts.push(testString.substring(lastIndex, match.index))
      }
      parts.push(
        <mark
          key={idx}
          className="bg-primary/20 text-primary border-b border-primary/60 font-semibold rounded px-0.5"
          title={`Match #${idx + 1}\nIndex: ${match.index}`}
        >
          {match.text}
        </mark>
      )
      lastIndex = match.index + match.text.length
    })

    if (lastIndex < testString.length) {
      parts.push(testString.substring(lastIndex))
    }

    return parts
  }

  const handleCopy = async () => {
    let finalRegex = `/${regexInput}/`
    if (flagG) finalRegex += 'g'
    if (flagI) finalRegex += 'i'
    if (flagM) finalRegex += 'm'
    if (flagS) finalRegex += 's'
    navigator.clipboard.writeText(finalRegex)
    setIsCopied(true)
    await handleSomething();
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleSaveRegex = async () => {
    setIsSaved(true)
    await handleSomething();
    setTimeout(() => setIsSaved(false), 2000)
  }

  const handleSelectPattern = (id: string, regex: string, flagsStr: string, sampleText: string) => {
    setRegexInput(regex)
    setTestString(sampleText)
    setFlagG(flagsStr.includes('g'))
    setFlagI(flagsStr.includes('i'))
    setFlagM(flagsStr.includes('m'))
    setFlagS(flagsStr.includes('s'))

    const validTabs = ['email', 'phone', 'url', 'password', 'ipv4']
    if (validTabs.includes(id)) {
      router.push(`/tools/regex-tester?tab=${id}`, { scroll: false })
    } else {
      router.push('/tools/regex-tester', { scroll: false })
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
                <Code className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground leading-none">
                  DigitalMix
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Regex Engine</span>
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

      {/* Hero Head */}
      <div className="py-10 px-4 text-center bg-gradient-to-b from-primary/5 to-transparent">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">
          Real-Time Regex Tester & Debugger
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Write expressions, capture groups, analyze index positions, and generate clean token structures with our local engine thread.
        </p>
      </div>

      {/* Workspace Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side: Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Regular Expression
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="h-8 px-3 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {isCopied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={handleSaveRegex}
                  className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-[0.98]"
                >
                  <Save className="h-3 w-3" />
                  {isSaved ? 'Saved to Profile' : 'Save Pattern'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-2 rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-primary/40 transition-shadow">
              <span className="text-muted-foreground font-mono text-lg pl-2 select-none">/</span>
              <input
                type="text"
                value={regexInput}
                onChange={(e) => setRegexInput(e.target.value)}
                placeholder="[a-zA-Z0-9]+"
                className="w-full bg-transparent font-mono text-sm focus:outline-none text-foreground"
              />
              <span className="text-muted-foreground font-mono text-lg select-none">/</span>

              <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-lg border border-border text-xs font-mono text-primary font-bold">
                {flagG && 'g'}{flagI && 'i'}{flagM && 'm'}{flagS && 's'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
              <span className="text-muted-foreground font-medium">Expression Flags:</span>
              <label className="flex items-center gap-1.5 cursor-pointer font-mono">
                <input type="checkbox" checked={flagG} onChange={(e) => setFlagG(e.target.checked)} className="rounded border-border bg-background text-primary focus:ring-primary" />
                <span>g (global)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-mono">
                <input type="checkbox" checked={flagI} onChange={(e) => setFlagI(e.target.checked)} className="rounded border-border bg-background text-primary focus:ring-primary" />
                <span>i (insensitive)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-mono">
                <input type="checkbox" checked={flagM} onChange={(e) => setFlagM(e.target.checked)} className="rounded border-border bg-background text-primary focus:ring-primary" />
                <span>m (multiline)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-mono">
                <input type="checkbox" checked={flagS} onChange={(e) => setFlagS(e.target.checked)} className="rounded border-border bg-background text-primary focus:ring-primary" />
                <span>s (dotAll)</span>
              </label>
            </div>

            {regexError && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl font-mono">
                ⚠️ Structural Failure: {regexError}
              </div>
            )}
          </div>

          {/* Test String Framework */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Test String Framework
              </label>
              <button
                onClick={() => setTestString('')}
                className="text-xs text-destructive hover:underline flex items-center gap-1 font-medium"
              >
                <Trash2 className="h-3 w-3" /> Clear Text
              </button>
            </div>

            <div className="relative min-h-[140px] w-full rounded-xl border border-border bg-background p-4 text-sm font-mono leading-relaxed overflow-hidden">
              <div className="absolute inset-0 p-4 pointer-events-none whitespace-pre-wrap break-all text-transparent select-none z-0">
                {renderHighlightedText()}
              </div>
              <textarea
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                placeholder="Insert test logs or parsing target sequences here..."
                className="absolute inset-0 w-full h-full p-4 bg-transparent text-foreground border-none resize-none focus:outline-none z-10 whitespace-pre-wrap break-all font-mono"
                style={{ caretColor: 'currentColor' }}
              />
            </div>
          </div>

          {/* Match Diagnostics */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase flex items-center justify-between">
              <span>Match Diagnostics ({matches.length})</span>
            </h3>

            {matches.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                {matches.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <span className="h-5 w-5 bg-secondary text-muted-foreground rounded flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded font-bold max-w-xs truncate">
                        {item.text}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
                      <span>Index Pos: <strong className="text-foreground">{item.index}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                No expression matches intercepted. Adjust token strings or flags.
              </div>
            )}
          </div>
        </div>

        {/* Right Side */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary" /> Token Explanation
            </h3>
            <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2 text-xs font-mono leading-relaxed">
              {explanation.map((line, idx) => (
                <div key={idx} className="text-foreground/90">{line}</div>
              ))}
            </div>
          </div>

          {/* Patterns Library */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <Bookmark className="h-3.5 w-3.5 text-primary" /> Patterns Library
            </h3>
            <div className="space-y-2">
              {PATTERN_LIBRARY.map((pattern, idx) => {
                const isActive = searchParams.get('tab') === pattern.id;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectPattern(pattern.id, pattern.regex, pattern.flags, pattern.testText)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors flex flex-col gap-1 text-xs ${isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-background hover:border-primary/50'
                      }`}
                  >
                    <span className="font-bold text-foreground flex items-center justify-between w-full">
                      {pattern.name}
                      <Zap className={`h-3 w-3 ${isActive ? 'text-primary fill-primary' : 'text-amber-500'}`} />
                    </span>
                    <span className="text-[11px] text-muted-foreground line-clamp-1">{pattern.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-primary" /> Quick Cheat Sheet
            </h3>
            <div className="divide-y divide-border/60 max-h-[220px] overflow-y-auto pr-1">
              {CHEAT_SHEET.map((item, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between text-xs font-mono gap-2">
                  <span className="bg-secondary px-1.5 py-0.5 rounded font-bold text-primary">{item.token}</span>
                  <span className="text-muted-foreground text-[11px] text-right">{item.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 border-t border-border/60 mt-12">
        <h3 className="text-sm font-bold text-center mb-6 text-muted-foreground uppercase tracking-widest">
          Optimized Developer Validation Modules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <Link href="/tools/base64" className="p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all text-center flex flex-col items-center justify-center gap-2 group">
            <Binary className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-bold text-foreground group-hover:text-primary">Base64 Encoder / Decoder</span>
            <span className="text-[10px] text-muted-foreground">Convert binary data and strings into safe ASCII transport formats</span>
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

export default function RegexTool() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground flex items-center justify-center font-mono text-xs">Loading Mix Engine...</div>}>
      <RegexToolContent />
    </Suspense>
  )
}