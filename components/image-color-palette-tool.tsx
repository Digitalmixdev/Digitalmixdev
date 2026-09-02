'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  Palette,
  Pipette,
  UploadCloud,
  Download,
  Copy,
  Check,
  Sparkles,
  Sliders,
  Eye,
  Info,
  Layers,
  FileCode,
  ShieldCheck,
  Zap,
  Image as ImageIcon,
  RotateCcw,
  Maximize2,
  ExternalLink,
  Contrast,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { logToolActivity } from '@/lib/history-service'
import { useLanguage } from '@/lib/i18n/context'
import { toast } from 'sonner'
import {
  type ColorData,
  type PaletteResult,
  extractPaletteFromImage,
  getColorHarmonies,
  generateCssVariables,
  generateTailwindConfig,
  generateJsonPalette,
  generatePaletteCardPng,
  createColorData,
  rgbToHex,
} from '@/lib/color-extractor'

const toolMeta: ToolMetadata = {
  id: 'image-color-palette',
  name: 'Image Color Palette Extractor',
  name_ar: 'مستخرج لوحة ألوان الصور',
  description:
    'Extract dominant color palettes, HEX/RGB swatches, and color harmonies from any image instantly in your browser with zero server uploads.',
  description_ar:
    'استخرج الألوان السائدة وأكواد HEX/RGB وتناغمات الألوان من أي صورة فورياً داخل متصفحك دون رفع الملفات.',
  category: {
    id: 'files',
    name: 'File Utilities',
    slug: 'files',
  },
  icon: Palette,
  privacyBadge: '100% Client-Side • Canvas Hardware Accelerated',
  privacyBadge_ar: '100% معالجة محلياً • تسريع معالجة البكسلات Canvas',
  features: [
    {
      icon: Palette,
      title: 'Smart Color Clustering',
      desc: 'Extracts dominant, vibrant, muted, pastel, and dark swatches with percentage frequencies.',
    },
    {
      icon: Pipette,
      title: 'Interactive 4x Loupe Eyedropper',
      desc: 'Hover anywhere across your image with a high-precision magnifier to pick exact pixel colors.',
    },
    {
      icon: FileCode,
      title: 'Developer Export Suite',
      desc: 'Export swatches as CSS Variables, Tailwind theme config, JSON objects, or aesthetic PNG cards.',
    },
    {
      icon: Contrast,
      title: 'WCAG Accessibility Checker',
      desc: 'Instant AA/AAA contrast ratios against light and dark backgrounds for every extracted color.',
    },
  ],
  features_ar: [
    {
      icon: Palette,
      title: 'تجميع الألوان الذكي',
      desc: 'استخراج الألوان الأساسية، الزاهية، الهادئة، الباستيل، والداكنة مع حساب نسب انتشارها.',
    },
    {
      icon: Pipette,
      title: 'عدسة مكبرة تفاعلية 4x',
      desc: 'مرر المؤشر فوق أي جزء في الصورة مع عدسة التكبير لالتقاط لون أي بكسل بدقة متناهية.',
    },
    {
      icon: FileCode,
      title: 'حزمة تصدير للمطورين',
      desc: 'تصدير الألوان كمتغيرات CSS أو إعدادات Tailwind أو كود JSON أو بطاقة PNG أنيقة.',
    },
    {
      icon: Contrast,
      title: 'فحص إمكانية الوصول WCAG',
      desc: 'حساب نسبة التباين AA/AAA الفورية مقابل الخلفيات الفاتحة والداكنة لكل لون مستخرج.',
    },
  ],
  faqs: [
    {
      q: 'Are my uploaded images stored or sent to a server?',
      a: 'No! All color extraction and canvas pixel analyses happen 100% locally in your browser memory. Your pictures never leave your device.',
    },
    {
      q: 'Can I copy colors in different formats like RGB or HSL?',
      a: 'Yes. Click on any color swatch to copy its HEX, RGB, HSL, or CMYK values, or open the detailed color inspector.',
    },
    {
      q: 'How does the eyedropper magnifier work?',
      a: 'Simply hover your cursor over the image preview to zoom into individual pixels, and click to add any custom color to your palette.',
    },
  ],
  faqs_ar: [
    {
      q: 'هل يتم حفظ الصور المرفوعة أو إرسالها إلى خادم؟',
      a: 'لا! جميع عمليات استخراج الألوان وتحليل بكسلات Canvas تنفذ 100% محلياً داخل ذاكرة متصفحك.',
    },
    {
      q: 'هل يمكنني نسخ الألوان بصيغ مختلفة مثل RGB أو HSL؟',
      a: 'نعم. اضغط على أي شريحة لون لنسخ قيمة HEX أو RGB أو HSL أو CMYK أو فتح فاحص التفاصيل.',
    },
    {
      q: 'كيف تعمل العدسة المكبرة التقاط الألوان؟',
      a: 'فقط حرك المؤشر فوق الصورة لمعاينة البكسلات المكبرة واضغط لالتقاط أي لون مخصص وإضافته للوحة الألوان.',
    },
  ],
}

// Curated preset sample images (SVG/Data URLs for instant zero-latency loading)
const SAMPLE_PALETTES = [
  {
    name: 'Sunset Horizon',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    category: 'Nature',
  },
  {
    name: 'Neon Cyberpunk',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    category: 'Vibrant',
  },
  {
    name: 'Emerald Forest',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
    category: 'Nature',
  },
  {
    name: 'Pastel Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    category: 'Minimal',
  },
]

export default function ImageColorPaletteTool() {
  const { t, language } = useLanguage()
  const isRtl = language === 'ar'

  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageName, setImageName] = useState<string>('sample-image')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [paletteResult, setPaletteResult] = useState<PaletteResult | null>(null)
  const [colorCount, setColorCount] = useState<number>(8)
  const [activeTab, setActiveTab] = useState<'dominant' | 'vibrant' | 'muted' | 'light' | 'dark' | 'picked'>('dominant')
  const [sortMode, setSortMode] = useState<'dominance' | 'hue' | 'brightness' | 'saturation'>('dominance')
  const [customPicked, setCustomPicked] = useState<ColorData[]>([])
  
  // Eyedropper Magnifier State
  const [magnifier, setMagnifier] = useState<{
    x: number
    y: number
    visible: boolean
    color: string
    rgb: string
    loupeCanvasDataUrl: string
  }>({
    x: 0,
    y: 0,
    visible: false,
    color: '#000000',
    rgb: 'rgb(0,0,0)',
    loupeCanvasDataUrl: '',
  })

  // Selected Color Inspector Modal
  const [inspectedColor, setInspectedColor] = useState<ColorData | null>(null)
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Load Initial Sample Image on Mount
  useEffect(() => {
    loadImageFromUrl(SAMPLE_PALETTES[0].url, SAMPLE_PALETTES[0].name)
  }, [])

  // Clipboard Paste Support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) handleFile(file)
          break
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  const processImage = useCallback(
    async (imgElement: HTMLImageElement, name: string) => {
      setIsProcessing(true)
      try {
        const result = await extractPaletteFromImage(imgElement, colorCount)
        setPaletteResult(result)
        setImageName(name)
        imageRef.current = imgElement

        // Draw image onto interactive canvas
        const canvas = canvasRef.current
        if (canvas) {
          const maxWidth = 800
          let w = imgElement.naturalWidth || imgElement.width
          let h = imgElement.naturalHeight || imgElement.height
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w)
            w = maxWidth
          }
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          if (ctx) {
            ctx.drawImage(imgElement, 0, 0, w, h)
          }
        }

        // Log to user history
        logToolActivity({
          toolId: 'image-color-palette',
          toolName: 'Image Color Palette Extractor',
          category: 'files',
          actionTitle: 'Extracted Color Palette',
          details: `Analyzed "${name}" (${result.dominant.length} swatches extracted)`,
          inputSnippet: name,
          outputSnippet: `Dominant: ${result.dominant.map((c) => c.hex).slice(0, 4).join(', ')}`,
        })
        incrementToolUsage()
        markToolUsed('image-color-palette')
      } catch (err) {
        console.error('Failed to extract color palette:', err)
        toast.error('Failed to analyze image colors')
      } finally {
        setIsProcessing(false)
      }
    },
    [colorCount]
  )

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, WebP, SVG)')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      loadImageFromUrl(url, file.name)
    }
    reader.readAsDataURL(file)
  }

  const loadImageFromUrl = (url: string, name: string) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = url
    img.onload = () => {
      setImageSrc(url)
      processImage(img, name)
    }
    img.onerror = () => {
      toast.error('Could not load image')
    }
  }

  // Eyedropper Mouse Movement & Loupe Magnification
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top
    const canvasX = Math.floor(clientX * scaleX)
    const canvasY = Math.floor(clientY * scaleY)

    if (canvasX < 0 || canvasX >= canvas.width || canvasY < 0 || canvasY >= canvas.height) {
      setMagnifier((prev) => ({ ...prev, visible: false }))
      return
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2])
    const rgbStr = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`

    // Generate Zoomed Loupe Canvas Snapshot (9x9 pixels around cursor)
    const loupeSize = 11
    const half = Math.floor(loupeSize / 2)
    const srcX = Math.max(0, Math.min(canvas.width - loupeSize, canvasX - half))
    const srcY = Math.max(0, Math.min(canvas.height - loupeSize, canvasY - half))

    const loupeCanvas = document.createElement('canvas')
    loupeCanvas.width = 110
    loupeCanvas.height = 110
    const lCtx = loupeCanvas.getContext('2d')
    if (lCtx) {
      lCtx.imageSmoothingEnabled = false
      lCtx.drawImage(canvas, srcX, srcY, loupeSize, loupeSize, 0, 0, 110, 110)
      // Crosshair
      lCtx.strokeStyle = '#FFFFFF'
      lCtx.lineWidth = 1.5
      lCtx.strokeRect(45, 45, 20, 20)
    }

    setMagnifier({
      x: clientX,
      y: clientY,
      visible: true,
      color: hex,
      rgb: rgbStr,
      loupeCanvasDataUrl: loupeCanvas.toDataURL(),
    })
  }

  const handleCanvasMouseLeave = () => {
    setMagnifier((prev) => ({ ...prev, visible: false }))
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const canvasX = Math.floor((e.clientX - rect.left) * scaleX)
    const canvasY = Math.floor((e.clientY - rect.top) * scaleY)

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data
    const newColor = createColorData(pixel[0], pixel[1], pixel[2])

    setCustomPicked((prev) => {
      if (prev.some((c) => c.hex === newColor.hex)) return prev
      return [newColor, ...prev]
    })
    setActiveTab('picked')
    toast.success(`Picked color ${newColor.hex} (${newColor.name})`)
  }

  // Active Displayed Colors based on selected Tab & Sorting
  const displayedColors = useMemo(() => {
    if (!paletteResult) return []
    let list: ColorData[] = []
    if (activeTab === 'picked') {
      list = customPicked.length > 0 ? customPicked : paletteResult.dominant
    } else {
      list = paletteResult[activeTab] || paletteResult.dominant
    }

    const sorted = [...list]
    if (sortMode === 'hue') {
      sorted.sort((a, b) => a.hsl.h - b.hsl.h)
    } else if (sortMode === 'brightness') {
      sorted.sort((a, b) => b.luminance - a.luminance)
    } else if (sortMode === 'saturation') {
      sorted.sort((a, b) => b.hsl.s - a.hsl.s)
    }
    return sorted
  }, [paletteResult, activeTab, customPicked, sortMode])

  // Copy Helpers
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedFormat(label)
    toast.success(`Copied ${label} to clipboard!`)
    setTimeout(() => setCopiedFormat(null), 2000)
  }

  const handleDownloadPng = async () => {
    if (!displayedColors.length) return
    try {
      const blob = await generatePaletteCardPng(displayedColors, imageName)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `palette-${imageName.replace(/\.[^/.]+$/, '')}.png`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Palette poster image downloaded!')
    } catch (err) {
      toast.error('Failed to generate PNG poster')
    }
  }

  return (
    <ToolLayout metadata={toolMeta}>
      <div className="space-y-8" id="color-palette-extractor-app">
        {/* Top Control Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Palette className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                {t('tool.image_color_palette', 'Image Color Palette Studio')}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                  {t('tool_layout.privacy_badge', '100% In-Browser')}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('palette.subtitle', 'Extract dominant color harmonies, copy HEX/RGB/HSL codes, and inspect WCAG contrast.')}
              </p>
            </div>
          </div>

          {/* Preset Sample Images Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground mr-1">
              {t('palette.samples', 'Try Presets:')}
            </span>
            {SAMPLE_PALETTES.map((sample) => (
              <button
                key={sample.name}
                onClick={() => loadImageFromUrl(sample.url, sample.name)}
                className="text-xs px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary text-foreground font-medium transition-colors"
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image Canvas & Eyedropper (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Pipette className="h-4 w-4 text-primary" />
                  {t('palette.image_inspector', 'Interactive Image & Eyedropper')}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {t('palette.click_to_pick', 'Click image to pick color')}
                </span>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
                }}
                className="relative group cursor-pointer border-2 border-dashed border-border hover:border-primary/60 bg-secondary/20 hover:bg-secondary/40 transition-all rounded-xl p-4 text-center"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground group-hover:text-foreground">
                  <UploadCloud className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{t('palette.upload_prompt', 'Upload picture')}</span>
                  <span>•</span>
                  <span>{t('palette.paste_hint', 'or paste with Ctrl+V')}</span>
                </div>
              </div>

              {/* Canvas Preview with Live Magnifier Loupe */}
              <div className="relative rounded-xl overflow-hidden border border-border bg-muted/20 flex items-center justify-center min-h-[260px]">
                <canvas
                  ref={canvasRef}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={handleCanvasMouseLeave}
                  onClick={handleCanvasClick}
                  className="w-full h-auto object-contain cursor-crosshair max-h-[380px]"
                />

                {/* Floating Precision Magnifier Loupe */}
                {magnifier.visible && (
                  <div
                    className="absolute pointer-events-none rounded-full shadow-2xl border-2 border-white overflow-hidden z-20 flex flex-col items-center justify-center bg-black/80 text-white"
                    style={{
                      width: 100,
                      height: 100,
                      left: Math.min(Math.max(magnifier.x - 50, 10), 300),
                      top: Math.min(Math.max(magnifier.y - 120, 10), 260),
                    }}
                  >
                    {magnifier.loupeCanvasDataUrl && (
                      <img
                        src={magnifier.loupeCanvasDataUrl}
                        alt="Zoomed Loupe"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute bottom-1 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider">
                      {magnifier.color}
                    </div>
                  </div>
                )}
              </div>

              {/* Eyedropper Live Status Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/50 text-xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-6 w-6 rounded-lg border border-black/10 shadow-sm"
                    style={{ backgroundColor: magnifier.color }}
                  />
                  <div>
                    <div className="font-mono font-bold text-foreground">{magnifier.color}</div>
                    <div className="text-[10px] text-muted-foreground">{magnifier.rgb}</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => copyToClipboard(magnifier.color, 'Hovered HEX')}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {t('action.copy', 'Copy')}
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Extracted Palette & Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-6">
              {/* Palette Filter Tabs & Count Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                {/* Mode Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {(
                    [
                      { id: 'dominant', label: 'Dominant' },
                      { id: 'vibrant', label: 'Vibrant' },
                      { id: 'muted', label: 'Muted' },
                      { id: 'light', label: 'Pastel' },
                      { id: 'dark', label: 'Dark' },
                      { id: 'picked', label: `Picked (${customPicked.length})` },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Swatch Count Selector */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground font-medium">{t('palette.colors', 'Colors:')}</span>
                  <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5 border border-border">
                    {[4, 6, 8, 12, 16].map((count) => (
                      <button
                        key={count}
                        onClick={() => {
                          setColorCount(count)
                          if (imageRef.current) processImage(imageRef.current, imageName)
                        }}
                        className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                          colorCount === count
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sorting Bar */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {displayedColors.length} {t('palette.swatches_found', 'Swatches Extracted')}
                </span>
                <div className="flex items-center gap-2">
                  <span>{t('palette.sort_by', 'Sort by:')}</span>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as any)}
                    className="bg-secondary text-foreground text-xs rounded-md border border-border px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="dominance">Dominance %</option>
                    <option value="hue">Hue Spectrum</option>
                    <option value="brightness">Lightness</option>
                    <option value="saturation">Saturation</option>
                  </select>
                </div>
              </div>

              {/* Swatches Visual Strip Banner */}
              <div className="h-14 w-full rounded-xl overflow-hidden flex shadow-inner border border-border">
                {displayedColors.map((color, i) => (
                  <div
                    key={color.hex + i}
                    onClick={() => setInspectedColor(color)}
                    style={{ backgroundColor: color.hex, width: `${100 / displayedColors.length}%` }}
                    className="h-full relative group cursor-pointer transition-transform hover:scale-105 hover:z-10"
                    title={`${color.name} (${color.hex}) - Click to inspect`}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white drop-shadow-md transition-opacity">
                      {color.hex}
                    </span>
                  </div>
                ))}
              </div>

              {/* Detailed Swatch Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {displayedColors.map((color, index) => (
                  <div
                    key={color.hex + index}
                    className="group relative rounded-xl border border-border bg-card p-3 hover:border-primary/50 transition-all hover:shadow-md space-y-2.5"
                  >
                    {/* Color Preview Block */}
                    <div
                      onClick={() => setInspectedColor(color)}
                      className="h-20 w-full rounded-lg relative cursor-pointer overflow-hidden border border-black/5 flex items-end p-2 transition-transform group-hover:scale-[1.02]"
                      style={{ backgroundColor: color.hex }}
                    >
                      {/* Dominance Badge if available */}
                      {color.percentage > 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm ${
                            color.isDark ? 'bg-black/60 text-white' : 'bg-white/80 text-black'
                          }`}
                        >
                          {color.percentage}%
                        </span>
                      )}

                      {/* Inspect Loupe Hover Icon */}
                      <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white p-1 rounded-full text-xs">
                        <Eye className="h-3 w-3" />
                      </span>
                    </div>

                    {/* Color Details */}
                    <div>
                      <div className="font-bold text-xs text-foreground truncate">{color.name}</div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mt-0.5">
                        <span>{color.hex}</span>
                        <button
                          onClick={() => copyToClipboard(color.hex, color.hex)}
                          className="hover:text-primary transition-colors p-1"
                          title="Copy HEX"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Format Copy Buttons */}
                    <div className="grid grid-cols-2 gap-1 pt-1 border-t border-border/40">
                      <button
                        onClick={() => copyToClipboard(`rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`, 'RGB')}
                        className="text-[10px] py-1 px-1.5 rounded bg-secondary/60 hover:bg-secondary text-foreground text-center font-mono font-medium transition-colors"
                      >
                        RGB
                      </button>
                      <button
                        onClick={() => copyToClipboard(`hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`, 'HSL')}
                        className="text-[10px] py-1 px-1.5 rounded bg-secondary/60 hover:bg-secondary text-foreground text-center font-mono font-medium transition-colors"
                      >
                        HSL
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Developer Export Actions Toolbar */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FileCode className="h-4 w-4 text-primary" />
                    {t('palette.export_suite', 'Export & Developer Formats')}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {displayedColors.length} {t('palette.ready_to_export', 'colors ready')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs font-semibold gap-1.5"
                    onClick={handleDownloadPng}
                  >
                    <Download className="h-3.5 w-3.5 text-primary" />
                    {t('palette.download_png', 'PNG Poster')}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs font-semibold gap-1.5"
                    onClick={() => copyToClipboard(generateCssVariables(displayedColors), 'CSS Variables')}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t('palette.copy_css', 'CSS :root')}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs font-semibold gap-1.5"
                    onClick={() => copyToClipboard(generateTailwindConfig(displayedColors), 'Tailwind Config')}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t('palette.copy_tailwind', 'Tailwind')}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs font-semibold gap-1.5"
                    onClick={() => copyToClipboard(generateJsonPalette(displayedColors), 'JSON Array')}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t('palette.copy_json', 'JSON')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Color Inspector Modal Dialog */}
        <Dialog open={!!inspectedColor} onOpenChange={(open) => !open && setInspectedColor(null)}>
          <DialogContent className="max-w-md p-6 rounded-2xl">
            {inspectedColor && (
              <div className="space-y-5">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold flex items-center justify-between">
                    <span>{inspectedColor.name}</span>
                    <span className="font-mono text-sm px-2.5 py-1 rounded-md bg-secondary text-foreground">
                      {inspectedColor.hex}
                    </span>
                  </DialogTitle>
                </DialogHeader>

                {/* Big Swatch Banner */}
                <div
                  className="h-28 w-full rounded-xl shadow-inner border border-black/10 flex items-center justify-center"
                  style={{ backgroundColor: inspectedColor.hex }}
                >
                  <span
                    className={`font-mono text-xl font-bold px-4 py-1.5 rounded-lg shadow-sm ${
                      inspectedColor.isDark ? 'bg-black/40 text-white' : 'bg-white/70 text-black'
                    }`}
                  >
                    {inspectedColor.hex}
                  </span>
                </div>

                {/* Color Values Table */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <span className="font-medium text-muted-foreground">HEX:</span>
                    <span className="font-mono font-bold text-foreground">{inspectedColor.hex}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <span className="font-medium text-muted-foreground">RGB:</span>
                    <span className="font-mono font-bold text-foreground">
                      rgb({inspectedColor.rgb.r}, {inspectedColor.rgb.g}, {inspectedColor.rgb.b})
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <span className="font-medium text-muted-foreground">HSL:</span>
                    <span className="font-mono font-bold text-foreground">
                      hsl({inspectedColor.hsl.h}, {inspectedColor.hsl.s}%, {inspectedColor.hsl.l}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <span className="font-medium text-muted-foreground">CMYK:</span>
                    <span className="font-mono font-bold text-foreground">
                      cmyk({inspectedColor.cmyk.c}%, {inspectedColor.cmyk.m}%, {inspectedColor.cmyk.y}%, {inspectedColor.cmyk.k}%)
                    </span>
                  </div>
                </div>

                {/* WCAG Contrast Compliance */}
                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-2">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Contrast className="h-3.5 w-3.5 text-primary" />
                    WCAG Accessibility Contrast
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-white text-black border border-black/10 flex items-center justify-between">
                      <span>On White:</span>
                      <span className="font-bold font-mono">{inspectedColor.contrastOnWhite}:1</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 text-white border border-white/10 flex items-center justify-between">
                      <span>On Black:</span>
                      <span className="font-bold font-mono">{inspectedColor.contrastOnBlack}:1</span>
                    </div>
                  </div>
                </div>

                {/* Harmonious Palettes Generator */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-foreground">Color Harmonies</div>
                  {(() => {
                    const harmonies = getColorHarmonies(inspectedColor)
                    return (
                      <div className="grid grid-cols-4 gap-2">
                        <div
                          className="h-10 rounded-lg border border-black/10 flex items-center justify-center text-[10px] font-mono text-white drop-shadow"
                          style={{ backgroundColor: harmonies.complementary.hex }}
                          title="Complementary"
                        >
                          Comp
                        </div>
                        <div
                          className="h-10 rounded-lg border border-black/10 flex items-center justify-center text-[10px] font-mono text-white drop-shadow"
                          style={{ backgroundColor: harmonies.triadic[0].hex }}
                          title="Triadic 1"
                        >
                          Tri 1
                        </div>
                        <div
                          className="h-10 rounded-lg border border-black/10 flex items-center justify-center text-[10px] font-mono text-white drop-shadow"
                          style={{ backgroundColor: harmonies.triadic[1].hex }}
                          title="Triadic 2"
                        >
                          Tri 2
                        </div>
                        <div
                          className="h-10 rounded-lg border border-black/10 flex items-center justify-center text-[10px] font-mono text-white drop-shadow"
                          style={{ backgroundColor: harmonies.analogous[0].hex }}
                          title="Analogous"
                        >
                          Ana
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    className="w-full text-xs font-semibold gap-2"
                    onClick={() => {
                      copyToClipboard(inspectedColor.hex, inspectedColor.hex)
                      setInspectedColor(null)
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Copy HEX ({inspectedColor.hex})
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ToolLayout>
  )
}
