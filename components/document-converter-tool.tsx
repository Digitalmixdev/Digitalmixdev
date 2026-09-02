'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  RefreshCw,
  UploadCloud,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  Presentation,
  ArrowRight,
  ShieldCheck,
  Zap,
  Copy,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Plus,
  FileArchive,
  MoveUp,
  MoveDown,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Layout,
  Printer,
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
import { logToolActivity } from '@/lib/history-service'
import { performOcrOnImageBlob } from '@/lib/ocr-service'
import {
  parseDocx,
  parsePptx,
  parseXlsx,
  parsePdf,
  renderPdfToImages,
  generateDocxFile,
  generatePptxFile,
  generateXlsxFromData,
  generatePdfDocument,
  generateHtmlDocument,
  type ConversionResult,
} from '@/lib/converters/office-converter'
import {
  imagesToPdf,
  convertSingleImage,
  decodeFileToCanvas,
  type ImageToPdfOptions,
} from '@/lib/converters/image-converter'

type FormatKey = 'auto' | 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'html' | 'jpg' | 'png' | 'txt'

interface FormatConfig {
  id: FormatKey
  label: string
  ext: string
  mime: string
  icon: any
  color: string
  badgeColor: string
}

const FORMAT_CONFIGS: Record<FormatKey, FormatConfig> = {
  auto: {
    id: 'auto',
    label: 'Auto Detect',
    ext: '*',
    mime: '',
    icon: RefreshCw,
    color: 'text-muted-foreground',
    badgeColor: 'bg-muted text-muted-foreground',
  },
  pdf: {
    id: 'pdf',
    label: 'PDF Document',
    ext: '.pdf',
    mime: 'application/pdf',
    icon: FileText,
    color: 'text-rose-500',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900',
  },
  docx: {
    id: 'docx',
    label: 'Word Document',
    ext: '.docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    icon: FileText,
    color: 'text-blue-500',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900',
  },
  pptx: {
    id: 'pptx',
    label: 'PowerPoint',
    ext: '.pptx',
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    icon: Presentation,
    color: 'text-amber-500',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900',
  },
  xlsx: {
    id: 'xlsx',
    label: 'Excel Spreadsheet',
    ext: '.xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    icon: FileSpreadsheet,
    color: 'text-emerald-500',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900',
  },
  html: {
    id: 'html',
    label: 'HTML Webpage',
    ext: '.html',
    mime: 'text/html',
    icon: FileCode,
    color: 'text-purple-500',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900',
  },
  jpg: {
    id: 'jpg',
    label: 'JPG Image',
    ext: '.jpg',
    mime: 'image/jpeg',
    icon: ImageIcon,
    color: 'text-orange-500',
    badgeColor: 'bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900',
  },
  png: {
    id: 'png',
    label: 'PNG Image',
    ext: '.png',
    mime: 'image/png',
    icon: ImageIcon,
    color: 'text-cyan-500',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:border-cyan-900',
  },
  txt: {
    id: 'txt',
    label: 'Plain Text',
    ext: '.txt',
    mime: 'text/plain',
    icon: FileText,
    color: 'text-slate-500',
    badgeColor: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800',
  },
}

const COMPATIBILITY_MAP: Record<FormatKey, FormatKey[]> = {
  auto: ['pdf', 'docx', 'xlsx', 'pptx', 'html', 'jpg', 'png', 'txt'],
  pdf: ['docx', 'html', 'jpg', 'png', 'txt', 'xlsx', 'pptx'],
  docx: ['pdf', 'html', 'txt', 'jpg'],
  pptx: ['pdf', 'html', 'txt', 'jpg'],
  xlsx: ['pdf', 'html', 'txt'],
  html: ['pdf', 'docx', 'xlsx', 'jpg', 'txt'],
  jpg: ['pdf', 'png', 'docx', 'html'],
  png: ['pdf', 'jpg', 'docx', 'html'],
  txt: ['pdf', 'docx', 'html'],
}

const PRESET_CONVERSIONS = [
  { from: 'jpg' as FormatKey, to: 'pdf' as FormatKey, label: 'Images to PDF', icon: '🖼️' },
  { from: 'docx' as FormatKey, to: 'pdf' as FormatKey, label: 'Word to PDF', icon: '📄' },
  { from: 'pdf' as FormatKey, to: 'docx' as FormatKey, label: 'PDF to Word', icon: '📑' },
  { from: 'pdf' as FormatKey, to: 'pptx' as FormatKey, label: 'PDF to PPTX', icon: '📽️' },
  { from: 'pdf' as FormatKey, to: 'jpg' as FormatKey, label: 'PDF to Images', icon: '📸' },
  { from: 'xlsx' as FormatKey, to: 'pdf' as FormatKey, label: 'Excel to PDF', icon: '📊' },
  { from: 'pptx' as FormatKey, to: 'pdf' as FormatKey, label: 'PPTX to PDF', icon: '📽️' },
  { from: 'html' as FormatKey, to: 'pdf' as FormatKey, label: 'HTML to PDF', icon: '🌐' },
]

export interface DocumentQueueItem {
  id: string
  file: File
  name: string
  size: number
  format: FormatKey
  isImage: boolean
  previewUrl: string
  width?: number
  height?: number
  status: 'idle' | 'converting' | 'success' | 'error'
  convertedBlob?: Blob
  convertedUrl?: string
  convertedName?: string
  error?: string
}

const toolMeta: ToolMetadata = {
  id: 'document-converter',
  name: 'Document & Office Converter',
  name_ar: 'محول المستندات والأوفيس والصور لـ PDF',
  description:
    'Convert images (PNG, JPG, WEBP) and office documents (Word, Excel, PowerPoint, HTML, PDF) to PDF and other formats with custom page layout, live preview, and individual or merged downloads.',
  description_ar:
    'تحويل عدة صور (JPG, PNG) وملفات الأوفيس (Word, Excel, PPTX, HTML) إلى PDF وباقي الصيغ مع إمكانية تعديل تخطيط الصفحة والمعاينة المباشرة وتنزيل الملفات فردياً أو مضغوطة ZIP.',
  category: {
    id: 'files',
    name: 'File Utilities',
    slug: 'files',
  },
  icon: RefreshCw,
  privacyBadge: '100% Client-Side • Zero File Uploads • In-Memory Processing',
  privacyBadge_ar: '100% معالجة داخل متصفحك • بدون رفع أي ملفات • معالجة في الذاكرة',
  features: [
    {
      icon: ImageIcon,
      title: 'Multi-Image to PDF Engine',
      desc: 'Batch select multiple PNG, JPG, or WEBP images and convert them into a single multi-page PDF or individual PDF documents with instant preview.',
    },
    {
      icon: Layout,
      title: 'Page Layout & Sizing Options',
      desc: 'Customize page dimensions (A4 Portrait, A4 Landscape, Fit to Image, US Letter), image scaling (Contain, Cover), and custom margins.',
    },
    {
      icon: Eye,
      title: 'Real-Time Visual Page Preview',
      desc: 'Simulate and inspect how images will be framed inside each PDF page before exporting, with interactive page browsing.',
    },
    {
      icon: ShieldCheck,
      title: 'Local Privacy Guarantee',
      desc: 'All file parsing and PDF generation happen directly inside your browser memory using WebAssembly with zero server uploads.',
    },
  ],
  features_ar: [
    {
      icon: ImageIcon,
      title: 'محرك تحويل متعدد الصور لـ PDF',
      desc: 'حدد مجموعة صور PNG أو JPG أو WEBP واجمعها في مستند PDF متعدد الصفحات أو ملفات PDF فردية مع معاينة فورية.',
    },
    {
      icon: Layout,
      title: 'خيارات التخطيط وأبعاد الصفحة',
      desc: 'تخصيص أبعاد الصفحة (A4 عمودي، A4 أفقي، ملاءمة للصورة، US Letter)، ومقياس الصورة (Contain, Cover)، والهوامش.',
    },
    {
      icon: Eye,
      title: 'معاينة بصرية مباشرة للصفحات',
      desc: 'معاينة وفحص دقيق لنسب الإطارات والهوامش في كل صفحة PDF قبل التصدير مع التصفح التفاعلي.',
    },
    {
      icon: ShieldCheck,
      title: 'ضمان الخصوصية المحلية 100%',
      desc: 'يتم تحليل وتوليد مستندات PDF محلياً داخل ذاكرة متصفحك دون إرسال أي بيانات لخوادم خارجية.',
    },
  ],
  faqs: [
    {
      q: 'How do I convert multiple images to PDF at once?',
      a: 'Click "Select Files" or drag & drop all your JPG, PNG, or WEBP pictures. You can choose whether to merge all photos into a single multi-page PDF document or export each image as an individual PDF file.',
    },
    {
      q: 'Can I customize how images fit on the PDF pages (A4, Fit, etc.)?',
      a: 'Yes! In the Page Layout settings, you can choose A4 Portrait, A4 Landscape, Fit to Image, or US Letter, select whether the image fills the page or maintains aspect ratio, and adjust margins.',
    },
    {
      q: 'Can I preview my PDF pages before downloading?',
      a: 'Yes! An interactive visual preview underneath shows page-by-page rendering with the exact page dimensions, margins, and placement.',
    },
    {
      q: 'Can I download each converted image PDF separately or together in a ZIP?',
      a: 'Yes, you can download each page individually with one click, download the entire collection as a ZIP file, or download the consolidated single-file PDF.',
    },
    {
      q: 'What other document types can I convert?',
      a: 'You can convert Microsoft Word (.docx), PowerPoint (.pptx), Excel (.xlsx), HTML, Plain Text, and PDF back and forth.',
    },
  ],
  faqs_ar: [
    {
      q: 'كيف يمكنني تحويل صور متعددة إلى ملف PDF واحد؟',
      a: 'اضغط على "اختر الملفات" أو اسحب وأفلت صور JPG أو PNG أو WEBP. يمكنك اختيار دمج جميع الصور في مستند PDF واحد أو تصدير كل صورة كملف PDF مستقل.',
    },
    {
      q: 'هل يمكنني تخصيص قياسات الصفحة والهوامش (A4، ملائمة للصورة، إلخ)؟',
      a: 'نعم! في إعدادات تخطيط الصفحة، يمكنك اختيار A4 عمودي أو أفقي أو ملائمة مقاس الصورة أو US Letter وتحديد حجم الهوامش بكل سهولة.',
    },
    {
      q: 'هل يمكنني معاينة صفحات الـ PDF قبل التحميل؟',
      a: 'نعم! تتيح لك شاشة المعاينة التفاعلية رؤية شكل ورسومات الصفحات بأبعادها وهيئتها النهائية بدقة عالية قبل الحفظ.',
    },
    {
      q: 'هل يمكنني تحميل الملفات المحولة فرادى أو كملف ZIP؟',
      a: 'نعم، يمكنك تنزيل كل صفحة محولة بنقرة واحدة، أو تنزيل جميع الملفات في أرشيف ZIP مضغوط، أو تنزيل ملف الـ PDF المجمع.',
    },
    {
      q: 'ما هي أنواع المستندات الأخرى التي يمكنني تحويلها؟',
      a: 'يمكنك تحويل ملفات Word (.docx)، وPowerPoint (.pptx)، وExcel (.xlsx)، وHTML، والنصوص العادية، وPDF متبادلاً بكل سلاسة.',
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

function detectFormatFromFileName(name: string): FormatKey {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') return 'pdf'
  if (ext === 'docx' || ext === 'doc') return 'docx'
  if (ext === 'pptx' || ext === 'ppt') return 'pptx'
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return 'xlsx'
  if (ext === 'html' || ext === 'htm') return 'html'
  if (ext === 'jpg' || ext === 'jpeg') return 'jpg'
  if (ext === 'png') return 'png'
  if (ext === 'txt' || ext === 'md') return 'txt'
  return 'auto'
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return ['jpg', 'jpeg', 'png', 'webp', 'avif', 'bmp', 'tiff', 'tif', 'svg'].includes(ext)
}

export default function DocumentConverterTool() {
  const [sourceFormat, setSourceFormat] = useState<FormatKey>('auto')
  const [targetFormat, setTargetFormat] = useState<FormatKey>('pdf')
  const [items, setItems] = useState<DocumentQueueItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [conversionProgress, setConversionProgress] = useState<string>('')
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [activePreviewTab, setActivePreviewTab] = useState<'preview' | 'text' | 'pages'>('preview')
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState<number>(0)
  const [modalItem, setModalItem] = useState<DocumentQueueItem | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Layout & Styling Configuration for Images -> PDF
  const [pageSize, setPageSize] = useState<'a4-portrait' | 'a4-landscape' | 'fit' | 'letter-portrait' | 'letter-landscape' | 'auto'>('a4-portrait')
  const [fitMode, setFitMode] = useState<'contain' | 'cover' | 'original'>('contain')
  const [margin, setMargin] = useState<number>(30) // 0, 15, 30, 50
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF')
  const [exportMode, setExportMode] = useState<'merged' | 'individual'>('merged')
  const [pdfToDocxMode, setPdfToDocxMode] = useState<'editableText' | 'withImages'>('editableText')

  // Check if current queue is primarily images
  const hasImages = items.some((it) => it.isImage)
  const allImages = items.length > 0 && items.every((it) => it.isImage)

  // Effective source format
  const effectiveSource =
    sourceFormat !== 'auto'
      ? sourceFormat
      : items.length > 0
      ? items[0].format
      : 'jpg'

  const availableTargets = COMPATIBILITY_MAP[effectiveSource] || COMPATIBILITY_MAP.auto
  const validTarget = availableTargets.includes(targetFormat)
    ? targetFormat
    : availableTargets[0] || 'pdf'

  // Check if current mode is Images -> PDF
  const isImagesToPdf =
    validTarget === 'pdf' &&
    (sourceFormat === 'jpg' ||
      sourceFormat === 'png' ||
      (sourceFormat === 'auto' && (effectiveSource === 'jpg' || effectiveSource === 'png' || (items.length > 0 && hasImages))))

  const handleAddFiles = async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    if (fileArray.length === 0) return

    const newQueueItems: DocumentQueueItem[] = []

    for (const f of fileArray) {
      const isImg = isImageFile(f)
      const detected = detectFormatFromFileName(f.name)
      let previewUrl = ''
      let width: number | undefined
      let height: number | undefined

      if (isImg) {
        try {
          const canvas = await decodeFileToCanvas(f)
          width = canvas.width
          height = canvas.height
          previewUrl = canvas.toDataURL('image/jpeg', 0.85)
        } catch {
          if (f.type.startsWith('image/')) {
            previewUrl = URL.createObjectURL(f)
          }
        }
      }

      newQueueItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        name: f.name,
        size: f.size,
        format: detected,
        isImage: isImg,
        previewUrl,
        width,
        height,
        status: 'idle',
      })
    }

    setItems((prev) => [...prev, ...newQueueItems])
    setResult(null)

    // Auto-update formats if first time uploading
    if (items.length === 0 && newQueueItems.length > 0) {
      const first = newQueueItems[0]
      if (first.isImage) {
        setSourceFormat('jpg')
        setTargetFormat('pdf')
      } else if (first.format !== 'auto') {
        setSourceFormat(first.format)
        if (first.format === 'docx' || first.format === 'pptx' || first.format === 'xlsx' || first.format === 'html') {
          setTargetFormat('pdf')
        } else if (first.format === 'pdf') {
          setTargetFormat('docx')
        }
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files)
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
    if (currentPreviewIndex >= items.length - 1) {
      setCurrentPreviewIndex(Math.max(0, items.length - 2))
    }
  }

  const handleClearAll = () => {
    items.forEach((it) => {
      if (it.previewUrl && it.previewUrl.startsWith('blob:')) URL.revokeObjectURL(it.previewUrl)
      if (it.convertedUrl && it.convertedUrl.startsWith('blob:')) URL.revokeObjectURL(it.convertedUrl)
    })
    setItems([])
    setResult(null)
    setCurrentPreviewIndex(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= items.length) return

    setItems((prev) => {
      const copy = [...prev]
      const temp = copy[index]
      copy[index] = copy[targetIdx]
      copy[targetIdx] = temp
      return copy
    })
    setCurrentPreviewIndex(targetIdx)
  }

  const handleApplyPreset = (preset: { from: FormatKey; to: FormatKey }) => {
    setSourceFormat(preset.from)
    setTargetFormat(preset.to)
    setResult(null)
    toast.info(`Preset applied: ${FORMAT_CONFIGS[preset.from].label} → ${FORMAT_CONFIGS[preset.to].label}`)
  }

  // Master Conversion Function
  const handleConvert = async () => {
    if (items.length === 0) {
      toast.error('Please upload at least one file to convert')
      return
    }

    setIsConverting(true)
    setConversionProgress('Preparing files for conversion...')

    try {
      const updatedItems = [...items]

      // =========================================================================
      // Scenario A: Converting Images to PDF (Single or Multiple with Layout Options)
      // =========================================================================
      if (hasImages && validTarget === 'pdf') {
        const imageItems = updatedItems.filter((it) => it.isImage)
        const nonImageItems = updatedItems.filter((it) => !it.isImage)

        setConversionProgress(`Rendering ${imageItems.length} images into PDF (${pageSize.toUpperCase()}, ${fitMode})...`)

        const pdfOptions: ImageToPdfOptions = {
          pageSize,
          fitMode,
          margin,
          backgroundColor,
        }

        // 1. Process Individual PDFs for each image
        for (let i = 0; i < imageItems.length; i++) {
          const item = imageItems[i]
          item.status = 'converting'
          setItems([...updatedItems])

          try {
            const singlePdfBlob = await imagesToPdf([item.file], pdfOptions)
            const baseName = item.name.replace(/\.[^/.]+$/, '')
            item.convertedBlob = singlePdfBlob
            item.convertedUrl = URL.createObjectURL(singlePdfBlob)
            item.convertedName = `${baseName}.pdf`
            item.status = 'success'
          } catch (e: any) {
            item.status = 'error'
            item.error = e.message || 'Failed to convert image'
          }
          setItems([...updatedItems])
        }

        // 2. If Merged Mode (or multiple images available), build the merged PDF document
        let mergedPdfBlob: Blob | null = null
        const validImageFiles = imageItems.map((it) => it.file)

        if (validImageFiles.length > 0) {
          mergedPdfBlob = await imagesToPdf(validImageFiles, pdfOptions)
        }

        const mainBlob = mergedPdfBlob || imageItems[0]?.convertedBlob || new Blob([])
        const mainFilename =
          imageItems.length > 1
            ? `merged-document-${imageItems.length}-pages.pdf`
            : `${imageItems[0]?.name.replace(/\.[^/.]+$/, '') || 'document'}.pdf`

        setResult({
          blob: mainBlob,
          filename: mainFilename,
          mimeType: 'application/pdf',
          pageCount: imageItems.length,
          previewText: `Successfully compiled ${imageItems.length} photo(s) into PDF with ${pageSize} layout and ${fitMode} scaling.`,
          items: imageItems.map((it, idx) => ({
            name: it.convertedName || `page-${idx + 1}.pdf`,
            blob: it.convertedBlob || mainBlob,
            url: it.previewUrl,
          })),
        })

        toast.success(
          imageItems.length > 1
            ? `Successfully converted and merged ${imageItems.length} images into PDF!`
            : `Successfully converted image to PDF!`
        )

        // Activity Logging
        logToolActivity({
          toolId: 'document-converter',
          toolName: 'Office & Document Converter',
          category: 'converter',
          actionTitle: `Images to PDF (${imageItems.length} files)`,
          details: `Converted and merged ${imageItems.length} image(s) into single PDF document "${mainFilename}" (${pageSize}, ${fitMode})`,
          inputSnippet: imageItems.map((i) => i.file.name).join(', '),
          outputSnippet: mainFilename,
          metadata: {
            source: 'images',
            target: 'pdf',
            fileCount: imageItems.length,
            pageSize,
            fitMode,
            outputName: mainFilename,
          },
        })
      }

      // =========================================================================
      // Scenario B: Document Conversions (Word, PPTX, Excel, PDF, HTML, TXT)
      // =========================================================================
      else {
        const firstItem = updatedItems[0]
        const file = firstItem.file
        const baseName = file.name.replace(/\.[^/.]+$/, '')
        const src = firstItem.format !== 'auto' ? firstItem.format : effectiveSource
        const tgt = validTarget
        let res: ConversionResult | null = null

        setConversionProgress(`Converting ${src.toUpperCase()} to ${tgt.toUpperCase()}...`)

        // 1. DOCX Source
        if (src === 'docx') {
          const docxData = await parseDocx(file)
          if (tgt === 'pdf') {
            const pdfBlob = await generatePdfDocument({
              title: baseName,
              text: docxData.text,
              images: docxData.images && docxData.images.length > 0 && !docxData.text
                ? await Promise.all(docxData.images.map(async img => ({
                    data: await img.blob.arrayBuffer(),
                    type: (img.filename.toLowerCase().endsWith('png') ? 'png' : 'jpg') as 'png' | 'jpg'
                  })))
                : undefined
            })
            res = { blob: pdfBlob, filename: `${baseName}.pdf`, mimeType: 'application/pdf', previewHtml: docxData.html, previewText: docxData.text, pageCount: docxData.images?.length || 1 }
          } else if (tgt === 'html') {
            const htmlBlob = generateHtmlDocument({ title: baseName, bodyHtml: docxData.html, sourceType: 'Word Document' })
            res = { blob: htmlBlob, filename: `${baseName}.html`, mimeType: 'text/html', previewHtml: docxData.html, previewText: docxData.text }
          } else if (tgt === 'txt') {
            res = { blob: new Blob([docxData.text], { type: 'text/plain;charset=utf-8' }), filename: `${baseName}.txt`, mimeType: 'text/plain', previewText: docxData.text }
          } else if (tgt === 'jpg' || tgt === 'png') {
            const pdfBlob = await generatePdfDocument({ title: baseName, text: docxData.text })
            const imgs = await renderPdfToImages(pdfBlob, tgt as 'jpg' | 'png')
            res = {
              blob: imgs[0]?.blob || pdfBlob,
              filename: `${baseName}-page1.${tgt}`,
              mimeType: tgt === 'jpg' ? 'image/jpeg' : 'image/png',
              previewHtml: docxData.html,
              pageCount: imgs.length,
              items: imgs.map((img) => ({ name: `${baseName}-page${img.pageNumber}.${tgt}`, blob: img.blob, url: img.dataUrl })),
            }
          }
        }
        // 2. PPTX Source
        else if (src === 'pptx') {
          const pptxData = await parsePptx(file)
          if (tgt === 'pdf') {
            const slideParas = pptxData.slides.map((s) => `[SLIDE ${s.slideNumber}] ${s.title}\n\n${s.bullets.map((b) => `• ${b}`).join('\n')}`)
            const pdfBlob = await generatePdfDocument({ title: baseName, paragraphs: slideParas })
            res = { blob: pdfBlob, filename: `${baseName}.pdf`, mimeType: 'application/pdf', previewHtml: pptxData.html, previewText: pptxData.text, pageCount: pptxData.slides.length }
          } else if (tgt === 'html') {
            const htmlBlob = generateHtmlDocument({ title: baseName, bodyHtml: pptxData.html, sourceType: 'PowerPoint' })
            res = { blob: htmlBlob, filename: `${baseName}-slides.html`, mimeType: 'text/html', previewHtml: pptxData.html, pageCount: pptxData.slides.length }
          } else if (tgt === 'txt') {
            res = { blob: new Blob([pptxData.text], { type: 'text/plain;charset=utf-8' }), filename: `${baseName}-outline.txt`, mimeType: 'text/plain', previewText: pptxData.text }
          }
        }
        // 3. XLSX Source
        else if (src === 'xlsx') {
          const xlsxData = await parseXlsx(file)
          if (tgt === 'pdf') {
            const pdfBlob = await generatePdfDocument({ title: `${baseName} - Spreadsheet`, text: xlsxData.text })
            res = { blob: pdfBlob, filename: `${baseName}.pdf`, mimeType: 'application/pdf', previewHtml: xlsxData.html, previewText: xlsxData.text }
          } else if (tgt === 'html') {
            const htmlBlob = generateHtmlDocument({ title: baseName, bodyHtml: xlsxData.html, sourceType: 'Excel Spreadsheet' })
            res = { blob: htmlBlob, filename: `${baseName}.html`, mimeType: 'text/html', previewHtml: xlsxData.html }
          } else if (tgt === 'txt') {
            res = { blob: new Blob([xlsxData.text], { type: 'text/plain;charset=utf-8' }), filename: `${baseName}.csv`, mimeType: 'text/csv', previewText: xlsxData.text }
          }
        }
        // 4. PDF Source
        else if (src === 'pdf') {
          const pdfData = await parsePdf(file)
          const pageImages = await renderPdfToImages(file, 'jpg', 0.92, 2.0).catch(() => [])
          if (tgt === 'docx') {
            setConversionProgress('Analyzing document structure and performing OCR text recognition...')
            const finalParagraphs: string[] = []
            let fullHtml = ''

            for (let i = 0; i < pdfData.pages.length; i++) {
              const p = pdfData.pages[i]
              let pageText = p.text?.trim() || ''
              let pageHtml = ''

              // Run OCR if text is short/scanned image form or missing
              if (pageText.length < 50 && pageImages[i]) {
                setConversionProgress(`Recognizing text via OCR on page ${i + 1} of ${pdfData.pages.length}...`)
                const ocrRes = await performOcrOnImageBlob(pageImages[i].blob)
                if (ocrRes.text && ocrRes.text.trim().length > pageText.length) {
                  pageText = ocrRes.text.trim()
                  pageHtml = ocrRes.html
                }
              }

              if (pageText) {
                if (pdfData.pages.length > 1) {
                  finalParagraphs.push(`--- Page ${p.pageNumber} ---`)
                }
                finalParagraphs.push(pageText)
                fullHtml += (pageHtml || `<p>${pageText.replace(/\n+/g, '</p><p>')}</p>`) + '\n'
              }
            }

            const fullExtractedText = finalParagraphs.join('\n\n')

            const docxBlob = await generateDocxFile({
              title: baseName,
              text: fullExtractedText,
              html: fullHtml,
              paragraphs: finalParagraphs,
              images: pdfToDocxMode === 'withImages' ? pageImages.map((img) => ({ data: img.blob, type: 'jpg' })) : undefined,
              includeImagePages: pdfToDocxMode === 'withImages',
            })
            res = {
              blob: docxBlob,
              filename: `${baseName}.docx`,
              mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              previewText: fullExtractedText,
              pageCount: pdfData.pageCount,
            }
          } else if (tgt === 'jpg' || tgt === 'png') {
            const images = await renderPdfToImages(file, tgt)
            res = {
              blob: images[0]?.blob || new Blob([]),
              filename: `${baseName}-page1.${tgt}`,
              mimeType: tgt === 'jpg' ? 'image/jpeg' : 'image/png',
              previewText: `Extracted ${images.length} pages as high-res ${tgt.toUpperCase()} images.`,
              pageCount: images.length,
              items: images.map((img) => ({ name: `${baseName}-page${img.pageNumber}.${tgt}`, blob: img.blob, url: img.dataUrl })),
            }
          } else if (tgt === 'html') {
            const htmlContent = `<div class="space-y-4">${pdfData.pages.map((p) => `<div class="p-4 border rounded-xl bg-card"><div class="text-xs text-muted-foreground font-bold mb-1">Page ${p.pageNumber}</div><p class="whitespace-pre-wrap text-sm">${p.text}</p></div>`).join('')}</div>`
            const htmlBlob = generateHtmlDocument({ title: baseName, bodyHtml: htmlContent, sourceType: 'PDF' })
            res = { blob: htmlBlob, filename: `${baseName}.html`, mimeType: 'text/html', previewHtml: htmlContent, pageCount: pdfData.pageCount }
          } else if (tgt === 'txt') {
            res = { blob: new Blob([pdfData.text], { type: 'text/plain;charset=utf-8' }), filename: `${baseName}.txt`, mimeType: 'text/plain', previewText: pdfData.text, pageCount: pdfData.pageCount }
          } else if (tgt === 'pptx') {
            setConversionProgress('Generating PPTX slides with extracted editable content...')
            const slides = []
            for (let i = 0; i < pdfData.pages.length; i++) {
              const p = pdfData.pages[i]
              let pageText = p.text?.trim() || ''

              if (pageText.length < 50 && pageImages[i]) {
                const ocrRes = await performOcrOnImageBlob(pageImages[i].blob)
                if (ocrRes.text && ocrRes.text.trim().length > pageText.length) {
                  pageText = ocrRes.text.trim()
                }
              }

              const lines = pageText.split('\n').filter((l) => l.trim().length > 0)
              const title = lines[0] ? lines[0].slice(0, 70) : `الصفحة ${p.pageNumber}`
              const bullets = lines.slice(1, 12).map((l) => l.slice(0, 150))
              if (bullets.length === 0) {
                bullets.push(lines[0] || `محتوى الصفحة ${p.pageNumber}`)
              }

              slides.push({
                title,
                bullets,
              })
            }

            const pptxBlob = await generatePptxFile({
              title: baseName,
              slides,
              images: pdfToDocxMode === 'withImages' ? pageImages.map((img) => ({ data: img.blob, type: 'jpg' })) : undefined,
              includeBackgroundImages: pdfToDocxMode === 'withImages',
            })
            res = {
              blob: pptxBlob,
              filename: `${baseName}.pptx`,
              mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              previewText: pdfData.text,
              pageCount: pdfData.pageCount,
            }
          } else if (tgt === 'xlsx') {
            setConversionProgress('Analyzing document structure & converting to Excel...')
            let fullHtml = ''
            const rows: any[][] = []

            for (let i = 0; i < pdfData.pages.length; i++) {
              const p = pdfData.pages[i]
              let pageText = p.text?.trim() || ''

              if (pageText.length < 50 && pageImages[i]) {
                const ocrRes = await performOcrOnImageBlob(pageImages[i].blob)
                if (ocrRes.text && ocrRes.text.trim().length > pageText.length) {
                  pageText = ocrRes.text.trim()
                  if (ocrRes.html) fullHtml += ocrRes.html + '\n'
                }
              }

              if (pageText) {
                const lines = pageText.split('\n').filter((l) => l.trim().length > 0)
                lines.forEach((l) => {
                  if (l.includes('\t')) {
                    rows.push(l.split('\t').map((c) => c.trim()))
                  } else if (/\s{2,}/.test(l)) {
                    rows.push(l.split(/\s{2,}/).map((c) => c.trim()))
                  } else if (l.includes(':')) {
                    const parts = l.split(':')
                    rows.push([parts[0].trim(), parts.slice(1).join(':').trim()])
                  } else {
                    rows.push([l.trim()])
                  }
                })
              }
            }

            const xlsxBlob = generateXlsxFromData({
              sheetName: baseName,
              rows: rows.length > 0 ? rows : undefined,
              htmlTable: fullHtml.includes('<table') ? fullHtml : undefined,
            })
            res = {
              blob: xlsxBlob,
              filename: `${baseName}.xlsx`,
              mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              previewText: pdfData.text,
              pageCount: pdfData.pageCount,
            }
          }
        }
        // 5. HTML Source
        else if (src === 'html') {
          const textContent = await file.text()
          if (tgt === 'pdf') {
            const pdfBlob = await generatePdfDocument({ title: baseName, text: textContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() })
            res = { blob: pdfBlob, filename: `${baseName}.pdf`, mimeType: 'application/pdf', previewHtml: textContent }
          } else if (tgt === 'docx') {
            const docxBlob = await generateDocxFile({ title: baseName, html: textContent })
            res = { blob: docxBlob, filename: `${baseName}.docx`, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', previewHtml: textContent }
          }
        }
        // 6. Plain Text Source
        else if (src === 'txt') {
          const textContent = await file.text()
          if (tgt === 'pdf') {
            const pdfBlob = await generatePdfDocument({ title: baseName, text: textContent })
            res = { blob: pdfBlob, filename: `${baseName}.pdf`, mimeType: 'application/pdf', previewText: textContent }
          } else if (tgt === 'docx') {
            const docxBlob = await generateDocxFile({ title: baseName, text: textContent })
            res = { blob: docxBlob, filename: `${baseName}.docx`, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', previewText: textContent }
          }
        }
        // 7. Image Source (JPG/PNG -> DOCX or XLSX via OCR)
        else if ((src === 'jpg' || src === 'png') && tgt === 'docx') {
          setConversionProgress('Recognizing text inside image via OCR...')
          const ocrRes = await performOcrOnImageBlob(file)
          const paragraphs = ocrRes.text.split(/\r?\n\r?\n|\r?\n/).map((l) => l.trim()).filter(Boolean)
          const docxBlob = await generateDocxFile({
            title: baseName,
            text: ocrRes.text,
            html: ocrRes.html,
            paragraphs: paragraphs.length > 0 ? paragraphs : ['No text recognized from image.'],
            images: pdfToDocxMode === 'withImages' ? [{ data: await file.arrayBuffer(), type: src as 'jpg' | 'png' }] : undefined,
            includeImagePages: pdfToDocxMode === 'withImages',
          })
          res = {
            blob: docxBlob,
            filename: `${baseName}.docx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            previewText: ocrRes.text,
            pageCount: 1,
          }
        } else if ((src === 'jpg' || src === 'png') && tgt === 'xlsx') {
          setConversionProgress('Recognizing text & tabular structure from image for Excel...')
          const ocrRes = await performOcrOnImageBlob(file)
          const rows: any[][] = []

          if (ocrRes.text) {
            const lines = ocrRes.text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
            lines.forEach((l) => {
              if (l.includes('\t')) {
                rows.push(l.split('\t').map((c) => c.trim()))
              } else if (/\s{2,}/.test(l)) {
                rows.push(l.split(/\s{2,}/).map((c) => c.trim()))
              } else if (l.includes(':')) {
                const parts = l.split(':')
                rows.push([parts[0].trim(), parts.slice(1).join(':').trim()])
              } else {
                rows.push([l.trim()])
              }
            })
          }

          const xlsxBlob = generateXlsxFromData({
            sheetName: baseName,
            rows: rows.length > 0 ? rows : undefined,
            htmlTable: ocrRes.html.includes('<table') ? ocrRes.html : undefined,
          })
          res = {
            blob: xlsxBlob,
            filename: `${baseName}.xlsx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            previewText: ocrRes.text,
            pageCount: 1,
          }
        }

        if (res) {
          firstItem.status = 'success'
          firstItem.convertedBlob = res.blob
          firstItem.convertedUrl = URL.createObjectURL(res.blob)
          firstItem.convertedName = res.filename
          setItems([...updatedItems])
          setResult(res)
          toast.success(`Successfully converted to ${tgt.toUpperCase()}!`)

          // Detailed activity logging
          const fileSizeFormatted =
            file.size > 1024 * 1024
              ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
              : `${(file.size / 1024).toFixed(1)} KB`

          logToolActivity({
            toolId: 'document-converter',
            toolName: 'Office & Document Converter',
            category: 'converter',
            actionTitle: `${src.toUpperCase()} to ${tgt.toUpperCase()}`,
            details: `Converted ${src.toUpperCase()} file "${file.name}" (${fileSizeFormatted}) to ${tgt.toUpperCase()} output "${res.filename}"`,
            inputSnippet: `File: ${file.name}\nSize: ${fileSizeFormatted}\nType: ${file.type || src}`,
            outputSnippet: `Output: ${res.filename}\nMIME: ${res.mimeType}${res.pageCount ? `\nPages: ${res.pageCount}` : ''}`,
            metadata: {
              sourceFormat: src,
              targetFormat: tgt,
              originalFilename: file.name,
              outputFilename: res.filename,
              fileSizeBytes: file.size,
              pageCount: res.pageCount || 1,
            },
          })
        }
      }

      // Record tool usage
      try {
        await incrementToolUsage()
        await markToolUsed('document-converter')
      } catch {
        // silent
      }
    } catch (err: any) {
      console.error(err)
      toast.error(`Conversion failed: ${err?.message || 'Unknown error'}`)
    } finally {
      setIsConverting(false)
      setConversionProgress('')
    }
  }

  // Single Item Download
  const handleDownloadItem = (item: DocumentQueueItem) => {
    if (!item.convertedBlob) return
    const url = item.convertedUrl || URL.createObjectURL(item.convertedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = item.convertedName || `${item.name.replace(/\.[^/.]+$/, '')}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success(`Downloaded ${a.download}`)
  }

  // Download All as ZIP
  const handleDownloadAllZip = async () => {
    const convertedItems = items.filter((it) => it.status === 'success' && it.convertedBlob)
    if (convertedItems.length === 0) {
      toast.error('No converted files ready to download')
      return
    }

    const zip = new JSZip()
    convertedItems.forEach((it) => {
      const fname = it.convertedName || `${it.name.replace(/\.[^/.]+$/, '')}.pdf`
      zip.file(fname, it.convertedBlob!)
    })

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const zipUrl = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = zipUrl
    a.download = `converted-documents-${Date.now()}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(zipUrl)
    toast.success('Downloaded all individual PDF files as ZIP!')
  }

  // Download Combined PDF
  const handleDownloadCombined = () => {
    if (!result?.blob) return
    const url = URL.createObjectURL(result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${result.filename}`)
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Text copied to clipboard!')
  }

  // Currently active item for page simulation preview
  const activeSimulatedItem = items[currentPreviewIndex] || items[0]

  // Aspect ratio styling for page simulator
  const getPageSimulatorAspect = () => {
    if (pageSize === 'a4-portrait') return 'aspect-[210/297]'
    if (pageSize === 'a4-landscape') return 'aspect-[297/210]'
    if (pageSize === 'letter-portrait') return 'aspect-[8.5/11]'
    if (pageSize === 'letter-landscape') return 'aspect-[11/8.5]'
    if (pageSize === 'auto' && activeSimulatedItem?.width && activeSimulatedItem?.height) {
      return activeSimulatedItem.width > activeSimulatedItem.height ? 'aspect-[297/210]' : 'aspect-[210/297]'
    }
    return 'aspect-[3/4]' // default fit
  }

  return (
    <ToolLayout metadata={toolMeta}>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Quick Conversion Presets */}
        <div className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs backdrop-blur-xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Popular One-Click Presets
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">Click to configure source & target</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {PRESET_CONVERSIONS.map((preset, idx) => {
              const isSelected =
                (sourceFormat === preset.from || (sourceFormat === 'auto' && effectiveSource === preset.from)) &&
                targetFormat === preset.to
              return (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(preset)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                      : 'border-border/60 bg-card hover:border-primary/50 hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <span className="text-base mb-1">{preset.icon}</span>
                  <span className="text-xs font-medium leading-tight">{preset.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Format Selector Bar: From -> To */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-4">
            {/* From Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Source Format (Convert From)
              </label>
              <div className="relative">
                <select
                  value={sourceFormat}
                  onChange={(e) => {
                    const val = e.target.value as FormatKey
                    setSourceFormat(val)
                    setResult(null)
                  }}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                >
                  <option value="auto">⚡ Auto-Detect (from files)</option>
                  <option value="jpg">Images (JPG, PNG, WEBP, AVIF)</option>
                  <option value="docx">Word (.docx, .doc)</option>
                  <option value="pdf">PDF Document (.pdf)</option>
                  <option value="pptx">PowerPoint (.pptx, .ppt)</option>
                  <option value="xlsx">Excel Spreadsheet (.xlsx, .csv)</option>
                  <option value="html">HTML Webpage (.html, .htm)</option>
                  <option value="txt">Plain Text (.txt, .md)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Direction Arrow */}
            <div className="flex justify-center pt-2 md:pt-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>

            {/* To Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Target Format (Convert To)
              </label>
              <div className="relative">
                <select
                  value={validTarget}
                  onChange={(e) => {
                    setTargetFormat(e.target.value as FormatKey)
                    setResult(null)
                  }}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                >
                  {availableTargets.map((t) => (
                    <option key={t} value={t}>
                      {FORMAT_CONFIGS[t].label} ({FORMAT_CONFIGS[t].ext})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Word Options Panel (when target format is DOCX) */}
        {validTarget === 'docx' && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="w-4 h-4 text-primary" />
                <span>خيارات تحويل Word (Word Conversion Options)</span>
              </div>
              <span className="text-xs text-muted-foreground bg-background/80 px-2.5 py-1 rounded-full border border-border">
                {pdfToDocxMode === 'editableText' ? '⚡ نص قابل للتعديل المباشر' : '🖼️ مع صور الخلفية'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPdfToDocxMode('editableText')}
                className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                  pdfToDocxMode === 'editableText'
                    ? 'border-primary bg-background shadow-xs text-primary font-medium'
                    : 'border-border/60 bg-background/50 hover:bg-background text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> نص Word قابل للتعديل (موصى به)
                  </span>
                  {pdfToDocxMode === 'editableText' && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  يحلل المستند ويستخرج النصوص (بما فيها النص داخل الصور بالمسح الضوئي OCR) ويضعها مباشرة في ملف Word لتعديلها بسهولة بدون صور خلفية أو صفحات إضافية.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPdfToDocxMode('withImages')}
                className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                  pdfToDocxMode === 'withImages'
                    ? 'border-primary bg-background shadow-xs text-primary font-medium'
                    : 'border-border/60 bg-background/50 hover:bg-background text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-primary" /> تضمين صور الخلفية مع النص
                  </span>
                  {pdfToDocxMode === 'withImages' && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  يتضمن صور الصفحة الأصلية بالإضافة إلى النصوص لاستعراض الصورة مع النص.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Page & Layout Options (Displayed ONLY when converting images to PDF) */}
        {isImagesToPdf && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Layout className="w-4 h-4 text-primary" /> PDF Page Layout & Customization
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure page dimensions, image placement, margins, and export mode
                </p>
              </div>
              <Badge variant="outline" className="text-xs w-fit text-primary border-primary/30">
                <Sliders className="w-3 h-3 mr-1" /> Dynamic Layout Engine
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Page Size */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Page Dimensions
                </label>
                <select
                  value={pageSize}
                  onChange={(e: any) => setPageSize(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="a4-portrait">📄 A4 Portrait (210 × 297 mm)</option>
                  <option value="a4-landscape">🖼️ A4 Landscape (297 × 210 mm)</option>
                  <option value="fit">📐 Fit to Image (Dynamic Ratio)</option>
                  <option value="auto">⚡ Smart Auto-Orientation</option>
                  <option value="letter-portrait">📜 US Letter Portrait</option>
                  <option value="letter-landscape">📜 US Letter Landscape</option>
                </select>
              </div>

              {/* Image Fit Mode */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Image Scaling (Fit Mode)
                </label>
                <select
                  value={fitMode}
                  onChange={(e: any) => setFitMode(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="contain">🔍 Fit Inside Page (Preserve Aspect)</option>
                  <option value="cover">📐 Fill Page / Full Bleed</option>
                  <option value="original">🎯 1:1 Original Pixel Size</option>
                </select>
              </div>

              {/* Page Margin */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Page Margin
                </label>
                <select
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value={0}>0 mm (No Margin / Borderless)</option>
                  <option value={15}>5 mm (Compact Margin)</option>
                  <option value={30}>10 mm (Standard Margin)</option>
                  <option value={50}>18 mm (Spacious Margin)</option>
                </select>
              </div>

              {/* Export Mode */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Download Mode
                </label>
                <select
                  value={exportMode}
                  onChange={(e: any) => setExportMode(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="merged">📑 Merge All into 1 Combined PDF</option>
                  <option value="individual">🗂️ Export Each as Individual PDF</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Upload Zone (Supports Multi-Selection) */}
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
            accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.html,.htm,.jpg,.jpeg,.png,.webp,.avif,.bmp,.tiff,.tif,.txt,.md"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleAddFiles(e.target.files)
              }
            }}
          />

          <div className="space-y-3 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Select or drag & drop multiple files or images
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Multi-select enabled: Choose multiple PNG/JPG photos to create PDF, or upload Word, PowerPoint, Excel & PDF files
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl pointer-events-none text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Browse Files (Multi-Select Enabled)
            </Button>
          </div>
        </div>

        {/* Queued Files List & Reordering */}
        {items.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  Queued Files ({items.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ready to transform into <strong className="text-foreground">{FORMAT_CONFIGS[validTarget].label}</strong>
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs h-9 rounded-xl gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add More Files
                </Button>

                {items.some((it) => it.status === 'success') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAllZip}
                    className="text-xs h-9 rounded-xl gap-1.5"
                  >
                    <FileArchive className="w-3.5 h-3.5" /> Download All ZIP
                  </Button>
                )}

                <Button
                  onClick={handleConvert}
                  disabled={isConverting}
                  size="sm"
                  className="rounded-xl gap-1.5 font-semibold text-xs h-9 px-4 shadow-xs"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Converting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" /> Convert to {FORMAT_CONFIGS[validTarget].label}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Grid of Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item, idx) => {
                const isConverted = item.status === 'success'
                const isCurrentPreview = currentPreviewIndex === idx

                return (
                  <div
                    key={item.id}
                    className={`relative rounded-xl border p-3.5 flex flex-col justify-between gap-3 transition-all ${
                      isCurrentPreview
                        ? 'border-primary ring-1 ring-primary bg-primary/5'
                        : 'border-border bg-muted/20 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail / Icon */}
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPreviewIndex(idx)
                          if (item.previewUrl) setModalItem(item)
                        }}
                        title="Click to preview"
                        className="relative w-14 h-14 rounded-lg bg-card border border-border/60 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer group/thumb hover:ring-2 hover:ring-primary transition-all"
                      >
                        {item.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                          />
                        ) : (
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            Page {idx + 1} of {items.length}
                          </span>
                          <div className="flex items-center gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveItem(idx, 'up')}
                                title="Move up"
                                className="p-0.5 hover:text-primary transition-colors cursor-pointer"
                              >
                                <MoveUp className="w-3 h-3" />
                              </button>
                            )}
                            {idx < items.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveItem(idx, 'down')}
                                title="Move down"
                                className="p-0.5 hover:text-primary transition-colors cursor-pointer"
                              >
                                <MoveDown className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs font-semibold text-foreground truncate mt-0.5">{item.name}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                          <span>{formatFileSize(item.size)}</span>
                          {item.width && item.height && (
                            <>
                              <span>•</span>
                              <span>{item.width}×{item.height}px</span>
                            </>
                          )}
                        </div>

                        {item.status === 'success' && (
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                            <CheckCircle2 className="w-3 h-3" /> Converted (PDF)
                          </div>
                        )}
                        {item.status === 'converting' && (
                          <div className="flex items-center gap-1.5 text-[10px] text-primary font-semibold mt-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Processing
                          </div>
                        )}
                        {item.status === 'error' && (
                          <div className="text-[10px] text-destructive font-semibold mt-1 truncate">
                            {item.error || 'Failed'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 gap-2">
                      {isImagesToPdf ? (
                        <button
                          type="button"
                          onClick={() => setCurrentPreviewIndex(idx)}
                          className={`text-[11px] font-medium transition-colors cursor-pointer ${
                            isCurrentPreview ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {isCurrentPreview ? '● Active Preview' : 'Select for Preview'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">{item.format.toUpperCase()}</span>
                      )}

                      <div className="flex items-center gap-2">
                        {isConverted && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadItem(item)}
                            className="h-6 px-2 text-[10px] rounded-lg gap-1 border-primary/40 text-primary"
                          >
                            <Download className="w-2.5 h-2.5" /> PDF
                          </Button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-[11px] text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {conversionProgress && (
              <p className="text-xs text-center text-muted-foreground animate-pulse">
                {conversionProgress}
              </p>
            )}
          </div>
        )}

        {/* Live Visual Page & PDF Preview Section (Only for Images to PDF) */}
        {items.length > 0 && activeSimulatedItem && isImagesToPdf && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6 animate-in fade-in-50 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">
                    Live PDF Page Preview
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Inspecting Page {currentPreviewIndex + 1} of {items.length}:{' '}
                    <strong className="text-foreground">{activeSimulatedItem.name}</strong> • Layout: {pageSize.toUpperCase()} ({fitMode})
                  </p>
                </div>
              </div>

              {/* Navigation buttons for preview pages */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPreviewIndex === 0}
                  onClick={() => setCurrentPreviewIndex((prev) => Math.max(0, prev - 1))}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-semibold px-2">
                  {currentPreviewIndex + 1} / {items.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPreviewIndex >= items.length - 1}
                  onClick={() => setCurrentPreviewIndex((prev) => Math.min(items.length - 1, prev + 1))}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Simulated Page Container */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-muted/40 rounded-xl border border-border/80 overflow-hidden">
              <div
                className={`relative bg-white text-black shadow-2xl rounded-sm border border-neutral-300 max-w-full transition-all duration-300 overflow-hidden flex items-center justify-center ${getPageSimulatorAspect()}`}
                style={{
                  width: pageSize.includes('landscape') ? 'min(100%, 640px)' : 'min(100%, 460px)',
                  padding: `${Math.max(0, margin / 3.5)}px`,
                  backgroundColor: backgroundColor,
                }}
              >
                {/* Visual margin boundary guideline */}
                {margin > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none border border-dashed border-sky-400/30 m-[inherit]"
                    style={{ margin: `${Math.max(0, margin / 3.5)}px` }}
                  />
                )}

                {activeSimulatedItem.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeSimulatedItem.previewUrl}
                    alt={activeSimulatedItem.name}
                    className={`w-full h-full transition-all ${
                      fitMode === 'contain'
                        ? 'object-contain'
                        : fitMode === 'cover'
                        ? 'object-cover'
                        : 'object-none'
                    }`}
                  />
                ) : (
                  <div className="p-8 text-center space-y-2">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-xs font-semibold text-neutral-700">{activeSimulatedItem.name}</p>
                    <p className="text-[10px] text-neutral-500">Document Page Placeholder</p>
                  </div>
                )}

                {/* Simulated page number watermark footer */}
                <div className="absolute bottom-1.5 right-2 text-[9px] text-neutral-400 font-mono select-none">
                  {currentPreviewIndex + 1}
                </div>
              </div>

              {/* Page Carousel Thumbnails */}
              {items.length > 1 && (
                <div className="flex items-center gap-2 mt-6 overflow-x-auto max-w-full p-1 custom-scrollbar">
                  {items.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCurrentPreviewIndex(idx)}
                      className={`relative w-12 h-14 rounded-md border shrink-0 overflow-hidden cursor-pointer transition-all ${
                        currentPreviewIndex === idx
                          ? 'border-primary ring-2 ring-primary scale-105'
                          : 'border-border/80 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {item.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-card flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 bg-black/70 text-white text-[8px] font-bold px-1 rounded-tl">
                        {idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results & Download Master Action Section */}
        {result && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6 animate-in fade-in-50 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">Conversion Completed</h3>
                  <p className="text-xs text-muted-foreground">
                    Output: <span className="font-semibold text-foreground">{result.filename}</span> •{' '}
                    {formatFileSize(result.blob.size)}
                    {result.pageCount ? ` • ${result.pageCount} pages compiled` : ''}
                  </p>
                </div>
              </div>

              {/* Master Download Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {result.items && result.items.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleDownloadAllZip}
                    className="rounded-xl gap-2 font-semibold shadow-xs"
                  >
                    <FileArchive className="w-4 h-4" /> Download All (ZIP)
                  </Button>
                )}

                <Button
                  onClick={handleDownloadCombined}
                  className="rounded-xl gap-2 font-semibold shadow-xs"
                >
                  <Download className="w-4 h-4" /> Download {FORMAT_CONFIGS[validTarget].label}
                </Button>
              </div>
            </div>

            {/* Individual Extracted Pages List */}
            {result.items && result.items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Individual Converted Pages ({result.items.length})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Download each page independently or as a combined package
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-1 custom-scrollbar">
                  {result.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-xl border border-border overflow-hidden bg-muted/20 hover:border-primary/60 transition-all p-2 text-center"
                    >
                      {item.url && (
                        <div className="aspect-[3/4] bg-card rounded-lg overflow-hidden mb-2 border border-border/50 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.url}
                            alt={item.name}
                            className="object-contain w-full h-full"
                          />
                        </div>
                      )}
                      <p className="text-[11px] font-medium text-foreground truncate">{item.name}</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const url = URL.createObjectURL(item.blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = item.name
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                          URL.revokeObjectURL(url)
                          toast.success(`Downloaded ${item.name}`)
                        }}
                        className="w-full mt-2 h-7 text-[11px] rounded-lg gap-1 opacity-90 group-hover:opacity-100"
                      >
                        <Download className="w-3 h-3" /> Save File
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Content / HTML / Text Preview */}
            {(result.previewHtml || result.previewText) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    {result.previewHtml && (
                      <button
                        onClick={() => setActivePreviewTab('preview')}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          activePreviewTab === 'preview'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Visual Document Preview
                      </button>
                    )}
                    {result.previewText && (
                      <button
                        onClick={() => setActivePreviewTab('text')}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          activePreviewTab === 'text'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Extracted Text View
                      </button>
                    )}
                  </div>

                  {result.previewText && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyText(result.previewText || '')}
                      className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Text
                    </Button>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-4 max-h-[460px] overflow-y-auto text-sm custom-scrollbar">
                  {activePreviewTab === 'preview' && result.previewHtml ? (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: result.previewHtml }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-xs text-foreground/90 leading-relaxed">
                      {result.previewText}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal High-Res Preview */}
        <Dialog open={!!modalItem} onOpenChange={(open) => !open && setModalItem(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold truncate">
                {modalItem?.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {modalItem ? `${formatFileSize(modalItem.size)} • ${modalItem.width || ''}×${modalItem.height || ''}px` : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-muted/30 rounded-xl border border-border min-h-[300px]">
              {modalItem?.previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={modalItem.previewUrl}
                  alt={modalItem.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalItem(null)}
                className="text-xs rounded-xl"
              >
                Close Preview
              </Button>
              {modalItem?.convertedBlob && (
                <Button
                  size="sm"
                  onClick={() => modalItem && handleDownloadItem(modalItem)}
                  className="text-xs rounded-xl gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ToolLayout>
  )
}
