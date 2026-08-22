'use client'

import React, { useState, useRef, useMemo } from 'react'
import {
  FileCode,
  Copy,
  Trash2,
  Download,
  Check,
  Sparkles,
  Upload,
  Minimize2,
  AlertTriangle,
  FileText,
  Zap,
  ShieldCheck,
  Lock,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'

interface JsonStats {
  lines: number
  characters: number
  keyCount: number
  maxDepth: number
  fileSizeKB: string
}

const toolMeta: ToolMetadata = {
  id: 'json-formatter',
  name: 'JSON Formatter & Validator',
  description:
    'Format, validate, parse, and minify JSON data instantly with syntax error highlighting and structural statistics.',
  category: {
    id: 'database',
    name: 'Database Tools',
    slug: 'database',
  },
  icon: FileCode,
  privacyBadge: '100% Client-Side • Tree Depth & Key Stats',
  features: [
    {
      icon: Sparkles,
      title: 'Structural Validation',
      desc: 'Pinpoints syntax errors, unclosed brackets, and illegal trailing commas.',
    },
    {
      icon: Layers,
      title: 'Deep Matrix Stats',
      desc: 'Measures total keys, maximum nest depth, lines, and payload size.',
    },
    {
      icon: ShieldCheck,
      title: 'Client-Side Privacy',
      desc: 'All JSON parsing runs strictly inside your local browser memory.',
    },
    {
      icon: Minimize2,
      title: 'Instant Minification',
      desc: 'Strip unnecessary whitespaces for compact API network payloads.',
    },
  ],
  faqs: [
    {
      q: 'Why is my JSON showing an invalid syntax error?',
      a: 'Common reasons include trailing commas in arrays/objects, unquoted keys, single quotes instead of double quotes, or missing closing brackets/braces.',
    },
    {
      q: 'Can I format large JSON files?',
      a: 'Yes. The tool processes JSON directly using native browser V8 JSON engines, easily handling megabyte-scale files smoothly without uploading to a server.',
    },
    {
      q: 'How does the Minify function work?',
      a: 'Minify parses the structured data and outputs a condensed one-line string with all indentation, linebreaks, and spacing removed.',
    },
  ],
}

export default function JsonFormatterTool() {
  const [inputJson, setInputJson] = useState('')
  const [outputJson, setOutputJson] = useState('')
  const [indentSpaces, setIndentSpaces] = useState<number>(2)
  const [isCopied, setIsCopied] = useState(false)
  const [syntaxWarning, setSyntaxWarning] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const recordUsage = async () => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed('json-formatter'),
      ])
    } catch {
      // Non-blocking telemetry
    }
  }

  const calculateJsonStats = (jsonStr: string): JsonStats => {
    const lines = jsonStr ? jsonStr.split('\n').length : 0
    const characters = jsonStr.length
    const fileSizeKB = (characters / 1024).toFixed(2)

    let keyCount = 0
    let maxDepth = 0

    try {
      const parsed = JSON.parse(jsonStr)

      const analyzeObj = (obj: unknown, currentDepth: number) => {
        if (typeof obj !== 'object' || obj === null) return
        maxDepth = Math.max(maxDepth, currentDepth)
        const record = obj as Record<string, unknown>
        for (const key in record) {
          if (Object.prototype.hasOwnProperty.call(record, key)) {
            keyCount++
            analyzeObj(record[key], currentDepth + 1)
          }
        }
      }

      analyzeObj(parsed, 1)
    } catch {
      // ignore parsing error during stats calculation
    }

    return { lines, characters, keyCount, maxDepth, fileSizeKB }
  }

  const handleFormat = () => {
    if (!inputJson.trim()) return
    try {
      const parsed = JSON.parse(inputJson.trim())
      const formatted = JSON.stringify(parsed, null, indentSpaces)
      setOutputJson(formatted)
      setSyntaxWarning('')
      recordUsage()
    } catch (err: unknown) {
      setOutputJson('')
      setSyntaxWarning(`Invalid JSON Syntax: ${err instanceof Error ? err.message : 'Invalid JSON'}`)
    }
  }

  const handleMinify = () => {
    if (!inputJson.trim()) return
    try {
      const parsed = JSON.parse(inputJson.trim())
      const minified = JSON.stringify(parsed)
      setOutputJson(minified)
      setSyntaxWarning('')
      recordUsage()
    } catch (err: unknown) {
      setOutputJson('')
      setSyntaxWarning(`Invalid JSON Syntax: ${err instanceof Error ? err.message : 'Invalid JSON'}`)
    }
  }

  const handleClear = () => {
    setInputJson('')
    setOutputJson('')
    setSyntaxWarning('')
  }

  const handleCopy = async () => {
    if (!outputJson) return
    await navigator.clipboard.writeText(outputJson)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!outputJson) return
    const blob = new Blob([outputJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setInputJson(text)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const stats = useMemo(() => calculateJsonStats(outputJson || inputJson), [outputJson, inputJson])

  return (
    <ToolLayout metadata={toolMeta} maxWidth="7xl">
      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-xl shadow-xs">
            <span className="text-xs font-semibold text-muted-foreground">Indent:</span>
            <select
              value={indentSpaces}
              onChange={(e) => setIndentSpaces(Number(e.target.value))}
              className="bg-transparent font-mono text-xs font-bold text-foreground focus:outline-none cursor-pointer"
            >
              <option value={2} className="bg-background text-foreground">2 Spaces</option>
              <option value={4} className="bg-background text-foreground">4 Spaces</option>
            </select>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept=".json,.txt"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 px-3.5 gap-2 text-xs font-semibold"
          >
            <Upload className="h-4 w-4" />
            Upload .json
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={!inputJson && !outputJson}
          className="h-10 px-3.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </Button>
      </div>

      {/* Syntax Warning Banner */}
      {syntaxWarning && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 animate-in fade-in-0 duration-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-xs sm:text-sm font-mono font-medium">{syntaxWarning}</span>
        </div>
      )}

      {/* Textareas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Input Textarea */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Input JSON Payload
            </label>
            <button
              type="button"
              onClick={() =>
                setInputJson(
                  JSON.stringify(
                    {
                      project: "DigitalMix",
                      version: "2026.1",
                      description: "Enterprise Developer Ecosystem",
                      features: ["100% Client-Side", "Multi-Dialect SQL", "JSON Validator"],
                      stats: { users: 15400, uptime: 99.98, active: true },
                    },
                    null,
                    0
                  )
                )
              }
              className="text-xs text-primary hover:underline font-medium cursor-pointer"
            >
              Load Example
            </button>
          </div>
          <textarea
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            placeholder={`Paste your JSON payload string here...\n\nExample:\n{"name": "DigitalMix", "tools": ["sql", "json", "jwt"]}`}
            className="w-full h-80 p-4 rounded-2xl border border-border/80 bg-card font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary resize-none transition-all placeholder:text-muted-foreground/40 leading-relaxed text-foreground shadow-xs"
          />
        </div>

        {/* Output Textarea */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileCode className="h-3.5 w-3.5 text-primary" />
              Formatted JSON Output
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!outputJson}
                className="h-8 px-2.5 text-xs gap-1.5 rounded-lg"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                disabled={!outputJson}
                className="h-8 px-3 text-xs gap-1.5 rounded-lg font-semibold"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {isCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="w-full h-80 p-4 rounded-2xl border border-border/80 bg-card font-mono text-sm overflow-auto whitespace-pre leading-relaxed text-foreground shadow-xs">
            {outputJson ? (
              <code>{outputJson}</code>
            ) : (
              <span className="text-muted-foreground/40 italic select-none text-xs">
                Formatted JSON structure will appear here...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
        <Button
          size="lg"
          onClick={handleFormat}
          disabled={!inputJson.trim()}
          className="h-12 px-8 rounded-xl font-bold shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all"
        >
          <Sparkles className="h-4.5 w-4.5" />
          Beautify / Format JSON
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={handleMinify}
          disabled={!inputJson.trim()}
          className="h-12 px-8 rounded-xl font-bold hover:bg-secondary transition-all"
        >
          <Minimize2 className="h-4.5 w-4.5" />
          Minify JSON
        </Button>
      </div>

      {/* JSON Diagnostics Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs">
          <div className="text-2xl font-extrabold text-primary">{stats.lines}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">Total Lines</div>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs">
          <div className="text-2xl font-extrabold text-primary">{stats.characters}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">Characters</div>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs">
          <div className="text-2xl font-extrabold text-emerald-500">{stats.keyCount}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">Total Object Keys</div>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs">
          <div className="text-2xl font-extrabold text-amber-500">{stats.maxDepth}</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">Max Tree Depth</div>
        </div>
        <div className="p-4 rounded-2xl border border-border/70 bg-card/70 text-center shadow-xs col-span-2 sm:col-span-1">
          <div className="text-2xl font-extrabold text-blue-500">{stats.fileSizeKB} KB</div>
          <div className="text-xs font-medium text-muted-foreground mt-1">Estimated Size</div>
        </div>
      </div>
    </ToolLayout>
  )
}