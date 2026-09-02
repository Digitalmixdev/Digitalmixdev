'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Layers,
  Trash2,
  Download,
  UploadCloud,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Plus,
  Maximize2,
  X,
  RotateCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PDFDocument } from 'pdf-lib'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { useLanguage } from '@/lib/i18n/context'
import { logToolActivity } from '@/lib/history-service'

interface PDFPageItem {
  id: string
  sourceFileName: string
  fileIndex: number
  pageIndex: number
  rawFile: File
  thumbnailUrl: string
}

const toolMeta: ToolMetadata = {
  id: 'pdf-merge',
  name: 'PDF Merger & Page Organizer',
  name_ar: 'أداة دمج وترتيب ملفات PDF',
  description:
    'Merge multiple PDF documents, reorder individual pages, delete unwanted sheets, and assemble publication-ready PDFs 100% inside your browser.',
  description_ar:
    'دمج عدة مستندات PDF، إعادة ترتيب الصفحات، حذف الصفحات غير المرغوبة، وتنظيم الملفات بسهولة وسرعة محلياً داخل متصفحك.',
  category: {
    id: 'files',
    name: 'File Utilities',
    slug: 'files',
  },
  icon: Layers,
  privacyBadge: '100% Client-Side • Zero Document Upload',
  privacyBadge_ar: '100% معالجة محلياً • بدون رفع المستندات',
  features: [
    {
      icon: ShieldCheck,
      title: 'Confidential Local Processing',
      desc: 'Legal contracts, bank statements, and tax files are merged directly in memory.',
    },
    {
      icon: Layers,
      title: 'Visual Page Level Reordering',
      desc: 'Rearrange, delete, or combine specific pages from multiple documents with visual previews.',
    },
    {
      icon: Zap,
      title: 'Lossless Assembly',
      desc: 'Preserves vector fonts, original DPI resolutions, and document metadata structures.',
    },
    {
      icon: CheckCircle2,
      title: 'No File Size Limits',
      desc: 'Merge large multi-page reports without arbitrary cloud upload constraints.',
    },
  ],
  features_ar: [
    {
      icon: ShieldCheck,
      title: 'معالجة محلية سرية وآمنة',
      desc: 'العقود القانونية والكشوفات البنكية والملفات الشخصية تُدمج وتُنظم محلياً في الذاكرة بأمان تام.',
    },
    {
      icon: Layers,
      title: 'إعادة ترتيب وتدوير الصفحات بصرياً',
      desc: 'ترتيب، حذف، أو تدوير صفحات محددة من مستندات متعددة مع معاينة مصغرات الصور فورياً.',
    },
    {
      icon: Zap,
      title: 'دمج عالي الدقة دون فقدان الجودة',
      desc: 'الحفاظ على الخطوط المتجهة (Vector) ودقة الصور الأصلية وبنية البيانات داخل مستندات PDF.',
    },
    {
      icon: CheckCircle2,
      title: 'بدون حدود لحجم الملفات',
      desc: 'دمج التقارير والكتب الكبيرة متعددة الصفحات بدون أي قيود على الحجم أو عدد الصفحات.',
    },
  ],
  faqs: [
    {
      q: 'Is it safe to merge confidential PDF documents with this tool?',
      a: 'Yes. The merger uses WebAssembly and pure client-side PDF binaries running in your browser thread. No PDF file or thumbnail is ever transmitted over the network.',
    },
    {
      q: 'Can I reorder pages between different PDF files?',
      a: 'Yes. Once uploaded, all pages from all files appear in the visual organizer grid. You can move any page forward or backward to create custom document arrangements.',
    },
    {
      q: 'Will the merged PDF lose original image quality?',
      a: 'No. The underlying pdf-lib engine performs byte-level page vector splicing, keeping all embedded vector paths and high-resolution images uncompressed and crisp.',
    },
  ],
  faqs_ar: [
    {
      q: 'هل من الآمن دمج المستندات والملفات السرية بهذه الأداة؟',
      a: 'نعم بالتأكيد. تتم عمليات الدمج عبر مكتبات WebAssembly محلياً في ذاكرة متصفحك، ولا يتم إرسال أي ملف أو صفحة عبر الإنترنت نهائياً.',
    },
    {
      q: 'هل يمكنني إعادة ترتيب الصفحات بين ملفات PDF مختلفة؟',
      a: 'نعم! بمجرد اختيار الملفات، تظهر جميع الصفحات في لوحة المعاينة التفاعلية، ويمكنك سحب وتحريك أي صفحة للأمام أو الخلف لإنشاء المستند النهائي.',
    },
    {
      q: 'هل سيفقد ملف الـ PDF المدمج جودته الأصلية؟',
      a: 'لا. يقوم المحرك بمعالجة الصفحات على مستوى الأكواد الثنائية مباشرة (Byte-Level)، مما يحافظ على دقة النصوص المتجهة والصور العالية كما هي.',
    },
  ],
}

// Global cached map of loaded PDF.js documents to avoid re-parsing on every page
const pdfDocCache = new Map<File, any>()

async function getCachedPdfDocument(file: File) {
  if (pdfDocCache.has(file)) {
    return pdfDocCache.get(file)
  }
  const pdfjsLib = await import('pdfjs-dist')
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    try {
      const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
      pdfjsLib.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.min.mjs`
    } catch {
      // ignore
    }
  }

  const arrayBuffer = await file.arrayBuffer()
  let pdf: any
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer.slice(0)),
      cMapUrl: '/cmaps/',
      cMapPacked: true,
    })
    pdf = await loadingTask.promise
  } catch (workerErr) {
    console.warn('PDF worker error in merge tool, falling back to main thread:', workerErr)
    const fallbackTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer.slice(0)),
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      disableWorker: true,
    } as any)
    pdf = await fallbackTask.promise
  }

  pdfDocCache.set(file, pdf)
  return pdf
}

async function renderHighQualityThumbnail(file: File, pageNum: number): Promise<string> {
  const pdf = await getCachedPdfDocument(file)
  const pdfPage = await pdf.getPage(pageNum)
  
  // High-DPI scale (1.2x - 1.5x) for crystal-clear text readability without lag
  const viewport = pdfPage.getViewport({ scale: 1.2 })
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { alpha: false })

  if (!context) return ''

  canvas.height = viewport.height
  canvas.width = viewport.width

  // White background base
  context.fillStyle = '#FFFFFF'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'

  await pdfPage.render({
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
    intent: 'display',
  } as any).promise

  // High quality WebP / JPEG format
  return canvas.toDataURL('image/jpeg', 0.88)
}

function LazyPageCard({
  page,
  index,
  total,
  removePage,
  movePage,
  onRenderComplete,
  onPreviewZoom,
}: {
  page: PDFPageItem
  index: number
  total: number
  removePage: (id: string) => void
  movePage: (index: number, direction: 'forward' | 'backward') => void
  onRenderComplete: (pageId: string, url: string) => void
  onPreviewZoom: (page: PDFPageItem) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isRendering, setIsRendering] = useState(false)

  useEffect(() => {
    if (page.thumbnailUrl) return

    let isMounted = true
    const observer = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && !page.thumbnailUrl && !isRendering) {
          setIsRendering(true)
          try {
            const url = await renderHighQualityThumbnail(page.rawFile, page.fileIndex)
            if (isMounted && url) {
              onRenderComplete(page.id, url)
            }
          } catch (err: unknown) {
            console.error('PDF thumbnail render error:', err)
          } finally {
            if (isMounted) setIsRendering(false)
          }
        }
      },
      { rootMargin: '300px 0px', threshold: 0.01 }
    )

    if (cardRef.current) observer.observe(cardRef.current)
    return () => {
      isMounted = false
      if (cardRef.current) observer.unobserve(cardRef.current)
    }
  }, [page.rawFile, page.fileIndex, page.id, page.thumbnailUrl, isRendering, onRenderComplete])

  return (
    <div
      ref={cardRef}
      className="group relative flex flex-col rounded-2xl border border-border/80 bg-card p-3 shadow-xs hover:border-primary/50 hover:shadow-lg transition-all duration-200"
    >
      <div className="relative aspect-3/4 w-full rounded-xl bg-muted/40 overflow-hidden flex items-center justify-center border border-border/40 shadow-inner">
        {page.thumbnailUrl ? (
          <div className="relative w-full h-full group/thumb cursor-pointer" onClick={() => onPreviewZoom(page)}>
            <img
              src={page.thumbnailUrl}
              alt={`Page ${index + 1}`}
              className="h-full w-full object-contain select-none transition-transform duration-200 group-hover/thumb:scale-[1.02]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-xs font-semibold">
                <Maximize2 className="h-3.5 w-3.5" /> Enlarge
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground p-4 text-center">
            {isRendering ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <FileText className="h-6 w-6 opacity-40" />
            )}
            <span className="text-[10px] font-mono">
              {isRendering ? 'Rendering...' : `Page ${page.fileIndex}`}
            </span>
          </div>
        )}

        <div className="absolute top-2 left-2 rounded-lg bg-background/95 backdrop-blur-xs px-2 py-0.5 text-[11px] font-bold text-foreground shadow-xs border border-border/60">
          #{index + 1}
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-1">
        <span className="text-[11px] font-medium text-muted-foreground truncate max-w-22.5" title={page.sourceFileName}>
          {page.sourceFileName}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => movePage(index, 'backward')}
            disabled={index === 0}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label="Move page left"
            title="Move Left"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => movePage(index, 'forward')}
            disabled={index === total - 1}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label="Move page right"
            title="Move Right"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => removePage(page.id)}
            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove page"
            title="Delete Page"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function PdfMergeTool() {
  const { t } = useLanguage()
  const [pages, setPages] = useState<PDFPageItem[]>([])
  const [isMerging, setIsMerging] = useState(false)
  const [isProcessingFiles, setIsProcessingFiles] = useState(false)
  const [activeZoomPage, setActiveZoomPage] = useState<PDFPageItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const recordUsage = async () => {
    try {
      await Promise.all([
        incrementToolUsage(),
        markToolUsed('pdf-merge'),
      ])
    } catch {
      // Non-blocking telemetry
    }
  }

  const handleFilesUpload = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return
    setIsProcessingFiles(true)

    try {
      const newPageItems: PDFPageItem[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') || file.type === ''
        if (isPdf) {
          try {
            let pageCount = 0
            try {
              const pdf = await getCachedPdfDocument(file)
              pageCount = pdf.numPages
            } catch (pdfJsErr) {
              console.warn('pdfjs failed, using pdf-lib fallback for page count:', pdfJsErr)
              const fileBuffer = await file.arrayBuffer()
              const pdfDoc = await PDFDocument.load(fileBuffer.slice(0), { ignoreEncryption: true })
              pageCount = pdfDoc.getPageCount()
            }

            for (let p = 1; p <= pageCount; p++) {
              newPageItems.push({
                id: `${file.name}-${p}-${Math.random().toString(36).slice(2, 7)}`,
                sourceFileName: file.name,
                fileIndex: p,
                pageIndex: p - 1,
                rawFile: file,
                thumbnailUrl: '',
              })
            }
          } catch (err) {
            console.error(`Failed to load PDF ${file.name}:`, err)
          }
        }
      }

      setPages((prev) => [...prev, ...newPageItems])

      // Immediately kick off high quality rendering for initial batch
      setTimeout(async () => {
        for (const item of newPageItems.slice(0, 12)) {
          try {
            const url = await renderHighQualityThumbnail(item.rawFile, item.fileIndex)
            if (url) {
              setPages((prev) =>
                prev.map((p) => (p.id === item.id ? { ...p, thumbnailUrl: url } : p))
              )
            }
          } catch {
            // handled gracefully
          }
        }
      }, 50)
    } catch (err: unknown) {
      console.error('Error processing PDF documents:', err)
    } finally {
      setIsProcessingFiles(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files)
    }
  }

  const handleThumbnailRenderComplete = (pageId: string, url: string) => {
    setPages((prev) =>
      prev.map((item) => (item.id === pageId ? { ...item, thumbnailUrl: url } : item))
    )
  }

  const movePage = (index: number, direction: 'forward' | 'backward') => {
    setPages((prev) => {
      const copy = [...prev]
      const targetIndex = direction === 'forward' ? index + 1 : index - 1
      if (targetIndex < 0 || targetIndex >= copy.length) return copy
      const temp = copy[index]
      copy[index] = copy[targetIndex]
      copy[targetIndex] = temp
      return copy
    })
  }

  const removePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id))
  }

  const handleClearAll = () => {
    setPages([])
    pdfDocCache.clear()
  }

  const handleMergeAndDownload = async () => {
    if (pages.length === 0) return
    setIsMerging(true)

    try {
      const mergedPdf = await PDFDocument.create()
      const cachedDocs = new Map<File, PDFDocument>()

      for (const item of pages) {
        let sourceDoc = cachedDocs.get(item.rawFile)
        if (!sourceDoc) {
          const fileBytes = await item.rawFile.arrayBuffer()
          sourceDoc = await PDFDocument.load(fileBytes)
          cachedDocs.set(item.rawFile, sourceDoc)
        }

        const [copiedPage] = await mergedPdf.copyPages(sourceDoc, [item.pageIndex])
        mergedPdf.addPage(copiedPage)
      }

      const mergedBytes = await mergedPdf.save()
      const blob = new Blob([new Uint8Array(mergedBytes)], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const downloadName = `merged-document-${Date.now()}.pdf`
      const a = document.createElement('a')
      a.href = url
      a.download = downloadName
      a.click()
      URL.revokeObjectURL(url)

      // Dashboard Activity Logging
      const uniqueFiles = Array.from(new Set(pages.map((p) => p.sourceFileName)))
      const isArabic = false // or check language if available
      logToolActivity({
        toolId: 'pdf-merge',
        toolName: 'PDF Merger & Page Organizer',
        category: 'files',
        actionTitle: `Merged ${pages.length} Pages PDF`,
        details: `Merged ${pages.length} pages from ${uniqueFiles.length} file(s) (${uniqueFiles.join(', ')}) into "${downloadName}"`,
        inputSnippet: uniqueFiles.join('\n'),
        outputSnippet: `File: ${downloadName}\nTotal Pages: ${pages.length}\nSize: ${(blob.size / 1024).toFixed(1)} KB`,
        metadata: {
          totalPages: pages.length,
          sourceFiles: uniqueFiles,
          outputFile: downloadName,
          fileSizeBytes: blob.size,
        },
      })

      recordUsage()
    } catch (err) {
      console.error('Error merging PDF files:', err)
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <ToolLayout metadata={toolMeta} maxWidth="7xl">
      {/* Upload Dropzone */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          handleFilesUpload(e.target.files)
          e.target.value = ''
        }}
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
      />

      {pages.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border/80 hover:border-primary/50 bg-card/50 hover:bg-card/90 rounded-3xl p-10 sm:p-16 text-center cursor-pointer transition-all duration-200 shadow-xs flex flex-col items-center justify-center gap-4 group"
        >
          <div className="p-4 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-200">
            {isProcessingFiles ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <UploadCloud className="h-8 w-8" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              {t('pdf_merge.dropzone_title', 'Select or Drop PDF Files')}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {t('pdf_merge.dropzone_desc', 'Upload multiple PDF documents to reorder pages, remove sheets, and merge into one.')}
            </p>
          </div>
          <Button size="lg" className="rounded-xl font-bold gap-2 pointer-events-none mt-2">
            <Plus className="h-4 w-4" /> {t('pdf_merge.choose_btn', 'Choose PDF Files')}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-border/70 bg-card shadow-xs">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingFiles}
                className="gap-2 text-xs font-semibold rounded-xl"
              >
                {isProcessingFiles ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {t('pdf_merge.add_more', 'Add More PDFs')}
              </Button>
              <span className="text-xs font-medium text-muted-foreground">
                {pages.length} {t('pdf_merge.pages_total', 'pages total')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> {t('action.clear', 'Clear All')}
              </Button>
              <Button
                size="sm"
                onClick={handleMergeAndDownload}
                disabled={isMerging || pages.length === 0}
                className="gap-2 text-xs font-bold shadow-md shadow-primary/20 rounded-xl px-5"
              >
                {isMerging ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('action.processing', 'Downloading...')}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    {t('action.download', 'Download')}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Visual Page Reorder Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {pages.map((page, idx) => (
              <LazyPageCard
                key={page.id}
                page={page}
                index={idx}
                total={pages.length}
                removePage={removePage}
                movePage={movePage}
                onRenderComplete={handleThumbnailRenderComplete}
                onPreviewZoom={setActiveZoomPage}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal for Zooming / Enlarging Page Preview */}
      {activeZoomPage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setActiveZoomPage(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] bg-card rounded-2xl border border-border/80 shadow-2xl p-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 border-b border-border/50 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">
                  Page Preview - {activeZoomPage.sourceFileName} (Page #{activeZoomPage.fileIndex})
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setActiveZoomPage(null)}
                className="h-8 w-8 rounded-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-auto max-h-[75vh] w-full flex items-center justify-center p-2 rounded-xl bg-muted/30">
              {activeZoomPage.thumbnailUrl ? (
                <img
                  src={activeZoomPage.thumbnailUrl}
                  alt={`Enlarged page ${activeZoomPage.fileIndex}`}
                  className="max-h-[70vh] object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs">Loading page preview...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}