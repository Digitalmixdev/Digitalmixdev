'use client'

import React, { useState, useRef, useTransition } from 'react'
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
  ExternalLink,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
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
import { imagesToPdf, convertSingleImage } from '@/lib/converters/image-converter'

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

// Matrix of supported destination formats per source format
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
  { from: 'docx' as FormatKey, to: 'pdf' as FormatKey, label: 'Word to PDF', icon: '📄' },
  { from: 'pdf' as FormatKey, to: 'docx' as FormatKey, label: 'PDF to Word', icon: '📑' },
  { from: 'xlsx' as FormatKey, to: 'pdf' as FormatKey, label: 'Excel to PDF', icon: '📊' },
  { from: 'pptx' as FormatKey, to: 'pdf' as FormatKey, label: 'PPTX to PDF', icon: '📽️' },
  { from: 'jpg' as FormatKey, to: 'pdf' as FormatKey, label: 'JPG to PDF', icon: '🖼️' },
  { from: 'pdf' as FormatKey, to: 'jpg' as FormatKey, label: 'PDF to JPG', icon: '📸' },
  { from: 'html' as FormatKey, to: 'pdf' as FormatKey, label: 'HTML to PDF', icon: '🌐' },
  { from: 'xlsx' as FormatKey, to: 'html' as FormatKey, label: 'Excel to HTML', icon: '📋' },
]

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

const toolMeta: ToolMetadata = {
  id: 'document-converter',
  name: 'Document & Office Converter',
  description:
    'Convert between PDF, Word DOCX, PowerPoint PPTX, Excel XLSX, HTML, and Images (JPG/PNG) instantly inside your browser with 100% data privacy.',
  category: {
    id: 'files',
    name: 'File Utilities',
    slug: 'files',
  },
  icon: RefreshCw,
  privacyBadge: '100% Client-Side • Zero File Uploads • In-Memory Processing',
  features: [
    {
      icon: RefreshCw,
      title: 'Full Format Conversion Matrix',
      desc: 'Bidirectional conversions between PDF, Word (DOCX), Excel (XLSX), PowerPoint (PPTX), HTML, and Images.',
    },
    {
      icon: ShieldCheck,
      title: 'Guaranteed Local Confidentiality',
      desc: 'Contracts, balance sheets, and proprietary slides are converted entirely in local memory with zero server uploads.',
    },
    {
      icon: Zap,
      title: 'High-Fidelity Extraction',
      desc: 'Preserves slide outlines, spreadsheet tables, document headings, and image resolutions accurately.',
    },
    {
      icon: Layers,
      title: 'Live Interactive Preview',
      desc: 'Inspect converted HTML, extracted slides, spreadsheet data grids, and page previews before downloading.',
    },
  ],
  faqs: [
    {
      q: 'Which formats are supported for conversion?',
      a: 'The converter supports PDF (.pdf), Microsoft Word (.docx, .doc), Microsoft PowerPoint (.pptx, .ppt), Microsoft Excel (.xlsx, .xls, .csv), HTML (.html, .htm), Images (.jpg, .png), and Plain Text (.txt, .md).',
    },
    {
      q: 'Does my document get uploaded to any third-party server?',
      a: 'No! All parsing, formatting, and file generation processes take place 100% client-side inside your web browser. No confidential files ever touch a remote server.',
    },
    {
      q: 'How does PowerPoint to PDF or HTML conversion work?',
      a: 'The engine parses the XML slide tree inside the presentation, extracts slide titles, shapes, bullets, and body content, then compiles them into a publication-ready PDF or interactive responsive HTML slide deck.',
    },
    {
      q: 'Can I convert multi-page PDFs to JPG images?',
      a: 'Yes, each page of your PDF is rendered to high-resolution canvas images (150-300 DPI) that you can download individually or save together.',
    },
    {
      q: 'Can I convert Excel sheets to formatted HTML or PDF?',
      a: 'Yes! Upload any .xlsx, .xls, or .csv file and choose HTML to get an embeddable table or PDF to get a structured multi-page document.',
    },
  ],
}

export default function DocumentConverterTool() {
  const [sourceFormat, setSourceFormat] = useState<FormatKey>('auto')
  const [targetFormat, setTargetFormat] = useState<FormatKey>('pdf')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [conversionProgress, setConversionProgress] = useState<string>('')
  const [result, setResult] = useState<ConversionResult | null>(null)
  const [activePreviewTab, setActivePreviewTab] = useState<'preview' | 'text' | 'info'>('preview')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determine actual effective source format
  const effectiveSource =
    sourceFormat !== 'auto'
      ? sourceFormat
      : selectedFile
      ? detectFormatFromFileName(selectedFile.name)
      : 'pdf'

  const availableTargets = COMPATIBILITY_MAP[effectiveSource] || COMPATIBILITY_MAP.auto

  // Ensure target is valid when source changes
  const validTarget = availableTargets.includes(targetFormat)
    ? targetFormat
    : availableTargets[0] || 'pdf'

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setResult(null)
    const detected = detectFormatFromFileName(file.name)
    if (detected !== 'auto') {
      setSourceFormat(detected)
      const targets = COMPATIBILITY_MAP[detected]
      // Pick a smart default target
      if (detected === 'docx') setTargetFormat('pdf')
      else if (detected === 'pdf') setTargetFormat('docx')
      else if (detected === 'pptx') setTargetFormat('pdf')
      else if (detected === 'xlsx') setTargetFormat('pdf')
      else if (detected === 'html') setTargetFormat('pdf')
      else if (detected === 'jpg' || detected === 'png') setTargetFormat('pdf')
      else if (targets && targets.length > 0) setTargetFormat(targets[0])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleApplyPreset = (preset: { from: FormatKey; to: FormatKey }) => {
    setSourceFormat(preset.from)
    setTargetFormat(preset.to)
    setResult(null)
    toast.info(`Preset applied: ${FORMAT_CONFIGS[preset.from].label} → ${FORMAT_CONFIGS[preset.to].label}`)
  }

  const handleConvert = async () => {
    if (!selectedFile) {
      toast.error('Please upload a file to convert')
      return
    }

    setIsConverting(true)
    setConversionProgress('Reading and analyzing document structure...')

    try {
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '')
      const src = effectiveSource
      const tgt = validTarget
      let res: ConversionResult | null = null

      setConversionProgress(`Converting from ${src.toUpperCase()} to ${tgt.toUpperCase()}...`)

      // ---------------------------------------------
      // Case 1: Source is DOCX
      // ---------------------------------------------
      if (src === 'docx') {
        const docxData = await parseDocx(selectedFile)

        if (tgt === 'pdf') {
          const pdfBlob = await generatePdfDocument({
            title: baseName,
            text: docxData.text,
          })
          res = {
            blob: pdfBlob,
            filename: `${baseName}.pdf`,
            mimeType: 'application/pdf',
            previewHtml: docxData.html,
            previewText: docxData.text,
          }
        } else if (tgt === 'html') {
          const htmlBlob = generateHtmlDocument({
            title: baseName,
            bodyHtml: docxData.html,
            sourceType: 'Word Document',
          })
          res = {
            blob: htmlBlob,
            filename: `${baseName}.html`,
            mimeType: 'text/html',
            previewHtml: docxData.html,
            previewText: docxData.text,
          }
        } else if (tgt === 'txt') {
          const txtBlob = new Blob([docxData.text], { type: 'text/plain;charset=utf-8' })
          res = {
            blob: txtBlob,
            filename: `${baseName}.txt`,
            mimeType: 'text/plain',
            previewText: docxData.text,
          }
        } else if (tgt === 'jpg') {
          // Render HTML to PDF and then images or direct text PDF
          const pdfBlob = await generatePdfDocument({
            title: baseName,
            text: docxData.text,
          })
          const images = await renderPdfToImages(pdfBlob, 'jpg')
          res = {
            blob: images[0]?.blob || pdfBlob,
            filename: `${baseName}-page1.jpg`,
            mimeType: 'image/jpeg',
            previewHtml: docxData.html,
            pageCount: images.length,
            items: images.map((img) => ({
              name: `${baseName}-page${img.pageNumber}.jpg`,
              blob: img.blob,
              url: img.dataUrl,
            })),
          }
        }
      }

      // ---------------------------------------------
      // Case 2: Source is PPTX
      // ---------------------------------------------
      else if (src === 'pptx') {
        const pptxData = await parsePptx(selectedFile)

        if (tgt === 'pdf') {
          const slideParagraphs = pptxData.slides.map(
            (s) => `[SLIDE ${s.slideNumber}] ${s.title}\n\n${s.bullets.map((b) => `• ${b}`).join('\n')}`
          )
          const pdfBlob = await generatePdfDocument({
            title: baseName,
            paragraphs: slideParagraphs,
          })
          res = {
            blob: pdfBlob,
            filename: `${baseName}.pdf`,
            mimeType: 'application/pdf',
            previewHtml: pptxData.html,
            previewText: pptxData.text,
            pageCount: pptxData.slides.length,
          }
        } else if (tgt === 'html') {
          const htmlBlob = generateHtmlDocument({
            title: baseName,
            bodyHtml: pptxData.html,
            sourceType: 'PowerPoint Presentation',
          })
          res = {
            blob: htmlBlob,
            filename: `${baseName}-slides.html`,
            mimeType: 'text/html',
            previewHtml: pptxData.html,
            previewText: pptxData.text,
            pageCount: pptxData.slides.length,
          }
        } else if (tgt === 'txt') {
          const txtBlob = new Blob([pptxData.text], { type: 'text/plain;charset=utf-8' })
          res = {
            blob: txtBlob,
            filename: `${baseName}-outline.txt`,
            mimeType: 'text/plain',
            previewText: pptxData.text,
          }
        } else if (tgt === 'jpg') {
          const pdfBlob = await generatePdfDocument({
            title: baseName,
            paragraphs: pptxData.slides.map((s) => `[SLIDE ${s.slideNumber}] ${s.title}\n${s.bullets.join('\n')}`),
          })
          const images = await renderPdfToImages(pdfBlob, 'jpg')
          res = {
            blob: images[0]?.blob || pdfBlob,
            filename: `${baseName}-slide1.jpg`,
            mimeType: 'image/jpeg',
            previewHtml: pptxData.html,
            pageCount: images.length,
            items: images.map((img) => ({
              name: `${baseName}-slide${img.pageNumber}.jpg`,
              blob: img.blob,
              url: img.dataUrl,
            })),
          }
        }
      }

      // ---------------------------------------------
      // Case 3: Source is XLSX / CSV
      // ---------------------------------------------
      else if (src === 'xlsx') {
        const xlsxData = await parseXlsx(selectedFile)

        if (tgt === 'pdf') {
          const pdfBlob = await generatePdfDocument({
            title: `${baseName} - Spreadsheet`,
            text: xlsxData.text,
          })
          res = {
            blob: pdfBlob,
            filename: `${baseName}.pdf`,
            mimeType: 'application/pdf',
            previewHtml: xlsxData.html,
            previewText: xlsxData.text,
          }
        } else if (tgt === 'html') {
          const htmlBlob = generateHtmlDocument({
            title: `${baseName} - Spreadsheet Data`,
            bodyHtml: xlsxData.html,
            sourceType: 'Excel Spreadsheet',
          })
          res = {
            blob: htmlBlob,
            filename: `${baseName}.html`,
            mimeType: 'text/html',
            previewHtml: xlsxData.html,
            previewText: xlsxData.text,
          }
        } else if (tgt === 'txt') {
          const txtBlob = new Blob([xlsxData.text], { type: 'text/plain;charset=utf-8' })
          res = {
            blob: txtBlob,
            filename: `${baseName}.csv`,
            mimeType: 'text/csv',
            previewText: xlsxData.text,
          }
        }
      }

      // ---------------------------------------------
      // Case 4: Source is PDF
      // ---------------------------------------------
      else if (src === 'pdf') {
        const pdfData = await parsePdf(selectedFile)

        if (tgt === 'docx') {
          const docxBlob = await generateDocxFile({
            title: baseName,
            text: pdfData.text,
            paragraphs: pdfData.pages.map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`),
          })
          res = {
            blob: docxBlob,
            filename: `${baseName}.docx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            previewText: pdfData.text,
            pageCount: pdfData.pageCount,
          }
        } else if (tgt === 'html') {
          const htmlContent = `
            <div class="pdf-extracted space-y-6">
              ${pdfData.pages
                .map(
                  (p) => `
                <div class="p-6 border border-border rounded-xl bg-card">
                  <div class="text-xs text-muted-foreground font-semibold mb-2">Page ${p.pageNumber} of ${pdfData.pageCount}</div>
                  <p class="text-sm leading-relaxed whitespace-pre-wrap">${p.text}</p>
                </div>
              `
                )
                .join('')}
            </div>
          `
          const htmlBlob = generateHtmlDocument({
            title: baseName,
            bodyHtml: htmlContent,
            sourceType: 'PDF Document',
          })
          res = {
            blob: htmlBlob,
            filename: `${baseName}.html`,
            mimeType: 'text/html',
            previewHtml: htmlContent,
            previewText: pdfData.text,
            pageCount: pdfData.pageCount,
          }
        } else if (tgt === 'jpg' || tgt === 'png') {
          const images = await renderPdfToImages(selectedFile, tgt)
          res = {
            blob: images[0]?.blob || new Blob([]),
            filename: `${baseName}-page1.${tgt}`,
            mimeType: tgt === 'jpg' ? 'image/jpeg' : 'image/png',
            previewText: `Extracted ${images.length} pages as high-resolution ${tgt.toUpperCase()} images.`,
            pageCount: images.length,
            items: images.map((img) => ({
              name: `${baseName}-page${img.pageNumber}.${tgt}`,
              blob: img.blob,
              url: img.dataUrl,
            })),
          }
        } else if (tgt === 'xlsx') {
          const rows = pdfData.pages.flatMap((p) =>
            p.text
              .split('\n')
              .map((line) => line.split(/\s{2,}|\t/).filter(Boolean))
              .filter((r) => r.length > 0)
          )
          const xlsxBlob = generateXlsxFromData({
            sheetName: 'PDF Extracted Data',
            rows: rows.length > 0 ? rows : [['Page', 'Content'], ...pdfData.pages.map((p) => [p.pageNumber, p.text])],
          })
          res = {
            blob: xlsxBlob,
            filename: `${baseName}.xlsx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            previewText: pdfData.text,
            pageCount: pdfData.pageCount,
          }
        } else if (tgt === 'pptx') {
          const slides = pdfData.pages.map((p) => ({
            title: `Page ${p.pageNumber}`,
            bullets: p.text.split('\n').filter((l) => l.trim().length > 0).slice(0, 8),
            body: p.text,
          }))
          const pptxBlob = await generatePptxFile({
            title: baseName,
            slides,
          })
          res = {
            blob: pptxBlob,
            filename: `${baseName}.pptx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            previewText: pdfData.text,
            pageCount: pdfData.pageCount,
          }
        } else if (tgt === 'txt') {
          const txtBlob = new Blob([pdfData.text], { type: 'text/plain;charset=utf-8' })
          res = {
            blob: txtBlob,
            filename: `${baseName}.txt`,
            mimeType: 'text/plain',
            previewText: pdfData.text,
            pageCount: pdfData.pageCount,
          }
        }
      }

      // ---------------------------------------------
      // Case 5: Source is HTML
      // ---------------------------------------------
      else if (src === 'html') {
        const textContent = await selectedFile.text()

        if (tgt === 'pdf') {
          const pdfBlob = await generatePdfDocument({
            title: baseName,
            text: textContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
          })
          res = {
            blob: pdfBlob,
            filename: `${baseName}.pdf`,
            mimeType: 'application/pdf',
            previewHtml: textContent,
          }
        } else if (tgt === 'docx') {
          const docxBlob = await generateDocxFile({
            title: baseName,
            html: textContent,
          })
          res = {
            blob: docxBlob,
            filename: `${baseName}.docx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            previewHtml: textContent,
          }
        } else if (tgt === 'xlsx') {
          const xlsxBlob = generateXlsxFromData({
            sheetName: 'HTML Table Data',
            htmlTable: textContent,
          })
          res = {
            blob: xlsxBlob,
            filename: `${baseName}.xlsx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            previewHtml: textContent,
          }
        } else if (tgt === 'txt') {
          const cleanText = textContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          res = {
            blob: new Blob([cleanText], { type: 'text/plain;charset=utf-8' }),
            filename: `${baseName}.txt`,
            mimeType: 'text/plain',
            previewText: cleanText,
          }
        }
      }

      // ---------------------------------------------
      // Case 6: Source is Image (JPG / PNG)
      // ---------------------------------------------
      else if (src === 'jpg' || src === 'png') {
        if (tgt === 'pdf') {
          const pdfBlob = await imagesToPdf([selectedFile], { pageSize: 'fit' })
          res = {
            blob: pdfBlob,
            filename: `${baseName}.pdf`,
            mimeType: 'application/pdf',
            pageCount: 1,
          }
        } else if (tgt === 'docx') {
          const docxBlob = await generateDocxFile({
            title: baseName,
            paragraphs: [`Image asset: ${selectedFile.name}`, `File size: ${formatFileSize(selectedFile.size)}`],
          })
          res = {
            blob: docxBlob,
            filename: `${baseName}.docx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          }
        } else if (tgt === 'jpg' || tgt === 'png') {
          const convertedImg = await convertSingleImage(selectedFile, {
            format: tgt,
            quality: 0.94,
          })
          res = {
            blob: convertedImg.blob,
            filename: `${baseName}.${tgt}`,
            mimeType: tgt === 'jpg' ? 'image/jpeg' : 'image/png',
          }
        }
      }

      // ---------------------------------------------
      // Case 7: Source is TXT
      // ---------------------------------------------
      else if (src === 'txt') {
        const textContent = await selectedFile.text()
        if (tgt === 'pdf') {
          const pdfBlob = await generatePdfDocument({
            title: baseName,
            text: textContent,
          })
          res = {
            blob: pdfBlob,
            filename: `${baseName}.pdf`,
            mimeType: 'application/pdf',
            previewText: textContent,
          }
        } else if (tgt === 'docx') {
          const docxBlob = await generateDocxFile({
            title: baseName,
            text: textContent,
          })
          res = {
            blob: docxBlob,
            filename: `${baseName}.docx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            previewText: textContent,
          }
        } else if (tgt === 'html') {
          const htmlContent = `<div class="whitespace-pre-wrap font-sans text-sm">${textContent}</div>`
          const htmlBlob = generateHtmlDocument({
            title: baseName,
            bodyHtml: htmlContent,
            sourceType: 'Plain Text',
          })
          res = {
            blob: htmlBlob,
            filename: `${baseName}.html`,
            mimeType: 'text/html',
            previewHtml: htmlContent,
            previewText: textContent,
          }
        }
      }

      if (!res) {
        throw new Error(`Conversion from ${src.toUpperCase()} to ${tgt.toUpperCase()} could not be processed`)
      }

      setResult(res)
      toast.success(`Successfully converted to ${tgt.toUpperCase()}!`)

      // Track usage
      try {
        await incrementToolUsage()
        await markToolUsed('document-converter')
      } catch {
        // silent fail
      }
    } catch (err: any) {
      console.error('Conversion error:', err)
      toast.error(`Conversion failed: ${err.message || 'Unknown error'}`)
    } finally {
      setIsConverting(false)
      setConversionProgress('')
    }
  }

  const handleDownload = (blob?: Blob, filename?: string) => {
    const targetBlob = blob || result?.blob
    const targetName = filename || result?.filename || 'converted-file'
    if (!targetBlob) return

    const url = URL.createObjectURL(targetBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = targetName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Downloading ${targetName}`)
  }

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Text copied to clipboard!')
  }

  const handleReset = () => {
    setSelectedFile(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
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
            <span className="text-xs text-muted-foreground hidden sm:inline">Click to set source & target</span>
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
                  <option value="auto">⚡ Auto-Detect (from file)</option>
                  <option value="docx">Word (.docx, .doc)</option>
                  <option value="pdf">PDF Document (.pdf)</option>
                  <option value="pptx">PowerPoint (.pptx, .ppt)</option>
                  <option value="xlsx">Excel Spreadsheet (.xlsx, .csv)</option>
                  <option value="html">HTML Webpage (.html, .htm)</option>
                  <option value="jpg">JPG Image (.jpg, .jpeg)</option>
                  <option value="png">PNG Image (.png)</option>
                  <option value="txt">Plain Text (.txt, .md)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Direction Arrow / Swap */}
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

          {/* Active conversion indication */}
          <div className="mt-4 pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Ready to transform:</span>
              <span className="font-semibold text-foreground">
                {FORMAT_CONFIGS[effectiveSource].label}
              </span>
              <ArrowRight className="w-3 h-3" />
              <span className="font-bold text-primary">
                {FORMAT_CONFIGS[validTarget].label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" /> 100% In-Browser Privacy
            </div>
          </div>
        </div>

        {/* File Upload Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : selectedFile
              ? 'border-border bg-card'
              : 'border-border/80 hover:border-primary/50 bg-card/50 hover:bg-card cursor-pointer'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.csv,.html,.htm,.jpg,.jpeg,.png,.webp,.txt,.md"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelect(e.target.files[0])
              }
            }}
          />

          {!selectedFile ? (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">
                  Choose a file or drag & drop here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports PDF, Word (DOCX), PowerPoint (PPTX), Excel (XLSX), HTML, JPG, PNG & Text
                </p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl mt-2 pointer-events-none">
                Browse Document
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected File Card */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/30 max-w-2xl mx-auto text-left">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate text-sm">
                      {selectedFile.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{formatFileSize(selectedFile.size)}</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {FORMAT_CONFIGS[effectiveSource].label}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReset()
                    }}
                    className="h-8 px-2 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Remove
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                    className="h-8 text-xs"
                  >
                    Change File
                  </Button>
                </div>
              </div>

              {/* Convert Action Button */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleConvert()
                  }}
                  disabled={isConverting}
                  size="lg"
                  className="rounded-xl px-8 font-semibold shadow-md gap-2"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Convert to {FORMAT_CONFIGS[validTarget].label}
                    </>
                  )}
                </Button>
              </div>

              {conversionProgress && (
                <p className="text-xs text-muted-foreground animate-pulse">
                  {conversionProgress}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Results & Live Preview Section */}
        {result && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6 animate-in fade-in-50 duration-300">
            {/* Header with success badge & download */}
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
                    {result.pageCount ? ` • ${result.pageCount} pages/slides` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleDownload()}
                  className="rounded-xl gap-2 font-semibold shadow-xs"
                >
                  <Download className="w-4 h-4" /> Download {FORMAT_CONFIGS[validTarget].ext.toUpperCase()}
                </Button>
              </div>
            </div>

            {/* Multi-page extraction items (e.g. PDF to images) */}
            {result.items && result.items.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Extracted Pages ({result.items.length})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Click any page to download individually
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
                        onClick={() => handleDownload(item.blob, item.name)}
                        className="w-full mt-2 h-7 text-[11px] rounded-lg gap-1 opacity-90 group-hover:opacity-100"
                      >
                        <Download className="w-3 h-3" /> Save
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Tabs */}
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

            {/* Action footer */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Need another format or adjustment?</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="rounded-xl text-xs"
              >
                Convert Another Document
              </Button>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
