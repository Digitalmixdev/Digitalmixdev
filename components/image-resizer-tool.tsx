'use client'

import React, { useState, useRef } from 'react'
import {
  Maximize2,
  Trash2,
  Download,
  UploadCloud,
  Loader2,
  Sliders,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Plus,
  Eye,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { useLanguage } from '@/lib/i18n/context'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { logToolActivity } from '@/lib/history-service'

interface ImageFileItem {
  id: string
  name: string
  size: number
  type: string
  aspectRatio: number
  originalWidth: number
  originalHeight: number
  targetWidth: number
  targetHeight: number
  previewUrl: string
  rawFile: File
}

const toolMeta: ToolMetadata = {
  id: 'image-resizer',
  name: 'Image Resizer & Format Converter',
  name_ar: 'أداة تغيير أبعاد ومقاسات الصور',
  description:
    'Resize, crop, compress, and convert PNG, JPEG, and WebP images in batch with aspect ratio locking and 100% client-side privacy.',
  description_ar:
    'تعديل مقاسات، قص، ضغط، وتحويل صيغ صور PNG و JPEG و WebP دفعة واحدة مع قفل نسبة الأبعاد ومعالجة محلية 100%.',
  category: {
    id: 'files',
    name: 'File Utilities',
    slug: 'files',
  },
  icon: Maximize2,
  privacyBadge: '100% Client-Side • Canvas Hardware Accelerated',
  privacyBadge_ar: '100% معالجة محلياً • تسريع عبر كارت الشاشة Canvas',
  features: [
    {
      icon: Zap,
      title: 'Batch Image Processing',
      desc: 'Resize dozens of high-resolution images simultaneously with custom dimensions.',
    },
    {
      icon: Sliders,
      title: 'Aspect Ratio Lock',
      desc: 'Preserves proportions automatically while allowing free-form dimension customization.',
    },
    {
      icon: ShieldCheck,
      title: 'Local GPU Acceleration',
      desc: 'Images are drawn and converted using your browser HTML5 canvas with zero server uploads.',
    },
    {
      icon: Sparkles,
      title: 'Multi-Format Export',
      desc: 'Seamlessly convert between WebP, PNG, and JPEG with configurable compression quality.',
    },
  ],
  features_ar: [
    {
      icon: Zap,
      title: 'معالجة الصور الجماعية',
      desc: 'تغيير مقاسات عشرات الصور عالية الدقة في نفس الوقت بأبعاد مخصصة.',
    },
    {
      icon: Sliders,
      title: 'قفل نسبة الأبعاد (Aspect Ratio)',
      desc: 'الحفاظ على تناسق العرض والارتفاع تلقائياً مع إمكانية التعديل الحر.',
    },
    {
      icon: ShieldCheck,
      title: 'تسريع المعالجة المحلي',
      desc: 'تُعتمد معالجة الرسم بالكامل على متصفحك وCanvas محلياً دون رفع الملفات للسيرفر.',
    },
    {
      icon: Sparkles,
      title: 'التصدير بصيغ متعددة',
      desc: 'التحويل بين WebP و PNG و JPEG مع إمكانية التحكم بنسبة الضغط والجودة.',
    },
  ],
  faqs: [
    {
      q: 'Will resizing images reduce their quality?',
      a: 'Resizing downsamples pixel matrices. Using our high-quality bicubic canvas interpolation and WebP export ensures crisp visuals with optimized file sizes.',
    },
    {
      q: 'Are there file size or upload count limits?',
      a: 'Because operations execute 100% in your local device memory, you can resize as many high-resolution photos as your device RAM supports without artificial limits.',
    },
    {
      q: 'Can I convert JPEG images to WebP format?',
      a: 'Yes. Select WebP from the output format selector to convert images into modern high-efficiency WebP files.',
    },
  ],
  faqs_ar: [
    {
      q: 'هل تغيير مقاسات الصورة يقلل من جودتها؟',
      a: 'تغيير الأبعاد يعيد توزيع البكسلات. باستخدام خوارزمية التنعيم العالية التي نوفرها وتصدير WebP، تحصل على صور ناصعة وبحجم مخصص ومثالي.',
    },
    {
      q: 'هل هناك حدود لحجم الملفات أو عدد الصور؟',
      a: 'نظراً لأن جميع العمليات تنفذ داخل ذاكرة جهازك، يمكنك معالجة أي عدد من الصور العالية الدقة بقدر ما تتحمله ذاكرة جهازك (RAM).',
    },
    {
      q: 'هل يمكنني تحويل صور JPEG إلى صيغة WebP الحديثة؟',
      a: 'نعم! اختر WebP من قائمة صيغ التصدير لتحويل الصور إلى صيغة WebP الخفيفة وعالية الجودة.',
    },
  ],
}

export default function ImageResizerTool() {
  const { language } = useLanguage()
  const isAr = language === 'ar'

  const [images, setImages] = useState<ImageFileItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [globalWidth, setGlobalWidth] = useState<number>(800)
  const [globalHeight, setGlobalHeight] = useState<number>(600)
  const [maintainRatio, setMaintainRatio] = useState(true)
  const [globalQuality, setGlobalQuality] = useState<number>(80)
  const [outputFormat, setOutputFormat] = useState<string>('image/jpeg')

  const [activePreview, setActivePreview] = useState<{ url: string; width: number; height: number; name: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const recordUsage = async () => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed('image-resizer'),
      ])
    } catch {
      // Non-blocking telemetry
    }
  }

  const handleFileSelection = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    const newImages: ImageFileItem[] = []

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      if (file.type.startsWith('image/')) {
        await new Promise<void>((resolve) => {
          const reader = new FileReader()
          reader.onload = (event) => {
            const img = new Image()
            img.onload = () => {
              const ratio = img.width / img.height
              newImages.push({
                id: Math.random().toString(36).substring(2, 9),
                name: file.name,
                size: file.size,
                type: file.type,
                aspectRatio: ratio,
                originalWidth: img.width,
                originalHeight: img.height,
                targetWidth: globalWidth,
                targetHeight: maintainRatio ? Math.round(globalWidth / ratio) : globalHeight,
                previewUrl: event.target?.result as string,
                rawFile: file,
              })
              resolve()
            }
            img.src = event.target?.result as string
          }
          reader.readAsDataURL(file)
        })
      }
    }

    setImages((prev) => [...prev, ...newImages])
  }

  const updateGlobalWidth = (width: number) => {
    setGlobalWidth(width)
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        targetWidth: width,
        targetHeight: maintainRatio ? Math.round(width / img.aspectRatio) : img.targetHeight,
      }))
    )
  }

  const updateGlobalHeight = (height: number) => {
    setGlobalHeight(height)
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        targetHeight: height,
        targetWidth: maintainRatio ? Math.round(height * img.aspectRatio) : img.targetWidth,
      }))
    )
  }

  const processAndDownloadImage = async (item: ImageFileItem) => {
    const canvas = document.createElement('canvas')
    canvas.width = item.targetWidth
    canvas.height = item.targetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.src = item.previewUrl
    await new Promise((resolve) => {
      img.onload = resolve
    })

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, item.targetWidth, item.targetHeight)

    const ext = outputFormat === 'image/png' ? 'png' : outputFormat === 'image/webp' ? 'webp' : 'jpg'
    const quality = outputFormat === 'image/png' ? 1 : globalQuality / 100

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `resized-${item.name.replace(/\.[^/.]+$/, '')}.${ext}`
        a.click()
        URL.revokeObjectURL(url)

        logToolActivity({
          toolId: 'image-resizer',
          toolName: isAr ? 'أداة تغيير أبعاد ومقاسات الصور' : 'Image Resizer & Converter',
          category: 'files',
          actionTitle: isAr ? `تم تغيير أبعاد الصورة (${item.targetWidth}×${item.targetHeight})` : `Resized Image (${item.targetWidth}×${item.targetHeight})`,
          details: isAr
            ? `تم تعديل مقاسات "${item.name}" من ${item.originalWidth}×${item.originalHeight} إلى ${item.targetWidth}×${item.targetHeight}px بصيغة (${ext.toUpperCase()})`
            : `Resized "${item.name}" from ${item.originalWidth}×${item.originalHeight} to ${item.targetWidth}×${item.targetHeight}px (${ext.toUpperCase()})`,
          inputSnippet: `Original: ${item.name} (${item.originalWidth}×${item.originalHeight}px)`,
          outputSnippet: `Target: ${item.targetWidth}×${item.targetHeight}px, Format: ${ext.toUpperCase()}`,
        })
      },
      outputFormat,
      quality
    )
  }

  const handleDownloadAll = async () => {
    if (images.length === 0) return
    setIsProcessing(true)

    for (const item of images) {
      await processAndDownloadImage(item)
    }

    recordUsage()
    setIsProcessing(false)
  }

  const handlePreview = (item: ImageFileItem) => {
    const canvas = document.createElement('canvas')
    canvas.width = item.targetWidth
    canvas.height = item.targetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.src = item.previewUrl
    img.onload = () => {
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, item.targetWidth, item.targetHeight)

      const ext = outputFormat === 'image/png' ? 'png' : outputFormat === 'image/webp' ? 'webp' : 'jpg'
      const quality = outputFormat === 'image/png' ? 1 : globalQuality / 100

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            setActivePreview({
              url,
              width: item.targetWidth,
              height: item.targetHeight,
              name: `resized-${item.name.replace(/\.[^/.]+$/, '')}.${ext}`,
            })
          }
        },
        outputFormat,
        quality
      )
    }
  }

  return (
    <ToolLayout metadata={toolMeta} maxWidth="7xl">
      <div dir={isAr ? 'rtl' : 'ltr'}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileSelection(e.target.files)}
          accept="image/*"
          multiple
          className="hidden"
        />

        {images.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border/80 hover:border-primary/50 bg-card/50 hover:bg-card/90 rounded-3xl p-10 sm:p-16 text-center cursor-pointer transition-all duration-200 shadow-xs flex flex-col items-center justify-center gap-4 group"
          >
            <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-200">
              <UploadCloud className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                {isAr ? 'حدد أو اسحب وأفلت الصور هنا' : 'Select or Drop Images'}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {isAr
                  ? 'ارفع صور JPEG أو PNG أو WebP لتغيير أبعادها وتحويل صيغها دفعة واحدة.'
                  : 'Upload JPEG, PNG, or WebP images to resize dimensions and convert formats in batch.'}
              </p>
            </div>
            <Button size="lg" className="rounded-xl font-bold gap-2 pointer-events-none mt-2">
              <Plus className="h-4 w-4" />
              {isAr ? 'اختيار الصور' : 'Choose Images'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Controls Bar */}
            <div className="p-6 rounded-2xl border border-border/70 bg-card shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/40">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" />
                  {isAr ? 'إعدادات تغيير المقاسات والأبعاد' : 'Global Resizing Configuration'}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 text-xs font-semibold rounded-xl"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isAr ? 'إضافة صور' : 'Add Images'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setImages([])}
                    className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {isAr ? 'مسح الكل' : 'Clear All'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {isAr ? 'العرض (بكسل)' : 'Width (px)'}
                  </label>
                  <input
                    type="number"
                    value={globalWidth}
                    onChange={(e) => updateGlobalWidth(Math.max(1, Number(e.target.value)))}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {isAr ? 'الارتفاع (بكسل)' : 'Height (px)'}
                  </label>
                  <input
                    type="number"
                    value={globalHeight}
                    onChange={(e) => updateGlobalHeight(Math.max(1, Number(e.target.value)))}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {isAr ? 'صيغة التصدير' : 'Output Format'}
                  </label>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer"
                  >
                    <option value="image/jpeg">JPEG (.jpg)</option>
                    <option value="image/png">PNG (.png)</option>
                    <option value="image/webp">WebP (.webp)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                    <span>{isAr ? 'مستوى الجودة' : 'Quality'}</span>
                    <span>{globalQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={globalQuality}
                    onChange={(e) => setGlobalQuality(Number(e.target.value))}
                    className="w-full h-10 accent-primary cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={maintainRatio}
                    onChange={(e) => setMaintainRatio(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  {isAr ? 'قفل نسبة الأبعاد (التناسب)' : 'Lock Aspect Ratio Proportions'}
                </label>

                <Button
                  onClick={handleDownloadAll}
                  disabled={isProcessing || images.length === 0}
                  className="gap-2 text-xs font-bold shadow-md shadow-primary/20 rounded-xl"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isProcessing
                    ? isAr ? 'جارٍ المعالجة والتنزيل...' : 'Processing...'
                    : isAr ? `معالجة وتنزيل الكل (${images.length})` : `Process & Download All (${images.length})`}
                </Button>
              </div>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-border/70 bg-card shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="relative aspect-video w-full rounded-xl bg-muted/40 overflow-hidden border border-border/40">
                    <img src={item.previewUrl} alt={item.name} className="h-full w-full object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => handlePreview(item)}
                        className="p-1.5 rounded-lg bg-background/90 text-foreground hover:text-primary transition-colors shadow-xs"
                        title={isAr ? 'معاينة النتيجة' : 'Preview Resized Output'}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((i) => i.id !== item.id))}
                        className="p-1.5 rounded-lg bg-background/90 text-destructive hover:bg-destructive hover:text-white transition-colors shadow-xs"
                        title={isAr ? 'حذف الصورة' : 'Delete Image'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {item.originalWidth}x{item.originalHeight} →{' '}
                      <span className="text-primary font-bold">{item.targetWidth}x{item.targetHeight}</span>
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => processAndDownloadImage(item)}
                    className="w-full text-xs font-semibold rounded-lg h-8 gap-1.5"
                  >
                    <Download className="h-3 w-3" />
                    {isAr ? 'تنزيل' : 'Download'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Preview */}
        {activePreview && (
          <Dialog open={Boolean(activePreview)} onOpenChange={() => setActivePreview(null)}>
            <DialogContent className="max-w-2xl" dir={isAr ? 'rtl' : 'ltr'}>
              <DialogHeader>
                <DialogTitle className="text-sm font-bold truncate text-start">
                  {isAr ? 'معاينة:' : 'Preview:'} {activePreview.name} ({activePreview.width}x{activePreview.height})
                </DialogTitle>
              </DialogHeader>
              <div className="max-h-[65vh] overflow-auto flex items-center justify-center p-4 bg-muted/20 rounded-xl border border-border/50">
                <img src={activePreview.url} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg" />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ToolLayout>
  )
}