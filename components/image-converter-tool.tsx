'use client'

import React, { useState, useRef } from 'react'
import {
  Image as ImageIcon,
  UploadCloud,
  Download,
  CheckCircle2,
  Trash2,
  Sliders,
  FileArchive,
  FileText,
  Layers,
  ShieldCheck,
  Zap,
  Sparkles,
  RefreshCw,
  Loader2,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { convertSingleImage, imagesToPdf, type SupportedImageFormat } from '@/lib/converters/image-converter'
import { renderPdfToImages } from '@/lib/converters/office-converter'

interface ImageItem {
  id: string
  file: File
  name: string
  originalSize: number
  previewUrl: string
  status: 'idle' | 'converting' | 'success' | 'error'
  convertedBlob?: Blob
  convertedSize?: number
  convertedUrl?: string
  width?: number
  height?: number
  error?: string
}

const toolMeta: ToolMetadata = {
  id: 'image-converter',
  name: 'Image & Media Converter',
  description:
    'Convert JPG, PNG, WebP, SVG, and BMP images, pack photos into clean PDF albums, or extract PDF pages to JPG with 100% browser-based privacy.',
  category: {
    id: 'files',
    name: 'File Utilities',
    slug: 'files',
  },
  icon: ImageIcon,
  privacyBadge: '100% Client-Side • In-Memory Processing • Zero Image Tracking',
  features: [
    {
      icon: ImageIcon,
      title: 'Universal Image Cross-Conversion',
      desc: 'Convert seamlessly between JPG, PNG, WebP, SVG, and BMP with high-fidelity color preservation.',
    },
    {
      icon: FileText,
      title: 'Photos to PDF Album',
      desc: 'Combine multiple image files into a single unified multi-page PDF with custom margins and A4 layouts.',
    },
    {
      icon: Sliders,
      title: 'Compression & Dimension Resampling',
      desc: 'Dial in custom quality percentages and scale resolutions to optimize web loading speeds.',
    },
    {
      icon: ShieldCheck,
      title: 'Strict Local Privacy',
      desc: 'All graphic transformations run on HTML5 Canvas in local browser memory without server uploads.',
    },
  ],
  faqs: [
    {
      q: 'Which image formats can I convert?',
      a: 'You can convert between JPG/JPEG, PNG, WebP, BMP, SVG, and PDF. You can also extract pages from PDF documents directly into high-res JPG or PNG images.',
    },
    {
      q: 'Does converting to WebP maintain quality?',
      a: 'Yes, WebP provides exceptional compression efficiency, reducing file sizes by 30% to 70% compared to JPG while retaining sharp details and transparent backgrounds.',
    },
    {
      q: 'Can I combine multiple pictures into one PDF?',
      a: 'Yes! Select multiple images, set the Target Format to PDF, choose your preferred page layout (Fit, A4 Portrait, or Letter), and download your combined document.',
    },
    {
      q: 'Are transparent backgrounds preserved?',
      a: 'When converting PNG to WebP, transparency is preserved. When converting to JPG, transparent areas are cleanly filled with your choice of background color (default pure white).',
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
  const [targetFormat, setTargetFormat] = useState<SupportedImageFormat>('webp')
  const [quality, setQuality] = useState<number>(90)
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined)
  const [pageSize, setPageSize] = useState<'fit' | 'a4-portrait' | 'a4-landscape' | 'letter'>('fit')
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF')
  const [items, setItems] = useState<ImageItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | File[]) => {
    const newItems: ImageItem[] = Array.from(files).map((f) => {
      const isPdf = f.type === 'application/pdf' || f.name.endsWith('.pdf')
      const previewUrl = isPdf ? '' : URL.createObjectURL(f)
      return {
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        name: f.name,
        originalSize: f.size,
        previewUrl,
        status: 'idle',
      }
    })

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
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      if (target?.convertedUrl) URL.revokeObjectURL(target.convertedUrl)
      return filtered
    })
  }

  const handleClearAll = () => {
    items.forEach((it) => {
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl)
      if (it.convertedUrl) URL.revokeObjectURL(it.convertedUrl)
    })
    setItems([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleConvertAll = async () => {
    if (items.length === 0) {
      toast.error('Please upload at least one image or PDF file')
      return
    }

    setIsProcessing(true)

    // Special Case: Combine all images into a single PDF
    if (targetFormat === 'pdf') {
      try {
        const validImages = items.filter((it) => it.file.type.startsWith('image/'))
        if (validImages.length === 0) {
          throw new Error('Please provide at least one valid image to generate a PDF')
        }

        toast.info(`Assembling ${validImages.length} images into PDF...`)
        const pdfBlob = await imagesToPdf(
          validImages.map((it) => it.file),
          { pageSize, margin: 24 }
        )

        const pdfUrl = URL.createObjectURL(pdfBlob)
        setItems((prev) =>
          prev.map((it) => ({
            ...it,
            status: 'success',
            convertedBlob: pdfBlob,
            convertedSize: pdfBlob.size,
            convertedUrl: pdfUrl,
          }))
        )

        // Prompt direct download of the merged album
        const a = document.createElement('a')
        a.href = pdfUrl
        a.download = `photo-album-${Date.now()}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        toast.success('Successfully created and downloaded PDF album!')
        await incrementToolUsage()
        await markToolUsed('image-converter')
      } catch (err: any) {
        toast.error(`PDF generation failed: ${err.message}`)
      } finally {
        setIsProcessing(false)
      }
      return
    }

    // Standard Case: Convert individual images
    const updatedItems = [...items]

    for (let i = 0; i < updatedItems.length; i++) {
      const item = updatedItems[i]
      try {
        item.status = 'converting'
        setItems([...updatedItems])

        // If source is a PDF file, extract page 1 to target format
        if (item.file.type === 'application/pdf' || item.name.endsWith('.pdf')) {
          const imgs = await renderPdfToImages(item.file, targetFormat === 'png' ? 'png' : 'jpg')
          if (imgs.length > 0) {
            item.convertedBlob = imgs[0].blob
            item.convertedSize = imgs[0].blob.size
            item.convertedUrl = imgs[0].dataUrl
            item.status = 'success'
          } else {
            throw new Error('No pages found in PDF')
          }
        } else {
          // Standard Image
          const res = await convertSingleImage(item.file, {
            format: targetFormat,
            quality: quality / 100,
            maxWidth,
            backgroundColor,
          })

          item.convertedBlob = res.blob
          item.convertedSize = res.blob.size
          item.convertedUrl = URL.createObjectURL(res.blob)
          item.width = res.width
          item.height = res.height
          item.status = 'success'
        }
      } catch (err: any) {
        console.error(err)
        item.status = 'error'
        item.error = err.message || 'Failed to convert'
      }
      setItems([...updatedItems])
    }

    setIsProcessing(false)
    toast.success('All conversions completed!')

    try {
      await incrementToolUsage()
      await markToolUsed('image-converter')
    } catch {
      // silent
    }
  }

  const handleDownloadItem = (item: ImageItem) => {
    if (!item.convertedBlob) return
    const ext = targetFormat === 'pdf' ? 'pdf' : targetFormat
    const baseName = item.name.replace(/\.[^/.]+$/, '')
    const downloadName = `${baseName}.${ext}`

    const url = item.convertedUrl || URL.createObjectURL(item.convertedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success(`Downloaded ${downloadName}`)
  }

  return (
    <ToolLayout metadata={toolMeta}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Configuration Panel */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Target Format & Output Settings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose output format, compression ratio, and layout options
              </p>
            </div>
            <Badge variant="outline" className="text-xs w-fit text-primary border-primary/30">
              <Sparkles className="w-3 h-3 mr-1" /> High-Performance Canvas
            </Badge>
          </div>

          {/* Format Selector Pills */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Convert To Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {[
                { id: 'webp' as SupportedImageFormat, label: 'WebP', desc: 'Modern & Compact' },
                { id: 'jpg' as SupportedImageFormat, label: 'JPG / JPEG', desc: 'Universal Photo' },
                { id: 'png' as SupportedImageFormat, label: 'PNG', desc: 'Lossless & Sharp' },
                { id: 'bmp' as SupportedImageFormat, label: 'BMP', desc: 'Bitmap Uncompressed' },
                { id: 'pdf' as SupportedImageFormat, label: 'PDF Album', desc: 'Combine to Doc' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setTargetFormat(fmt.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    targetFormat === fmt.id
                      ? 'border-primary bg-primary/10 text-primary shadow-xs'
                      : 'border-border/70 hover:border-primary/40 bg-card hover:bg-muted/40 text-foreground'
                  }`}
                >
                  <p className="text-sm font-bold">{fmt.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{fmt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Controls: Quality & Page Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {/* Quality Slider (for JPG/WebP) */}
            {targetFormat !== 'png' && targetFormat !== 'bmp' && targetFormat !== 'pdf' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Quality ({quality}%)
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {quality > 85 ? 'High Fidelity' : quality > 65 ? 'Balanced' : 'High Compression'}
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
            )}

            {/* Background Color for JPG */}
            {targetFormat === 'jpg' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Transparency Fill Color
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
            {targetFormat !== 'pdf' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Max Resolution Constraint
                </label>
                <select
                  value={maxWidth || 'original'}
                  onChange={(e) => {
                    const val = e.target.value
                    setMaxWidth(val === 'original' ? undefined : Number(val))
                  }}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="original">Original Full Resolution</option>
                  <option value="2560">2K QHD (2560px)</option>
                  <option value="1920">Full HD (1920px)</option>
                  <option value="1280">HD (1280px)</option>
                  <option value="800">Web Standard (800px)</option>
                </select>
              </div>
            )}

            {/* PDF Page Layout (when target is PDF) */}
            {targetFormat === 'pdf' && (
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  PDF Page Layout
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'fit', label: 'Fit to Image' },
                    { id: 'a4-portrait', label: 'A4 Portrait' },
                    { id: 'a4-landscape', label: 'A4 Landscape' },
                    { id: 'letter', label: 'US Letter' },
                  ].map((layout) => (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => setPageSize(layout.id as any)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        pageSize === layout.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {layout.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
            accept="image/*,.pdf"
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
                Drop images or click to select files
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Supports JPG, PNG, WebP, SVG, BMP and PDF extraction
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl pointer-events-none text-xs">
              Add Images
            </Button>
          </div>
        </div>

        {/* Items List */}
        {items.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Queued Files ({items.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ready to convert to {targetFormat.toUpperCase()}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs text-muted-foreground hover:text-destructive h-8"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear All
                </Button>
                <Button
                  onClick={handleConvertAll}
                  disabled={isProcessing}
                  size="sm"
                  className="rounded-xl gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" /> Convert All
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="relative rounded-xl border border-border bg-muted/20 p-3 flex flex-col justify-between gap-3 group hover:border-primary/40 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-lg bg-card border border-border/60 overflow-hidden flex items-center justify-center shrink-0">
                      {item.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatFileSize(item.originalSize)}
                        {item.convertedSize
                          ? ` → ${formatFileSize(item.convertedSize)}`
                          : ''}
                      </p>
                      {item.status === 'success' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                      {item.status === 'converting' && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold mt-1">
                          <Loader2 className="w-3 h-3 animate-spin" /> Converting
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                    {item.status === 'success' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownloadItem(item)}
                        className="h-7 text-xs rounded-lg gap-1"
                      >
                        <Download className="w-3 h-3" /> Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
