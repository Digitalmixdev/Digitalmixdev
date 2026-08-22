"use client"

import React, { useState, useEffect, useRef } from "react"
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
  Layers,
  Maximize2,
  Binary,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Loader2,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { PDFDocument } from 'pdf-lib'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { isFavoriteTool, toggleFavoriteTool } from '@/actions/favorites'
import { useRouter } from 'next/navigation'

interface PDFPageItem {
  id: string
  sourceFileName: string
  fileIndex: number
  pageIndex: number
  rawFile: File
  thumbnailUrl: string
}

interface LazyPageCardProps {
  page: PDFPageItem
  index: number
  removePage: (id: string) => void
  movePage: (index: number, direction: 'forward' | 'backward') => void
  isFirst: boolean
  isLast: boolean
  onRenderComplete: (pageId: string, url: string) => void
}

function LazyPageCard({ page, index, removePage, movePage, isFirst, isLast, onRenderComplete }: LazyPageCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isRendering, setIsRendering] = useState(false)

  useEffect(() => {
    if (page.thumbnailUrl) return

    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && !page.thumbnailUrl && !isRendering) {
          setIsRendering(true)
          try {
            const pdfjsLib = await import('pdfjs-dist')
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
              'pdfjs-dist/build/pdf.worker.mjs',
              import.meta.url
            ).toString()

            const arrayBuffer = await page.rawFile.arrayBuffer()

            // 1. الإعدادات القصوى لفك التشفير وتخطي أخطاء الصور الممسوحة ضوئياً
            const loadingTask = pdfjsLib.getDocument({
              data: arrayBuffer,
              cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
              cMapPacked: true,
              disableFontFace: false, // السماح بتحميل الخطوط المدمجة
              isEvalSupported: text => true // تفعيل مفسر الأكواد الداخلية للـ PDF
            })

            const pdf = await loadingTask.promise
            const pdfPage = await pdf.getPage(page.fileIndex)

            // ضبط الـ scale على 0.35 ليكون متوازناً جداً
            const viewport = pdfPage.getViewport({ scale: 0.35 })

            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')

            if (context) {
              canvas.height = viewport.height
              canvas.width = viewport.width

              // 2. حل مشكلة الصور الشفافة والممسوحة: تهيئة الـ Canvas بخلفية بيضاء صريحة
              context.fillStyle = '#FFFFFF'
              context.fillRect(0, 0, canvas.width, canvas.height)

              context.imageSmoothingEnabled = true
              context.imageSmoothingQuality = 'high'

              // 3. تشغيل الرندرة مع تفعيل بارامترات التوافقية العالية
              const renderContext = {
                canvasContext: context,
                viewport: viewport,
                intent: 'display' // إجبار المكتبة على وضع العرض البصري الكامل
              }

              try {
                await pdfPage.render(renderContext).promise
              } catch (renderError) {
                console.warn("Standard render failed, trying fallback...", renderError)
                // Fallback: إذا فشل الرسم عالي الجودة، نرسم بدون إعدادات متقدمة لضمان الظهور
                await pdfPage.render({ canvasContext: context, viewport: viewport }).promise
              }

              const url = canvas.toDataURL('image/jpeg', 0.6)
              onRenderComplete(page.id, url)
            }
          } catch (err) {
            console.error("Error rendering on-screen page:", err)
          } finally {
            setIsRendering(false)
          }
        }
      },
      { rootMargin: '300px 0px', threshold: 0.01 } // قمنا بزيادة الـ rootMargin لـ 300px ليعطي المتصفح وقتاً أطول للرندرة قبل وصول العين
    )

    if (cardRef.current) observer.observe(cardRef.current)

    return () => {
      if (cardRef.current) observer.unobserve(cardRef.current)
    }
  }, [page, isRendering, onRenderComplete])

  return (
    <div
      ref={cardRef}
      className="group relative border border-border rounded-xl bg-card p-3 shadow-sm flex flex-col justify-between transition-all hover:border-primary hover:shadow-md"
    >
      <span className="absolute top-2 left-2 z-10 bg-background/90 backdrop-blur border border-border text-[10px] font-mono px-2 py-0.5 rounded-md font-bold text-foreground">
        #{index + 1}
      </span>

      <button
        onClick={() => removePage(page.id)}
        className="absolute top-2 right-2 z-10 bg-destructive text-destructive-foreground p-1.5 rounded-md shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
        title="Delete this page"
      >
        <Trash2 className="h-3 w-3" />
      </button>

      <div className="aspect-[3/4] w-full bg-secondary/30 dark:bg-zinc-900 rounded-lg overflow-hidden border border-border/50 flex items-center justify-center relative mb-3 shadow-inner">
        {page.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.thumbnailUrl}
            alt={`Page ${page.fileIndex}`}
            className="w-full h-full object-contain select-none pointer-events-none animate-in fade-in duration-300"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground text-[10px] font-mono">
            <Loader2 className="h-4 w-4 animate-spin text-primary/70" />
            <span>On-Demand Preview</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-[11px] min-w-0">
          <p className="font-semibold truncate text-foreground" title={page.sourceFileName}>
            {page.sourceFileName}
          </p>
          <p className="text-muted-foreground font-mono mt-0.5 text-[10px]">Orig Page: {page.fileIndex}</p>
        </div>

        <div className="grid grid-cols-2 gap-1 border-t border-border/40 pt-2">
          <button
            disabled={isFirst}
            onClick={() => movePage(index, 'backward')}
            className="text-[10px] py-1 bg-secondary hover:bg-secondary/80 rounded font-medium disabled:opacity-40 transition-colors"
          >
            ◀ Move
          </button>
          <button
            disabled={isLast}
            onClick={() => movePage(index, 'forward')}
            className="text-[10px] py-1 bg-secondary hover:bg-secondary/80 rounded font-medium disabled:opacity-40 transition-colors"
          >
            Move ▶
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PDFMergeTool() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(false)
  const [mounted, setMounted] = useState(false)  

  const [pages, setPages] = useState<PDFPageItem[]>([])
  const [isLoadingPages, setIsLoadingPages] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [isGridExpanded, setIsGridExpanded] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)


  const [progressCurrent, setProgressCurrent] = useState(0)
  const [progressTotal, setProgressTotal] = useState(0)

  // المرجع الخاص بالـ AbortController للتحكم بالإلغاء الفوري
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleToggleFavorite = async () => {
    const nextFavorite = !isFavorite
    setIsFavorite(nextFavorite)

    try {
      await toggleFavoriteTool("pdf-merge-tool")
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
        markToolUsed("pdf-merge-tool")
      ]);
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }

  useEffect(() => {
    setMounted(true)
    return () => {
      // تنظيف الـ controller عند الخروج من الصفحة لحماية الذاكرة
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [])

  useEffect(() => {
    const loadFavorite = async () => {
      const favorite = await isFavoriteTool("pdf-merge-tool")
      setIsFavorite(favorite)
    }

    loadFavorite()
  }, [])

  // دالة الإلغاء (Cancel) عند ضغط الزر
  const handleCancelLoading = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsLoadingPages(false)
    setProgressCurrent(0)
    setProgressTotal(0)
  }

  // دالة معالجة سريعة لخرائط بايتات الـ PDF (تدعم الإلغاء عبر الـ signal)
  const mapPdfStructureOnly = async (file: File, signal: AbortSignal) => {
    if (signal.aborted) return []
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.mjs',
        import.meta.url
      ).toString()

      const arrayBuffer = await file.arrayBuffer()
      if (signal.aborted) return []

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise

      const structuredPages: PDFPageItem[] = []
      for (let i = 1; i <= pdf.numPages; i++) {
        if (signal.aborted) return []
        structuredPages.push({
          id: Math.random().toString(36).substring(2, 9),
          sourceFileName: file.name,
          fileIndex: i,
          pageIndex: i - 1,
          rawFile: file,
          thumbnailUrl: ""
        })
      }
      return structuredPages
    } catch (error) {
      console.error("Error mapping PDF mapping matrix:", error)
      return []
    }
  }

  const runBackgroundPreRenderQueue = async (newPages: PDFPageItem[], signal: AbortSignal) => {
    const pdfjsLib = await import('pdfjs-dist')

    for (const page of newPages) {
      if (signal.aborted) break

      if (!page.thumbnailUrl) {
        try {
          const arrayBuffer = await page.rawFile.arrayBuffer()
          if (signal.aborted) break

          const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
            cMapPacked: true,
            disableFontFace: false,
            isEvalSupported: text => true
          })

          const pdf = await loadingTask.promise
          if (signal.aborted) break

          const pdfPage = await pdf.getPage(page.fileIndex)
          const viewport = pdfPage.getViewport({ scale: 0.35 })

          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')

          if (context) {
            canvas.height = viewport.height
            canvas.width = viewport.width

            // تهيئة الخلفية البيضاء في طابور الخلفية أيضاً
            context.fillStyle = '#FFFFFF'
            context.fillRect(0, 0, canvas.width, canvas.height)
            context.imageSmoothingEnabled = true

            const renderContext = {
              canvasContext: context,
              viewport: viewport,
              intent: 'display'
            }

            try {
              if (!signal.aborted) {
                await pdfPage.render(renderContext).promise
              }
            } catch (e) {
              if (!signal.aborted) {
                await pdfPage.render({ canvasContext: context, viewport: viewport }).promise
              }
            }

            const url = canvas.toDataURL('image/jpeg', 0.6)

            if (!signal.aborted) {
              handlePageRenderComplete(page.id, url)
            }
          }
        } catch (e) {
          console.error("Background pre-render failed for item:", page.id, e)
        }
      }
    }
  }

  const handleFileSelection = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    // إنشاء Controller جديد لكل عملية رفع جديدة
    const controller = new AbortController()
    abortControllerRef.current = controller
    const { signal } = controller

    setIsLoadingPages(true)
    setProgressCurrent(0)
    setProgressTotal(selectedFiles.length)

    try {
      const allStructuredPages: PDFPageItem[] = []

      for (let i = 0; i < selectedFiles.length; i++) {
        if (signal.aborted) return
        const file = selectedFiles[i]
        if (file.type === 'application/pdf') {
          const fileStructure = await mapPdfStructureOnly(file, signal)
          allStructuredPages.push(...fileStructure)
          if (!signal.aborted) {
            setProgressCurrent(i + 1)
          }
        }
      }

      if (!signal.aborted) {
        setPages((prev) => [...prev, ...allStructuredPages])
        setIsGridExpanded(true)
        setIsLoadingPages(false) // إنهاء حالة التحميل المبدئي للانتقال لخلفية العمل

        // ⚡ تشغيل طابور المعالجة المستمر في الخلفية (حتى لو غادر المستخدم التبويب)
        runBackgroundPreRenderQueue(allStructuredPages, signal)
      }
    } catch (err) {
      console.error(err)
      if (!signal.aborted) setIsLoadingPages(false)
    }
  }

  const handlePageRenderComplete = (pageId: string, url: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId && !p.thumbnailUrl ? { ...p, thumbnailUrl: url } : p))
    )
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

  const removePage = (id: string) => {
    setPages((prev) => prev.filter(p => p.id !== id))
  }

  const movePage = (index: number, direction: 'forward' | 'backward') => {
    if (direction === 'backward' && index === 0) return
    if (direction === 'forward' && index === pages.length - 1) return

    const targetIndex = direction === 'backward' ? index - 1 : index + 1
    const updatedPages = [...pages]
    const temp = updatedPages[index]
    updatedPages[index] = updatedPages[targetIndex]
    updatedPages[targetIndex] = temp
    setPages(updatedPages)
  }

  const handleMergePDFs = async () => {
    if (pages.length === 0) return
    setIsMerging(true)

    try {
      const mergedPdf = await PDFDocument.create()
      const fileCache: { [key: string]: PDFDocument } = {}

      for (const pageItem of pages) {
        const cacheKey = pageItem.sourceFileName + pageItem.rawFile.size

        if (!fileCache[cacheKey]) {
          const fileBytes = await pageItem.rawFile.arrayBuffer()
          fileCache[cacheKey] = await PDFDocument.load(fileBytes)
        }

        const sourceDoc = fileCache[cacheKey]
        const [copiedPage] = await mergedPdf.copyPages(sourceDoc, [pageItem.pageIndex])
        mergedPdf.addPage(copiedPage)
      }

      const mergedPdfBytes = await mergedPdf.save()
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `digitalmix-merged-${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      await handleSomething();
    } catch (error) {
      console.error(error)
      alert("Failed to build the custom PDF pipeline.")
    } finally {
      setIsMerging(false)
    }
  }

  const progressPercentage = progressTotal > 0 ? Math.round((progressCurrent / progressTotal) * 100) : 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Framework */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between w-full gap-4">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Layers className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground leading-none">DigitalMix</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Advanced PDF Studio</span>
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
                <span className="sr-only">Toggle theme</span>
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
                className="hidden sm:flex text-muted-foreground hover:text-foreground"
              >
                <Link href="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden text-muted-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* قائمة الموبايل للربط */}
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

      {/* Hero Workspace Section */}
      <div className="py-10 px-4 text-center bg-gradient-to-b from-primary/5 to-transparent">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium mb-4">
          <ShieldCheck className="h-3.5 w-3.5" /> 100% Secure Local Page Processing Hub
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3">
          Free PDF Merger & Organizer Tool Online
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Your files are broken down into pages locally in your browser. Preview content, isolate specific sheets, remove junk pages, and download your ideal master copy safely.
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
          className={`p-10 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer ${dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border bg-card hover:border-border/80'
            }`}
          onClick={() => document.getElementById('pdf-input')?.click()}
        >
          <input
            id="pdf-input"
            type="file"
            multiple
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleFileSelection(e.target.files)}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center border border-border">
              <UploadCloud className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Drag & drop your PDFs here, or click to analyze pages</p>
              <p className="text-xs text-muted-foreground mt-1">Extracts, maps, and structures page matrices instantly offline</p>
            </div>
          </div>
        </div>

        {/* 📊 شريط التقدم التفاعلي المطور مع زر الـ Cancel */}
        {isLoadingPages && (
          <div className="mt-8 max-w-md mx-auto bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                Mapping file streams...
              </span>
              <span className="font-bold text-primary">{progressCurrent} / {progressTotal} ({progressPercentage}%)</span>
            </div>

            {/* صف أفقي يحتوي على الـ Progress Bar وزر الـ Cancel المضاف */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden border border-border/40">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <button
                type="button"
                onClick={handleCancelLoading}
                className="flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors bg-destructive/10 px-2 py-1 rounded-md border border-destructive/20"
                title="Cancel File Loading Pipeline"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Processing runs inside dynamic sub-threads. Background rendering continues safely if you switch browser tabs.
            </p>
          </div>
        )}

        {/* Visual Page Grid Layout */}
        {pages.length > 0 && (
          <div className="mt-10 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <button
                onClick={() => setIsGridExpanded(!isGridExpanded)}
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <Eye className="h-4 w-4 text-primary" />
                Visual Lazy-Sequencer Layout ({pages.length} Pages Loaded)
                {isGridExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </button>

              <button onClick={() => setPages([])} className="text-xs text-destructive hover:underline font-medium">
                Remove All Sheets
              </button>
            </div>

            {isGridExpanded && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 transition-all duration-300">
                {pages.map((page, index) => (
                  <LazyPageCard
                    key={page.id}
                    page={page}
                    index={index}
                    removePage={removePage}
                    movePage={movePage}
                    isFirst={index === 0}
                    isLast={index === pages.length - 1}
                    onRenderComplete={handlePageRenderComplete}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-border/40">
              <Button
                disabled={pages.length === 0 || isMerging}
                onClick={handleMergePDFs}
                className="w-full sm:w-auto h-11 px-6 font-semibold gap-2 shadow-sm text-sm"
              >
                {isMerging ? <>Assembling Chosen Vectors...</> : <><Download className="h-4 w-4" /> Export Tailored PDF Document</>}
              </Button>
            </div>
          </div>
        )}

        <hr className="my-16 border-border/60" />

        {/* Features & Frequently Asked Questions */}
        <div className="space-y-16 text-left max-w-4xl mx-auto">
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Why Use This Tool?
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Discover how DigitalMix revolutionizes document workflows directly in your local environment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-border bg-card/50 space-y-3 transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 group">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  100% In-Browser Privacy
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use localized canvas rendering pipelines. Your legal documents, receipts, and sensitive charts never touch an external cloud backend server.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card/50 space-y-3 transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 group">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  Granular Sheet Extraction
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Do not settle for generic, blind document mergers. Inspect every page element visually, trash junk slides, and re-order individual canvas elements inside a smooth layout grid.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-card/50 space-y-3 transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 group">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  Hardware-Accelerated Speed
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Compiled instantly via zero-latency web assemblies. Eliminates the slow network upload handshakes of legacy file platforms.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-border/40" />

          <section className="bg-secondary/40 border border-border rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <HelpCircle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">How to Organize & Merge Your PDFs</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center sm:text-left">
              <div className="space-y-1">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-1">1</span>
                <h4 className="text-xs font-bold text-foreground">Upload Files</h4>
                <p className="text-[11px] text-muted-foreground leading-normal">Drag and drop your PDF files into the secure compiler area.</p>
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-1">2</span>
                <h4 className="text-xs font-bold text-foreground">Inspect Content</h4>
                <p className="text-[11px] text-muted-foreground leading-normal">Look inside the generated local thumbnails to see actual page contents.</p>
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-1">3</span>
                <h4 className="text-xs font-bold text-foreground">Sort & Clean</h4>
                <p className="text-[11px] text-muted-foreground leading-normal">Use Move arrows to reorder sheets, or hit Delete to wipe out clutter.</p>
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-1">4</span>
                <h4 className="text-xs font-bold text-foreground">Export PDF</h4>
                <p className="text-[11px] text-muted-foreground leading-normal">Click Export to bundle your custom tailored pipeline instantly.</p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold tracking-tight text-center md:text-left">Frequently Asked Questions</h3>
            <div className="space-y-3">
              <div className="border border-border rounded-lg bg-card p-4 space-y-1.5">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="text-primary font-mono text-xs">Q.</span> Are my private documents uploaded to any remote server?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                  Absolutely not. DigitalMix extracts, renders, and combines your files 100% client-side in your own browser instance using specialized local canvas layers.
                </p>
              </div>

              <div className="border border-border rounded-lg bg-card p-4 space-y-1.5">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="text-primary font-mono text-xs">Q.</span> Can I change page positions and delete single sheets?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                  Yes! Unlike blind PDF binders, this engine shows you live visual preview cards. You can delete useless spaces, move specific pages backward or forward, and re-structure the entire file logic.
                </p>
              </div>

              <div className="border border-border rounded-lg bg-card p-4 space-y-1.5">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="text-primary font-mono text-xs">Q.</span> Is there any file size limit for loading massive workbooks?
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                  Since compilation relies on your local computer hardware and web assembly protocols, it can scale to manage heavy pages corporate workbooks swiftly without experiencing network timeouts.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="max-w-7xl mx-auto px-4 py-8 border-t border-border/60 mt-16">
          <h3 className="text-sm font-bold text-center mb-6 text-muted-foreground uppercase tracking-widest">
            Optimized Developer Validation Modules
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Link href="/tools/image-resizer" className="p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all text-center flex flex-col items-center justify-center gap-3 group min-h-[140px]">
              <Maximize2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="space-y-1">
                <span className="block text-sm font-bold text-foreground group-hover:text-primary">Image Resizer Tool</span>
                <p className="text-[11px] text-muted-foreground max-w-[240px] mx-auto leading-normal">Resize, crop, and convert your images</p>
              </div>
            </Link>

            <Link href="/tools/base64" className="p-5 rounded-xl border border-border bg-card hover:border-primary hover:shadow-md hover:shadow-primary/5 transition-all text-center flex flex-col items-center justify-center gap-3 group min-h-[140px]">
              <Binary className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="space-y-1">
                <span className="block text-sm font-bold text-foreground group-hover:text-primary">Base64 Encoder / Decoder</span>
                <p className="text-[11px] text-muted-foreground max-w-[240px] mx-auto leading-normal">Instantly map binary arrays or standard strings to ASCII formats.</p>
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