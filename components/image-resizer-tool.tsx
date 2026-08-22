"use client"

import React, { useState, useEffect } from "react"
import { useTheme } from 'next-themes'
import {
  Trash2,
  Download,
  UploadCloud,
  ShieldCheck,
  Zap,
  HelpCircle,
  LayoutDashboard,
  Menu,
  X,
  Star,
  Sun,
  Moon,
  Eye,
  Code,
  Layers,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Loader2,
  Maximize2,
  Sliders,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { isFavoriteTool, toggleFavoriteTool } from '@/actions/favorites'
import { useRouter } from 'next/navigation'

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

export default function ImageResizerTool() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(false)
  const [mounted, setMounted] = useState(false)  

  const [images, setImages] = useState<ImageFileItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [isGridExpanded, setIsGridExpanded] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // إعدادات التحكم الجماعي (Global Controls)
  const [globalWidth, setGlobalWidth] = useState<number>(800)
  const [globalHeight, setGlobalHeight] = useState<number>(600)
  const [maintainRatio, setMaintainRatio] = useState(true)
  const [globalQuality, setGlobalQuality] = useState<number>(80)
  const [outputFormat, setOutputFormat] = useState<string>("image/jpeg")

  // حالة النافذة المنبثقة للمعاينة بدقة كاملة ومقاس حقيقي (متوافقة مع الموبايل)
  const [activePreview, setActivePreview] = useState<{ url: string; width: number; height: number; name: string } | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  const handleToggleFavorite = async () => {
    const nextFavorite = !isFavorite
    setIsFavorite(nextFavorite)
    try {
      await toggleFavoriteTool("image-resizer-tool")
      router.refresh()
    } catch (error) {
      setIsFavorite(!nextFavorite)
      console.error("Error toggling favorite:", error)
    }
  }

  const handleUsageStats = async () => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed("image-resizer-tool")
      ])
    } catch (error) {
      console.error("Error updating stats:", error)
    }
  }

  useEffect(() => {
    setMounted(true)
    const loadFavorite = async () => {
      const favorite = await isFavoriteTool("image-resizer-tool")
      setIsFavorite(favorite)
    }
    loadFavorite()
  }, [])

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
                rawFile: file
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
    setIsGridExpanded(true)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFileSelection(e.dataTransfer.files)
    }
  }

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter(img => img.id !== id))
  }

  // تحديث المقاسات لكل صورة عند تغيير الإعدادات العامة
  useEffect(() => {
    setImages((prev) =>
      prev.map((img) => {
        const nextWidth = globalWidth
        const nextHeight = maintainRatio ? Math.round(nextWidth / img.aspectRatio) : globalHeight
        return { ...img, targetWidth: nextWidth, targetHeight: nextHeight }
      })
    )
  }, [globalWidth, globalHeight, maintainRatio])

  // توليد المعاينة الحية بالمقاس الجديد ومحاكاتها قبل التحميل
  const generateLivePreview = async (imgItem: ImageFileItem) => {
    setIsPreviewLoading(true)
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      const img = new Image()
      await new Promise((resolve) => {
        img.onload = resolve
        img.src = imgItem.previewUrl
      })

      canvas.width = imgItem.targetWidth
      canvas.height = imgItem.targetHeight

      if (ctx) {
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, imgItem.targetWidth, imgItem.targetHeight)
        
        const generatedDataUrl = canvas.toDataURL(outputFormat, globalQuality / 100)
        setActivePreview({
          url: generatedDataUrl,
          width: imgItem.targetWidth,
          height: imgItem.targetHeight,
          name: imgItem.name
        })
      }
    } catch (err) {
      console.error("Error rendering live preview", err)
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleProcessImages = async () => {
    if (images.length === 0) return
    setIsProcessing(true)

    try {
      for (const imgItem of images) {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        const img = new Image()
        await new Promise((resolve) => {
          img.onload = resolve
          img.src = imgItem.previewUrl
        })

        canvas.width = imgItem.targetWidth
        canvas.height = imgItem.targetHeight

        if (ctx) {
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, imgItem.targetWidth, imgItem.targetHeight)

          const fileExtension = outputFormat.split('/')[1]
          const cleanedName = imgItem.name.replace(/\.[^/.]+$/, "")
          
          const dataUrl = canvas.toDataURL(outputFormat, globalQuality / 100)
          const link = document.createElement('a')
          link.href = dataUrl
          link.download = `digitalmix-${cleanedName}-${imgItem.targetWidth}x${imgItem.targetHeight}.${fileExtension}`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      }
      await handleUsageStats()
    } catch (error) {
      console.error(error)
      alert("Failed to process image optimization pipeline.")
    } finally {
      setIsProcessing(false)
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
                <Maximize2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground leading-none">DigitalMix</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Advanced Image Lab</span>
              </div>
            </Link>

            <div className="flex items-center gap-2 shrink-0">
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              )}
              
              <Button
                variant="ghost"
                className={`hidden sm:flex gap-2 font-medium h-9 px-3 ${isFavorite ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-foreground"}`}
                onClick={handleToggleFavorite}
              >
                <Star className={`h-4 w-4 ${isFavorite ? "fill-amber-500 text-amber-500" : ""}`} />
                {isFavorite ? "Favorited" : "Favorite"}
              </Button>

              <Button asChild variant="ghost" className="hidden sm:flex text-muted-foreground hover:text-foreground">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              </Button>

              <Button variant="ghost" size="icon" className="sm:hidden text-muted-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl p-4 space-y-2">
            <Button variant="ghost" className={`w-full justify-start gap-2 ${isFavorite ? "text-amber-500 hover:text-amber-600" : "text-foreground"}`} onClick={handleToggleFavorite}>
              <Star className={`h-4 w-4 ${isFavorite ? "fill-amber-500 text-amber-500" : ""}`} /> {isFavorite ? "Favorited" : "Favorite"}
            </Button>
            <Button asChild variant="ghost" className="w-full text-foreground justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
              <Link href="/dashboard"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
            </Button>
          </div>
        )}
      </header>

      {/* Hero Workspace Section */}
      <div className="py-10 px-4 text-center bg-gradient-to-b from-primary/5 to-transparent">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium mb-4">
          <ShieldCheck className="h-3.5 w-3.5" /> 100% Secure Local Image Optimization Hub
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">
          Free Image Resizer & Converter Tool Online
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Resize, compress, and re-format bulk images instantly inside your device memory. No server uploads, zero quality compromise, maximum processing privacy.
        </p>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Drag & Drop Area */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`p-10 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer ${dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border bg-card hover:border-border/80'}`}
          onClick={() => document.getElementById('image-input')?.click()}
        >
          <input id="image-input" type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileSelection(e.target.files)} />
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center border border-border">
              <UploadCloud className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Drag & drop your images here, or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Supports PNG, JPG, WebP, SVG, and GIF processing</p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        {images.length > 0 && (
          <div className="mt-8 bg-card border border-border rounded-xl p-5 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground border-b border-border pb-2">
              <Settings className="h-4 w-4 text-primary" />
              <span>Global Dimension & Format Pipeline Settings</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground font-mono">Width (px)</label>
                <input type="number" value={globalWidth} onChange={(e) => setGlobalWidth(Number(e.target.value))} className="w-full bg-secondary border border-border h-9 px-3 rounded-md text-xs font-semibold focus:outline-none focus:border-primary" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground font-mono">Height (px)</label>
                <input type="number" disabled={maintainRatio} value={maintainRatio ? "" : globalHeight} onChange={(e) => setGlobalHeight(Number(e.target.value))} placeholder={maintainRatio ? "Auto Ratio" : ""} className="w-full bg-secondary border border-border h-9 px-3 rounded-md text-xs font-semibold focus:outline-none focus:border-primary disabled:opacity-50" />
              </div>

              <div className="space-y-1.5 flex items-center h-9">
                <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none">
                  <input type="checkbox" checked={maintainRatio} onChange={(e) => setMaintainRatio(e.target.checked)} className="rounded border-border bg-secondary text-primary focus:ring-0" />
                  Lock Aspect Ratio
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground font-mono">Output Format</label>
                <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="w-full bg-secondary border border-border h-9 px-2 rounded-md text-xs font-semibold focus:outline-none focus:border-primary">
                  <option value="image/jpeg">JPEG (Optimized)</option>
                  <option value="image/png">PNG (Lossless)</option>
                  <option value="image/webp">WebP (Next-Gen)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground font-mono">Quality: {globalQuality}%</label>
                <input type="range" min="10" max="100" value={globalQuality} onChange={(e) => setGlobalQuality(Number(e.target.value))} className="w-full h-9 accent-primary" />
              </div>
            </div>
          </div>
        )}

        {/* Visual Images Grid Layout */}
        {images.length > 0 && (
          <div className="mt-10 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <button onClick={() => setIsGridExpanded(!isGridExpanded)} className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 hover:text-foreground transition-colors">
                <Eye className="h-4 w-4 text-primary" />
                Image Batch Sequencer ({images.length} Files Loaded)
                {isGridExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </button>
              <button onClick={() => setImages([])} className="text-xs text-destructive hover:underline font-medium">Remove All Images</button>
            </div>

            {isGridExpanded && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img) => (
                  <div key={img.id} className="group relative border border-border rounded-xl bg-card p-3 shadow-sm flex flex-col justify-between transition-all hover:border-primary hover:shadow-md">
                    
                    {/* أزرار التحكم بالصورة الفردية - تظهر في الموبايل دائماً وفي الديسكتوب عند التمرير الفأري */}
                    <div className="absolute top-2 right-2 z-10 flex gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => generateLivePreview(img)} 
                        title="Live Preview Resized Output"
                        className="bg-primary text-primary-foreground p-1.5 rounded-md shadow hover:bg-primary/90"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={() => removeImage(img.id)} 
                        className="bg-destructive text-destructive-foreground p-1.5 rounded-md shadow hover:bg-destructive/90"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <div className="aspect-[4/3] w-full bg-secondary/30 dark:bg-zinc-900 rounded-lg overflow-hidden border border-border/50 flex items-center justify-center relative mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.previewUrl} alt={img.name} className="w-full h-full object-contain select-none pointer-events-none" />
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] min-w-0">
                        <p className="font-semibold truncate text-foreground" title={img.name}>{img.name}</p>
                        <p className="text-muted-foreground font-mono mt-0.5 text-[10px]">Orig: {img.originalWidth}x{img.originalHeight}px</p>
                        <p className="text-primary font-mono text-[10px] font-bold">Target: {img.targetWidth}x{img.targetHeight}px</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-border/40">
              <Button disabled={images.length === 0 || isProcessing} onClick={handleProcessImages} className="w-full sm:w-auto h-11 px-6 font-semibold gap-2 shadow-sm text-sm">
                {isProcessing ? <><Loader2 className="h-4 w-4 animate-spin" /> Rendering Canvas Buffers...</> : <><Download className="h-4 w-4" /> Export Resized Batch Files</>}
              </Button>
            </div>
          </div>
        )}

        {/* 🌟 نافذة المعاينة المنبثقة الحية الشاملة للموبايل والديسكتوب (Mobile-Responsive Live Preview Modal) */}
        {activePreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-card border-0 sm:border border-border w-full h-full sm:h-auto sm:max-w-2xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl relative flex flex-col justify-between sm:max-h-[90vh]">
              
              {/* زر الإغلاق العلوي */}
              <button 
                onClick={() => setActivePreview(null)} 
                className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              {/* تفاصيل الصورة */}
              <div className="mb-4 mt-8 sm:mt-0">
                <h3 className="text-sm font-bold truncate pr-10">Live Target Output Preview</h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Rendering Matrix: <span className="text-primary font-bold">{activePreview.width} x {activePreview.height} px</span> ({outputFormat.split('/')[1].toUpperCase()})
                </p>
              </div>

              {/* منطقة عرض المقاس الحقيقي الفعلي (قابلة للتمرير واللمس على الموبايل) */}
              <div className="flex-1 overflow-auto bg-secondary/30 dark:bg-zinc-950/80 border border-border/40 rounded-xl p-2 flex items-center justify-center min-h-[300px] h-full sm:max-h-[55vh] my-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={activePreview.url} 
                  alt="Live canvas rendering output" 
                  className="max-w-full max-h-full object-contain shadow-md rounded border border-border/40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxlPSIjZWVlIi8+CjxyZWN0IHg9IjQiIHk9IjQiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNlZWUiLz4KPC9zdmc+')] bg-repeat"
                />
              </div>

              {/* أزرار التحكم السفلية - ملائمة جداً للمس في الهواتف */}
              <div className="mt-4 pt-3 border-t border-border/40 flex flex-col sm:flex-row justify-end gap-2">
                <Button variant="secondary" onClick={() => setActivePreview(null)} className="h-10 sm:h-9 text-xs order-2 sm:order-1">
                  Close Preview
                </Button>
                <Button asChild className="h-10 sm:h-9 text-xs font-semibold order-1 sm:order-2">
                  <a href={activePreview.url} download={`preview-${activePreview.width}x${activePreview.height}-${activePreview.name}`}>
                    <Download className="h-4 w-4 sm:h-3.5 sm:w-3.5 mr-1.5" /> Download Individually
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        <hr className="my-16 border-border/60" />

        {/* أقسام Why Use, How To, FAQs, Related Tools المعتادة */}
        <div className="space-y-16 text-left max-w-4xl mx-auto">
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Why Use This Tool?</h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">Discover how DigitalMix revolutionizes asset optimization workflows directly in your local environment.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-border bg-card/50 space-y-3 transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 group">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><ShieldCheck className="h-5 w-5" /></div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">100% Local Sandbox</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">We use browser-native canvas extraction algorithms. Your confidential screenshots, raw mockups, and corporate media files never touch any network database.</p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card/50 space-y-3 transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 group">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Sliders className="h-5 w-5" /></div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Granular Batch Manipulation</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">No need to manage files individually. Apply universal scale properties, maintain precise aspect limits, adjust compression density, and configure destination encoders on the fly.</p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card/50 space-y-3 transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 group">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Zap className="h-5 w-5" /></div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Zero Loading Congestion</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Bypass slow file handshakes. Hardware-accelerated processing engine guarantees rapid multi-format rendering across any browser pipeline setup.</p>
              </div>
            </div>
          </section>

          <hr className="border-border/40" />

          <section className="bg-secondary/40 border border-border rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">How to Bulk Resize & Format Images</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center sm:text-left">
              <div className="space-y-1">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-1">1</span>
                <h4 className="text-xs font-bold text-foreground">Import Media</h4>
                <p className="text-[11px] text-muted-foreground leading-normal">Drop or upload your target batch photos directly into the active matrix area.</p>
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-1">2</span>
                <h4 className="text-xs font-bold text-foreground">Set Vectors</h4>
                <p className="text-[11px] text-muted-foreground leading-normal">Enter target pixels or lock aspect constraints to configure resolution steps uniformly.</p>
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-1">3</span>
                <h4 className="text-xs font-bold text-foreground">Tune Encoders</h4>
                <p className="text-[11px] text-muted-foreground leading-normal">Pick your export layout system (JPEG, PNG, WebP) and assign compression thresholds.</p>
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-1">4</span>
                <h4 className="text-xs font-bold text-foreground">Download Batch</h4>
                <p className="text-[11px] text-muted-foreground leading-normal">Trigger export to render and save your custom asset structures instantly.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold tracking-tight text-center md:text-left">Frequently Asked Questions</h3>
            <div className="space-y-3">
              <div className="border border-border rounded-lg bg-card p-4 space-y-1.5">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2"><span className="text-primary font-mono text-xs">Q.</span> Are my photos sent to an external server for processing?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed pl-5">Never. DigitalMix executes all sampling, cropping, and vector mutations locally via hardware-linked client scripts inside your application instance.</p>
              </div>
              <div className="border border-border rounded-lg bg-card p-4 space-y-1.5">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2"><span className="text-primary font-mono text-xs">Q.</span> Does altering sizes break the image aspect ratios?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed pl-5">By default, the pipeline locks proportional metrics to avoid compression stretching. You can disable this checkbox to manipulate specific, independent dimensions.</p>
              </div>
              <div className="border border-border rounded-lg bg-card p-4 space-y-1.5">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2"><span className="text-primary font-mono text-xs">Q.</span> Is there a file limit on asset processing?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed pl-5">Since work happens directly within the browser tab runtime memory sandbox, performance relies entirely on local device computing limits rather than network capacity constraints.</p>
              </div>
            </div>
          </section>
        </div>

        {/* Related Tools */}
        <div className="max-w-7xl mx-auto px-4 py-8 border-t border-border/60 mt-16">
          <h3 className="text-sm font-bold text-center mb-6 text-muted-foreground uppercase tracking-widest">Optimized Developer Validation Modules</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Link href="/tools/sql-formatter" className="p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all text-center flex flex-col items-center justify-center gap-3 group min-h-[140px]">
              <Code className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="space-y-1">
                <span className="block text-sm font-bold text-foreground group-hover:text-primary">SQL Query Beautifier</span>
                <p className="text-[11px] text-muted-foreground max-w-[240px] mx-auto leading-normal">Clean, format, and enforce UPPERCASE casing syntax on raw query lines.</p>
              </div>
            </Link>

            <Link href="/tools/pdf-merge" className="p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all text-center flex flex-col items-center justify-center gap-3 group min-h-[140px]">
              <Layers className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="space-y-1">
                <span className="block text-sm font-bold text-foreground group-hover:text-primary">PDF Merger & Organizer</span>
                <p className="text-[11px] text-muted-foreground max-w-[240px] mx-auto leading-normal">Merge PDF files, reorder pages, and organize documents</p>
              </div>
            </Link>

            <Link href="/tools/kpi-calculator" className="p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all text-center flex flex-col items-center justify-center gap-3 group min-h-[140px]">
              <BarChart3 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="space-y-1">
                <span className="block text-sm font-bold text-foreground group-hover:text-primary">Business KPI Calculators</span>
                <p className="text-[11px] text-muted-foreground max-w-[240px] mx-auto leading-normal">Institutional KPI Calculator Suite and e-commerce cohort metrics analysis.</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}