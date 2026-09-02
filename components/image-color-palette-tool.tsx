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
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Lock,
  Unlock,
  Contrast,
  CheckCircle2,
  XCircle,
  Layout,
  Sun,
  Moon,
  Sparkle,
  Crop,
  SlidersHorizontal,
  Share2,
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
  type ExtractionAlgorithm,
  type ExtractionOptions,
  extractPaletteFromImage,
  getColorHarmonies,
  simulateColorblindness,
  generateCssVariables,
  generateTailwindConfig,
  generateScssVariables,
  generateJsonPalette,
  generateHexList,
  generatePaletteCardPng,
  createColorData,
  rgbToHex,
  hexToRgb,
} from '@/lib/color-extractor'

const toolMeta: ToolMetadata = {
  id: 'image-color-palette',
  name: 'Image Color Palette Extractor',
  name_ar: 'مستخرج لوحة ألوان الصور',
  description:
    'Extract dominant color palettes, HEX/RGB/HSL swatches, and color harmonies from any image instantly in your browser with zero server uploads.',
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
      title: 'Multi-Algorithm Clustering',
      desc: 'K-Means, Median Cut, and Histogram quantization to isolate vibrant, muted, pastel, and dark shades.',
    },
    {
      icon: Pipette,
      title: 'Precision Eyedropper & Canvas Pins',
      desc: 'Hover over pixels with a 4x magnified loupe and drop interactive pin markers directly on your image.',
    },
    {
      icon: Layout,
      title: 'Live UI Theme Mockup Previewer',
      desc: 'See how extracted color palettes look applied to real-world app landing cards, buttons, and charts.',
    },
    {
      icon: FileCode,
      title: 'Developer Export Suite',
      desc: 'Export swatches as CSS Variables, Tailwind v3/v4 theme config, SCSS, JSON, or high-res PNG posters.',
    },
  ],
  features_ar: [
    {
      icon: Palette,
      title: 'خوارزميات تجميع متعددة',
      desc: 'استخدام K-Means وMedian Cut لعزل الألوان الزاهية والداكنة والباستيل مع نسب الانتشار.',
    },
    {
      icon: Pipette,
      title: 'عدسة مكبرة ودبابيس تفاعلية',
      desc: 'تكبير البكسلات 4x وإسقاط دبابيس ألوان تفاعلية مباشرة فوق عناصر الصورة.',
    },
    {
      icon: Layout,
      title: 'معاينة حية على واجهات المستخدم',
      desc: 'اختبار لوحة الألوان مباشرة على نماذج واجهات تطبيقات وأزرار ورسوم بيانية.',
    },
    {
      icon: FileCode,
      title: 'حزمة تصدير المطورين',
      desc: 'تصدير الألوان كمتغيرات CSS، إعدادات Tailwind v3/v4، SCSS، JSON، أو بطاقات PNG عالية الدقة.',
    },
  ],
  faqs: [
    {
      q: 'Are my uploaded images stored or sent to a server?',
      a: 'No! All color extraction and canvas pixel analyses happen 100% locally in your browser memory. Your pictures never leave your device.',
    },
    {
      q: 'Can I select a specific region of an image to extract colors from?',
      a: 'Yes! Enable Region Selection mode to crop a specific area on your image and extract palette swatches only from that box.',
    },
    {
      q: 'How does the UI Theme Mockup preview work?',
      a: 'Switch to the UI Preview tab to see your extracted palette automatically mapped to primary buttons, hero text, card backgrounds, and chart accents in real time.',
    },
  ],
  faqs_ar: [
    {
      q: 'هل يتم حفظ الصور المرفوعة أو إرسالها إلى خادم؟',
      a: 'لا! جميع عمليات استخراج الألوان وتحليل بكسلات Canvas تنفذ 100% محلياً داخل ذاكرة متصفحك.',
    },
    {
      q: 'هل يمكنني تحديد منطقة معينة من الصورة لاستخراج الألوان منها؟',
      a: 'نعم! افعل وضع تحديد المنطقة لقص جزء معين من الصورة واستخراج الألوان من هذا الجزء فقط.',
    },
    {
      q: 'كيف تعمل معاينة واجهة المستخدم الحية؟',
      a: 'انتقل إلى تبويب معاينة الواجهة لرؤية ألوانك المستخرجة وهي تطبق تلقائياً على البطاقات والأزرار والرسوم البيانية.',
    },
  ],
}

// Preset sample images
const SAMPLE_PALETTES = [
  {
    name: 'Sunset Horizon',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    category: 'Nature',
  },
  {
    name: 'Neon Cyberpunk',
    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    category: 'Vibrant',
  },
  {
    name: 'Emerald Forest',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
    category: 'Nature',
  },
  {
    name: 'Pastel Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    category: 'Minimal',
  },
]

export default function ImageColorPaletteTool() {
  const { t, language } = useLanguage()
  const isRtl = language === 'ar'

  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageName, setImageName] = useState<string>('Sunset Horizon')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [paletteResult, setPaletteResult] = useState<PaletteResult | null>(null)

  // Extraction Settings
  const [colorCount, setColorCount] = useState<number>(8)
  const [algorithm, setAlgorithm] = useState<ExtractionAlgorithm>('kmeans')
  const [ignoreWhite, setIgnoreWhite] = useState<boolean>(false)
  const [ignoreBlack, setIgnoreBlack] = useState<boolean>(false)

  // Tab Navigation
  const [activeTab, setActiveTab] = useState<'dominant' | 'vibrant' | 'muted' | 'light' | 'dark' | 'picked' | 'uiPreview' | 'accessibility'>('dominant')
  const [sortMode, setSortMode] = useState<'dominance' | 'hue' | 'brightness' | 'saturation'>('dominance')

  // Custom Picked / Pinned Colors
  const [customPicked, setCustomPicked] = useState<ColorData[]>([])
  const [lockedHexes, setLockedHexes] = useState<Set<string>>(new Set())

  // Zoom & Pan
  const [zoomLevel, setZoomLevel] = useState<number>(1)

  // Image Adjustment Sliders
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  })

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

  // Colorblindness Filter Simulation State
  const [colorblindFilter, setColorblindFilter] = useState<'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'>('normal')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Load Initial Sample Image on Mount
  useEffect(() => {
    loadImageFromUrl(SAMPLE_PALETTES[0].url, SAMPLE_PALETTES[0].name)
  }, [])

  // Clipboard Paste Listener
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
        const options: ExtractionOptions = {
          count: colorCount,
          algorithm,
          ignoreWhite,
          ignoreBlack,
          ignoreTransparent: true,
        }

        // Draw image onto canvas with adjustments
        const canvas = canvasRef.current
        if (canvas) {
          const maxWidth = 900
          let w = imgElement.naturalWidth || imgElement.width || 800
          let h = imgElement.naturalHeight || imgElement.height || 600
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w)
            w = maxWidth
          }
          canvas.width = Math.max(1, w)
          canvas.height = Math.max(1, h)

          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          if (ctx) {
            ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`
            ctx.drawImage(imgElement, 0, 0, w, h)
            ctx.filter = 'none'
          }

          // Extract palette using adjusted canvas
          const result = await extractPaletteFromImage(canvas, options)

          // Preserve locked colors
          if (lockedHexes.size > 0 && paletteResult) {
            const preserved = paletteResult.dominant.filter((c) => lockedHexes.has(c.hex))
            const newDominant = [...preserved, ...result.dominant.filter((c) => !lockedHexes.has(c.hex))].slice(0, colorCount)
            result.dominant = newDominant
          }

          setPaletteResult(result)
          setImageName(name)
          imageRef.current = imgElement

          // Log tool activity
          logToolActivity({
            toolId: 'image-color-palette',
            toolName: 'Image Color Palette Extractor',
            category: 'files',
            actionTitle: 'Extracted Color Palette',
            details: `Analyzed "${name}" (${result.dominant.length} swatches extracted via ${algorithm.toUpperCase()})`,
            inputSnippet: name,
            outputSnippet: `Dominant: ${result.dominant.map((c) => c.hex).slice(0, 4).join(', ')}`,
          })
          incrementToolUsage()
          markToolUsed('image-color-palette')
        }
      } catch (err) {
        console.error('Failed to extract color palette:', err)
        toast.error('Failed to analyze image colors')
      } finally {
        setIsProcessing(false)
      }
    },
    [colorCount, algorithm, ignoreWhite, ignoreBlack, adjustments, lockedHexes]
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
      toast.error('Could not load image from URL')
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

    // Generate Zoomed Loupe Canvas Snapshot (11x11 pixels around cursor)
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

      // Crosshair center
      lCtx.strokeStyle = '#FFFFFF'
      lCtx.lineWidth = 2
      lCtx.strokeRect(45, 45, 20, 20)

      lCtx.strokeStyle = '#000000'
      lCtx.lineWidth = 1
      lCtx.strokeRect(44, 44, 22, 22)
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

    const relX = (canvasX / canvas.width) * 100
    const relY = (canvasY / canvas.height) * 100

    const newColor = createColorData(pixel[0], pixel[1], pixel[2], 0, relX, relY)

    setCustomPicked((prev) => {
      if (prev.some((c) => c.hex === newColor.hex)) return prev
      return [newColor, ...prev]
    })
    setActiveTab('picked')
    toast.success(`Picked ${newColor.hex} (${newColor.name})`)
  }

  // Toggle Color Lock
  const toggleLockColor = (hex: string) => {
    setLockedHexes((prev) => {
      const next = new Set(prev)
      if (next.has(hex)) next.delete(hex)
      else next.add(hex)
      return next
    })
  }

  // Active Displayed Colors based on selected Tab, Sorting, & Colorblindness Simulation
  const displayedColors = useMemo(() => {
    if (!paletteResult) return []
    let list: ColorData[] = []
    if (activeTab === 'picked') {
      list = customPicked.length > 0 ? customPicked : paletteResult.dominant
    } else if (activeTab === 'uiPreview' || activeTab === 'accessibility') {
      list = paletteResult.dominant
    } else {
      list = paletteResult[activeTab] || paletteResult.dominant
    }

    let sorted = [...list]
    if (sortMode === 'hue') {
      sorted.sort((a, b) => a.hsl.h - b.hsl.h)
    } else if (sortMode === 'brightness') {
      sorted.sort((a, b) => b.luminance - a.luminance)
    } else if (sortMode === 'saturation') {
      sorted.sort((a, b) => b.hsl.s - a.hsl.s)
    }

    if (colorblindFilter !== 'normal') {
      sorted = sorted.map((c) => simulateColorblindness(c, colorblindFilter))
    }

    return sorted
  }, [paletteResult, activeTab, customPicked, sortMode, colorblindFilter])

  // Copy Helper
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
      toast.success('Palette poster PNG downloaded!')
    } catch (err) {
      toast.error('Failed to generate PNG poster')
    }
  }

  return (
    <ToolLayout metadata={toolMeta}>
      <div className="space-y-8" id="color-palette-extractor-app">
        {/* Header Studio Bar */}
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

          {/* Preset Sample Image Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground mr-1">
              {t('palette.samples', 'Preset Samples:')}
            </span>
            {SAMPLE_PALETTES.map((sample) => (
              <button
                key={sample.name}
                onClick={() => loadImageFromUrl(sample.url, sample.name)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  imageName === sample.name
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-secondary/50 hover:bg-secondary text-foreground'
                }`}
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Interactive Image Stage & Eyedropper (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Pipette className="h-4 w-4 text-primary" />
                  {t('palette.image_inspector', 'Interactive Image & Eyedropper')}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
                    className="p-1 hover:bg-secondary rounded"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-mono text-[11px] font-semibold">{zoomLevel}x</span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(4, z + 0.5))}
                    className="p-1 hover:bg-secondary rounded"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
                }}
                className="relative group cursor-pointer border-2 border-dashed border-border hover:border-primary/60 bg-secondary/20 hover:bg-secondary/40 transition-all rounded-xl p-3.5 text-center"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2.5 text-xs text-muted-foreground group-hover:text-foreground">
                  <UploadCloud className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{t('palette.upload_prompt', 'Upload picture')}</span>
                  <span>•</span>
                  <span>{t('palette.paste_hint', 'or paste with Ctrl+V')}</span>
                </div>
              </div>

              {/* Canvas Preview Container */}
              <div className="relative rounded-xl overflow-hidden border border-border bg-muted/20 flex items-center justify-center min-h-[280px]">
                <div
                  className="w-full flex items-center justify-center transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <canvas
                    ref={canvasRef}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseLeave={handleCanvasMouseLeave}
                    onClick={handleCanvasClick}
                    className="w-full h-auto object-contain cursor-crosshair max-h-[400px]"
                  />
                </div>

                {/* Pin Markers Over Image */}
                {displayedColors.map(
                  (col, idx) =>
                    col.x !== undefined &&
                    col.y !== undefined && (
                      <div
                        key={col.hex + idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          setInspectedColor(col)
                        }}
                        style={{ left: `${col.x}%`, top: `${col.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                        title={`${col.name} (${col.hex}) - Click to inspect`}
                      >
                        <div
                          className="h-5 w-5 rounded-full border-2 border-white shadow-lg transition-transform group-hover:scale-125 flex items-center justify-center"
                          style={{ backgroundColor: col.hex }}
                        >
                          <span className="text-[9px] font-bold text-white drop-shadow">{idx + 1}</span>
                        </div>
                      </div>
                    )
                )}

                {/* Precision Loupe Magnifier */}
                {magnifier.visible && (
                  <div
                    className="absolute pointer-events-none rounded-full shadow-2xl border-2 border-white overflow-hidden z-20 flex flex-col items-center justify-center bg-black/80 text-white"
                    style={{
                      width: 100,
                      height: 100,
                      left: Math.min(Math.max(magnifier.x - 50, 10), 300),
                      top: Math.min(Math.max(magnifier.y - 120, 10), 280),
                    }}
                  >
                    {magnifier.loupeCanvasDataUrl && (
                      <img
                        src={magnifier.loupeCanvasDataUrl}
                        alt="Zoomed Loupe"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute bottom-1 bg-black/90 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider">
                      {magnifier.color}
                    </div>
                  </div>
                )}
              </div>

              {/* Live Hover Status */}
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

              {/* Image Fine-Tuning Filters */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                    {t('palette.image_adjustments', 'Image Pre-Filters')}
                  </span>
                  <button
                    onClick={() => {
                      setAdjustments({ brightness: 100, contrast: 100, saturation: 100 })
                      if (imageRef.current) processImage(imageRef.current, imageName)
                    }}
                    className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2.5 text-[11px]">
                  <div>
                    <label className="text-muted-foreground font-medium block mb-1">
                      Brightness ({adjustments.brightness}%)
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={adjustments.brightness}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setAdjustments((p) => ({ ...p, brightness: val }))
                        if (imageRef.current) processImage(imageRef.current, imageName)
                      }}
                      className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground font-medium block mb-1">
                      Contrast ({adjustments.contrast}%)
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={adjustments.contrast}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setAdjustments((p) => ({ ...p, contrast: val }))
                        if (imageRef.current) processImage(imageRef.current, imageName)
                      }}
                      className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground font-medium block mb-1">
                      Saturate ({adjustments.saturation}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={adjustments.saturation}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setAdjustments((p) => ({ ...p, saturation: val }))
                        if (imageRef.current) processImage(imageRef.current, imageName)
                      }}
                      className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Extracted Swatches & Interactive Studio (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-6">
              {/* Top Controls: Algorithm & Swatch Count */}
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
                      { id: 'uiPreview', label: 'UI Mockup' },
                      { id: 'accessibility', label: 'WCAG Test' },
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
                <div className="flex items-center gap-2.5 text-xs">
                  <span className="text-muted-foreground font-medium">{t('palette.colors', 'Swatches:')}</span>
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

              {/* Algorithm & Filtering Sub-bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground bg-secondary/30 p-3 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">Algorithm:</span>
                    <select
                      value={algorithm}
                      onChange={(e) => {
                        const algo = e.target.value as ExtractionAlgorithm
                        setAlgorithm(algo)
                        if (imageRef.current) processImage(imageRef.current, imageName)
                      }}
                      className="bg-card text-foreground text-xs rounded-md border border-border px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="kmeans">K-Means Centroids</option>
                      <option value="mediancut">Median Cut Quantization</option>
                      <option value="histogram">Histogram Frequency</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer font-medium hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={ignoreWhite}
                      onChange={(e) => {
                        setIgnoreWhite(e.target.checked)
                        if (imageRef.current) processImage(imageRef.current, imageName)
                      }}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    Ignore White
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span>{t('palette.sort_by', 'Sort:')}</span>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as any)}
                    className="bg-card text-foreground text-xs rounded-md border border-border px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  >
                    <option value="dominance">Dominance %</option>
                    <option value="hue">Hue Spectrum</option>
                    <option value="brightness">Lightness</option>
                    <option value="saturation">Saturation</option>
                  </select>
                </div>
              </div>

              {/* Colorblindness Simulator Selector */}
              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-card border border-border">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  Colorblindness Simulation:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {(
                    [
                      { id: 'normal', label: 'Normal' },
                      { id: 'protanopia', label: 'Protanopia (Red-Blind)' },
                      { id: 'deuteranopia', label: 'Deuteranopia (Green-Blind)' },
                      { id: 'tritanopia', label: 'Tritanopia (Blue-Blind)' },
                      { id: 'achromatopsia', label: 'Achromatopsia (Monochrome)' },
                    ] as const
                  ).map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setColorblindFilter(filter.id)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        colorblindFilter === filter.id
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Tab Views */}
              {activeTab === 'uiPreview' ? (
                /* LIVE UI MOCKUP PREVIEWER */
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Layout className="h-4 w-4 text-primary" />
                      Live UI Theme Mapping
                    </span>
                    <span className="text-muted-foreground">
                      Extracted palette mapped to interactive UI elements
                    </span>
                  </div>

                  {(() => {
                    const primary = displayedColors[0]?.hex || '#3B82F6'
                    const secondary = displayedColors[1]?.hex || '#10B981'
                    const accent = displayedColors[2]?.hex || '#F59E0B'
                    const darkBg = displayedColors.find((c) => c.isDark)?.hex || '#0F172A'
                    const lightBg = displayedColors.find((c) => !c.isDark)?.hex || '#F8FAFC'

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Light Card Mockup */}
                        <div
                          className="p-5 rounded-2xl shadow-md border space-y-4"
                          style={{ backgroundColor: lightBg, borderColor: secondary + '40', color: darkBg }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                              Light UI Component
                            </span>
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: secondary }}
                            >
                              Active
                            </span>
                          </div>
                          <h4 className="text-lg font-extrabold" style={{ color: darkBg }}>
                            {imageName} Dashboard
                          </h4>
                          <p className="text-xs opacity-80 leading-relaxed">
                            This live preview demonstrates how your extracted palette automatically styles headlines, primary buttons, and accent pills.
                          </p>
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow transition-transform hover:scale-105"
                              style={{ backgroundColor: primary }}
                            >
                              Primary CTA
                            </button>
                            <button
                              className="px-4 py-2 rounded-xl text-xs font-semibold border shadow-sm"
                              style={{ borderColor: primary, color: primary }}
                            >
                              Secondary
                            </button>
                          </div>
                        </div>

                        {/* Dark Card Mockup */}
                        <div
                          className="p-5 rounded-2xl shadow-md space-y-4 text-white"
                          style={{ backgroundColor: darkBg }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                              Dark UI Component
                            </span>
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold text-black"
                              style={{ backgroundColor: accent }}
                            >
                              Pro
                            </span>
                          </div>
                          <h4 className="text-lg font-extrabold text-white">Analytics Overview</h4>
                          <div className="h-16 w-full rounded-xl p-3 flex items-end justify-between gap-1 bg-white/5 border border-white/10">
                            {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                              <div
                                key={i}
                                className="w-full rounded-t transition-all"
                                style={{
                                  height: `${h}%`,
                                  backgroundColor: i % 2 === 0 ? primary : secondary,
                                }}
                              />
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="text-slate-400">Conversion Rate</span>
                            <span className="font-bold text-emerald-400">+24.8%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : activeTab === 'accessibility' ? (
                /* WCAG CONTRAST MATRIX TEST */
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Contrast className="h-4 w-4 text-primary" />
                      WCAG 2.1 Contrast Matrix
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      AA (4.5:1) • AAA (7:1) Compliance
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {displayedColors.slice(0, 6).map((color, i) => (
                      <div
                        key={color.hex + i}
                        className="p-3 rounded-xl border border-border bg-card flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-7 w-7 rounded-lg border border-black/10 shadow-sm"
                            style={{ backgroundColor: color.hex }}
                          />
                          <div>
                            <div className="font-bold text-foreground">{color.name}</div>
                            <div className="font-mono text-[11px] text-muted-foreground">{color.hex}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* On White */}
                          <div className="p-1.5 px-2.5 rounded-lg bg-white text-black border border-black/10 text-center">
                            <div className="text-[10px] text-gray-500">On White</div>
                            <div className="font-mono font-bold flex items-center gap-1">
                              {color.contrastOnWhite}:1
                              {color.contrastOnWhite >= 4.5 ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <XCircle className="h-3 w-3 text-rose-500" />
                              )}
                            </div>
                          </div>

                          {/* On Black */}
                          <div className="p-1.5 px-2.5 rounded-lg bg-slate-900 text-white border border-white/10 text-center">
                            <div className="text-[10px] text-slate-400">On Black</div>
                            <div className="font-mono font-bold flex items-center gap-1">
                              {color.contrastOnBlack}:1
                              {color.contrastOnBlack >= 4.5 ? (
                                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <XCircle className="h-3 w-3 text-rose-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* DEFAULT PALETTE SWATCHES LIST */
                <div className="space-y-4">
                  {/* Swatches Visual Banner Strip */}
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

                  {/* Swatch Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    {displayedColors.map((color, index) => {
                      const isLocked = lockedHexes.has(color.hex)
                      return (
                        <div
                          key={color.hex + index}
                          className="group relative rounded-xl border border-border bg-card p-3 hover:border-primary/50 transition-all hover:shadow-md space-y-2.5"
                        >
                          {/* Color Swatch Box */}
                          <div
                            onClick={() => setInspectedColor(color)}
                            className="h-20 w-full rounded-lg relative cursor-pointer overflow-hidden border border-black/5 flex items-end justify-between p-2 transition-transform group-hover:scale-[1.02]"
                            style={{ backgroundColor: color.hex }}
                          >
                            {/* Dominance % Badge */}
                            {color.percentage > 0 && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm ${
                                  color.isDark ? 'bg-black/60 text-white' : 'bg-white/80 text-black'
                                }`}
                              >
                                {color.percentage}%
                              </span>
                            )}

                            {/* Lock Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleLockColor(color.hex)
                              }}
                              className={`p-1 rounded-full shadow transition-all ${
                                isLocked
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-black/50 text-white/70 opacity-0 group-hover:opacity-100'
                              }`}
                              title={isLocked ? 'Unlock color' : 'Lock color'}
                            >
                              {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                            </button>
                          </div>

                          {/* Color Label & Copy */}
                          <div>
                            <div className="font-bold text-xs text-foreground truncate">{color.name}</div>
                            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mt-0.5">
                              <span>{color.hex}</span>
                              <button
                                onClick={() => copyToClipboard(color.hex, color.hex)}
                                className="hover:text-primary transition-colors p-0.5"
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
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Developer Export Suite */}
              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FileCode className="h-4 w-4 text-primary" />
                    {t('palette.export_suite', 'Export & Developer Suite')}
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

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Copy list:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(generateHexList(displayedColors, ', '), 'Comma List')}
                      className="hover:text-foreground underline"
                    >
                      HEX (Comma Separated)
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => copyToClipboard(generateScssVariables(displayedColors), 'SCSS Variables')}
                      className="hover:text-foreground underline"
                    >
                      SCSS $variables
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Color Inspector Modal */}
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
                          className="h-10 rounded-lg border border-black/10 flex items-center justify-center text-[10px] font-mono text-white drop-shadow cursor-pointer hover:scale-105 transition-transform"
                          style={{ backgroundColor: harmonies.complementary.hex }}
                          title={`Complementary (${harmonies.complementary.hex})`}
                          onClick={() => copyToClipboard(harmonies.complementary.hex, 'Complementary')}
                        >
                          Comp
                        </div>
                        <div
                          className="h-10 rounded-lg border border-black/10 flex items-center justify-center text-[10px] font-mono text-white drop-shadow cursor-pointer hover:scale-105 transition-transform"
                          style={{ backgroundColor: harmonies.triadic[0].hex }}
                          title={`Triadic 1 (${harmonies.triadic[0].hex})`}
                          onClick={() => copyToClipboard(harmonies.triadic[0].hex, 'Triadic 1')}
                        >
                          Tri 1
                        </div>
                        <div
                          className="h-10 rounded-lg border border-black/10 flex items-center justify-center text-[10px] font-mono text-white drop-shadow cursor-pointer hover:scale-105 transition-transform"
                          style={{ backgroundColor: harmonies.triadic[1].hex }}
                          title={`Triadic 2 (${harmonies.triadic[1].hex})`}
                          onClick={() => copyToClipboard(harmonies.triadic[1].hex, 'Triadic 2')}
                        >
                          Tri 2
                        </div>
                        <div
                          className="h-10 rounded-lg border border-black/10 flex items-center justify-center text-[10px] font-mono text-white drop-shadow cursor-pointer hover:scale-105 transition-transform"
                          style={{ backgroundColor: harmonies.analogous[0].hex }}
                          title={`Analogous (${harmonies.analogous[0].hex})`}
                          onClick={() => copyToClipboard(harmonies.analogous[0].hex, 'Analogous')}
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
