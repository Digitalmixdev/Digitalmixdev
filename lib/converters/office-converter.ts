import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib'
import {
  NormalizedDocument,
  NormalizedPage,
  DocumentElement,
  TextElement,
  ImageElement,
  TableElement,
  ShapeElement,
  containsRtl,
  cleanPdfText,
  escapeXml,
  escapeHtml,
  toUint8Array,
  parseHtmlToElements,
  parseTextToElements,
} from './intermediate-document'

export * from './intermediate-document'

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
// Helper: Safe PDF.js Loading & Worker Setup
// ----------------------------------------------------
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
// 1. PDF Parser -> Normalized Document Model
// ----------------------------------------------------
function detectCanvasBackgroundColor(canvas: HTMLCanvasElement): string | undefined {
  try {
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    const w = canvas.width
    const h = canvas.height
    if (w < 20 || h < 20) return undefined
    const samples = [
      ctx.getImageData(10, 10, 1, 1).data,
      ctx.getImageData(w - 10, 10, 1, 1).data,
      ctx.getImageData(10, h - 10, 1, 1).data,
      ctx.getImageData(w - 10, h - 10, 1, 1).data,
    ]
    const first = samples[0]
    const isUniform = samples.every(
      (s) => Math.abs(s[0] - first[0]) < 12 && Math.abs(s[1] - first[1]) < 12 && Math.abs(s[2] - first[2]) < 12
    )
    if (isUniform) {
      const r = first[0].toString(16).padStart(2, '0')
      const g = first[1].toString(16).padStart(2, '0')
      const b = first[2].toString(16).padStart(2, '0')
      const hex = `#${r}${g}${b}`.toUpperCase()
      if (hex === '#FFFFFF') return undefined
      return hex
    }
  } catch {
    // ignore
  }
  return undefined
}

async function extractPdfPageImages(
  pdfjsLib: any,
  page: any,
  viewport: any,
  pageCanvas?: HTMLCanvasElement | null
): Promise<ImageElement[]> {
  const images: ImageElement[] = []
  try {
    const opList = await page.getOperatorList()
    const OPS = pdfjsLib.OPS || (pdfjsLib as any).OPS || {}

    let ctm = [1, 0, 0, 1, 0, 0]
    const stack: number[][] = []

    const multiply = (m1: number[], m2: number[]) => [
      m1[0] * m2[0] + m1[2] * m2[1],
      m1[1] * m2[0] + m1[3] * m2[1],
      m1[0] * m2[2] + m1[2] * m2[3],
      m1[1] * m2[2] + m1[3] * m2[3],
      m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
      m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
    ]

    for (let j = 0; j < opList.fnArray.length; j++) {
      const fn = opList.fnArray[j]
      const args = opList.argsArray[j]

      if (fn === OPS.save) {
        stack.push([...ctm])
      } else if (fn === OPS.restore) {
        if (stack.length > 0) ctm = stack.pop()!
      } else if (fn === OPS.transform) {
        if (args && args.length >= 6) {
          ctm = multiply(ctm, args)
        }
      } else if (
        fn === OPS.paintImageXObject ||
        fn === OPS.paintInlineImageXObject ||
        fn === OPS.paintImageMaskXObject
      ) {
        const scaleX = Math.abs(ctm[0])
        const scaleY = Math.abs(ctm[3])
        const translateX = ctm[4]
        const translateY = ctm[5]

        const width = Math.round(scaleX)
        const height = Math.round(scaleY)
        const x = Math.round(translateX)
        const y = Math.round(viewport.height - (translateY + scaleY))

        if (width < 12 || height < 12) continue
        if (width >= viewport.width * 0.96 && height >= viewport.height * 0.96) continue

        const imgName = args ? args[0] : null
        let extractedBlob: Blob | null = null

        if (imgName && page.objs) {
          try {
            const rawImg = await new Promise<any>((resolve) => {
              try {
                const res = page.objs.get(imgName, (obj: any) => resolve(obj))
                if (res !== undefined) resolve(res)
                else setTimeout(() => resolve(null), 300)
              } catch {
                resolve(null)
              }
            })

            if (rawImg) {
              if (rawImg instanceof HTMLCanvasElement || (typeof ImageBitmap !== 'undefined' && rawImg instanceof ImageBitmap)) {
                const c = document.createElement('canvas')
                c.width = rawImg.width
                c.height = rawImg.height
                const ctx = c.getContext('2d')
                if (ctx) {
                  ctx.drawImage(rawImg as any, 0, 0)
                  extractedBlob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/png'))
                }
              } else if (rawImg.data && rawImg.width && rawImg.height) {
                const c = document.createElement('canvas')
                c.width = rawImg.width
                c.height = rawImg.height
                const ctx = c.getContext('2d')
                if (ctx) {
                  const imgData = ctx.createImageData(rawImg.width, rawImg.height)
                  const srcData = rawImg.data
                  if (srcData.length === rawImg.width * rawImg.height * 4) {
                    imgData.data.set(srcData)
                  } else if (srcData.length === rawImg.width * rawImg.height * 3) {
                    for (let p = 0, q = 0; p < srcData.length; p += 3, q += 4) {
                      imgData.data[q] = srcData[p]
                      imgData.data[q + 1] = srcData[p + 1]
                      imgData.data[q + 2] = srcData[p + 2]
                      imgData.data[q + 3] = 255
                    }
                  } else if (srcData.length === rawImg.width * rawImg.height) {
                    for (let p = 0, q = 0; p < srcData.length; p++, q += 4) {
                      const v = srcData[p]
                      imgData.data[q] = v
                      imgData.data[q + 1] = v
                      imgData.data[q + 2] = v
                      imgData.data[q + 3] = 255
                    }
                  }
                  ctx.putImageData(imgData, 0, 0)
                  extractedBlob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/png'))
                }
              }
            }
          } catch (e) {
            console.warn('Native image extraction fallback:', e)
          }
        }

        if (!extractedBlob && pageCanvas) {
          try {
            const cropCanvas = document.createElement('canvas')
            const scaleRatio = pageCanvas.width / viewport.width
            const cropX = Math.max(0, Math.round(x * scaleRatio))
            const cropY = Math.max(0, Math.round(y * scaleRatio))
            const cropW = Math.min(pageCanvas.width - cropX, Math.round(width * scaleRatio))
            const cropH = Math.min(pageCanvas.height - cropY, Math.round(height * scaleRatio))

            if (cropW > 10 && cropH > 10) {
              cropCanvas.width = cropW
              cropCanvas.height = cropH
              const cropCtx = cropCanvas.getContext('2d')
              if (cropCtx) {
                cropCtx.drawImage(
                  pageCanvas,
                  cropX, cropY, cropW, cropH,
                  0, 0, cropW, cropH
                )
                extractedBlob = await new Promise<Blob>((res) => cropCanvas.toBlob((b) => res(b!), 'image/png'))
              }
            }
          } catch (err) {
            console.warn('Region crop error:', err)
          }
        }

        if (extractedBlob) {
          const isLogo = y < viewport.height * 0.35 && width < 300 && height < 200
          images.push({
            type: 'image',
            data: extractedBlob,
            imageType: 'png',
            x,
            y,
            width,
            height,
            isLogo,
          })
        }
      }
    }
  } catch (err) {
    console.warn('Error extracting PDF page images:', err)
  }

  return images
}

export async function parsePdfToNormalizedDocument(
  file: File | Blob,
  options: { ocrHandler?: (imageBlob: Blob) => Promise<{ text: string; html?: string }> } = {}
): Promise<NormalizedDocument> {
  const pdfjsLib = await import('pdfjs-dist')
  const pdf = await getPdfDocumentSafe(pdfjsLib, file)
  const pageCount = pdf.numPages
  const pages: NormalizedPage[] = []
  let fullDocText = ''

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.0 })

    // Render offscreen canvas for background detection and image region cropping
    let pageCanvas: HTMLCanvasElement | null = null
    try {
      pageCanvas = document.createElement('canvas')
      const rViewport = page.getViewport({ scale: 1.5 })
      pageCanvas.width = rViewport.width
      pageCanvas.height = rViewport.height
      const ctx = pageCanvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
        await page.render({ canvasContext: ctx, viewport: rViewport, canvas: pageCanvas } as any).promise
      }
    } catch {
      // ignore render error
    }

    const backgroundColor = pageCanvas ? detectCanvasBackgroundColor(pageCanvas) : undefined
    const extractedImages = await extractPdfPageImages(pdfjsLib, page, viewport, pageCanvas)

    const textContent = await page.getTextContent({ normalizeWhitespace: true })

    // Group items by vertical position (Y coordinate) to reconstruct lines and layout
    interface RawTextItem {
      str: string
      x: number
      y: number
      width: number
      height: number
      fontSize: number
      hasEOL: boolean
      dir: string
    }

    const items: RawTextItem[] = []
    for (const item of textContent.items as any[]) {
      const str = cleanPdfText(item.str || '')
      if (!str && !item.hasEOL) continue

      const tx = item.transform || [12, 0, 0, 12, 0, 0]
      const fontSize = Math.round(Math.hypot(tx[0], tx[1]) || 12)
      const x = Math.round(tx[4])
      const y = Math.round(tx[5])

      items.push({
        str,
        x,
        y,
        width: Math.round(item.width || 0),
        height: Math.round(item.height || fontSize),
        fontSize,
        hasEOL: !!item.hasEOL,
        dir: item.dir || 'ltr',
      })
    }

    // Sort items vertically (top to bottom: in PDF Y=0 is bottom, so descending Y)
    // Then horizontally (ascending X for LTR, or natural order)
    items.sort((a, b) => {
      const dy = b.y - a.y
      if (Math.abs(dy) > 5) return dy
      return a.x - b.x
    })

    // Group items into lines
    interface RawLine {
      y: number
      topY: number
      minX: number
      maxX: number
      width: number
      height: number
      text: string
      maxFontSize: number
      isRtl: boolean
      items: RawTextItem[]
    }

    const rawLines: RawLine[] = []
    let currentLineItems: RawTextItem[] = []
    let currentLineY: number | null = null

    for (const item of items) {
      if (currentLineY === null) {
        currentLineY = item.y
        currentLineItems.push(item)
      } else if (Math.abs(item.y - currentLineY) <= 6) {
        currentLineItems.push(item)
      } else {
        // Finalize line
        if (currentLineItems.length > 0) {
          const lineStr = currentLineItems.map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim()
          if (lineStr) {
            const maxFontSize = Math.max(...currentLineItems.map((it) => it.fontSize), 12)
            const minX = Math.min(...currentLineItems.map((it) => it.x))
            const maxX = Math.max(...currentLineItems.map((it) => it.x + (it.width || 0)))
            const topY = Math.max(0, Math.round(viewport.height - currentLineY - maxFontSize))
            rawLines.push({
              y: currentLineY,
              topY,
              minX,
              maxX,
              width: Math.max(30, maxX - minX),
              height: Math.max(14, maxFontSize * 1.2),
              text: lineStr,
              maxFontSize,
              isRtl: containsRtl(lineStr),
              items: currentLineItems,
            })
          }
        }
        currentLineY = item.y
        currentLineItems = [item]
      }
    }

    if (currentLineItems.length > 0) {
      const lineStr = currentLineItems.map((it) => it.str).join(' ').replace(/\s+/g, ' ').trim()
      if (lineStr) {
        const maxFontSize = Math.max(...currentLineItems.map((it) => it.fontSize), 12)
        const minX = Math.min(...currentLineItems.map((it) => it.x))
        const maxX = Math.max(...currentLineItems.map((it) => it.x + (it.width || 0)))
        const topY = Math.max(0, Math.round(viewport.height - (currentLineY || 0) - maxFontSize))
        rawLines.push({
          y: currentLineY || 0,
          topY,
          minX,
          maxX,
          width: Math.max(30, maxX - minX),
          height: Math.max(14, maxFontSize * 1.2),
          text: lineStr,
          maxFontSize,
          isRtl: containsRtl(lineStr),
          items: currentLineItems,
        })
      }
    }

    const pageRawText = rawLines.map((l) => l.text).join('\n')
    fullDocText += `\n--- Page ${i} ---\n${pageRawText}\n`

    const elements: DocumentElement[] = []
    const isScanned = pageRawText.length < 30

    if (isScanned && options.ocrHandler) {
      // Perform OCR for scanned pages
      try {
        const pageCanvas = document.createElement('canvas')
        const renderScale = 1.8
        const rViewport = page.getViewport({ scale: renderScale })
        pageCanvas.width = rViewport.width
        pageCanvas.height = rViewport.height
        const ctx = pageCanvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
          await page.render({ canvasContext: ctx, viewport: rViewport, canvas: pageCanvas } as any).promise
          const blob = await new Promise<Blob>((resolve) => pageCanvas.toBlob((b) => resolve(b || new Blob([])), 'image/jpeg', 0.92))
          const ocrRes = await options.ocrHandler(blob)

          if (ocrRes.html) {
            const ocrElements = parseHtmlToElements(ocrRes.html)
            elements.push(...ocrElements)
          } else if (ocrRes.text) {
            const ocrElements = parseTextToElements(ocrRes.text)
            elements.push(...ocrElements)
          }
        }
      } catch (err) {
        console.warn(`OCR error on page ${i}:`, err)
      }
    }

    if (elements.length === 0) {
      // Build elements from native text lines
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
            y: rawLines[0]?.topY ?? 100,
          })
          tableRows = []
        }
        inTable = false
      }

      for (let lineIdx = 0; lineIdx < rawLines.length; lineIdx++) {
        const line = rawLines[lineIdx]
        const text = line.text

        // Table Detection: check if line has table separators or tab gaps
        if (text.includes('|') && text.startsWith('|')) {
          if (/^\|?[\s\-:|]+\|?$/.test(text)) {
            inTable = true
            continue
          }
          const cells = text
            .split('|')
            .map((c) => c.trim())
            .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
          if (cells.length > 0) {
            tableRows.push(cells)
            inTable = true
            continue
          }
        } else if (line.items.length >= 3 && hasColumnAlignments(line.items)) {
          // Multi-column row detection
          tableRows.push(line.items.map((it) => it.str.trim()).filter(Boolean))
          inTable = true
          continue
        } else if (inTable) {
          flushTable()
        }

        // Special photo frame / placeholder detection
        if (text.includes('صورة الطالب') || text.includes('صورة الشخصية') || text.includes('صورة ملونة خلفية بيضاء')) {
          elements.push({
            type: 'shape',
            shapeType: 'photo-frame',
            label: text,
            x: line.minX,
            y: line.topY,
            width: line.width,
            height: line.height,
          })
          continue
        }

        // Author / Byline
        if (/^(created by|written by|by |author:|إعداد|تأليف|تصميم|بقلم|عمل الطالب|تقديم)/i.test(text)) {
          elements.push({
            type: 'text',
            text,
            role: 'byline',
            isRtl: line.isRtl,
            alignment: 'center',
            x: line.minX,
            y: line.topY,
            width: line.width,
            height: line.height,
            fontSize: line.maxFontSize,
          })
          continue
        }

        // Title / Heading
        if (lineIdx === 0 && text.length < 80 && !text.endsWith('.') && !text.includes(':')) {
          elements.push({
            type: 'text',
            text,
            role: 'title',
            fontSize: line.maxFontSize > 16 ? line.maxFontSize : 22,
            isRtl: line.isRtl,
            alignment: 'center',
            x: line.minX,
            y: line.topY,
            width: line.width,
            height: line.height,
          })
          continue
        }

        if (lineIdx === 1 && text.length < 120 && !text.endsWith('.') && !text.includes(':')) {
          elements.push({
            type: 'text',
            text,
            role: 'subtitle',
            fontSize: line.maxFontSize > 14 ? line.maxFontSize : 14,
            isRtl: line.isRtl,
            alignment: 'center',
            x: line.minX,
            y: line.topY,
            width: line.width,
            height: line.height,
          })
          continue
        }

        if (/^(chapter|section|unit|part|الفصل|المبحث|المطلب|الوحدة|الباب)\s+\d+/i.test(text) || line.maxFontSize >= 18) {
          elements.push({
            type: 'text',
            text,
            role: 'heading1',
            fontSize: line.maxFontSize,
            isRtl: line.isRtl,
            alignment: line.isRtl ? 'right' : 'left',
            x: line.minX,
            y: line.topY,
            width: line.width,
            height: line.height,
          })
          continue
        }

        if (line.maxFontSize >= 15 || (/^[0-9]+[\.\)]\s+/.test(text) && text.length < 60)) {
          elements.push({
            type: 'text',
            text,
            role: 'heading2',
            fontSize: line.maxFontSize,
            isRtl: line.isRtl,
            alignment: line.isRtl ? 'right' : 'left',
            x: line.minX,
            y: line.topY,
            width: line.width,
            height: line.height,
          })
          continue
        }

        // Bullet item
        if (/^[•\-\*⁃◦‣▪▫]\s+/.test(text)) {
          elements.push({
            type: 'text',
            text: text.replace(/^[•\-\*⁃◦‣▪▫]\s+/, ''),
            role: 'bullet',
            fontSize: line.maxFontSize,
            isRtl: line.isRtl,
            alignment: line.isRtl ? 'right' : 'left',
            x: line.minX,
            y: line.topY,
            width: line.width,
            height: line.height,
          })
          continue
        }

        // Regular Paragraph
        elements.push({
          type: 'text',
          text,
          role: 'paragraph',
          fontSize: line.maxFontSize,
          isRtl: line.isRtl,
          alignment: line.isRtl ? 'right' : 'left',
          x: line.minX,
          y: line.topY,
          width: line.width,
          height: line.height,
        })
      }

      if (inTable) flushTable()
    }

    const sortedPageElements = [...extractedImages, ...elements]
    sortedPageElements.sort((a, b) => (a.y ?? 0) - (b.y ?? 0))

    pages.push({
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      elements: sortedPageElements,
      backgroundColor,
      isScanned,
      hasNativeText: !isScanned,
      hasImages: extractedImages.length > 0,
      hasTables: elements.some((e) => e.type === 'table'),
    })
  }

  const baseTitle = file instanceof File ? file.name.replace(/\.[^/.]+$/, '') : 'PDF Document'

  return {
    title: baseTitle,
    sourceType: 'pdf',
    pageCount,
    pages,
    rawText: fullDocText.trim(),
  }
}

function hasColumnAlignments(items: { x: number; str: string }[]): boolean {
  if (items.length < 3) return false
  const gaps = []
  for (let i = 1; i < items.length; i++) {
    gaps.push(items[i].x - items[i - 1].x)
  }
  return gaps.some((g) => g > 60)
}

// ----------------------------------------------------
// 2. Render PDF Pages to Images (JPG / PNG)
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
      width: viewport.width,
      height: viewport.height,
    })
  }

  return results
}

// ----------------------------------------------------
// 3. DOCX Parser -> Normalized Document Model
// ----------------------------------------------------
export async function parseDocx(
  file: File | Blob
): Promise<{ html: string; text: string; images?: { filename: string; blob: Blob }[] }> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    const images: { filename: string; blob: Blob }[] = []
    const mediaFiles = Object.keys(zip.files).filter((name) => /^word\/media\/.+/i.test(name))
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
      const mediaFiles = Object.keys(zip.files).filter((name) => /^word\/media\/.+/i.test(name))
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

export async function parseDocxToNormalizedDocument(file: File | Blob): Promise<NormalizedDocument> {
  const { html, text, images } = await parseDocx(file)
  const elements = parseHtmlToElements(html)
  const baseTitle = file instanceof File ? file.name.replace(/\.[^/.]+$/, '') : 'Word Document'

  if (images && images.length > 0) {
    for (const img of images) {
      const imgType = img.filename.toLowerCase().endsWith('png') ? 'png' : 'jpg'
      elements.unshift({
        type: 'image',
        data: img.blob,
        imageType: imgType,
      })
    }
  }

  return {
    title: baseTitle,
    sourceType: 'docx',
    pageCount: 1,
    pages: [
      {
        pageNumber: 1,
        width: 595,
        height: 842,
        elements,
        hasNativeText: true,
        hasImages: !!images && images.length > 0,
        hasTables: elements.some((e) => e.type === 'table'),
      },
    ],
    rawText: text,
  }
}

// ----------------------------------------------------
// 4. PPTX Parser -> Normalized Document Model
// ----------------------------------------------------
export async function parsePptx(
  file: File | Blob
): Promise<{ slides: ParsedSlide[]; text: string; html: string }> {
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

export async function parsePptxToNormalizedDocument(file: File | Blob): Promise<NormalizedDocument> {
  const { slides, text } = await parsePptx(file)
  const baseTitle = file instanceof File ? file.name.replace(/\.[^/.]+$/, '') : 'PowerPoint Presentation'

  const pages: NormalizedPage[] = slides.map((s) => {
    const elements: DocumentElement[] = [
      {
        type: 'text',
        text: s.title,
        role: 'title',
        isRtl: containsRtl(s.title),
        alignment: containsRtl(s.title) ? 'right' : 'left',
      },
    ]

    for (const b of s.bullets) {
      elements.push({
        type: 'text',
        text: b,
        role: 'bullet',
        isRtl: containsRtl(b),
        alignment: containsRtl(b) ? 'right' : 'left',
      })
    }

    return {
      pageNumber: s.slideNumber,
      width: 960,
      height: 540,
      elements,
      hasNativeText: true,
    }
  })

  return {
    title: baseTitle,
    sourceType: 'pptx',
    pageCount: slides.length,
    pages,
    rawText: text,
  }
}

// ----------------------------------------------------
// 5. XLSX Parser -> Normalized Document Model
// ----------------------------------------------------
export async function parseXlsx(
  file: File | Blob
): Promise<{ sheets: ParsedSheet[]; html: string; text: string }> {
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

export async function parseXlsxToNormalizedDocument(file: File | Blob): Promise<NormalizedDocument> {
  const { sheets, text } = await parseXlsx(file)
  const baseTitle = file instanceof File ? file.name.replace(/\.[^/.]+$/, '') : 'Excel Spreadsheet'

  const pages: NormalizedPage[] = sheets.map((sheet, idx) => {
    const rawRows = sheet.csv
      .split('\n')
      .map((r) => r.split(',').map((c) => c.replace(/^"(.*)"$/, '$1').trim()))
      .filter((r) => r.some((c) => c.length > 0))

    const elements: DocumentElement[] = [
      {
        type: 'text',
        text: sheet.name,
        role: 'title',
        isRtl: containsRtl(sheet.name),
      },
      {
        type: 'table',
        matrix: rawRows,
        headers: rawRows[0],
        isRtl: containsRtl(sheet.csv),
      },
    ]

    return {
      pageNumber: idx + 1,
      width: 800,
      height: 600,
      elements,
      hasNativeText: true,
      hasTables: true,
    }
  })

  return {
    title: baseTitle,
    sourceType: 'xlsx',
    pageCount: sheets.length,
    pages,
    rawText: text,
  }
}

// ----------------------------------------------------
// 6. Generic PDF Parsing wrapper
// ----------------------------------------------------
export async function parsePdf(
  file: File | Blob
): Promise<{ text: string; pageCount: number; pages: { pageNumber: number; text: string }[] }> {
  const normDoc = await parsePdfToNormalizedDocument(file)
  return {
    text: normDoc.rawText || '',
    pageCount: normDoc.pageCount,
    pages: normDoc.pages.map((p) => ({
      pageNumber: p.pageNumber,
      text: p.elements
        .filter((e) => e.type === 'text' || e.type === 'table')
        .map((e) => (e.type === 'text' ? e.text : e.matrix.map((r) => r.join(' | ')).join('\n')))
        .join('\n'),
    })),
  }
}

// ----------------------------------------------------
// 7. DOCX Generation (OpenXML via JSZip)
// ----------------------------------------------------
export interface DocxPageOption {
  text?: string
  html?: string
  image?: Blob | ArrayBuffer | Uint8Array
  imageType?: 'jpg' | 'png'
}

function renderDocxHeader(text: string, level = 'h2'): string {
  const isRtl = containsRtl(text)
  const isH1 = level === 'h1'
  const size = isH1 ? '44' : level === 'h2' ? '32' : '28'
  const isCenter = isH1 || text.length < 50
  return `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="${isH1 ? 'Heading1' : 'Heading2'}"/>
        <w:jc w:val="${isCenter ? 'center' : isRtl ? 'right' : 'left'}"/>
        ${isRtl ? '<w:bidi/>' : ''}
        <w:spacing w:before="360" w:after="160"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:cs="Traditional Arabic"/>
          <w:b/>
          <w:sz w:val="${size}"/>
          <w:szCs w:val="${size}"/>
          ${isRtl ? '<w:rtl/>' : ''}
          <w:color w:val="${isH1 ? '0F172A' : '1E293B'}"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  `
}

function renderDocxSubtitle(text: string): string {
  const isRtl = containsRtl(text)
  return `
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        ${isRtl ? '<w:bidi/>' : ''}
        <w:spacing w:before="120" w:after="300"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:cs="Traditional Arabic"/>
          <w:i/>
          <w:sz w:val="28"/>
          <w:szCs w:val="28"/>
          ${isRtl ? '<w:rtl/>' : ''}
          <w:color w:val="475569"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  `
}

function renderDocxByline(text: string): string {
  const isRtl = containsRtl(text)
  return `
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        ${isRtl ? '<w:bidi/>' : ''}
        <w:spacing w:before="720" w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:cs="Traditional Arabic"/>
          <w:b/>
          <w:sz w:val="24"/>
          <w:szCs w:val="26"/>
          ${isRtl ? '<w:rtl/>' : ''}
          <w:color w:val="2563EB"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  `
}

function renderDocxBullet(text: string): string {
  const isRtl = containsRtl(text)
  return `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="ListParagraph"/>
        <w:numPr>
          <w:ilvl w:val="0"/>
          <w:numId w:val="1"/>
        </w:numPr>
        <w:jc w:val="${isRtl ? 'right' : 'left'}"/>
        ${isRtl ? '<w:bidi/>' : ''}
        <w:spacing w:before="80" w:after="80" w:line="260" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:cs="Traditional Arabic"/>
          <w:sz w:val="24"/>
          <w:szCs w:val="26"/>
          ${isRtl ? '<w:rtl/>' : ''}
          <w:color w:val="1E293B"/>
        </w:rPr>
        <w:t xml:space="preserve">${isRtl ? '• ' : '• '}${escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  `
}

function renderDocxParagraph(text: string): string {
  const isRtl = containsRtl(text)
  const isCentered = text.length < 40 && !text.endsWith('.') && !text.includes(':')
  return `
    <w:p>
      <w:pPr>
        <w:jc w:val="${isCentered ? 'center' : isRtl ? 'right' : 'left'}"/>
        ${isRtl ? '<w:bidi/>' : ''}
        <w:spacing w:before="120" w:after="120" w:line="280" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:cs="Traditional Arabic"/>
          <w:sz w:val="24"/>
          <w:szCs w:val="26"/>
          ${isRtl ? '<w:rtl/>' : ''}
          <w:color w:val="1E293B"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>
  `
}

function renderDocxPhotoFrame(label: string): string {
  return `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="1800" w:type="dxa"/>
        <w:jc w:val="center"/>
        <w:tblBorders>
          <w:top w:val="dashed" w:sz="12" w:space="0" w:color="3B82F6"/>
          <w:left w:val="dashed" w:sz="12" w:space="0" w:color="3B82F6"/>
          <w:bottom w:val="dashed" w:sz="12" w:space="0" w:color="3B82F6"/>
          <w:right w:val="dashed" w:sz="12" w:space="0" w:color="3B82F6"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="1800" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/>
            <w:tcMar>
              <w:top w:w="240" w:type="dxa"/>
              <w:left w:w="160" w:type="dxa"/>
              <w:bottom w:w="240" w:type="dxa"/>
              <w:right w:w="160" w:type="dxa"/>
            </w:tcMar>
          </w:tcPr>
          <w:p>
            <w:pPr>
              <w:jc w:val="center"/>
            </w:pPr>
            <w:r>
              <w:rPr>
                <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:cs="Traditional Arabic"/>
                <w:sz w:val="20"/>
                <w:szCs w:val="20"/>
                <w:color w:val="64748B"/>
              </w:rPr>
              <w:t xml:space="preserve">${escapeXml(label)}</w:t>
            </w:r>
          </w:p>
        </w:tc>
      </w:tr>
    </w:tbl>
  `
}

function renderDocxTableFromMatrix(matrix: string[][]): string {
  if (!matrix || matrix.length === 0) return ''

  const colCount = Math.max(...matrix.map((r) => r.length), 1)
  const isRtl = matrix.some((r) => r.some((c) => containsRtl(c)))

  let tblXml = `
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:jc w:val="center"/>
        ${isRtl ? '<w:bidiVisual/>' : ''}
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:top w:w="120" w:type="dxa"/>
          <w:left w:w="160" w:type="dxa"/>
          <w:bottom w:w="120" w:type="dxa"/>
          <w:right w:w="160" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>
      <w:tblGrid>
        ${Array(colCount).fill('<w:gridCol/>').join('')}
      </w:tblGrid>
  `

  matrix.forEach((row, rIdx) => {
    const isHeader = rIdx === 0
    tblXml += `<w:tr>${isHeader ? '<w:trPr><w:tblHeader/></w:trPr>' : ''}`
    row.forEach((cellText) => {
      tblXml += `
        <w:tc>
          <w:tcPr>
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

function renderDocxElement(element: DocumentElement): string {
  if (element.type === 'table') {
    return renderDocxTableFromMatrix(element.matrix)
  }
  if (element.type === 'shape') {
    return renderDocxPhotoFrame(element.label || 'صورة الشخصية')
  }
  if (element.type === 'text') {
    switch (element.role) {
      case 'title':
        return renderDocxHeader(element.text, 'h1')
      case 'subtitle':
        return renderDocxSubtitle(element.text)
      case 'heading1':
        return renderDocxHeader(element.text, 'h1')
      case 'heading2':
        return renderDocxHeader(element.text, 'h2')
      case 'byline':
        return renderDocxByline(element.text)
      case 'bullet':
        return renderDocxBullet(element.text)
      default:
        return renderDocxParagraph(element.text)
    }
  }
  return ''
}

export async function generateDocxFromNormalizedDoc(
  doc: NormalizedDocument,
  options: { includeImages?: boolean } = {}
): Promise<Blob> {
  const zip = new JSZip()
  const includeImages = options.includeImages !== false

  let wordRelsContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>
`

  let bodyXml = ''
  let relIndex = 4

  for (let pageIdx = 0; pageIdx < doc.pages.length; pageIdx++) {
    const page = doc.pages[pageIdx]

    // Page break between multiple pages
    if (pageIdx > 0) {
      bodyXml += `<w:p><w:r><w:br w:type="page"/></w:r></w:p>\n`
    }

    // Process page elements
    for (const elem of page.elements) {
      if (elem.type === 'image' && includeImages && elem.data) {
        const u8 = await toUint8Array(elem.data)
        if (u8.length > 0) {
          const imgExt = elem.imageType || 'jpg'
          const imgFilename = `media/image_${pageIdx + 1}_${relIndex}.${imgExt}`
          const relId = `rId${relIndex++}`
          wordRelsContent += `  <Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${imgFilename}"/>\n`
          zip.file(`word/${imgFilename}`, u8)

          // Image width & height calculation in EMUs
          let cx = 5486400 // ~ 5.7 inches
          let cy = 3657600
          if (elem.width && elem.height) {
            const aspect = elem.height / elem.width
            cx = Math.min(5486400, elem.width * 9525)
            cy = Math.round(cx * aspect)
          }

          bodyXml += `
            <w:p>
              <w:pPr>
                <w:jc w:val="center"/>
                <w:spacing w:before="200" w:after="200"/>
              </w:pPr>
              <w:r>
                <w:drawing>
                  <wp:inline distT="0" distB="0" distL="0" distR="0">
                    <wp:extent cx="${cx}" cy="${cy}"/>
                    <wp:effectExtent l="0" t="0" r="0" b="0"/>
                    <wp:docPr id="${relIndex}" name="Picture ${relIndex}"/>
                    <wp:cNvGraphicFramePr>
                      <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
                    </wp:cNvGraphicFramePr>
                    <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                      <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                        <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                          <pic:nvPicPr>
                            <pic:cNvPr id="${relIndex}" name="Image ${relIndex}"/>
                            <pic:cNvPicPr><a:picLocks noChangeAspect="1"/></pic:cNvPicPr>
                          </pic:nvPicPr>
                          <pic:blipFill>
                            <a:blip r:embed="${relId}"/>
                            <a:stretch><a:fillRect/></a:stretch>
                          </pic:blipFill>
                          <pic:spPr>
                            <a:xfrm>
                              <a:ext cx="${cx}" cy="${cy}"/>
                            </a:xfrm>
                            <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                          </pic:spPr>
                        </pic:pic>
                      </a:graphicData>
                    </a:graphic>
                  </wp:inline>
                </w:drawing>
              </w:r>
            </w:p>
          `
        }
      } else {
        bodyXml += renderDocxElement(elem)
      }
    }
  }

  wordRelsContent += `</Relationships>`

  const pageBg = doc.pages[0]?.backgroundColor
  const docBgXml = pageBg && pageBg.toUpperCase() !== '#FFFFFF'
    ? `<w:background w:color="${pageBg.replace('#', '')}"/>`
    : ''

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  ${docBgXml}
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
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
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>
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
        <w:sz w:val="24"/>
        <w:szCs w:val="26"/>
        <w:lang w:val="en-US" w:bidi="ar-SA"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="160" w:line="240" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="360" w:after="160"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="44"/>
      <w:szCs w:val="46"/>
      <w:color w:val="0F172A"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:qFormat/>
    <w:pPr>
      <w:spacing w:before="240" w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="32"/>
      <w:szCs w:val="34"/>
      <w:color w:val="1E293B"/>
    </w:rPr>
  </w:style>
</w:styles>`

  const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:doNotDisplayPageBoundaries/>
  <w:compat>
    <w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>
  </w:compat>
</w:settings>`

  const fontTableXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:font w:name="Segoe UI">
    <w:panose1 w:val="020B0502040204020203"/>
    <w:charset w:val="00"/>
    <w:family w:val="swiss"/>
    <w:pitch w:val="variable"/>
  </w:font>
  <w:font w:name="Traditional Arabic">
    <w:panose1 w:val="02010000000000000000"/>
    <w:charset w:val="B2"/>
    <w:family w:val="auto"/>
    <w:pitch w:val="variable"/>
  </w:font>
  <w:font w:name="Calibri">
    <w:panose1 w:val="020F0502020204030204"/>
    <w:charset w:val="00"/>
    <w:family w:val="swiss"/>
    <w:pitch w:val="variable"/>
  </w:font>
</w:fonts>`

  zip.file('[Content_Types].xml', contentTypesXml)
  zip.file('_rels/.rels', relsXml)
  zip.file('word/_rels/document.xml.rels', wordRelsContent)
  zip.file('word/document.xml', documentXml)
  zip.file('word/styles.xml', stylesXml)
  zip.file('word/settings.xml', settingsXml)
  zip.file('word/fontTable.xml', fontTableXml)

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

// Legacy compatibility wrapper
export async function generateDocxFile(options: {
  title?: string
  text?: string
  html?: string
  paragraphs?: string[]
  images?: { data: Blob | ArrayBuffer | Uint8Array; type?: 'jpg' | 'png' }[]
  pages?: DocxPageOption[]
  includeImagePages?: boolean
}): Promise<Blob> {
  const normPages: NormalizedPage[] = []

  if (options.pages && options.pages.length > 0) {
    for (let i = 0; i < options.pages.length; i++) {
      const p = options.pages[i]
      const elements: DocumentElement[] = []
      if (p.image) {
        elements.push({
          type: 'image',
          data: p.image,
          imageType: p.imageType || 'jpg',
        })
      }
      if (p.html) {
        elements.push(...parseHtmlToElements(p.html))
      } else if (p.text) {
        elements.push(...parseTextToElements(p.text))
      }
      normPages.push({
        pageNumber: i + 1,
        width: 595,
        height: 842,
        elements,
      })
    }
  } else {
    const elements: DocumentElement[] = []
    if (options.images && options.images.length > 0) {
      for (const img of options.images) {
        elements.push({
          type: 'image',
          data: img.data,
          imageType: img.type || 'jpg',
        })
      }
    }
    if (options.html) {
      elements.push(...parseHtmlToElements(options.html))
    } else if (options.text) {
      elements.push(...parseTextToElements(options.text))
    } else if (options.paragraphs && options.paragraphs.length > 0) {
      elements.push(...parseTextToElements(options.paragraphs.join('\n\n')))
    }

    normPages.push({
      pageNumber: 1,
      width: 595,
      height: 842,
      elements,
    })
  }

  const doc: NormalizedDocument = {
    title: options.title || 'Document',
    sourceType: 'auto',
    pageCount: normPages.length,
    pages: normPages,
  }

  return generateDocxFromNormalizedDoc(doc, { includeImages: options.includeImagePages })
}

// ----------------------------------------------------
// 8. PPTX Generation (PresentationML via JSZip)
// ----------------------------------------------------
export async function generatePptxFromNormalizedDoc(
  doc: NormalizedDocument,
  options: { includeImages?: boolean } = {}
): Promise<Blob> {
  const zip = new JSZip()
  const presentationTitle = cleanPdfText(doc.title || 'Presentation')
  const includeImages = options.includeImages !== false

  let contentTypesOverrides = ''
  let presentationSlideRels = `  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>\n`
  presentationSlideRels += `  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>\n`
  let presentationSlidesList = ''

  for (let i = 0; i < doc.pages.length; i++) {
    const page = doc.pages[i]
    const slideNum = i + 1
    const relId = `rId${slideNum + 2}`

    contentTypesOverrides += `<Override PartName="/ppt/slides/slide${slideNum}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>\n`
    presentationSlideRels += `  <Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${slideNum}.xml"/>\n`
    presentationSlidesList += `    <p:sldId id="${255 + slideNum}" r:id="${relId}"/>\n`

    let slideRelsContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
`

    const pageW = page.width || 595
    const pageH = page.height || 842
    const slideW = 12192000
    const slideH = 6858000

    let slideShapesXml = ''
    let shapeIdCounter = 2
    let imgRelIdx = 2

    // Sort elements from top to bottom
    const elementsToRender = [...page.elements].sort((a, b) => (a.y ?? 0) - (b.y ?? 0))

    for (const el of elementsToRender) {
      if (el.type === 'image' && includeImages) {
        if (!el.data) continue
        const u8 = await toUint8Array(el.data)
        if (u8.length === 0) continue

        const imgExt = el.imageType || 'jpg'
        const imgFilename = `media/slide_${slideNum}_img_${imgRelIdx}.${imgExt}`
        const imgRelId = `rId${imgRelIdx++}`
        slideRelsContent += `  <Relationship Id="${imgRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../${imgFilename}"/>\n`
        zip.file(`ppt/${imgFilename}`, u8)

        let emuX = 7500000
        let emuY = 1600000
        let emuW = 4000000
        let emuH = 3000000

        if (el.x !== undefined && el.y !== undefined && el.width && el.height) {
          emuX = Math.round((el.x / pageW) * slideW)
          emuY = Math.round((el.y / pageH) * slideH)
          emuW = Math.round((el.width / pageW) * slideW)
          emuH = Math.round((el.height / pageH) * slideH)
        } else if (el.isLogo) {
          emuX = Math.round(slideW * 0.72)
          emuY = Math.round(slideH * 0.05)
          emuW = Math.round(slideW * 0.22)
          emuH = Math.round(slideH * 0.18)
        }

        const shapeId = shapeIdCounter++
        slideShapesXml += `
        <p:pic>
          <p:nvPicPr>
            <p:cNvPr id="${shapeId}" name="Image ${shapeId}"/>
            <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
            <p:nvPr/>
          </p:nvPicPr>
          <p:blipFill>
            <a:blip r:embed="${imgRelId}"/>
            <a:stretch><a:fillRect/></a:stretch>
          </p:blipFill>
          <p:spPr>
            <a:xfrm>
              <a:off x="${emuX}" y="${emuY}"/>
              <a:ext cx="${emuW}" cy="${emuH}"/>
            </a:xfrm>
            <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          </p:spPr>
        </p:pic>
        `
      } else if (el.type === 'text') {
        const textStr = cleanPdfText(el.text)
        if (!textStr) continue

        const isRtl = el.isRtl || containsRtl(textStr)
        const fontSz = el.fontSize || (el.role === 'title' ? 24 : el.role === 'heading1' ? 20 : 14)
        const isBold = el.role === 'title' || el.role === 'heading1' || el.role === 'heading2'

        let emuX = Math.round(((el.x ?? 40) / pageW) * slideW)
        let emuY = Math.round(((el.y ?? 40) / pageH) * slideH)
        let emuW = Math.round(((el.width ?? (pageW * 0.85)) / pageW) * slideW)
        let emuH = Math.round(((el.height ?? (fontSz * 1.5)) / pageH) * slideH)

        emuW = Math.max(emuW, 2000000)
        emuH = Math.max(emuH, 350000)

        const alignVal = el.alignment === 'center' ? 'ctr' : isRtl || el.alignment === 'right' ? 'r' : 'l'
        const shapeId = shapeIdCounter++

        slideShapesXml += `
        <p:sp>
          <p:nvSpPr>
            <p:cNvPr id="${shapeId}" name="Text ${shapeId}"/>
            <p:cNvSpPr/>
            <p:nvPr/>
          </p:nvSpPr>
          <p:spPr>
            <a:xfrm>
              <a:off x="${emuX}" y="${emuY}"/>
              <a:ext cx="${emuW}" cy="${emuH}"/>
            </a:xfrm>
            <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          </p:spPr>
          <p:txBody>
            <a:bodyPr lIns="50000" rIns="50000" tIns="30000" bIns="30000" wrap="square"/>
            <a:lstStyle/>
            <a:p>
              <a:pPr algn="${alignVal}" ${isRtl ? 'rtl="1"' : ''}/>
              <a:r>
                <a:rPr lang="${isRtl ? 'ar-SA' : 'en-US'}" altLang="ar-SA" b="${isBold ? '1' : '0'}" sz="${Math.round(fontSz * 100)}">
                  <a:solidFill><a:srgbClr val="0F172A"/></a:solidFill>
                  <a:latin typeface="Segoe UI"/>
                  <a:cs typeface="Traditional Arabic"/>
                </a:rPr>
                <a:t>${escapeXml(textStr)}</a:t>
              </a:r>
            </a:p>
          </p:txBody>
        </p:sp>
        `
      } else if (el.type === 'table') {
        const isTblRtl = el.isRtl || el.matrix.some((r) => r.some((c) => containsRtl(c)))
        const rowsXml = el.matrix
          .slice(0, 15)
          .map((row) => {
            const cellsXml = row
              .map((c) => {
                const cellRtl = containsRtl(c)
                return `
                  <a:tc>
                    <a:txBody>
                      <a:bodyPr lIns="40000" rIns="40000" tIns="30000" bIns="30000"/>
                      <a:lstStyle/>
                      <a:p>
                        <a:pPr algn="${isTblRtl || cellRtl ? 'r' : 'l'}" ${isTblRtl || cellRtl ? 'rtl="1"' : ''}/>
                        <a:r>
                          <a:rPr sz="1200" lang="${isTblRtl || cellRtl ? 'ar-SA' : 'en-US'}">
                            <a:solidFill><a:srgbClr val="0F172A"/></a:solidFill>
                            <a:latin typeface="Segoe UI"/>
                            <a:cs typeface="Traditional Arabic"/>
                          </a:rPr>
                          <a:t>${escapeXml(c)}</a:t>
                        </a:r>
                      </a:p>
                    </a:txBody>
                    <a:tcPr/>
                  </a:tc>
                `
              })
              .join('')
            return `<a:tr h="350000">${cellsXml}</a:tr>`
          })
          .join('')

        const colCount = Math.max(...el.matrix.map((r) => r.length), 1)
        const gridColsXml = Array(colCount).fill('<a:gridCol w="1500000"/>').join('')

        let emuX = Math.round(((el.x ?? 40) / pageW) * slideW)
        let emuY = Math.round(((el.y ?? 200) / pageH) * slideH)
        let emuW = Math.round(((el.width ?? (pageW * 0.9)) / pageW) * slideW)
        let emuH = Math.round(((el.height ?? (el.matrix.length * 30)) / pageH) * slideH)

        emuW = Math.max(emuW, 3000000)
        emuH = Math.max(emuH, 1000000)
        const shapeId = shapeIdCounter++

        slideShapesXml += `
        <p:graphicFrame>
          <p:nvGraphicFramePr>
            <p:cNvPr id="${shapeId}" name="Table ${shapeId}"/>
            <p:cNvGraphicFramePr/>
            <p:nvPr/>
          </p:nvGraphicFramePr>
          <p:xfrm>
            <a:off x="${emuX}" y="${emuY}"/>
            <a:ext cx="${emuW}" cy="${emuH}"/>
          </p:xfrm>
          <a:graphic>
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
              <a:tbl>
                <a:tblPr rtl="${isTblRtl ? '1' : '0'}"/>
                <a:tblGrid>${gridColsXml}</a:tblGrid>
                ${rowsXml}
              </a:tbl>
            </a:graphicData>
          </a:graphic>
        </p:graphicFrame>
        `
      }
    }

    slideRelsContent += `</Relationships>`
    zip.file(`ppt/slides/_rels/slide${slideNum}.xml.rels`, slideRelsContent)

    const bgXml = page.backgroundColor && page.backgroundColor.toUpperCase() !== '#FFFFFF'
      ? `<p:bg><p:bgPr><a:solidFill><a:srgbClr val="${page.backgroundColor.replace('#', '')}"/></a:solidFill></p:bgPr></p:bg>`
      : ''

    const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    ${bgXml}
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
      ${slideShapesXml}
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

// Legacy PPTX compatibility wrapper
export async function generatePptxFile(options: {
  title?: string
  slides: { title: string; bullets: string[]; body?: string }[]
  images?: { data: Blob | ArrayBuffer | Uint8Array; type?: 'jpg' | 'png' }[]
  includeBackgroundImages?: boolean
}): Promise<Blob> {
  const normPages: NormalizedPage[] = options.slides.map((s, idx) => {
    const elements: DocumentElement[] = [
      {
        type: 'text',
        text: s.title,
        role: 'title',
        isRtl: containsRtl(s.title),
      },
    ]

    for (const b of s.bullets) {
      elements.push({
        type: 'text',
        text: b,
        role: 'bullet',
        isRtl: containsRtl(b),
      })
    }

    if (options.images && options.images[idx]) {
      elements.push({
        type: 'image',
        data: options.images[idx].data,
        imageType: options.images[idx].type || 'jpg',
      })
    }

    return {
      pageNumber: idx + 1,
      width: 960,
      height: 540,
      elements,
      hasNativeText: true,
    }
  })

  const doc: NormalizedDocument = {
    title: options.title || 'Presentation',
    sourceType: 'auto',
    pageCount: normPages.length,
    pages: normPages,
  }

  return generatePptxFromNormalizedDoc(doc, { includeImages: options.includeBackgroundImages })
}

// ----------------------------------------------------
// 9. Excel / XLSX Generation (via SheetJS)
// Strict Rule: Images and logos are NOT inserted into Excel
// ----------------------------------------------------
export function generateXlsxFromNormalizedDoc(doc: NormalizedDocument): Blob {
  const wb = XLSX.utils.book_new()
  const masterRows: any[][] = []

  for (let pageIdx = 0; pageIdx < doc.pages.length; pageIdx++) {
    const page = doc.pages[pageIdx]

    if (doc.pages.length > 1) {
      masterRows.push([`=== Page ${page.pageNumber} ===`])
    }

    for (const elem of page.elements) {
      if (elem.type === 'table') {
        // Direct matrix insertion
        elem.matrix.forEach((row) => {
          masterRows.push(row)
        })
        masterRows.push([]) // spacer row
      } else if (elem.type === 'text') {
        const text = elem.text.trim()
        if (text.includes('\t')) {
          masterRows.push(text.split('\t').map((c) => c.trim()))
        } else if (/\s{2,}/.test(text) && !text.includes(':')) {
          masterRows.push(text.split(/\s{2,}/).map((c) => c.trim()))
        } else if (text.includes(':') && text.length < 120) {
          const parts = text.split(':')
          masterRows.push([parts[0].trim(), parts.slice(1).join(':').trim()])
        } else {
          masterRows.push([text])
        }
      }
      // Image elements and shapes are strictly omitted in Excel
    }
  }

  const finalRows = masterRows.length > 0 ? masterRows : [['Converted Sheet'], ['No data']]
  const ws = XLSX.utils.aoa_to_sheet(finalRows)
  const sheetName = (doc.title || 'Sheet1').replace(/[\\/?*[\]]/g, '_').slice(0, 31)

  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  return new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

// Legacy Excel wrapper
export function generateXlsxFromData(data: {
  sheetName?: string
  rows?: any[][]
  htmlTable?: string
  csv?: string
}): Blob {
  const wb = XLSX.utils.book_new()
  const sheetName = (data.sheetName || 'Sheet1').replace(/[\\/?*[\]]/g, '_').slice(0, 31)

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
// 10. PDF Generation (Canvas Hi-DPI Engine for Arabic/Complex + WinAnsi)
// ----------------------------------------------------
const UNICODE_TO_ASCII_MAP: [RegExp, string][] = [
  [/↔/g, '<->'],
  [/↕/g, '<|>'],
  [/[→➔➜➤⟶⇒]/g, '->'],
  [/[←⟵⇐]/g, '<-'],
  [/[↑⇑]/g, '^'],
  [/[↓⇓]/g, 'v'],
  [/[✓✔☑]/g, '[v]'],
  [/[✗✘☒✕✖]/g, '[x]'],
  [/[•‣⁃◦∙◘●○■□▪▫]/g, '*'],
  [/[“”„‟″]/g, '"'],
  [/[‘’‚‛′‵]/g, "'"],
  [/[–—―−]/g, '-'],
  [/…/g, '...'],
]

export function sanitizeForPdfWinAnsi(input: string): string {
  if (!input) return ''
  let text = input
  for (const [pattern, replacement] of UNICODE_TO_ASCII_MAP) {
    text = text.replace(pattern, replacement)
  }
  text = text.replace(/[\u200B-\u200D\uFEFF\u00AD\u2060\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  text = text.replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
  text = text.replace(/\t/g, '    ')

  let sanitized = ''
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const code = char.charCodeAt(0)
    if ((code >= 0x20 && code <= 0x7E) || code === 0x0a || code === 0x0d) {
      sanitized += char
    } else if (code >= 0xa0 && code <= 0xff) {
      sanitized += char
    } else {
      const decomposed = char.normalize('NFD').replace(/[\u0300-\u036F]/g, '')
      if (decomposed && decomposed.charCodeAt(0) >= 0x20 && decomposed.charCodeAt(0) <= 0x7e) {
        sanitized += decomposed
      } else {
        sanitized += ' '
      }
    }
  }
  return sanitized
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

  if (hasRtlOrComplex && typeof document !== 'undefined') {
    const pdfDoc = await PDFDocument.create()
    const scale = 2
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

  // Latin PDF generation
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  const title = sanitizeForPdfWinAnsi(rawTitle)
  page.drawText(title, {
    x: margin,
    y: y - 18,
    size: 20,
    font: boldFont,
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

    const words = trimmed.split(/\s+/)
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      let textWidth = 0
      try {
        textWidth = font.widthOfTextAtSize(testLine, 10.5)
      } catch {
        textWidth = testLine.length * 6
      }

      if (textWidth > contentWidth) {
        if (y < margin + 25) {
          page = pdfDoc.addPage([pageWidth, pageHeight])
          y = pageHeight - margin
        }
        page.drawText(currentLine, {
          x: margin,
          y,
          size: 10.5,
          font,
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
      page.drawText(currentLine, {
        x: margin,
        y,
        size: 10.5,
        font,
        color: rgb(0.2, 0.25, 0.35),
      })
      y -= 18
    }
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
}

// ----------------------------------------------------
// 11. HTML Document Export
// ----------------------------------------------------
export function generateHtmlDocument(options: {
  title: string
  bodyHtml: string
  sourceType: string
}): Blob {
  const isDocRtl = containsRtl(options.title + ' ' + options.bodyHtml)
  const fullHtml = `<!DOCTYPE html>
<html lang="${isDocRtl ? 'ar' : 'en'}" dir="${isDocRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title)}</title>
  <style>
    :root {
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", Helvetica, Arial, sans-serif;
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
      text-align: ${isDocRtl ? 'right' : 'left'};
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
      <div class="meta">Converted from ${escapeHtml(options.sourceType.toUpperCase())} • DigitalMix Universal Engine</div>
    </div>
    <div class="content">
      ${options.bodyHtml}
    </div>
  </div>
</body>
</html>`

  return new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
}
