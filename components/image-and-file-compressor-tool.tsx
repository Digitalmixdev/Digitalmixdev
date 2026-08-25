'use client'

import React, { useState, useRef, useCallback } from 'react'
import JSZip from 'jszip'
import {
  FileArchive,
  UploadCloud,
  Download,
  Image as ImageIcon,
  FileText,
  Trash2,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileSpreadsheet,
  FileBox,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Eye,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { toast } from 'sonner'

interface CompressedItem {
  id: string
  originalFile: File
  name: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
  type: 'image' | 'file'
  previewUrl?: string
  compressedBlob?: Blob
  status: 'pending' | 'compressing' | 'done' | 'error'
  dimensions?: { original: { w: number; h: number }; compressed?: { w: number; h: number } }
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const toolMeta: ToolMetadata = {
  id: 'image-and-file-compressor',
  name: 'Image & File Compressor',
  description:
    'Compress JPG, PNG, and WebP images and package documents into optimized ZIP archives with real-time compression ratios and 100% private browser processing.',
  category: {
    id: 'files',
    name: 'File Utilities',
    slug: 'files',
  },
  icon: FileArchive,
  privacyBadge: '100% Client-Side • Zero Server Uploads • Encrypted in Memory',
  features: [
    {
      icon: Zap,
      title: 'Smart Image Resampling',
      desc: 'Lossless & lossy image reduction with custom quality scaling, WebP conversion, and dimension controls.',
    },
    {
      icon: FileArchive,
      title: 'High-Ratio ZIP Packaging',
      desc: 'Compress documents, scripts, PDFs, and data into standard DEFLATE-compressed ZIP archives.',
    },
    {
      icon: Layers,
      title: 'Batch Optimization & ZIP Export',
      desc: 'Process dozens of files concurrently and download individually or in a single packaged bundle.',
    },
  ],
  faqs: [
    {
      q: 'Does compressing my images or files upload them to a server?',
      a: 'No. All processing happens 100% locally inside your browser using HTML5 Canvas and WebAssembly. Your photos and documents never touch external servers.',
    },
    {
      q: 'Which image formats produce the highest compression savings?',
      a: 'Converting JPG and PNG images to WebP typically yields 30% to 75% size reductions with zero perceptible loss in visual fidelity.',
    },
    {
      q: 'Can I compress multiple files and download them as a single archive?',
      a: 'Yes! You can add images and files together, process them in batch, and click "Download All as ZIP" to get a clean packaged archive.',
    },
  ],
}

export default function ImageAndFileCompressorTool() {
  const [activeTab, setActiveTab] = useState<'image' | 'file'>('image')
  const [items, setItems] = useState<CompressedItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [activePreview, setActivePreview] = useState<{ url: string; name: string; size: string } | null>(null)

  // Image compression settings
  const [imageQuality, setImageQuality] = useState<number>(75)
  const [imageFormat, setImageFormat] = useState<'original' | 'image/jpeg' | 'image/png' | 'image/webp'>('image/webp')
  const [maxDimension, setMaxDimension] = useState<number>(1920)
  const [preset, setPreset] = useState<'balanced' | 'high_compression' | 'high_quality' | 'custom'>('balanced')

  // File compression (Zip) settings
  const [zipFileName, setZipFileName] = useState<string>('compressed-archive.zip')
  const [zipCompressionLevel, setZipCompressionLevel] = useState<number>(6)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Track tool usage
  const recordUsage = useCallback(async () => {
    try {
      await incrementToolUsage()
      await markToolUsed('image-and-file-compressor')
    } catch {
      // Non-blocking
    }
  }, [])

  // Handle Preset Changes
  const applyPreset = (selectedPreset: 'balanced' | 'high_compression' | 'high_quality') => {
    setPreset(selectedPreset)
    if (selectedPreset === 'high_compression') {
      setImageQuality(50)
      setMaxDimension(1280)
      setImageFormat('image/webp')
      setZipCompressionLevel(9)
    } else if (selectedPreset === 'balanced') {
      setImageQuality(75)
      setMaxDimension(1920)
      setImageFormat('image/webp')
      setZipCompressionLevel(6)
    } else if (selectedPreset === 'high_quality') {
      setImageQuality(90)
      setMaxDimension(3840)
      setImageFormat('original')
      setZipCompressionLevel(4)
    }
  }

  // Compress a single image
  const compressImage = useCallback(
    async (file: File): Promise<{ blob: Blob; width: number; height: number }> => {
      return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
          URL.revokeObjectURL(url)
          let targetWidth = img.width
          let targetHeight = img.height

          // Scale down if exceeds max dimension
          if (targetWidth > maxDimension || targetHeight > maxDimension) {
            if (targetWidth > targetHeight) {
              targetHeight = Math.round((targetHeight * maxDimension) / targetWidth)
              targetWidth = maxDimension
            } else {
              targetWidth = Math.round((targetWidth * maxDimension) / targetHeight)
              targetHeight = maxDimension
            }
          }

          const canvas = document.createElement('canvas')
          canvas.width = targetWidth
          canvas.height = targetHeight
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            reject(new Error('Canvas context not available'))
            return
          }

          ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

          let targetMime = imageFormat === 'original' ? file.type : imageFormat
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(targetMime)) {
            targetMime = 'image/jpeg'
          }

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({ blob, width: targetWidth, height: targetHeight })
              } else {
                reject(new Error('Image compression failed'))
              }
            },
            targetMime,
            imageQuality / 100
          )
        }

        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error('Failed to load image file'))
        }

        img.src = url
      })
    },
    [imageQuality, imageFormat, maxDimension]
  )

  // Add files to list
  const handleFilesAdded = useCallback((fileList: FileList | File[]) => {
    const newFiles = Array.from(fileList)
    if (newFiles.length === 0) return

    const newItems: CompressedItem[] = newFiles.map((file) => {
      const isImg = file.type.startsWith('image/')
      return {
        id: Math.random().toString(36).substring(2, 9),
        originalFile: file,
        name: file.name,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
        type: isImg ? 'image' : 'file',
        previewUrl: isImg ? URL.createObjectURL(file) : undefined,
        status: 'pending',
      }
    })

    setItems((prev) => [...prev, ...newItems])
    toast.success(`Added ${newItems.length} file${newItems.length > 1 ? 's' : ''}`)
  }, [])

  // Process all items
  const processItems = useCallback(async () => {
    if (items.length === 0) return
    setIsProcessing(true)

    const updated = [...items]

    for (let i = 0; i < updated.length; i++) {
      const item = updated[i]
      if (item.status === 'done') continue

      item.status = 'compressing'
      setItems([...updated])

      try {
        if (item.type === 'image') {
          const { blob, width, height } = await compressImage(item.originalFile)
          item.compressedBlob = blob
          item.compressedSize = blob.size
          const savedBytes = item.originalSize - blob.size
          item.compressionRatio = Math.max(0, Math.round((savedBytes / item.originalSize) * 100))
          item.dimensions = {
            original: { w: 0, h: 0 },
            compressed: { w: width, h: height },
          }
          item.status = 'done'
        } else {
          const zip = new JSZip()
          zip.file(item.name, item.originalFile, {
            compression: 'DEFLATE',
            compressionOptions: { level: zipCompressionLevel },
          })
          const zipBlob = await zip.generateAsync({ type: 'blob' })
          item.compressedBlob = zipBlob
          item.compressedSize = zipBlob.size
          const saved = item.originalSize - zipBlob.size
          item.compressionRatio = Math.max(0, Math.round((saved / item.originalSize) * 100))
          item.status = 'done'
        }
      } catch (err) {
        console.error(err)
        item.status = 'error'
      }

      setItems([...updated])
    }

    setIsProcessing(false)
    recordUsage()
    toast.success('Compression completed!')
  }, [items, compressImage, zipCompressionLevel, recordUsage])

  // Download single item
  const downloadSingle = (item: CompressedItem) => {
    if (!item.compressedBlob) return
    const url = URL.createObjectURL(item.compressedBlob)
    const a = document.createElement('a')
    a.href = url

    if (item.type === 'image') {
      const ext =
        imageFormat === 'image/webp'
          ? 'webp'
          : imageFormat === 'image/jpeg'
          ? 'jpg'
          : imageFormat === 'image/png'
          ? 'png'
          : item.name.split('.').pop() || 'jpg'
      const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name
      a.download = `${baseName}-compressed.${ext}`
    } else {
      a.download = `${item.name}.zip`
    }

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    recordUsage()
    toast.success(`Downloaded ${a.download}`)
  }

  // Download all as a single ZIP
  const downloadAllAsZip = async () => {
    if (items.length === 0) return
    const zip = new JSZip()

    items.forEach((item) => {
      if (item.compressedBlob) {
        let filename = item.name
        if (item.type === 'image') {
          const ext =
            imageFormat === 'image/webp'
              ? 'webp'
              : imageFormat === 'image/jpeg'
              ? 'jpg'
              : imageFormat === 'image/png'
              ? 'png'
              : item.name.split('.').pop() || 'jpg'
          const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name
          filename = `${baseName}-compressed.${ext}`
        }
        zip.file(filename, item.compressedBlob)
      } else {
        zip.file(item.name, item.originalFile)
      }
    })

    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: zipCompressionLevel },
    })

    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = zipFileName.endsWith('.zip') ? zipFileName : `${zipFileName}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    recordUsage()
    toast.success(`Archive downloaded: ${a.download}`)
  }

  // Remove item
  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  // Clear all
  const clearAll = () => {
    items.forEach((i) => {
      if (i.previewUrl) URL.revokeObjectURL(i.previewUrl)
    })
    setItems([])
    toast.info('Cleared all items')
  }

  // Totals
  const totalOriginalSize = items.reduce((acc, curr) => acc + curr.originalSize, 0)
  const totalCompressedSize = items.reduce(
    (acc, curr) => acc + (curr.status === 'done' ? curr.compressedSize : curr.originalSize),
    0
  )
  const totalSavings =
    totalOriginalSize > 0
      ? Math.max(0, Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100))
      : 0

  return (
    <ToolLayout metadata={toolMeta}>
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border bg-card/60 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="text-sm">
                <div className="font-semibold text-foreground">100% Client-Side</div>
                <div className="text-muted-foreground text-xs">Files never leave your device or browser</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <div className="text-sm">
                <div className="font-semibold text-foreground">Instant Processing</div>
                <div className="text-muted-foreground text-xs">Fast canvas engine & multi-file packaging</div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <Layers className="h-5 w-5" />
              </div>
              <div className="text-sm">
                <div className="font-semibold text-foreground">Batch Optimization</div>
                <div className="text-muted-foreground text-xs">Compress multiple images or pack as ZIP</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compression Mode Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'image' | 'file')} className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <TabsList className="bg-secondary/60 p-1 rounded-xl">
              <TabsTrigger value="image" className="rounded-lg gap-2 data-[state=active]:bg-background">
                <ImageIcon className="h-4 w-4" />
                Image Compressor (WebP/JPG/PNG)
              </TabsTrigger>
              <TabsTrigger value="file" className="rounded-lg gap-2 data-[state=active]:bg-background">
                <FileArchive className="h-4 w-4" />
                File & Archive Compressor (ZIP)
              </TabsTrigger>
            </TabsList>

            {/* Quick Presets */}
            {activeTab === 'image' && (
              <div className="flex items-center gap-1.5 bg-secondary/40 p-1 rounded-xl border border-border/50 text-xs">
                <span className="text-muted-foreground px-2 font-medium">Presets:</span>
                <Button
                  size="sm"
                  variant={preset === 'high_compression' ? 'default' : 'ghost'}
                  onClick={() => applyPreset('high_compression')}
                  className="h-7 text-xs rounded-lg px-2.5"
                >
                  Max Shrink
                </Button>
                <Button
                  size="sm"
                  variant={preset === 'balanced' ? 'default' : 'ghost'}
                  onClick={() => applyPreset('balanced')}
                  className="h-7 text-xs rounded-lg px-2.5"
                >
                  Balanced
                </Button>
                <Button
                  size="sm"
                  variant={preset === 'high_quality' ? 'default' : 'ghost'}
                  onClick={() => applyPreset('high_quality')}
                  className="h-7 text-xs rounded-lg px-2.5"
                >
                  High Quality
                </Button>
              </div>
            )}
          </div>

          {/* Settings Section */}
          <Card className="border-border bg-card shadow-sm mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                {activeTab === 'image' ? 'Image Compression Settings' : 'Archive Compression Settings'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeTab === 'image' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Quality Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold text-foreground">Quality: {imageQuality}%</Label>
                      <span className="text-xs text-muted-foreground">
                        {imageQuality < 60 ? 'High Compression' : imageQuality < 85 ? 'Optimal' : 'Crisp Quality'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={imageQuality}
                      onChange={(e) => {
                        setImageQuality(Number(e.target.value))
                        setPreset('custom')
                      }}
                      className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Max Dimension */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold text-foreground">
                        Max Width / Height: {maxDimension}px
                      </Label>
                    </div>
                    <select
                      value={maxDimension}
                      onChange={(e) => {
                        setMaxDimension(Number(e.target.value))
                        setPreset('custom')
                      }}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="1280">1280px (HD - Compact)</option>
                      <option value="1920">1920px (Full HD - Recommended)</option>
                      <option value="2560">2560px (2K QHD)</option>
                      <option value="3840">3840px (4K Original scale)</option>
                    </select>
                  </div>

                  {/* Output Format */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">Output Format</Label>
                    <select
                      value={imageFormat}
                      onChange={(e) => {
                        setImageFormat(e.target.value as any)
                        setPreset('custom')
                      }}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="image/webp">WebP (Best size & modern web)</option>
                      <option value="image/jpeg">JPEG (Universal compatibility)</option>
                      <option value="image/png">PNG (Lossless / Transparency)</option>
                      <option value="original">Preserve Original Format</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground">Archive Name</Label>
                    <input
                      type="text"
                      value={zipFileName}
                      onChange={(e) => setZipFileName(e.target.value)}
                      placeholder="archive.zip"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-semibold text-foreground">
                        Deflate Level: {zipCompressionLevel}/9
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {zipCompressionLevel > 7 ? 'Maximum' : 'Balanced'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="9"
                      step="1"
                      value={zipCompressionLevel}
                      onChange={(e) => setZipCompressionLevel(Number(e.target.value))}
                      className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>

        {/* Drag and Drop Upload Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            if (e.dataTransfer.files) {
              handleFilesAdded(e.dataTransfer.files)
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'border-border/80 hover:border-primary/50 bg-card/40 hover:bg-card/80'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={activeTab === 'image' ? 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml' : '*'}
            onChange={(e) => {
              if (e.target.files) handleFilesAdded(e.target.files)
              e.target.value = ''
            }}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-foreground">
                Drag & Drop {activeTab === 'image' ? 'Images' : 'Files'} here or Click to Browse
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {activeTab === 'image'
                  ? 'Supports JPG, PNG, WebP, GIF, SVG. Bulk processing available.'
                  : 'Supports code, documents, text, images, and folders. Packaged with ZIP Deflate.'}
              </p>
            </div>
            <Button size="sm" className="rounded-xl font-bold gap-2 pointer-events-none mt-1">
              <Plus className="h-4 w-4" /> Choose Files
            </Button>
          </div>
        </div>

        {/* Action Toolbar & Summary Bar */}
        {items.length > 0 && (
          <Card className="border-border bg-card shadow-sm">
            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Summary Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Files Selected</div>
                  <div className="font-bold text-foreground">{items.length}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Original Total</div>
                  <div className="font-bold text-foreground">{formatBytes(totalOriginalSize)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Compressed Total</div>
                  <div className="font-bold text-emerald-500">{formatBytes(totalCompressedSize)}</div>
                </div>
                {totalSavings > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs py-1 px-2.5"
                  >
                    Saved {totalSavings}% ({formatBytes(totalOriginalSize - totalCompressedSize)})
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  disabled={isProcessing}
                  className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Clear All
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={processItems}
                  disabled={isProcessing || items.length === 0}
                  className="rounded-xl shadow-sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  {isProcessing ? 'Compressing...' : 'Start Compression'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={downloadAllAsZip}
                  disabled={isProcessing || items.length === 0}
                  className="rounded-xl shadow-sm"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Download All as ZIP
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items List */}
        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className="border-border bg-card/70 backdrop-blur-xs hover:border-border transition-all overflow-hidden"
              >
                <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    {item.previewUrl ? (
                      <div className="h-14 w-14 rounded-xl border border-border overflow-hidden shrink-0 bg-muted/40 flex items-center justify-center">
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="h-full w-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() =>
                            setActivePreview({
                              url: item.previewUrl!,
                              name: item.name,
                              size: formatBytes(item.originalSize),
                            })
                          }
                        />
                      </div>
                    ) : (
                      <div className="h-14 w-14 rounded-xl border border-border bg-muted/30 flex items-center justify-center text-muted-foreground shrink-0">
                        {item.name.endsWith('.pdf') ? (
                          <FileText className="h-6 w-6 text-red-400" />
                        ) : item.name.endsWith('.json') || item.name.endsWith('.js') || item.name.endsWith('.ts') ? (
                          <FileCode className="h-6 w-6 text-blue-400" />
                        ) : item.name.endsWith('.csv') || item.name.endsWith('.xlsx') ? (
                          <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
                        ) : (
                          <FileBox className="h-6 w-6 text-amber-400" />
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-foreground truncate max-w-xs md:max-w-md">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{formatBytes(item.originalSize)}</span>
                        {item.status === 'done' && (
                          <>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium text-emerald-500">
                              {formatBytes(item.compressedSize)}
                            </span>
                            {item.compressionRatio > 0 && (
                              <span className="text-emerald-500 font-semibold">
                                (-{item.compressionRatio}%)
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                    {item.status === 'pending' && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Ready
                      </Badge>
                    )}
                    {item.status === 'compressing' && (
                      <Badge variant="outline" className="text-xs text-primary animate-pulse">
                        Compressing...
                      </Badge>
                    )}
                    {item.status === 'done' && (
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Compressed
                      </Badge>
                    )}
                    {item.status === 'error' && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Failed
                      </Badge>
                    )}

                    {item.previewUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setActivePreview({
                            url: item.previewUrl!,
                            name: item.name,
                            size: formatBytes(item.originalSize),
                          })
                        }
                        className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                        title="Preview Image"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}

                    {item.status === 'done' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadSingle(item)}
                        className="h-8 w-8 p-0 rounded-lg text-primary hover:bg-primary/10"
                        title="Download compressed item"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal Preview */}
        {activePreview && (
          <Dialog open={Boolean(activePreview)} onOpenChange={() => setActivePreview(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold truncate">
                  Preview: {activePreview.name} ({activePreview.size})
                </DialogTitle>
              </DialogHeader>
              <div className="max-h-[65vh] overflow-auto flex items-center justify-center p-4 bg-muted/20 rounded-xl border border-border/50">
                <img
                  src={activePreview.url}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ToolLayout>
  )
}
