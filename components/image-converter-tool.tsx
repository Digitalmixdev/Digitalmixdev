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
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import {
  convertSingleImage,
  decodeFileToCanvas,
  imagesToPdf,
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
  description:
    'Convert between 14 professional image formats: AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, and XPS with 100% in-browser privacy.',
  category: {
    id: 'files',
    name: 'File Utilities',
    slug: 'files',
  },
  icon: ImageIcon,
  privacyBadge: '100% Client-Side • In-Memory Processing • Zero Server Uploads',
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
  faqs: [
    {
      q: 'Which image formats are supported?',
      a: 'You can convert to and from all 15 formats: PDF, AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, and XPS.',
    },
    {
      q: 'Can I combine multiple images into a single PDF document?',
      a: 'Yes! Select multiple images at once and use the "Merge All into 1 PDF" button to package all your images into a high-quality multi-page PDF.',
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
        toast.warning(`Skipped "${f.name}": PDF files belong in Document Converter or PDF Merger.`)
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
    toast.success(`All conversions to ${targetFormat.toUpperCase()} completed!`)

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
    toast.success(`Downloaded ${downloadName}`)
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
    toast.success('Downloaded all converted files as ZIP!')
  }

  const handleMergeAllToPdf = async () => {
    if (items.length === 0) {
      toast.error('Please upload images to combine into PDF')
      return
    }

    try {
      toast.info('Assembling images into a single PDF document...')
      const files = items.map((it) => it.file)
      const pdfBlob = await imagesToPdf(files, { pageSize: 'fit' })
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `combined-images-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Generated PDF with ${items.length} images!`)
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to create PDF from images')
    }
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
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Configuration Panel */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Target Image Format (14 Formats)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select your target format from the full matrix below to convert your graphics
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs w-fit text-primary border-primary/30">
                <Sparkles className="w-3 h-3 mr-1" /> 14 Formats Supported
              </Badge>
            </div>
          </div>

          {/* 14 Formats Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Convert To ({filteredFormats.length} Available)
              </label>
              {selectedFormatDef && (
                <span className="text-xs text-primary font-medium">
                  Active: <strong className="font-bold">{selectedFormatDef.name}</strong> ({selectedFormatDef.description})
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
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
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
            ) : (
              <div className="space-y-1 text-xs text-muted-foreground flex flex-col justify-center">
                <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">Encoding Mode</span>
                <p className="text-muted-foreground text-xs mt-1">
                  Format <span className="font-bold text-foreground">{targetFormat.toUpperCase()}</span> uses lossless & structured container compression.
                </p>
              </div>
            )}

            {/* Background Color for Opaque formats */}
            {['jpg', 'bmp', 'eps', 'ps'].includes(targetFormat) && (
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
                <option value="512">Icon / Avatar (512px)</option>
                <option value="256">Small Icon (256px)</option>
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
                Drop multiple images or click to select files
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select one or multiple images (PDF, JPG, PNG, WEBP, AVIF, PSD, TIFF, EPS, ICO, ICNS, BMP, XPS)
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl pointer-events-none text-xs">
              Select Image Files (Multi-Select Enabled)
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
                  Ready to convert to <strong className="text-foreground">{targetFormat.toUpperCase()}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs text-muted-foreground hover:text-destructive h-8"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear All
                </Button>

                {items.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMergeAllToPdf}
                    className="text-xs h-9 rounded-xl gap-1.5 border-primary/40 hover:bg-primary/5 text-primary"
                    title="Merge all selected images into a single multi-page PDF"
                  >
                    <Layers className="w-3.5 h-3.5" /> Merge All into 1 PDF
                  </Button>
                )}

                {items.some((it) => it.status === 'success') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAllZip}
                    className="text-xs h-9 rounded-xl gap-1.5"
                  >
                    <FileArchive className="w-3.5 h-3.5" /> Download ZIP
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
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Converting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" /> Convert All to {targetFormat.toUpperCase()}
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
                        title="Click to preview"
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
                              <ArrowRight className="w-3 h-3 text-muted-foreground/60" />
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
                              <CheckCircle2 className="w-3 h-3" /> Converted ({targetFormat.toUpperCase()})
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
                            <Loader2 className="w-3 h-3 animate-spin" /> Processing
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-destructive font-semibold mt-1 truncate">
                            {item.error || 'Failed'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 gap-2">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        Remove
                      </button>

                      <div className="flex items-center gap-1.5">
                        {/* Preview Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openPreview(item)}
                          className="h-7 text-xs px-2 rounded-lg gap-1 text-muted-foreground hover:text-foreground"
                          title="Preview Result"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Preview</span>
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
          <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden border-border bg-card">
            {previewItem && (
              <>
                {/* Modal Header */}
                <DialogHeader className="p-4 sm:p-5 border-b border-border bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
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
                        ? `Converted to ${targetFormat.toUpperCase()} (${formatFileSize(previewItem.convertedSize || 0)})`
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
                        Converted ({targetFormat.toUpperCase()})
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
                      Original
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
                        <Columns className="w-3 h-3" /> Side-by-Side
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
                          Preview will appear here once converted.
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
                          No preview available.
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
                          Original ({formatFileSize(previewItem.originalSize)})
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
                            Converted {targetFormat.toUpperCase()} ({formatFileSize(previewItem.convertedSize || 0)})
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
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-card/90 backdrop-blur-sm border border-border p-1 rounded-xl shadow-md">
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        title="Zoom Out"
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
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setZoomLevel(1)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        title="Reset Zoom"
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
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {currentPreviewIndex + 1} of {convertedItems.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPreview}
                      disabled={currentPreviewIndex >= convertedItems.length - 1}
                      className="h-8 text-xs rounded-xl gap-1"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
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
                        <Download className="w-3.5 h-3.5" /> Download .{targetFormat.toUpperCase()} ({formatFileSize(previewItem.convertedSize || 0)})
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
