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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PDFDocument } from 'pdf-lib'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'

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
  description:
    'Merge multiple PDF documents, reorder individual pages, delete unwanted sheets, and assemble publication-ready PDFs 100% inside your browser.',
  category: {
    id: 'files',
    name: 'File Utilities',
    slug: 'files',
  },
  icon: Layers,
  privacyBadge: '100% Client-Side • Zero Document Upload',
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
}

function LazyPageCard({
  page,
  index,
  total,
  removePage,
  movePage,
  onRenderComplete,
}: {
  page: PDFPageItem
  index: number
  total: number
  removePage: (id: string) => void
  movePage: (index: number, direction: 'forward' | 'backward') => void
  onRenderComplete: (pageId: string, url: string) => void
}) {
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
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

            const arrayBuffer = await page.rawFile.arrayBuffer()
            const loadingTask = pdfjsLib.getDocument({
              data: arrayBuffer,
              cMapUrl: '/cmaps/',
              cMapPacked: true,
            })

            const pdf = await loadingTask.promise
            const pdfPage = await pdf.getPage(page.fileIndex)
            const viewport = pdfPage.getViewport({ scale: 0.35 })

            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')

            if (context) {
              canvas.height = viewport.height
              canvas.width = viewport.width
              context.fillStyle = '#FFFFFF'
              context.fillRect(0, 0, canvas.width, canvas.height)
              context.imageSmoothingEnabled = true

              await pdfPage.render({
                canvasContext: context,
                viewport: viewport,
                canvas: canvas,
                intent: 'display',
              }).promise

              const url = canvas.toDataURL('image/jpeg', 0.6)
              onRenderComplete(page.id, url)
            }
          } catch (err: unknown) {
            console.error('PDF thumbnail render error:', err)
          } finally {
            setIsRendering(false)
          }
        }
      },
      { rootMargin: '200px 0px', threshold: 0.01 }
    )

    if (cardRef.current) observer.observe(cardRef.current)
    return () => {
      if (cardRef.current) observer.unobserve(cardRef.current)
    }
  }, [page, isRendering, onRenderComplete])

  return (
    <div
      ref={cardRef}
      className="group relative flex flex-col rounded-2xl border border-border/70 bg-card p-3 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200"
    >
      <div className="relative aspect-3/4 w-full rounded-xl bg-muted/40 overflow-hidden flex items-center justify-center border border-border/40">
        {page.thumbnailUrl ? (
          <img
            src={page.thumbnailUrl}
            alt={`Page ${index + 1}`}
            className="h-full w-full object-contain select-none"
          />
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

        <div className="absolute top-2 left-2 rounded-lg bg-background/90 backdrop-blur-xs px-2 py-0.5 text-[11px] font-bold text-foreground shadow-xs border border-border/50">
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
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => removePage(page.id)}
            className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove page"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function PdfMergeTool() {
  const [pages, setPages] = useState<PDFPageItem[]>([])
  const [isMerging, setIsMerging] = useState(false)
  const [isProcessingFiles, setIsProcessingFiles] = useState(false)
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

  const handleFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsProcessingFiles(true)

    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

      const newPageItems: PDFPageItem[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          const arrayBuffer = await file.arrayBuffer()
          const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
            cMapUrl: '/cmaps/',
            cMapPacked: true,
          }).promise
          const pageCount = pdf.numPages

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
        }
      }

      setPages((prev) => [...prev, ...newPageItems])
    } catch (err: unknown) {
      console.error('Error processing PDF documents:', err)
    } finally {
      setIsProcessingFiles(false)
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
      const a = document.createElement('a')
      a.href = url
      a.download = `merged-document-${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)

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
        onChange={(e) => handleFilesUpload(e.target.files)}
        accept="application/pdf"
        multiple
        className="hidden"
      />

      {pages.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
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
              Select or Drop PDF Files
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Upload multiple PDF documents to reorder pages, remove sheets, and merge into one.
            </p>
          </div>
          <Button size="lg" className="rounded-xl font-bold gap-2 pointer-events-none mt-2">
            <Plus className="h-4 w-4" /> Choose PDF Files
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
                Add More PDFs
              </Button>
              <span className="text-xs font-medium text-muted-foreground">
                {pages.length} {pages.length === 1 ? 'page' : 'pages'} total
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear All
              </Button>
              <Button
                size="sm"
                onClick={handleMergeAndDownload}
                disabled={isMerging || pages.length === 0}
                className="gap-2 text-xs font-bold shadow-md shadow-primary/20 rounded-xl"
              >
                {isMerging ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Merge & Download PDF
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
              />
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}