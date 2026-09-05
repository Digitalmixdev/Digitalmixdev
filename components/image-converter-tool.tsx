'use client'

import React, { useState, useRef } from 'react'
import {
  Image as ImageIcon,
  UploadCloud,
  Download,
  CheckCircle2,
  Trash2,
  Sliders,
  ShieldCheck,
  Zap,
  Sparkles,
  RefreshCw,
  Loader2,
  FileArchive,
  Eye,
  Columns,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import JSZip from 'jszip'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { useLanguage } from '@/lib/i18n/context'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { logToolActivity } from '@/lib/history-service'
import {
  convertSingleImage,
  decodeFileToCanvas,
  SUPPORTED_IMAGE_FORMATS,
  type SupportedImageFormat,
} from '@/lib/converters/image-converter'

interface ImageItem {
  id: string
  file: File
  name: string
  originalSize: number
  originalWidth?: number
  originalHeight?: number
  previewUrl: string
  status: 'idle' | 'converting' | 'success' | 'error'
  convertedBlob?: Blob
  convertedSize?: number
  convertedUrl?: string
  convertedPreviewUrl?: string
  width?: number
  height?: number
  error?: string
}

const toolMeta: ToolMetadata = {
  id: 'image-converter',
  name: 'Universal Image Converter',
  name_ar: 'محول ومعدل صيغ الصور الشامل',
  description:
    'Convert between 14 professional image formats: AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, and XPS with 100% in-browser privacy.',
  description_ar:
    'تحويل فوري بين 14 صيغة صور تشمل AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, و XPS بأعلى دقة ومعالجة محلية 100%.',
  category: {
    id: 'files',
    name: 'File Utilities',
    slug: 'files',
  },
  icon: ImageIcon,
  privacyBadge: '100% Client-Side • In-Memory Processing • Zero Server Uploads',
  privacyBadge_ar: '100% معالجة محلياً • بدون رفع أي صور • معالجة في الذاكرة',
  features: [
    {
      icon: ImageIcon,
      title: '14 Core Image Formats',
      desc: 'Seamless two-way conversion between AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, and XPS.',
    },
    {
      icon: Eye,
      title: 'Instant High-Res Preview',
      desc: 'Inspect converted results immediately in high definition, compare before & after side-by-side, and verify quality prior to downloading.',
    },
    {
      icon: Sliders,
      title: 'Compression & Dimension Resampling',
      desc: 'Fine-tune quality percentages, transparency background fills, and downscale resolutions dynamically.',
    },
    {
      icon: ShieldCheck,
      title: 'Strict Local Privacy',
      desc: 'All graphic transformations run on HTML5 Canvas and native binary parsers in local browser memory without server uploads.',
    },
  ],
  features_ar: [
    {
      icon: ImageIcon,
      title: '14 صيغة صور أساسية',
      desc: 'تحويل مباشر ومتبادل بين AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, و XPS.',
    },
    {
      icon: Eye,
      title: 'معاينة فورية عالية الدقة',
      desc: 'فحص الصور المحولة فورياً بدقة عالية، ومقارنة قبل وبعد جنب إلى جنب والتأكد من الجودة قبل التحميل.',
    },
    {
      icon: Sliders,
      title: 'خيارات الضغط وتغيير الأبعاد',
      desc: 'ضبط نسبة الجودة، وتعبئة خلفية الشفافية بلون مخصص، وإعادة ضبط المقاسات بديناميكية.',
    },
    {
      icon: ShieldCheck,
      title: 'خصوصية محلية صارمة',
      desc: 'تتم كافة عمليات المعالجة عبر HTML5 Canvas ومفككات الأكواد المحلية دون رفع أي صورة لخادم خارجي.',
    },
  ],
  faqs: [
    {
      q: 'Which image formats are supported?',
      a: 'You can convert between 14 formats: AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, and XPS.',
    },
    {
      q: 'How can I convert or merge images into a PDF document?',
      a: 'Use our dedicated Document & Office Converter tool to convert single or multiple photos (JPG, PNG, WEBP) into high-quality PDFs with custom page sizes, A4 layouts, and instant previews.',
    },
    {
      q: 'Can I convert Photoshop PSD and macOS ICNS files directly in my browser?',
      a: 'Yes! Our custom binary decoders parse PSD layers and ICNS icon bundles locally in your browser to convert them into standard web formats or vice versa.',
    },
    {
      q: 'Are transparent backgrounds preserved?',
      a: 'When converting between transparent formats like PNG, WEBP, AVIF, ICO, ICNS, and PSD, alpha channel transparency is preserved. For opaque formats (JPG, BMP, EPS), transparent areas are cleanly filled with your selected background color.',
    },
  ],
  faqs_ar: [
    {
      q: 'ما هي صيغ الصور المدعومة في الأداة؟',
      a: 'يمكنك التحويل متبادلاً بين 14 صيغة: AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, و XPS.',
    },
    {
      q: 'كيف يمكنني تحويل الصور إلى ملف PDF أو دمجها؟',
      a: 'يمكنك استخدام أداة "محول المستندات والأوفيس" لتحويل عدة صور إلى ملف PDF عالي الجودة مع التحكم في مقاسات A4 والتنسيقات.',
    },
    {
      q: 'هل يمكن تحويل ملفات Photoshop PSD و macOS ICNS مباشرة في المتصفح؟',
      a: 'نعم! تقوم أداتنا بفك تشفير طبقات PSD وحزم أيقونات ICNS محلياً وتحويلها إلى صيغ الويب القياسية أو العكس.',
    },
    {
      q: 'هل يتم الحفاظ على خلفيات الصور الشفافة؟',
      a: 'نعم، عند التحويل بين الصيغ الشفافة مثل PNG, WEBP, AVIF, ICO, ICNS, و PSD يتم الحفاظ على الشفافية بالكامل. أما للصيغ المعتمة مثل JPG يتم تعبئة خلفية الشفافية باللون الذي تختاره.',
    },
  ],
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function ImageConverterTool() {
  const { language } = useLanguage()
  const isAr = language === 'ar'

  const [targetFormat, setTargetFormat] = useState<SupportedImageFormat>('webp')
  const [quality, setQuality] = useState<number>(90)
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined)
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF')
  const [items, setItems] = useState<ImageItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Preview Modal States
  const [previewItem, setPreviewItem] = useState<ImageItem | null>(null)
  const [previewTab, setPreviewTab] = useState<'converted' | 'original' | 'compare'>('converted')
  const [zoomLevel, setZoomLevel] = useState<number>(1)

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    // Filter out PDF files to keep logic strictly pure image converter
    const validFiles = fileArray.filter((f) => {
      if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
        toast.warning(
          isAr
            ? `تم تخطي "${f.name}": ملفات PDF تتبع أداة تحويل المستندات أو دمج PDF.`
            : `Skipped "${f.name}": PDF files belong in Document Converter or PDF Merger.`
        )
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    const newItems: ImageItem[] = []

    for (const f of validFiles) {
      let previewUrl = ''
      let originalWidth: number | undefined
      let originalHeight: number | undefined

      try {
        const canvas = await decodeFileToCanvas(f)
        originalWidth = canvas.width
        originalHeight = canvas.height
        previewUrl = canvas.toDataURL('image/jpeg', 0.85)
      } catch {
        if (
          f.type.startsWith('image/') &&
          !f.name.toLowerCase().endsWith('.psd') &&
          !f.name.toLowerCase().endsWith('.tiff') &&
          !f.name.toLowerCase().endsWith('.tif')
        ) {
          previewUrl = URL.createObjectURL(f)
        }
      }

      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        name: f.name,
        originalSize: f.size,
        originalWidth,
        originalHeight,
        previewUrl,
        status: 'idle',
      })
    }

    setItems((prev) => [...prev, ...newItems])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((it) => it.id !== id)
      const target = prev.find((it) => it.id === id)
      if (target?.previewUrl && target.previewUrl.startsWith('blob:')) URL.revokeObjectURL(target.previewUrl)
      if (target?.convertedUrl && target.convertedUrl.startsWith('blob:')) URL.revokeObjectURL(target.convertedUrl)
      return filtered
    })
    if (previewItem?.id === id) {
      setPreviewItem(null)
    }
  }

  const handleClearAll = () => {
    items.forEach((it) => {
      if (it.previewUrl && it.previewUrl.startsWith('blob:')) URL.revokeObjectURL(it.previewUrl)
      if (it.convertedUrl && it.convertedUrl.startsWith('blob:')) URL.revokeObjectURL(it.convertedUrl)
    })
    setItems([])
    setPreviewItem(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleConvertAll = async () => {
    if (items.length === 0) {
      toast.error('Please upload at least one image file')
      return
    }

    setIsProcessing(true)
    const updatedItems = [...items]

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i]
      try {
        item.status = 'converting'
        setItems([...updatedItems])

        const res = await convertSingleImage(item.file, {
          format: targetFormat,
          quality: quality / 100,
          maxWidth,
          backgroundColor,
        })

        item.convertedBlob = res.blob
        item.convertedSize = res.blob.size
        item.convertedUrl = URL.createObjectURL(res.blob)
        item.convertedPreviewUrl = res.previewDataUrl
        item.width = res.width
        item.height = res.height
        item.status = 'success'
      } catch (err: any) {
        console.error(err)
        item.status = 'error'
        item.error = err.message || 'Failed to convert'
      }
      setItems([...updatedItems])
    }

    setIsProcessing(false)
    toast.success(
      isAr
        ? `اكتملت كافة عمليات التحويل إلى ${targetFormat.toUpperCase()} بنجاح!`
        : `All conversions to ${targetFormat.toUpperCase()} completed!`
    )

    // Activity Logging
    const successfulItems = updatedItems.filter((it) => it.status === 'success')
    if (successfulItems.length > 0) {
      const firstItem = successfulItems[0]
      const fileNames = successfulItems.map((it) => it.name).join(', ')

      logToolActivity({
        toolId: 'image-converter',
        toolName: isAr ? 'محول ومعدل صيغ الصور الشامل' : 'Universal Image Converter',
        category: 'files',
        actionTitle: isAr ? `تم التحويل إلى ${targetFormat.toUpperCase()}` : `Converted to ${targetFormat.toUpperCase()}`,
        details:
          successfulItems.length === 1
            ? isAr
              ? `تحويل الصورة "${firstItem.name}" إلى ${targetFormat.toUpperCase()} (${firstItem.width || '?'}x${firstItem.height || '?'})`
              : `Converted image "${firstItem.name}" to ${targetFormat.toUpperCase()} (${firstItem.width || '?'}x${firstItem.height || '?'})`
            : isAr
            ? `تحويل ${successfulItems.length} صور (${fileNames}) إلى ${targetFormat.toUpperCase()}`
            : `Converted ${successfulItems.length} images (${fileNames}) to ${targetFormat.toUpperCase()}`,
        inputSnippet: fileNames,
        outputSnippet: `Format: ${targetFormat.toUpperCase()}\nQuality: ${quality}%\nMax Width: ${maxWidth || 'Original'}`,
        metadata: {
          targetFormat,
          quality,
          maxWidth,
          backgroundColor,
          count: successfulItems.length,
          files: successfulItems.map((it) => ({
            name: it.name,
            originalSize: it.originalSize,
            convertedSize: it.convertedSize,
          })),
        },
      })
    }

    try {
      await incrementToolUsage()
      await markToolUsed('image-converter')
    } catch {
      // silent
    }
  }

  const handleDownloadItem = (item: ImageItem) => {
    if (!item.convertedBlob) return
    const ext = targetFormat
    const baseName = item.name.replace(/\.[^/.]+$/, '')
    const downloadName = `${baseName}.${ext}`

    const url = item.convertedUrl || URL.createObjectURL(item.convertedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success(isAr ? `تم تنزيل ${downloadName}` : `Downloaded ${downloadName}`)
  }

  const handleDownloadAllZip = async () => {
    const converted = items.filter((it) => it.status === 'success' && it.convertedBlob)
    if (converted.length === 0) return

    const zip = new JSZip()
    converted.forEach((it) => {
      const baseName = it.name.replace(/\.[^/.]+$/, '')
      zip.file(`${baseName}.${targetFormat}`, it.convertedBlob!)
    })

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const zipUrl = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = zipUrl
    a.download = `converted-images-${targetFormat}-${Date.now()}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(zipUrl)
    toast.success(isAr ? 'تم تنزيل جميع الملفات المحولة كأرشيف ZIP!' : 'Downloaded all converted files as ZIP!')
  }

  const openPreview = (item: ImageItem) => {
    setPreviewItem(item)
    setPreviewTab(item.status === 'success' ? 'converted' : 'original')
    setZoomLevel(1)
  }

  // Navigation inside modal
  const convertedItems = items.filter((it) => it.status === 'success' || it.previewUrl)
  const currentPreviewIndex = previewItem ? convertedItems.findIndex((it) => it.id === previewItem.id) : -1

  const handleNextPreview = () => {
    if (currentPreviewIndex >= 0 && currentPreviewIndex < convertedItems.length - 1) {
      setPreviewItem(convertedItems[currentPreviewIndex + 1])
      setZoomLevel(1)
    }
  }

  const handlePrevPreview = () => {
    if (currentPreviewIndex > 0) {
      setPreviewItem(convertedItems[currentPreviewIndex - 1])
      setZoomLevel(1)
    }
  }

  const filteredFormats = SUPPORTED_IMAGE_FORMATS.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.extension.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedFormatDef = SUPPORTED_IMAGE_FORMATS.find((f) => f.id === targetFormat)

  return (
    <ToolLayout metadata={toolMeta}>
      <div className="max-w-5xl mx-auto space-y-8" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Configuration Panel */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isAr ? 'صيغة الصورة الهدف (14 صيغة احترافية)' : 'Target Image Format (14 Formats)'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? 'اختر الصيغة المستهدفة من المصفوفة أدناه لتحويل صورك ورسوماتك فورياً'
                  : 'Select your target format from the full matrix below to convert your graphics'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs w-fit text-primary border-primary/30">
                <Sparkles className={`w-3 h-3 ${isAr ? 'ml-1' : 'mr-1'}`} />
                {isAr ? '14 صيغة مدعومة بالكامل' : '14 Formats Supported'}
              </Badge>
            </div>
          </div>

          {/* 14 Formats Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                {isAr
                  ? `التحويل إلى (${filteredFormats.length} صيغة متاحة)`
                  : `Convert To (${filteredFormats.length} Available)`}
              </label>
              {selectedFormatDef && (
                <span className="text-xs text-primary font-medium">
                  {isAr ? 'الصيغة المحددة:' : 'Active:'}{' '}
                  <strong className="font-bold">{selectedFormatDef.name}</strong> ({selectedFormatDef.description})
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {filteredFormats.map((fmt) => {
                const isSelected = targetFormat === fmt.id
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setTargetFormat(fmt.id)}
                    className={`relative p-3.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary'
                        : 'border-border/80 hover:border-primary/40 bg-card hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    <span className="text-sm font-black tracking-wide">{fmt.name}</span>
                    <span className="text-[10px] text-muted-foreground line-clamp-1 leading-tight">
                      .{fmt.extension}
                    </span>
                    {isSelected && (
                      <span className={`absolute top-1.5 ${isAr ? 'left-1.5' : 'right-1.5'} w-2 h-2 rounded-full bg-primary`} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fine Tuning Controls: Quality, Background & Sizing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 border-t border-border/60">
            {/* Quality Slider */}
            {['jpg', 'webp', 'avif'].includes(targetFormat) ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {isAr ? `مستوى الجودة (${quality}%)` : `Quality (${quality}%)`}
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {quality > 85
                      ? isAr ? 'دقة فائقة' : 'High Fidelity'
                      : quality > 65
                      ? isAr ? 'متوازن' : 'Balanced'
                      : isAr ? 'أقصى ضغط' : 'High Compression'}
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            ) : (
              <div className="space-y-1 text-xs text-muted-foreground flex flex-col justify-center">
                <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
                  {isAr ? 'نمط الترميز' : 'Encoding Mode'}
                </span>
                <p className="text-muted-foreground text-xs mt-1">
                  {isAr ? (
                    <>تعتمد صيغة <span className="font-bold text-foreground">{targetFormat.toUpperCase()}</span> على ضغط الحاويات المنظم وبدون فقدان للجودة.</>
                  ) : (
                    <>Format <span className="font-bold text-foreground">{targetFormat.toUpperCase()}</span> uses lossless & structured container compression.</>
                  )}
                </p>
              </div>
            )}

            {/* Background Color for Opaque formats */}
            {['jpg', 'bmp', 'eps', 'ps'].includes(targetFormat) && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  {isAr ? 'لون تعبئة الشفافية' : 'Transparency Fill Color'}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-border cursor-pointer p-0.5 bg-background"
                  />
                  <span className="text-xs text-muted-foreground font-mono">{backgroundColor}</span>
                </div>
              </div>
            )}

            {/* Max Width Downscale */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                {isAr ? 'أقصى حد للأبعاد والدقة' : 'Max Resolution Constraint'}
              </label>
              <select
                value={maxWidth || 'original'}
                onChange={(e) => {
                  const val = e.target.value
                  setMaxWidth(val === 'original' ? undefined : Number(val))
                }}
                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="original">{isAr ? 'الدقة الكاملة الأصلية' : 'Original Full Resolution'}</option>
                <option value="2560">{isAr ? '2K QHD (2560 بكسل)' : '2K QHD (2560px)'}</option>
                <option value="1920">{isAr ? 'Full HD (1920 بكسل)' : 'Full HD (1920px)'}</option>
                <option value="1280">{isAr ? 'HD (1280 بكسل)' : 'HD (1280px)'}</option>
                <option value="800">{isAr ? 'قياسي للويب (800 بكسل)' : 'Web Standard (800px)'}</option>
                <option value="512">{isAr ? 'أيقونة / صورة شخصية (512 بكسل)' : 'Icon / Avatar (512px)'}</option>
                <option value="256">{isAr ? 'أيقونة صغيرة (256 بكسل)' : 'Small Icon (256px)'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Upload Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'border-border/80 hover:border-primary/50 bg-card/50 hover:bg-card'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/*,.avif,.bmp,.eps,.gif,.icns,.ico,.jpg,.jpeg,.odd,.png,.ps,.psd,.tiff,.tif,.webp,.xps,.svg"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files)
              }
            }}
          />

          <div className="space-y-3 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isAr ? 'اسحب وأفلت عدة صور هنا أو انقر للاختيار' : 'Drop multiple images or click to select files'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? 'حدد صورة أو عدة صور (JPG, PNG, WEBP, AVIF, PSD, TIFF, EPS, ICO, ICNS, BMP, XPS)'
                  : 'Select one or multiple images (PDF, JPG, PNG, WEBP, AVIF, PSD, TIFF, EPS, ICO, ICNS, BMP, XPS)'}
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl pointer-events-none text-xs">
              {isAr ? 'اختيار ملفات الصور (تحديد متعدد متاح)' : 'Select Image Files (Multi-Select Enabled)'}
            </Button>
          </div>
        </div>

        {/* Items List */}
        {items.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {isAr ? `الملفات في قائمة الانتظار (${items.length})` : `Queued Files (${items.length})`}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'جاهزة للتحويل إلى ' : 'Ready to convert to '}
                  <strong className="text-foreground">{targetFormat.toUpperCase()}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs text-muted-foreground hover:text-destructive h-8"
                >
                  <Trash2 className={`w-3.5 h-3.5 ${isAr ? 'ml-1' : 'mr-1'}`} />
                  {isAr ? 'مسح الكل' : 'Clear All'}
                </Button>

                {items.some((it) => it.status === 'success') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAllZip}
                    className="text-xs h-9 rounded-xl gap-1.5"
                  >
                    <FileArchive className="w-3.5 h-3.5" />
                    {isAr ? 'تنزيل الكل (ZIP)' : 'Download ZIP'}
                  </Button>
                )}

                <Button
                  onClick={handleConvertAll}
                  disabled={isProcessing}
                  size="sm"
                  className="rounded-xl gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {isAr ? 'جارٍ التحويل...' : 'Converting...'}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      {isAr ? `تحويل الكل إلى ${targetFormat.toUpperCase()}` : `Convert All to ${targetFormat.toUpperCase()}`}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item) => {
                const isConverted = item.status === 'success'
                const displayThumbnail = (isConverted && item.convertedPreviewUrl) ? item.convertedPreviewUrl : item.previewUrl
                const sizeSavedPercent = item.convertedSize
                  ? Math.round(((item.originalSize - item.convertedSize) / item.originalSize) * 100)
                  : null

                return (
                  <div
                    key={item.id}
                    className="relative rounded-xl border border-border bg-muted/20 p-3 flex flex-col justify-between gap-3 group hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      {/* Clickable Image Thumbnail for instant preview */}
                      <button
                        type="button"
                        onClick={() => openPreview(item)}
                        title={isAr ? 'انقر للمعاينة' : 'Click to preview'}
                        className="relative w-14 h-14 rounded-lg bg-card border border-border/60 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer group/thumb hover:ring-2 hover:ring-primary transition-all"
                      >
                        {displayThumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={displayThumbnail}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground mt-0.5">
                          <span>{formatFileSize(item.originalSize)}</span>
                          {item.convertedSize && (
                            <>
                              <ArrowRight className={`w-3 h-3 text-muted-foreground/60 ${isAr ? 'rotate-180' : ''}`} />
                              <span className="font-semibold text-foreground">
                                {formatFileSize(item.convertedSize)}
                              </span>
                              {sizeSavedPercent !== null && sizeSavedPercent > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold">
                                  -{sizeSavedPercent}%
                                </Badge>
                              )}
                            </>
                          )}
                        </div>

                        {item.status === 'success' && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              {isAr ? `تم التحويل (${targetFormat.toUpperCase()})` : `Converted (${targetFormat.toUpperCase()})`}
                            </span>
                            {item.width && item.height && (
                              <span className="text-[10px] text-muted-foreground">
                                {item.width}×{item.height}px
                              </span>
                            )}
                          </div>
                        )}
                        {item.status === 'converting' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold mt-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {isAr ? 'جارٍ المعالجة...' : 'Processing'}
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-destructive font-semibold mt-1 truncate">
                            {item.error || (isAr ? 'فشل' : 'Failed')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 gap-2">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        {isAr ? 'إزالة' : 'Remove'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        {/* Preview Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openPreview(item)}
                          className="h-7 text-xs px-2 rounded-lg gap-1 text-muted-foreground hover:text-foreground"
                          title={isAr ? 'معاينة النتيجة' : 'Preview Result'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isAr ? 'معاينة' : 'Preview'}</span>
                        </Button>

                        {item.status === 'success' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownloadItem(item)}
                            className="h-7 text-xs rounded-lg gap-1 font-semibold"
                          >
                            <Download className="w-3 h-3" /> .{targetFormat}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* High-Resolution Interactive Preview Modal */}
        <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
          <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden border-border bg-card" dir={isAr ? 'rtl' : 'ltr'}>
            {previewItem && (
              <>
                {/* Modal Header */}
                <DialogHeader className="p-4 sm:p-5 border-b border-border bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-sm sm:text-base font-bold truncate max-w-md">
                        {previewItem.name}
                      </DialogTitle>
                      {previewItem.status === 'success' && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                          .{targetFormat.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      {previewItem.status === 'success'
                        ? isAr
                          ? `تم التحويل إلى ${targetFormat.toUpperCase()} (${formatFileSize(previewItem.convertedSize || 0)})`
                          : `Converted to ${targetFormat.toUpperCase()} (${formatFileSize(previewItem.convertedSize || 0)})`
                        : isAr
                        ? `الصورة الأصلية (${formatFileSize(previewItem.originalSize)})`
                        : `Original image (${formatFileSize(previewItem.originalSize)})`}
                    </DialogDescription>
                  </div>

                  {/* Mode Selector Tabs (Converted / Original / Compare) */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/60 p-1 rounded-xl border border-border/80">
                    {previewItem.status === 'success' && (
                      <button
                        type="button"
                        onClick={() => setPreviewTab('converted')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          previewTab === 'converted'
                            ? 'bg-card text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {isAr ? `النتيجة المحولة (${targetFormat.toUpperCase()})` : `Converted (${targetFormat.toUpperCase()})`}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPreviewTab('original')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        previewTab === 'original'
                          ? 'bg-card text-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {isAr ? 'الأصلية' : 'Original'}
                    </button>
                    {previewItem.status === 'success' && (
                      <button
                        type="button"
                        onClick={() => setPreviewTab('compare')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          previewTab === 'compare'
                            ? 'bg-card text-foreground shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Columns className="w-3 h-3" />
                        {isAr ? 'جنباً إلى جنب' : 'Side-by-Side'}
                      </button>
                    )}
                  </div>
                </DialogHeader>

                {/* Main Image Viewport with Checkerboard transparency pattern */}
                <div className="relative flex-1 min-h-[340px] max-h-[58vh] overflow-auto bg-neutral-900/5 dark:bg-neutral-900/40 p-4 flex items-center justify-center">
                  {/* Subtle Checkerboard for transparent images */}
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none"
                    style={{
                      backgroundImage: `linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%)`,
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    }}
                  />

                  {/* 1. Converted View */}
                  {previewTab === 'converted' && (
                    <div
                      className="relative transition-transform duration-150 flex items-center justify-center"
                      style={{ transform: `scale(${zoomLevel})` }}
                    >
                      {previewItem.convertedPreviewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewItem.convertedPreviewUrl}
                          alt="Converted Result"
                          className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-md border border-border/40"
                        />
                      ) : (
                        <div className="p-8 text-center text-muted-foreground text-xs">
                          {isAr ? 'ستظهر المعاينة هنا بمجرد اكتمال التحويل.' : 'Preview will appear here once converted.'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Original View */}
                  {previewTab === 'original' && (
                    <div
                      className="relative transition-transform duration-150 flex items-center justify-center"
                      style={{ transform: `scale(${zoomLevel})` }}
                    >
                      {previewItem.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewItem.previewUrl}
                          alt="Original File"
                          className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-md border border-border/40"
                        />
                      ) : (
                        <div className="p-8 text-center text-muted-foreground text-xs">
                          {isAr ? 'لا تتوفر معاينة.' : 'No preview available.'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Side-by-Side Comparison */}
                  {previewTab === 'compare' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full h-full p-2">
                      {/* Left: Original */}
                      <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-card border border-border/60">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          {isAr ? 'الأصلية' : 'Original'} ({formatFileSize(previewItem.originalSize)})
                        </span>
                        <div className="flex-1 flex items-center justify-center overflow-hidden min-h-[180px] max-h-[38vh]">
                          {previewItem.previewUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={previewItem.previewUrl}
                              alt="Original"
                              className="max-h-[34vh] max-w-full object-contain rounded-md"
                            />
                          )}
                        </div>
                        {previewItem.originalWidth && (
                          <span className="text-[10px] text-muted-foreground">
                            {previewItem.originalWidth} × {previewItem.originalHeight} px
                          </span>
                        )}
                      </div>

                      {/* Right: Converted */}
                      <div className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-card border border-primary/30 ring-1 ring-primary/20">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                            {isAr ? `المحولة (${targetFormat.toUpperCase()})` : `Converted ${targetFormat.toUpperCase()}`} ({formatFileSize(previewItem.convertedSize || 0)})
                          </span>
                          {previewItem.convertedSize && previewItem.originalSize && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[10px] font-bold px-1.5 py-0">
                              {previewItem.convertedSize < previewItem.originalSize
                                ? `-${Math.round(((previewItem.originalSize - previewItem.convertedSize) / previewItem.originalSize) * 100)}%`
                                : `+${Math.round(((previewItem.convertedSize - previewItem.originalSize) / previewItem.originalSize) * 100)}%`}
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 flex items-center justify-center overflow-hidden min-h-[180px] max-h-[38vh]">
                          {previewItem.convertedPreviewUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={previewItem.convertedPreviewUrl}
                              alt="Converted"
                              className="max-h-[34vh] max-w-full object-contain rounded-md"
                            />
                          )}
                        </div>
                        {previewItem.width && (
                          <span className="text-[10px] text-muted-foreground">
                            {previewItem.width} × {previewItem.height} px
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Floating Zoom Controls (for single image view) */}
                  {previewTab !== 'compare' && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border p-1 rounded-xl shadow-md" dir="ltr">
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        title={isAr ? 'تصغير' : 'Zoom Out'}
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono px-1 font-semibold text-muted-foreground">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        title={isAr ? 'تكبير' : 'Zoom In'}
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(1)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        title={isAr ? 'إعادة ضبط التكبير' : 'Reset Zoom'}
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Modal Footer: Navigation & Actions */}
                <div className="p-4 border-t border-border bg-card/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Previous / Next buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPreview}
                      disabled={currentPreviewIndex <= 0}
                      className="h-8 text-xs rounded-xl gap-1"
                    >
                      <ChevronLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                      {isAr ? 'السابق' : 'Previous'}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {isAr
                        ? `${currentPreviewIndex + 1} من ${convertedItems.length}`
                        : `${currentPreviewIndex + 1} of ${convertedItems.length}`}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPreview}
                      disabled={currentPreviewIndex >= convertedItems.length - 1}
                      className="h-8 text-xs rounded-xl gap-1"
                    >
                      {isAr ? 'التالي' : 'Next'}
                      <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                    </Button>
                  </div>

                  {/* Download Action Button */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {previewItem.status === 'success' && (
                      <Button
                        size="sm"
                        onClick={() => handleDownloadItem(previewItem)}
                        className="h-8 text-xs font-semibold rounded-xl gap-1.5 px-4 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {isAr
                          ? `تنزيل .${targetFormat.toUpperCase()} (${formatFileSize(previewItem.convertedSize || 0)})`
                          : `Download .${targetFormat.toUpperCase()} (${formatFileSize(previewItem.convertedSize || 0)})`}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ToolLayout>
  )
}
