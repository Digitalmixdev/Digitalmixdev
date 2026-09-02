/**
 * Universal Intermediate Document Model & Normalizer
 * DigitalMix Document Engine Architecture:
 * Source Parser -> Content Detection -> Normalized Document Model -> Target Generator
 */

export type ElementType = 'text' | 'image' | 'table' | 'shape'

export interface TextSpan {
  text: string
  bold?: boolean
  italic?: boolean
  color?: string
  fontSize?: number
  isRtl?: boolean
}

export interface TextElement {
  type: 'text'
  text: string
  role?: 'title' | 'subtitle' | 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'byline' | 'bullet' | 'header' | 'footer'
  x?: number
  y?: number
  width?: number
  height?: number
  fontSize?: number
  fontWeight?: string
  fontStyle?: string
  fontFamily?: string
  color?: string
  alignment?: 'left' | 'center' | 'right' | 'justify'
  direction?: 'ltr' | 'rtl'
  isRtl?: boolean
  spans?: TextSpan[]
}

export interface ImageElement {
  type: 'image'
  data: Uint8Array | Blob | ArrayBuffer
  imageType: 'jpg' | 'png' | 'webp' | 'gif'
  x?: number
  y?: number
  width?: number
  height?: number
  isLogo?: boolean
  isBackground?: boolean
  caption?: string
}

export interface TableCell {
  text: string
  isHeader?: boolean
  colSpan?: number
  rowSpan?: number
  alignment?: 'left' | 'center' | 'right'
  bold?: boolean
  isRtl?: boolean
}

export interface TableElement {
  type: 'table'
  matrix: string[][]
  structuredRows?: TableCell[][]
  headers?: string[]
  x?: number
  y?: number
  width?: number
  height?: number
  isRtl?: boolean
  columnWidths?: number[]
  bordered?: boolean
}

export interface ShapeElement {
  type: 'shape'
  shapeType: 'photo-frame' | 'line' | 'rect'
  label?: string
  x?: number
  y?: number
  width?: number
  height?: number
}

export type DocumentElement = TextElement | ImageElement | TableElement | ShapeElement

export interface NormalizedPage {
  pageNumber: number
  width: number
  height: number
  elements: DocumentElement[]
  isScanned?: boolean
  hasNativeText?: boolean
  hasImages?: boolean
  hasTables?: boolean
  rawPageImage?: {
    blob: Blob
    dataUrl?: string
    width: number
    height: number
    type: 'jpg' | 'png'
  }
}

export interface NormalizedDocument {
  title?: string
  author?: string
  sourceType: string
  pageCount: number
  pages: NormalizedPage[]
  rawText?: string
}

// ----------------------------------------------------
// Utility Functions
// ----------------------------------------------------

export function containsRtl(str: string): boolean {
  if (!str) return false
  const arabicHebrewRange = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\u0590-\u05FF]/
  return arabicHebrewRange.test(str)
}

export function cleanPdfText(text: string): string {
  if (!text) return ''
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]/g, '')
    .trim()
}

export function escapeXml(str: string): string {
  if (!str) return ''
  return str
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function escapeHtml(str: string): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function toUint8Array(data: Blob | ArrayBuffer | Uint8Array): Promise<Uint8Array> {
  if (data instanceof Uint8Array) return data
  if (data instanceof ArrayBuffer) return new Uint8Array(data)
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    const ab = await data.arrayBuffer()
    return new Uint8Array(ab)
  }
  return new Uint8Array()
}

// ----------------------------------------------------
// Content Classifier & Element Builder
// ----------------------------------------------------

export function classifyLineRole(line: string, index: number, totalLines: number): 'title' | 'subtitle' | 'byline' | 'heading1' | 'heading2' | 'bullet' | 'paragraph' {
  const trimmed = line.trim()
  if (!trimmed) return 'paragraph'

  // Byline / Author Detection
  if (/^(created by|written by|author:|prepared by|designed by|إعداد|تأليف|تصميم|بقلم|عمل الطالب|تقديم|إشراف)\b/i.test(trimmed)) {
    return 'byline'
  }

  // Heading / Chapter Detection
  if (/^(chapter|section|unit|part|module|الفصل|المبحث|المطلب|الوحدة|الباب|القسم|الدرس)\s+\d+/i.test(trimmed)) {
    return 'heading1'
  }

  // Bullet Detection
  if (/^([•\-\*⁃◦‣▪▫]|\d+[\.\)]|[a-zA-Z][\.\)]|[\u0621-\u064A][\.\)])\s+/.test(trimmed)) {
    return 'bullet'
  }

  // Top Title Detection
  if (index === 0 && trimmed.length < 80 && !trimmed.endsWith('.') && !trimmed.includes(':') && totalLines > 1) {
    return 'title'
  }

  // Top Subtitle Detection
  if (index === 1 && trimmed.length < 120 && !trimmed.endsWith('.') && !trimmed.includes(':')) {
    return 'subtitle'
  }

  // Short standalone heading detection
  if (trimmed.length < 50 && !trimmed.endsWith('.') && !trimmed.includes(',') && !trimmed.includes(';') && !trimmed.includes(':')) {
    return 'heading2'
  }

  return 'paragraph'
}

/**
 * Parses raw HTML string (e.g. from OCR or RichText) into structured DocumentElements
 */
export function parseHtmlToElements(html: string): DocumentElement[] {
  const elements: DocumentElement[] = []
  if (!html || !html.trim()) return elements

  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const nodes = Array.from(doc.body.children.length > 0 ? doc.body.children : doc.body.childNodes)

      nodes.forEach((node, idx) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement
          const tagName = el.tagName.toLowerCase()
          const txt = el.textContent?.trim() || ''

          if (tagName === 'table') {
            const rows = Array.from(el.querySelectorAll('tr'))
            const matrix: string[][] = rows.map((r) =>
              Array.from(r.querySelectorAll('td, th')).map((c) => c.textContent?.trim() || '')
            ).filter(row => row.some(cell => cell.length > 0))

            if (matrix.length > 0) {
              const allText = matrix.flat().join(' ')
              elements.push({
                type: 'table',
                matrix,
                headers: matrix[0],
                isRtl: containsRtl(allText),
              })
            }
          } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4') {
            if (txt) {
              elements.push({
                type: 'text',
                text: txt,
                role: tagName === 'h1' ? 'title' : tagName === 'h2' ? 'heading1' : 'heading2',
                isRtl: containsRtl(txt),
                alignment: containsRtl(txt) ? 'right' : 'left',
              })
            }
          } else if (
            el.classList.contains('photo-frame') ||
            el.classList.contains('photo-box') ||
            txt.includes('صورة الطالب') ||
            txt.includes('صورة الطالبة') ||
            txt.includes('صورة شخصية')
          ) {
            elements.push({
              type: 'shape',
              shapeType: 'photo-frame',
              label: txt || 'صورة الطالب / الطالبة\n6 * 4',
            })
          } else if (
            /^(created by|written by|by |author:|إعداد|تأليف|تصميم|بقلم|عمل الطالب|تقديم)/i.test(txt)
          ) {
            elements.push({
              type: 'text',
              text: txt,
              role: 'byline',
              isRtl: containsRtl(txt),
              alignment: 'center',
            })
          } else if (tagName === 'ul' || tagName === 'ol') {
            const items = Array.from(el.querySelectorAll('li'))
            items.forEach((li) => {
              const liTxt = li.textContent?.trim() || ''
              if (liTxt) {
                elements.push({
                  type: 'text',
                  text: liTxt,
                  role: 'bullet',
                  isRtl: containsRtl(liTxt),
                  alignment: containsRtl(liTxt) ? 'right' : 'left',
                })
              }
            })
          } else {
            if (txt) {
              const isRtl = containsRtl(txt)
              const role = classifyLineRole(txt, idx, nodes.length)
              elements.push({
                type: 'text',
                text: txt,
                role,
                isRtl,
                alignment: role === 'title' || role === 'subtitle' || role === 'byline' ? 'center' : isRtl ? 'right' : 'left',
              })
            }
          }
        } else if (node.nodeType === Node.TEXT_NODE) {
          const txt = node.textContent?.trim() || ''
          if (txt) {
            const isRtl = containsRtl(txt)
            elements.push({
              type: 'text',
              text: txt,
              role: 'paragraph',
              isRtl,
              alignment: isRtl ? 'right' : 'left',
            })
          }
        }
      })

      if (elements.length > 0) return elements
    } catch (e) {
      console.warn('parseHtmlToElements DOMParser error, using fallback:', e)
    }
  }

  // Plain text fallback
  return parseTextToElements(html)
}

/**
 * Parses raw text lines into structured DocumentElements with table & header detection
 */
export function parseTextToElements(rawText: string): DocumentElement[] {
  const elements: DocumentElement[] = []
  if (!rawText || !rawText.trim()) return elements

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  let inTable = false
  let tableRows: string[][] = []

  const flushTable = () => {
    if (tableRows.length > 0) {
      const allText = tableRows.flat().join(' ')
      elements.push({
        type: 'table',
        matrix: [...tableRows],
        headers: tableRows[0],
        isRtl: containsRtl(allText),
      })
      tableRows = []
    }
    inTable = false
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Pipe-delimited Markdown table line
    if (line.includes('|') && (line.startsWith('|') || (line.match(/\|/g) || []).length >= 2)) {
      if (/^\|?[\s\-:|]+\|?$/.test(line)) {
        inTable = true
        continue
      }
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter((c, idx, arr) => (idx === 0 && !line.startsWith('|') ? true : idx > 0 && idx < arr.length - 1))
      if (cells.length > 0) {
        tableRows.push(cells)
        inTable = true
        continue
      }
    } else if (inTable) {
      flushTable()
    }

    // Photo Box / Placeholder
    if (line.includes('صورة الطالب') || line.includes('صورة الشخصية') || line.includes('صورة ملونة خلفية بيضاء')) {
      elements.push({
        type: 'shape',
        shapeType: 'photo-frame',
        label: line,
      })
      continue
    }

    // Tab-delimited table detection
    if (line.includes('\t') && line.split('\t').filter(Boolean).length >= 2) {
      const cells = line.split('\t').map((c) => c.trim())
      tableRows.push(cells)
      inTable = true
      continue
    }

    const role = classifyLineRole(line, i, lines.length)
    const isRtl = containsRtl(line)

    elements.push({
      type: 'text',
      text: line,
      role,
      isRtl,
      alignment: role === 'title' || role === 'subtitle' || role === 'byline' ? 'center' : isRtl ? 'right' : 'left',
    })
  }

  if (inTable) flushTable()

  return elements
}
