import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib'

export interface ParsedSlide {
  slideNumber: number
  title: string
  bullets: string[]
  rawText: string
}

export interface ParsedSheet {
  name: string
  htmlTable: string
  csv: string
  json: any[]
  rowCount: number
  colCount: number
}

export interface ConversionResult {
  blob: Blob
  filename: string
  mimeType: string
  previewText?: string
  previewHtml?: string
  pageCount?: number
  items?: { name: string; blob: Blob; url: string }[]
}

// ----------------------------------------------------
// 1. DOCX Parsing (via mammoth & JSZip)
// ----------------------------------------------------
export async function parseDocx(file: File | Blob): Promise<{ html: string; text: string; images?: { filename: string; blob: Blob }[] }> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)
    
    // Extract images from word/media/
    const images: { filename: string; blob: Blob }[] = []
    const mediaFiles = Object.keys(zip.files).filter(name => /^word\/media\/.+/i.test(name))
    for (const path of mediaFiles) {
      const fileData = await zip.files[path].async('blob')
      images.push({ filename: path.split('/').pop() || 'image.jpg', blob: fileData })
    }

    const mammoth = (await import('mammoth')).default || (await import('mammoth'))
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer })
    const textResult = await mammoth.extractRawText({ arrayBuffer })
    
    let html = htmlResult.value || '<p>No readable content found</p>'
    if (images.length > 0) {
      html += `<div class="mt-4 space-y-4">${images.map((img) => `<img src="${URL.createObjectURL(img.blob)}" class="max-w-full h-auto rounded shadow" />`).join('')}</div>`
    }

    return {
      html,
      text: textResult.value || '',
      images,
    }
  } catch (err: any) {
    console.warn('Mammoth parsing error, attempting zip fallback:', err)
    try {
      const zip = await JSZip.loadAsync(file)
      const images: { filename: string; blob: Blob }[] = []
      const mediaFiles = Object.keys(zip.files).filter(name => /^word\/media\/.+/i.test(name))
      for (const path of mediaFiles) {
        const fileData = await zip.files[path].async('blob')
        images.push({ filename: path.split('/').pop() || 'image.jpg', blob: fileData })
      }

      const docXml = await zip.file('word/document.xml')?.async('string')
      if (docXml) {
        const text = docXml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        const html = `<div class="docx-extracted">${text}</div>`
        return { html, text, images }
      }
    } catch {
      // ignore fallback error
    }
    throw new Error(`Failed to parse Word document: ${err?.message || 'Unknown error'}`)
  }
}

// ----------------------------------------------------
// 2. PPTX Parsing (via JSZip)
// ----------------------------------------------------
export async function parsePptx(file: File | Blob): Promise<{ slides: ParsedSlide[]; text: string; html: string }> {
  try {
    const zip = await JSZip.loadAsync(file)
    const slideFiles = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)![0], 10)
        const numB = parseInt(b.match(/\d+/)![0], 10)
        return numA - numB
      })

    if (slideFiles.length === 0) {
      throw new Error('No slides found in PowerPoint file')
    }

    const slides: ParsedSlide[] = []
    let fullText = ''
    let htmlOutput = '<div class="presentation-slides space-y-6">'

    for (let i = 0; i < slideFiles.length; i++) {
      const slidePath = slideFiles[i]
      const xml = await zip.files[slidePath].async('string')

      // Simple regex parser for slide text elements <a:t>...</a:t> and paragraphs <a:p>...</a:p>
      const paragraphs: string[] = []
      const pMatches = xml.match(/<a:p[\s\S]*?<\/a:p>/g) || []

      for (const pXml of pMatches) {
        const tMatches = pXml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || []
        const pText = tMatches
          .map((m) => m.replace(/<\/?a:t[^>]*>/g, ''))
          .join('')
          .trim()
        if (pText) {
          paragraphs.push(pText)
        }
      }

      const title = paragraphs[0] || `Slide ${i + 1}`
      const bullets = paragraphs.slice(1)
      const slideText = paragraphs.join('\n')

      slides.push({
        slideNumber: i + 1,
        title,
        bullets,
        rawText: slideText,
      })

      fullText += `\n--- Slide ${i + 1}: ${title} ---\n${bullets.join('\n')}\n`

      htmlOutput += `
        <div class="slide-card p-6 rounded-xl border border-border bg-card shadow-sm">
          <div class="flex items-center justify-between pb-3 border-b border-border/60 mb-4">
            <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Slide ${i + 1}</span>
            <span class="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">PowerPoint</span>
          </div>
          <h3 class="text-lg font-bold text-foreground mb-3">${escapeHtml(title)}</h3>
          ${
            bullets.length > 0
              ? `<ul class="list-disc list-inside space-y-1.5 text-muted-foreground text-sm">
                  ${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
                </ul>`
              : '<p class="text-sm text-muted-foreground italic">No bullet points</p>'
          }
        </div>
      `
    }

    htmlOutput += '</div>'
    return { slides, text: fullText.trim(), html: htmlOutput }
  } catch (err: any) {
    throw new Error(`Failed to parse PowerPoint presentation: ${err?.message || 'Invalid PPTX file'}`)
  }
}

// ----------------------------------------------------
// 3. XLSX Parsing (via SheetJS)
// ----------------------------------------------------
export async function parseXlsx(file: File | Blob): Promise<{ sheets: ParsedSheet[]; html: string; text: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    const sheets: ParsedSheet[] = []
    let fullText = ''
    let fullHtml = '<div class="excel-sheets space-y-8">'

    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName]
      const htmlTable = XLSX.utils.sheet_to_html(ws, { id: `sheet-${sheetName}` })
      const csv = XLSX.utils.sheet_to_csv(ws)
      const json: any[] = XLSX.utils.sheet_to_json(ws)
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1')
      const rowCount = range.e.r - range.s.r + 1
      const colCount = range.e.c - range.s.c + 1

      sheets.push({
        name: sheetName,
        htmlTable,
        csv,
        json,
        rowCount,
        colCount,
      })

      fullText += `\n=== Sheet: ${sheetName} ===\n${csv}\n`
      fullHtml += `
        <div class="sheet-section rounded-xl border border-border bg-card p-4 overflow-hidden shadow-sm">
          <div class="flex items-center justify-between pb-3 mb-3 border-b border-border">
            <h4 class="font-bold text-foreground flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              ${escapeHtml(sheetName)}
            </h4>
            <span class="text-xs text-muted-foreground">${rowCount} rows × ${colCount} cols</span>
          </div>
          <div class="overflow-x-auto max-h-96 text-xs custom-scrollbar">
            ${htmlTable}
          </div>
        </div>
      `
    }

    fullHtml += '</div>'
    return { sheets, html: fullHtml, text: fullText.trim() }
  } catch (err: any) {
    throw new Error(`Failed to parse Excel spreadsheet: ${err?.message || 'Invalid spreadsheet file'}`)
  }
}

// Helper to configure matching pdfjs worker version with graceful main-thread fallback
function configurePdfWorker(pdfjsLib: any) {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    try {
      const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : ''
      pdfjsLib.GlobalWorkerOptions.workerSrc = `${origin}/pdf.worker.min.mjs`
    } catch {
      // Ignore if workerSrc setting fails
    }
  }
}

async function getPdfDocumentSafe(pdfjsLib: any, fileOrBuffer: File | Blob | ArrayBuffer) {
  configurePdfWorker(pdfjsLib)
  const arrayBuffer = fileOrBuffer instanceof ArrayBuffer ? fileOrBuffer : await fileOrBuffer.arrayBuffer()
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer.slice(0)),
      cMapUrl: '/cmaps/',
      cMapPacked: true,
    })
    return await loadingTask.promise
  } catch (workerErr) {
    console.warn('PDF worker load failed, falling back to main-thread PDF parsing:', workerErr)
    const fallbackTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer.slice(0)),
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      disableWorker: true,
    } as any)
    return await fallbackTask.promise
  }
}

// ----------------------------------------------------
// 4. PDF Parsing & Page Extraction (via pdfjs-dist)
// ----------------------------------------------------
export async function parsePdf(
  file: File | Blob
): Promise<{ text: string; pageCount: number; pages: { pageNumber: number; text: string }[] }> {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    const pdf = await getPdfDocumentSafe(pdfjsLib, file)

    const pageCount = pdf.numPages
    const pages: { pageNumber: number; text: string }[] = []
    let fullText = ''

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

      pages.push({ pageNumber: i, text: pageText })
      fullText += `\n--- Page ${i} ---\n${pageText}\n`
    }

    return { text: fullText.trim(), pageCount, pages }
  } catch (err: any) {
    throw new Error(`Failed to read PDF document: ${err?.message || 'Invalid or encrypted PDF'}`)
  }
}

// ----------------------------------------------------
// 5. Render PDF Pages to Images (JPG / PNG)
// ----------------------------------------------------
export async function renderPdfToImages(
  file: File | Blob,
  format: 'jpg' | 'png' = 'jpg',
  quality: number = 0.92,
  scale: number = 1.8
): Promise<{ pageNumber: number; blob: Blob; dataUrl: string; width: number; height: number }[]> {
  const pdfjsLib = await import('pdfjs-dist')
  const pdf = await getPdfDocumentSafe(pdfjsLib, file)

  const results: { pageNumber: number; blob: Blob; dataUrl: string; width: number; height: number }[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) continue

    canvas.width = viewport.width
    canvas.height = viewport.height

    // Fill white background for JPG or transparent-friendly canvas
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingEnabled = true

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    } as any).promise

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
    const dataUrl = canvas.toDataURL(mimeType, quality)

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob([], { type: mimeType })), mimeType, quality)
    })

    results.push({
      pageNumber: i,
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    })
  }

  return results
}

// Helper to safely convert Blob/ArrayBuffer/Uint8Array to Uint8Array for JSZip
async function toUint8Array(data: Blob | ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  if (data instanceof Uint8Array) return data
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    const buf = await data.arrayBuffer()
    return new Uint8Array(buf)
  }
  return new Uint8Array()
}

function cleanPdfText(str: string): string {
  if (!str) return ''
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Helper to check if text contains Arabic/Hebrew (RTL) characters
export function containsRtl(text: string): boolean {
  if (!text) return false
  return /[\u0590-\u083F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFC]/.test(text)
}

// Helper to convert HTML / Markdown / Structured text into native Word OpenXML elements
function renderDocxHeader(text: string, level = 'h2'): string {
  const isRtl = containsRtl(text)
  const size = level === 'h1' ? '40' : level === 'h2' ? '32' : '28'
  return `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
        <w:jc w:val="${isRtl ? 'right' : 'left'}"/>
        ${isRtl ? '<w:bidi/>' : ''}
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:cs="Traditional Arabic"/>
          <w:b/>
          <w:sz w:val="${size}"/>
          <w:szCs w:val="${size}"/>
          ${isRtl ? '<w:rtl/>' : ''}
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  `
}

function renderDocxParagraph(text: string): string {
  const isRtl = containsRtl(text)
  return `
    <w:p>
      <w:pPr>
        <w:jc w:val="${isRtl ? 'right' : 'left'}"/>
        ${isRtl ? '<w:bidi/>' : ''}
        <w:spacing w:before="100" w:after="100" w:line="280" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:cs="Traditional Arabic"/>
          <w:sz w:val="24"/>
          <w:szCs w:val="26"/>
          ${isRtl ? '<w:rtl/>' : ''}
          <w:color w:val="334155"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  `
}

function renderDocxPhotoFrame(text: string): string {
  const isRtl = containsRtl(text)
  const lines = text.split(/\r?\n|\/|\\/).map((l) => l.trim()).filter(Boolean)

  let innerXml = ''
  lines.forEach((l) => {
    innerXml += `
      <w:p>
        <w:pPr>
          <w:jc w:val="center"/>
          ${isRtl ? '<w:bidi/>' : ''}
          <w:spacing w:before="40" w:after="40"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:cs="Traditional Arabic"/>
            <w:b/>
            <w:sz w:val="20"/>
            <w:szCs w:val="22"/>
            ${isRtl ? '<w:rtl/>' : ''}
            <w:color w:val="1E293B"/>
          </w:rPr>
          <w:t xml:space="preserve">${escapeXml(l)}</w:t>
        </w:r>
      </w:p>
    `
  })

  return `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="3000" w:type="dxa"/>
        <w:jc w:val="right"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="12" w:space="0" w:color="2563EB"/>
          <w:left w:val="single" w:sz="12" w:space="0" w:color="2563EB"/>
          <w:bottom w:val="single" w:sz="12" w:space="0" w:color="2563EB"/>
          <w:right w:val="single" w:sz="12" w:space="0" w:color="2563EB"/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:top w:w="180" w:type="dxa"/>
          <w:left w:w="180" w:type="dxa"/>
          <w:bottom w:w="180" w:type="dxa"/>
          <w:right w:w="180" w:type="dxa"/>
        </w:tblCellMar>
        <w:bidi/>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="3000" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/>
          </w:tcPr>
          ${innerXml}
        </w:tc>
      </w:tr>
    </w:tbl>
    <w:p><w:pPr><w:spacing w:before="100" w:after="100"/></w:pPr></w:p>
  `
}

function renderDocxTableFromMatrix(matrix: string[][]): string {
  if (matrix.length === 0) return ''

  let tblXml = `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="0" w:type="auto"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="475569"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="475569"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="475569"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="475569"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:top w:w="120" w:type="dxa"/>
          <w:left w:w="160" w:type="dxa"/>
          <w:bottom w:w="120" w:type="dxa"/>
          <w:right w:w="160" w:type="dxa"/>
        </w:tblCellMar>
        <w:bidi/>
      </w:tblPr>
  `

  matrix.forEach((row, rowIdx) => {
    tblXml += `<w:tr>`
    row.forEach((cellText) => {
      const isRtl = containsRtl(cellText)
      const isHeader = rowIdx === 0

      tblXml += `
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="0" w:type="auto"/>
            ${isHeader ? '<w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>' : ''}
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="${isRtl ? 'right' : 'left'}"/>
              ${isRtl ? '<w:bidi/>' : ''}
              <w:spacing w:before="60" w:after="60"/>
            </w:pPr>
            <w:r>
              <w:rPr>
                <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:cs="Traditional Arabic"/>
                ${isHeader ? '<w:b/>' : ''}
                <w:sz w:val="22"/>
                <w:szCs w:val="24"/>
                ${isRtl ? '<w:rtl/>' : ''}
                <w:color w:val="0F172A"/>
              </w:rPr>
              <w:t xml:space="preserve">${escapeXml(cellText)}</w:t>
            </w:r>
          </w:p>
        </w:tc>
      `
    })
    tblXml += `</w:tr>`
  })

  tblXml += `</w:tbl><w:p><w:pPr><w:spacing w:before="120" w:after="120"/></w:pPr></w:p>`
  return tblXml
}

function convertStructuredContentToDocxXml(htmlOrText: string): string {
  if (!htmlOrText || !htmlOrText.trim()) return ''

  if (typeof window !== 'undefined' && /<[a-z][\s\S]*>/i.test(htmlOrText)) {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlOrText, 'text/html')
      let xml = ''

      const nodes = Array.from(doc.body.children.length > 0 ? doc.body.children : doc.body.childNodes)

      nodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement
          const tagName = el.tagName.toLowerCase()

          if (tagName === 'table') {
            const rows = Array.from(el.querySelectorAll('tr'))
            const matrix = rows.map((r) => Array.from(r.querySelectorAll('td, th')).map((c) => c.textContent?.trim() || ''))
            xml += renderDocxTableFromMatrix(matrix)
          } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
            const txt = el.textContent?.trim() || ''
            if (txt) xml += renderDocxHeader(txt, tagName)
          } else if (
            el.classList.contains('photo-frame') ||
            el.classList.contains('photo-box') ||
            el.textContent?.includes('صورة الطالب') ||
            el.textContent?.includes('صورة الطالبة')
          ) {
            xml += renderDocxPhotoFrame(el.textContent?.trim() || 'صورة الطالب / الطالبة\n6 * 4')
          } else {
            const txt = el.textContent?.trim() || ''
            if (txt) xml += renderDocxParagraph(txt)
          }
        } else if (node.nodeType === Node.TEXT_NODE) {
          const txt = node.textContent?.trim() || ''
          if (txt) xml += renderDocxParagraph(txt)
        }
      })

      if (xml.trim().length > 0) return xml
    } catch (err) {
      console.warn('DOMParser failed, fallback to plain text parsing:', err)
    }
  }

  // Fallback / Plain text line by line
  const lines = htmlOrText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  let xml = ''
  let inTable = false
  let tableRows: string[][] = []

  const flushTable = () => {
    if (tableRows.length > 0) {
      xml += renderDocxTableFromMatrix(tableRows)
      tableRows = []
    }
    inTable = false
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.includes('|') && line.startsWith('|')) {
      inTable = true
      if (/^\|[\s\-:|]+\|$/.test(line)) continue

      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      if (cells.length > 0) {
        tableRows.push(cells)
      }
      continue
    } else if (inTable) {
      flushTable()
    }

    if (line.includes('صورة الطالب') || line.includes('صورة الشخصية') || line.includes('صورة ملونة خلفية بيضاء')) {
      xml += renderDocxPhotoFrame(line)
      continue
    }

    xml += renderDocxParagraph(line)
  }

  if (inTable) flushTable()

  return xml
}

export interface DocxPageOption {
  text?: string
  html?: string
  image?: Blob | ArrayBuffer | Uint8Array
  imageType?: 'jpg' | 'png'
}

async function getImageDimensions(u8: Uint8Array, type: string): Promise<{ width: number; height: number }> {
  if (typeof window === 'undefined') return { width: 800, height: 1131 }
  try {
    const blob = new Blob([u8 as unknown as BlobPart], { type: type === 'png' ? 'image/png' : 'image/jpeg' })
    if (typeof createImageBitmap !== 'undefined') {
      const bitmap = await createImageBitmap(blob)
      return { width: bitmap.width, height: bitmap.height }
    }
  } catch {
    // ignore
  }
  return { width: 800, height: 1131 }
}

// ----------------------------------------------------
// 6. DOCX Generation (OpenXML via JSZip)
// ----------------------------------------------------
export async function generateDocxFile(options: {
  title?: string
  text?: string
  html?: string
  paragraphs?: string[]
  images?: { data: Blob | ArrayBuffer | Uint8Array; type?: 'jpg' | 'png' }[]
  pages?: DocxPageOption[]
  includeImagePages?: boolean
}): Promise<Blob> {
  const zip = new JSZip()

  // Build unified page array
  const pageList: {
    text?: string
    html?: string
    imageData?: Uint8Array
    imageType: string
  }[] = []

  if (options.pages && options.pages.length > 0) {
    for (const p of options.pages) {
      let u8: Uint8Array | undefined
      if (p.image) {
        u8 = await toUint8Array(p.image)
      }
      pageList.push({
        text: p.text,
        html: p.html,
        imageData: u8 && u8.length > 0 ? u8 : undefined,
        imageType: p.imageType || 'jpg',
      })
    }
  } else {
    // Single page or legacy format
    const paragraphsList: string[] = []
    if (options.paragraphs && options.paragraphs.length > 0) {
      paragraphsList.push(...options.paragraphs.map((p) => cleanPdfText(p)).filter(Boolean))
    } else if (options.text) {
      const lines = options.text.split(/\r?\n\r?\n|\r?\n/).map((l) => cleanPdfText(l)).filter(Boolean)
      paragraphsList.push(...lines)
    }

    if (options.images && options.images.length > 0) {
      for (let i = 0; i < options.images.length; i++) {
        const img = options.images[i]
        const u8 = await toUint8Array(img.data)
        pageList.push({
          text: i === 0 ? (options.html || options.text || paragraphsList.join('\n')) : undefined,
          imageData: u8.length > 0 ? u8 : undefined,
          imageType: img.type || 'jpg',
        })
      }
    } else {
      pageList.push({
        text: options.text || paragraphsList.join('\n'),
        html: options.html,
        imageType: 'jpg',
      })
    }
  }

  let wordRelsContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
`

  let bodyXml = ''
  let relIndex = 2
  const shouldRenderImages = options.includeImagePages

  for (let i = 0; i < pageList.length; i++) {
    const page = pageList[i]

    // 1. Render page image if requested and available
    if (shouldRenderImages && page.imageData) {
      const imgExt = page.imageType || 'jpg'
      const imgFilename = `media/image${i + 1}.${imgExt}`
      const relId = `rId${relIndex++}`

      wordRelsContent += `  <Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${imgFilename}"/>\n`
      zip.file(`word/${imgFilename}`, page.imageData)

      const dims = await getImageDimensions(page.imageData, imgExt)
      let aspectRatio = dims.height / dims.width
      if (isNaN(aspectRatio) || aspectRatio <= 0) aspectRatio = 1.414

      // Calculate width & height in EMUs preserving aspect ratio
      // Standard page content width = 5,486,400 EMUs (6 inches)
      let cx = 5486400
      let cy = Math.round(cx * aspectRatio)
      if (cy > 7772400) {
        cy = 7772400
        cx = Math.round(cy / aspectRatio)
      }

      bodyXml += `
        <w:p>
          <w:pPr>
            <w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/>
            <w:jc w:val="center"/>
          </w:pPr>
          <w:r>
            <w:drawing>
              <wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="0" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
                <wp:simplePos x="0" y="0"/>
                <wp:positionH relativeFrom="margin">
                  <wp:align>center</wp:align>
                </wp:positionH>
                <wp:positionV relativeFrom="top">
                  <wp:posOffset>0</wp:posOffset>
                </wp:positionV>
                <wp:extent cx="${cx}" cy="${cy}"/>
                <wp:effectExtent l="0" t="0" r="0" b="0"/>
                <wp:wrapNone/>
                <wp:docPr id="${i + 1}" name="Page ${i + 1} Background"/>
                <wp:cNvGraphicFramePr>
                  <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noResize="1"/>
                </wp:cNvGraphicFramePr>
                <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                  <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                    <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                      <pic:nvPicPr>
                        <pic:cNvPr id="${i + 1}" name="Page ${i + 1}"/>
                        <pic:cNvPicPr>
                          <a:picLocks noChangeAspect="1"/>
                        </pic:cNvPicPr>
                      </pic:nvPicPr>
                      <pic:blipFill>
                        <a:blip r:embed="${relId}"/>
                        <a:stretch><a:fillRect/></a:stretch>
                      </pic:blipFill>
                      <pic:spPr>
                        <a:xfrm>
                          <a:off x="0" y="0"/>
                          <a:ext cx="${cx}" cy="${cy}"/>
                        </a:xfrm>
                        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                      </pic:spPr>
                    </pic:pic>
                  </a:graphicData>
                </a:graphic>
              </wp:anchor>
            </w:drawing>
          </w:r>
        </w:p>
      `
    }

    // 2. Render page editable structured content
    const pageContent = page.html || page.text || ''
    if (pageContent.trim().length > 0) {
      bodyXml += convertStructuredContentToDocxXml(pageContent)
    }

    // 3. Add page break if there are subsequent pages
    if (i < pageList.length - 1) {
      bodyXml += `<w:p><w:pPr><w:pageBreakBefore/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>`
    }
  }

  wordRelsContent += `</Relationships>`

  bodyXml += `
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
      <w:docGrid w:linePitch="360"/>
    </w:sectPr>
  `

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    ${bodyXml}
  </w:body>
</w:document>`

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Segoe UI" w:eastAsia="Segoe UI" w:hAnsi="Segoe UI" w:cs="Traditional Arabic"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="24"/>
        <w:lang w:val="en-US" w:bidi="ar-SA"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`

  zip.file('[Content_Types].xml', contentTypesXml)
  zip.file('_rels/.rels', relsXml)
  zip.file('word/_rels/document.xml.rels', wordRelsContent)
  zip.file('word/document.xml', documentXml)
  zip.file('word/styles.xml', stylesXml)

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

// ----------------------------------------------------
// 7. PPTX Generation (OpenXML via JSZip)
// ----------------------------------------------------
export async function generatePptxFile(options: {
  title?: string
  slides: { title: string; bullets: string[]; body?: string }[]
  images?: { data: Blob | ArrayBuffer | Uint8Array; type?: 'jpg' | 'png' }[]
  includeBackgroundImages?: boolean
}): Promise<Blob> {
  const zip = new JSZip()
  const presentationTitle = cleanPdfText(options.title || 'Presentation')
  const slides = options.slides.length > 0 ? options.slides : [{ title: presentationTitle, bullets: ['Slide 1 content'] }]

  // Process image data to Uint8Array
  const processedImages: { data: Uint8Array; type: string }[] = []
  if (options.images && options.images.length > 0) {
    for (const img of options.images) {
      const u8 = await toUint8Array(img.data)
      if (u8.length > 0) {
        processedImages.push({ data: u8, type: img.type || 'jpg' })
      }
    }
  }

  const shouldRenderImages = !!options.includeBackgroundImages && processedImages.length > 0

  let contentTypesOverrides = ''
  let presentationSlideRels = `  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>\n`
  presentationSlideRels += `  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>\n`

  let presentationSlidesList = ''

  for (let i = 0; i < slides.length; i++) {
    const slideNum = i + 1
    const relId = `rId${slideNum + 2}`

    contentTypesOverrides += `<Override PartName="/ppt/slides/slide${slideNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n`
    presentationSlideRels += `  <Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${slideNum}.xml"/>\n`
    presentationSlidesList += `    <p:sldId id="${255 + slideNum}" r:id="${relId}"/>\n`

    const slide = slides[i]
    let bulletsXml = ''

    const hasImageForSlide = shouldRenderImages && !!processedImages[i]

    for (const bullet of slide.bullets) {
      const cleanBullet = cleanPdfText(bullet)
      if (!cleanBullet) continue
      const isBulletRtl = containsRtl(cleanBullet)
      bulletsXml += `
        <a:p>
          <a:pPr lvl="0" algn="${isBulletRtl ? 'r' : 'l'}" ${isBulletRtl ? 'rtl="1"' : ''}/>
          <a:r>
            <a:rPr lang="${isBulletRtl ? 'ar-SA' : 'en-US'}" altLang="ar-SA" sz="2000">
              <a:solidFill><a:srgbClr val="${hasImageForSlide ? 'F1F5F9' : '334155'}"/></a:solidFill>
              <a:latin typeface="Segoe UI"/>
              <a:cs typeface="Traditional Arabic"/>
            </a:rPr>
            <a:t>${escapeXml(cleanBullet)}</a:t>
          </a:r>
        </a:p>
      `
    }

    if (slide.body && slide.bullets.length === 0) {
      const cleanBody = cleanPdfText(slide.body)
      if (cleanBody) {
        const isBodyRtl = containsRtl(cleanBody)
        bulletsXml += `
          <a:p>
            <a:pPr algn="${isBodyRtl ? 'r' : 'l'}" ${isBodyRtl ? 'rtl="1"' : ''}/>
            <a:r>
              <a:rPr lang="${isBodyRtl ? 'ar-SA' : 'en-US'}" altLang="ar-SA" sz="2000">
                <a:solidFill><a:srgbClr val="${hasImageForSlide ? 'F1F5F9' : '334155'}"/></a:solidFill>
                <a:latin typeface="Segoe UI"/>
                <a:cs typeface="Traditional Arabic"/>
              </a:rPr>
              <a:t>${escapeXml(cleanBody)}</a:t>
            </a:r>
          </a:p>
        `
      }
    }

    let slideRelsContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
`
    let picXml = ''

    if (hasImageForSlide) {
      const img = processedImages[i]
      const imgExt = img.type || 'jpg'
      const imgFilename = `media/image${slideNum}.${imgExt}`
      const imgRelId = `rId2`
      slideRelsContent += `  <Relationship Id="${imgRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../${imgFilename}"/>\n`
      zip.file(`ppt/${imgFilename}`, img.data)

      picXml = `
      <p:pic>
        <p:nvPicPr>
          <p:cNvPr id="4" name="Page Image ${slideNum}"/>
          <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
          <p:nvPr/>
        </p:nvPicPr>
        <p:blipFill>
          <a:blip r:embed="${imgRelId}"/>
          <a:stretch><a:fillRect/></a:stretch>
        </p:blipFill>
        <p:spPr>
          <a:xfrm>
            <a:off x="0" y="0"/>
            <a:ext cx="12192000" cy="6858000"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
      </p:pic>
      `
    }
    slideRelsContent += `</Relationships>`
    zip.file(`ppt/slides/_rels/slide${slideNum}.xml.rels`, slideRelsContent)

    const slideTitle = cleanPdfText(slide.title) || `Slide ${slideNum}`
    const isTitleRtl = containsRtl(slideTitle)

    const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
      ${picXml}
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Title 2"/>
          <p:cNvSpPr/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="838200" y="${hasImageForSlide ? '609600' : '609600'}"/>
            <a:ext cx="10515600" cy="1100000"/>
          </a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 12000"/></a:avLst></a:prstGeom>
          ${hasImageForSlide ? `
          <a:solidFill><a:srgbClr val="0F172A"><a:alpha val="85000"/></a:srgbClr></a:solidFill>
          <a:ln w="12700"><a:solidFill><a:srgbClr val="38BDF8"><a:alpha val="60000"/></a:srgbClr></a:solidFill></a:ln>
          ` : ''}
        </p:spPr>
        <p:txBody>
          <a:bodyPr lIns="200000" rIns="200000" tIns="150000" bIns="150000" anchor="ctr"/>
          <a:lstStyle/>
          <a:p>
            <a:pPr algn="${isTitleRtl ? 'r' : 'l'}" ${isTitleRtl ? 'rtl="1"' : ''}/>
            <a:r>
              <a:rPr lang="${isTitleRtl ? 'ar-SA' : 'en-US'}" altLang="ar-SA" b="1" sz="2800">
                <a:solidFill><a:srgbClr val="${hasImageForSlide ? 'FFFFFF' : '0F172A'}"/></a:solidFill>
                <a:latin typeface="Segoe UI"/>
                <a:cs typeface="Traditional Arabic"/>
              </a:rPr>
              <a:t>${escapeXml(slideTitle)}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
      ${bulletsXml ? `
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="3" name="Content 3"/>
          <p:cNvSpPr/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="838200" y="${hasImageForSlide ? '1900000' : '1900000'}"/>
            <a:ext cx="10515600" cy="4400000"/>
          </a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 8000"/></a:avLst></a:prstGeom>
          ${hasImageForSlide ? `
          <a:solidFill><a:srgbClr val="0F172A"><a:alpha val="85000"/></a:srgbClr></a:solidFill>
          <a:ln w="12700"><a:solidFill><a:srgbClr val="CBD5E1"><a:alpha val="40000"/></a:srgbClr></a:solidFill></a:ln>
          ` : ''}
        </p:spPr>
        <p:txBody>
          <a:bodyPr lIns="250000" rIns="250000" tIns="200000" bIns="200000"/>
          <a:lstStyle/>
          ${bulletsXml}
        </p:txBody>
      </p:sp>` : ''}
    </p:spTree>
  </p:cSld>
</p:sld>`

    zip.file(`ppt/slides/slide${slideNum}.xml`, slideXml)
  }

  const slideMasterXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>`

  const slideMasterRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`

  const slideLayoutXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
</p:sldLayout>`

  const slideLayoutRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`

  const themeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1F497D"/></a:dk2><a:lt2><a:srgbClr val="EEECE1"/></a:lt2>
      <a:accent1><a:srgbClr val="4F81BD"/></a:accent1><a:accent2><a:srgbClr val="C0504D"/></a:accent2>
      <a:accent3><a:srgbClr val="9BBB59"/></a:accent3><a:accent4><a:srgbClr val="8064A2"/></a:accent4>
      <a:accent5><a:srgbClr val="4BACC6"/></a:accent5><a:accent6><a:srgbClr val="F79646"/></a:accent6>
      <a:hlink><a:srgbClr val="0000FF"/></a:hlink><a:folHlink><a:srgbClr val="800080"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme>
    <a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
  </a:themeElements>
</a:theme>`

  zip.file('ppt/slideMasters/slideMaster1.xml', slideMasterXml)
  zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', slideMasterRelsXml)
  zip.file('ppt/slideLayouts/slideLayout1.xml', slideLayoutXml)
  zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', slideLayoutRelsXml)
  zip.file('ppt/theme/theme1.xml', themeXml)

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${contentTypesOverrides}
</Types>`

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`

  const presentationXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    ${presentationSlidesList}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`

  const presentationRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${presentationSlideRels}
</Relationships>`

  zip.file('[Content_Types].xml', contentTypesXml)
  zip.file('_rels/.rels', relsXml)
  zip.file('ppt/presentation.xml', presentationXml)
  zip.file('ppt/_rels/presentation.xml.rels', presentationRelsXml)

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  })
}

// ----------------------------------------------------
// 8. Excel Generation (via SheetJS)
// ----------------------------------------------------
export function generateXlsxFromData(data: {
  sheetName?: string
  rows?: any[][]
  htmlTable?: string
  csv?: string
}): Blob {
  const wb = XLSX.utils.book_new()
  const sheetName = (data.sheetName || 'Sheet1').slice(0, 31)

  let ws: XLSX.WorkSheet
  if (data.rows && data.rows.length > 0) {
    ws = XLSX.utils.aoa_to_sheet(data.rows)
  } else if (data.csv) {
    ws = XLSX.utils.aoa_to_sheet(
      data.csv.split('\n').map((row) => row.split(',').map((cell) => cell.replace(/^"(.*)"$/, '$1').trim()))
    )
  } else if (data.htmlTable) {
    const div = document.createElement('div')
    div.innerHTML = data.htmlTable
    const table = div.querySelector('table')
    if (table) {
      ws = XLSX.utils.table_to_sheet(table)
    } else {
      ws = XLSX.utils.aoa_to_sheet([['No tabular data found']])
    }
  } else {
    ws = XLSX.utils.aoa_to_sheet([['Converted Sheet'], ['No data']])
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

// ----------------------------------------------------
// 9. PDF Generation (via pdf-lib) & WinAnsi Encoding Sanitizer
// ----------------------------------------------------

const UNICODE_TO_ASCII_MAP: [RegExp, string][] = [
  // Arrows
  [/↔/g, '<->'],
  [/↕/g, '<|>'],
  [/[→➔➜➤⟶⇒]/g, '->'],
  [/[←⟵⇐]/g, '<-'],
  [/[↑⇑]/g, '^'],
  [/[↓⇓]/g, 'v'],
  [/[⇔⟺]/g, '<=>'],
  [/↗/g, '/^'],
  [/↘/g, '\\v'],
  [/↖/g, '^\\'],
  [/↙/g, 'v/'],

  // Checkmarks and crosses
  [/[✓✔☑]/g, '[v]'],
  [/[✗✘☒✕✖]/g, '[x]'],

  // Bullets and list markers
  [/[•‣⁃◦∙◘●○]/g, '*'],
  [/[■□▪▫]/g, '*'],
  [/[▲▼►◄▶◀]/g, '>'],
  [/[★☆]/g, '*'],
  [/♥/g, '<3>'],
  [/♦/g, '[D]'],
  [/♣/g, '[C]'],
  [/♠/g, '[S]'],

  // Math symbols
  [/≠/g, '!='],
  [/[≈≅]/g, '~='],
  [/≤/g, '<='],
  [/≥/g, '>='],
  [/√/g, 'sqrt'],
  [/∞/g, 'inf'],
  [/∑/g, 'Sum'],
  [/∏/g, 'Prod'],
  [/∫/g, 'int'],
  [/[∆Δ]/g, 'Delta'],
  [/[πΠ]/g, 'pi'],
  [/Ω/g, 'Ohm'],
  [/[µμ]/g, 'u'],
  [/±/g, '+/-'],
  [/×/g, 'x'],
  [/÷/g, '/'],

  // Quotes, dashes and typography
  [/[“”„‟″]/g, '"'],
  [/[‘’‚‛′‵]/g, "'"],
  [/[«»]/g, '"'],
  [/[–—―−]/g, '-'],
  [/…/g, '...'],
  [/™/g, '(TM)'],
  [/©/g, '(C)'],
  [/®/g, '(R)'],
  [/°/g, ' deg'],
  [/№/g, 'No.'],

  // Fractions
  [/½/g, '1/2'],
  [/¼/g, '1/4'],
  [/¾/g, '3/4'],
  [/⅓/g, '1/3'],
  [/⅔/g, '2/3'],
  [/⅛/g, '1/8'],
  [/⅜/g, '3/8'],
  [/⅝/g, '5/8'],
  [/⅞/g, '7/8'],

  // Currency
  [/€/g, 'EUR '],
  [/£/g, 'GBP '],
  [/¥/g, 'JPY '],
  [/₹/g, 'INR '],
  [/₽/g, 'RUB '],
  [/₺/g, 'TRY '],
  [/₩/g, 'KRW '],
  [/₿/g, 'BTC '],
  [/₫/g, 'VND '],
  [/₪/g, 'ILS '],
  [/¢/g, 'cent'],
]

/**
 * Sanitizes any text string to be strictly compatible with PDF-Lib's StandardFonts (WinAnsi encoding).
 * Replaces unencodable Unicode symbols, arrows, fractions, emojis, and unmapped characters.
 */
export function sanitizeForPdfWinAnsi(input: string): string {
  if (!input) return ''

  let text = input

  // Replace known Unicode symbols with clean ASCII equivalents
  for (const [pattern, replacement] of UNICODE_TO_ASCII_MAP) {
    text = text.replace(pattern, replacement)
  }

  // Remove zero-width & non-printable formatting characters
  text = text.replace(/[\u200B-\u200D\uFEFF\u00AD\u2060\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  // Normalize whitespace (NBSP, em space, en space, etc.)
  text = text.replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ')

  // Convert tabs to spaces
  text = text.replace(/\t/g, '    ')

  // Check every character against safe WinAnsi / ASCII
  let sanitized = ''
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const code = char.charCodeAt(0)

    // Standard ASCII printable & basic newline/carriage return
    if ((code >= 0x20 && code <= 0x7E) || code === 0x0A || code === 0x0D) {
      sanitized += char
      continue
    }

    // Windows-1252 / Latin-1 safe characters (accented Latin letters, etc.)
    if (code >= 0xA0 && code <= 0xFF) {
      sanitized += char
      continue
    }

    // Try decomposing diacritics to basic Latin letters
    const decomposed = char.normalize('NFD').replace(/[\u0300-\u036F]/g, '')
    if (decomposed && decomposed.charCodeAt(0) >= 0x20 && decomposed.charCodeAt(0) <= 0x7E) {
      sanitized += decomposed
    } else {
      // Safe fallback for unmappable glyphs
      sanitized += ' '
    }
  }

  return sanitized
}

function safeWidthOfText(font: any, text: string, size: number): number {
  try {
    return font.widthOfTextAtSize(text, size)
  } catch {
    const fallback = text.replace(/[^\x20-\x7E]/g, ' ')
    try {
      return font.widthOfTextAtSize(fallback, size)
    } catch {
      return fallback.length * size * 0.55
    }
  }
}

function safeDrawText(
  page: any,
  font: any,
  text: string,
  options: { x: number; y: number; size: number; color: any }
) {
  try {
    page.drawText(text, {
      x: options.x,
      y: options.y,
      size: options.size,
      font,
      color: options.color,
    })
  } catch (err) {
    console.warn('PDF drawText encoding warning, using ASCII fallback:', err)
    const fallback = text.replace(/[^\x20-\x7E]/g, ' ')
    try {
      page.drawText(fallback, {
        x: options.x,
        y: options.y,
        size: options.size,
        font,
        color: options.color,
      })
    } catch {
      // ignore
    }
  }
}

export async function generatePdfDocument(options: {
  title?: string
  text?: string
  paragraphs?: string[]
  images?: { data: ArrayBuffer | Uint8Array; type: 'jpg' | 'png' }[]
  pageSize?: [number, number]
}): Promise<Blob> {
  const [pageWidth, pageHeight] = options.pageSize || PageSizes.A4
  const margin = 50
  const contentWidth = pageWidth - margin * 2

  // If images are provided:
  if (options.images && options.images.length > 0) {
    const pdfDoc = await PDFDocument.create()
    for (const img of options.images) {
      const page = pdfDoc.addPage([pageWidth, pageHeight])
      let embeddedImg
      if (img.type === 'png') {
        embeddedImg = await pdfDoc.embedPng(img.data)
      } else {
        embeddedImg = await pdfDoc.embedJpg(img.data)
      }

      // Calculate scale to fit page margins proportionally
      const imgWidth = embeddedImg.width
      const imgHeight = embeddedImg.height
      const scaleFactor = Math.min(contentWidth / imgWidth, (pageHeight - margin * 2) / imgHeight, 1)

      const drawWidth = imgWidth * scaleFactor
      const drawHeight = imgHeight * scaleFactor
      const xPos = margin + (contentWidth - drawWidth) / 2
      const yPos = margin + (pageHeight - margin * 2 - drawHeight) / 2

      page.drawImage(embeddedImg, {
        x: xPos,
        y: yPos,
        width: drawWidth,
        height: drawHeight,
      })
    }

    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
  }

  const rawTitle = options.title || 'Document'
  const rawParagraphs = options.paragraphs || (options.text ? options.text.split('\n') : ['No text provided'])
  const allText = [rawTitle, ...rawParagraphs].join(' ')
  const hasRtlOrComplex = containsRtl(allText)

  // If text contains Arabic/RTL, render using Canvas Hi-DPI Engine (Like Adobe / iLovePDF)
  // to ensure 100% accurate connected glyphs, RTL flow, and zero empty pages
  if (hasRtlOrComplex && typeof document !== 'undefined') {
    const pdfDoc = await PDFDocument.create()
    const scale = 2 // 2x Retina scale for crisp text output
    const canvasWidth = pageWidth * scale
    const canvasHeight = pageHeight * scale
    const canvasMargin = margin * scale
    const canvasContentWidth = contentWidth * scale

    let canvas = document.createElement('canvas')
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    let ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas rendering context not available')

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    let currentY = canvasMargin + 40 * scale
    const pageCanvases: HTMLCanvasElement[] = [canvas]

    const addNewCanvasPage = () => {
      canvas = document.createElement('canvas')
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      currentY = canvasMargin + 30 * scale
      pageCanvases.push(canvas)
    }

    // Render Title
    if (rawTitle) {
      const isTitleRtl = containsRtl(rawTitle)
      ctx.direction = isTitleRtl ? 'rtl' : 'ltr'
      ctx.textAlign = isTitleRtl ? 'right' : 'left'
      ctx.fillStyle = '#0f172a'
      ctx.font = `bold ${22 * scale}px "Cairo", "Segoe UI", "Tahoma", -apple-system, sans-serif`
      const titleX = isTitleRtl ? canvasWidth - canvasMargin : canvasMargin
      ctx.fillText(rawTitle, titleX, currentY)
      currentY += 45 * scale
    }

    // Render Paragraphs
    ctx.font = `${13 * scale}px "Cairo", "Segoe UI", "Tahoma", -apple-system, sans-serif`
    ctx.fillStyle = '#334155'

    for (const para of rawParagraphs) {
      const trimmed = para.trim()
      if (!trimmed) {
        currentY += 16 * scale
        continue
      }

      const isParaRtl = containsRtl(trimmed)
      ctx.direction = isParaRtl ? 'rtl' : 'ltr'
      ctx.textAlign = isParaRtl ? 'right' : 'left'
      const paraX = isParaRtl ? canvasWidth - canvasMargin : canvasMargin

      // Word wrapping for Canvas
      const words = trimmed.split(/\s+/)
      let currentLine = ''

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const metrics = ctx.measureText(testLine)

        if (metrics.width > canvasContentWidth && currentLine) {
          if (currentY > canvasHeight - canvasMargin - 30 * scale) {
            addNewCanvasPage()
            ctx.direction = isParaRtl ? 'rtl' : 'ltr'
            ctx.textAlign = isParaRtl ? 'right' : 'left'
            ctx.font = `${13 * scale}px "Cairo", "Segoe UI", "Tahoma", -apple-system, sans-serif`
            ctx.fillStyle = '#334155'
          }
          ctx.fillText(currentLine, paraX, currentY)
          currentY += 24 * scale
          currentLine = word
        } else {
          currentLine = testLine
        }
      }

      if (currentLine) {
        if (currentY > canvasHeight - canvasMargin - 30 * scale) {
          addNewCanvasPage()
          ctx.direction = isParaRtl ? 'rtl' : 'ltr'
          ctx.textAlign = isParaRtl ? 'right' : 'left'
          ctx.font = `${13 * scale}px "Cairo", "Segoe UI", "Tahoma", -apple-system, sans-serif`
          ctx.fillStyle = '#334155'
        }
        ctx.fillText(currentLine, paraX, currentY)
        currentY += 28 * scale
      }
    }

    // Embed all generated pages into PDFDocument
    for (const pCanvas of pageCanvases) {
      const pngBlob = await new Promise<Blob>((resolve) => {
        pCanvas.toBlob((b) => resolve(b || new Blob([])), 'image/png', 1.0)
      })
      const pngBytes = await pngBlob.arrayBuffer()
      const embeddedPng = await pdfDoc.embedPng(pngBytes)
      const page = pdfDoc.addPage([pageWidth, pageHeight])
      page.drawImage(embeddedPng, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      })
    }

    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
  }

  // Standard Latin/English PDF Generation via StandardFonts
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  const title = sanitizeForPdfWinAnsi(rawTitle)

  safeDrawText(page, boldFont, title, {
    x: margin,
    y: y - 18,
    size: 20,
    color: rgb(0.06, 0.09, 0.16),
  })
  y -= 45

  const paragraphs = rawParagraphs.map((p) => sanitizeForPdfWinAnsi(p))

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) {
      y -= 12
      continue
    }

    // Wrap lines
    const words = trimmed.split(/\s+/)
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const textWidth = safeWidthOfText(font, testLine, 10.5)

      if (textWidth > contentWidth) {
        if (y < margin + 25) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          y = pageHeight - margin
        }
        safeDrawText(page, font, currentLine, {
          x: margin,
          y,
          size: 10.5,
          color: rgb(0.2, 0.25, 0.35),
        })
        y -= 16
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      if (y < margin + 25) {
        page = pdfDoc.addPage([pageWidth, pageHeight])
        y = pageHeight - margin
      }
      safeDrawText(page, font, currentLine, {
        x: margin,
        y,
        size: 10.5,
        color: rgb(0.2, 0.25, 0.35),
      })
      y -= 18
    }
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
}

// ----------------------------------------------------
// 10. HTML Document Export
// ----------------------------------------------------
export function generateHtmlDocument(options: {
  title: string
  bodyHtml: string
  sourceType: string
}): Blob {
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title)}</title>
  <style>
    :root {
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      --bg: #ffffff;
      --text: #1e293b;
      --muted: #64748b;
      --border: #e2e8f0;
      --primary: #2563eb;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f172a;
        --text: #f8fafc;
        --muted: #94a3b8;
        --border: #334155;
        --primary: #3b82f6;
      }
    }
    body {
      font-family: var(--font-family);
      line-height: 1.6;
      color: var(--text);
      background-color: var(--bg);
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 860px;
      margin: 0 auto;
      background: var(--bg);
    }
    .header {
      padding-bottom: 24px;
      margin-bottom: 32px;
      border-bottom: 1px solid var(--border);
    }
    h1 {
      font-size: 2rem;
      margin: 0 0 8px 0;
      color: var(--text);
    }
    .meta {
      font-size: 0.875rem;
      color: var(--muted);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
    }
    th, td {
      padding: 10px 14px;
      border: 1px solid var(--border);
      text-align: left;
      font-size: 0.875rem;
    }
    th {
      background-color: rgba(148, 163, 184, 0.1);
      font-weight: 600;
    }
    p, li {
      font-size: 1rem;
      color: var(--text);
    }
    .slide-card {
      margin-bottom: 24px;
      padding: 24px;
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    @media print {
      body { padding: 0; }
      .container { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(options.title)}</h1>
      <div class="meta">Converted from ${escapeHtml(options.sourceType.toUpperCase())} • Generated cleanly</div>
    </div>
    <div class="content">
      ${options.bodyHtml}
    </div>
  </div>
</body>
</html>`

  return new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
}

// ----------------------------------------------------
// Helpers
// ----------------------------------------------------
function escapeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function escapeXml(str: string): string {
  if (!str) return ''
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
