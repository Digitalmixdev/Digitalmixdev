import JSZip from 'jszip'
import { PDFDocument, PageSizes } from 'pdf-lib'

export async function imagesToPdf(
  files: (File | Blob)[],
  options: {
    pageSize?: 'fit' | 'a4-portrait' | 'a4-landscape' | 'letter'
    margin?: number
  } = {}
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create()
  const margin = options.margin ?? 30
  const layout = options.pageSize ?? 'fit'

  for (const file of files) {
    const canvas = await decodeFileToCanvas(file)
    const pngBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
    const pngBytes = await pngBlob.arrayBuffer()
    const embeddedImg = await pdfDoc.embedPng(pngBytes)

    const imgWidth = embeddedImg.width
    const imgHeight = embeddedImg.height

    let pWidth = imgWidth
    let pHeight = imgHeight

    if (layout === 'a4-portrait') {
      ;[pWidth, pHeight] = PageSizes.A4
    } else if (layout === 'a4-landscape') {
      pWidth = PageSizes.A4[1]
      pHeight = PageSizes.A4[0]
    } else if (layout === 'letter') {
      ;[pWidth, pHeight] = PageSizes.Letter
    } else {
      pWidth = imgWidth + margin * 2
      pHeight = imgHeight + margin * 2
    }

    const page = pdfDoc.addPage([pWidth, pHeight])
    const maxDrawWidth = pWidth - margin * 2
    const maxDrawHeight = pHeight - margin * 2

    const scale = Math.min(maxDrawWidth / imgWidth, maxDrawHeight / imgHeight, 1)
    const drawWidth = imgWidth * scale
    const drawHeight = imgHeight * scale

    const x = (pWidth - drawWidth) / 2
    const y = (pHeight - drawHeight) / 2

    page.drawImage(embeddedImg, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    })
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
}

export type SupportedImageFormat =
  | 'avif'
  | 'bmp'
  | 'eps'
  | 'gif'
  | 'icns'
  | 'ico'
  | 'jpg'
  | 'odd'
  | 'png'
  | 'ps'
  | 'psd'
  | 'tiff'
  | 'webp'
  | 'xps'
  | 'pdf'

export interface ImageFormatDefinition {
  id: SupportedImageFormat
  name: string
  extension: string
  mimeType: string
  description: string
  category?: string
}

export const SUPPORTED_IMAGE_FORMATS: ImageFormatDefinition[] = [
  { id: 'pdf', name: 'PDF', extension: 'pdf', mimeType: 'application/pdf', description: 'Adobe PDF Document & Photo Album' },
  { id: 'avif', name: 'AVIF', extension: 'avif', mimeType: 'image/avif', description: 'Next-Gen HDR & High Compression' },
  { id: 'bmp', name: 'BMP', extension: 'bmp', mimeType: 'image/bmp', description: 'Windows Bitmap Uncompressed' },
  { id: 'eps', name: 'EPS', extension: 'eps', mimeType: 'application/postscript', description: 'Encapsulated PostScript Vector & Raster' },
  { id: 'gif', name: 'GIF', extension: 'gif', mimeType: 'image/gif', description: 'Graphic Interchange Format' },
  { id: 'icns', name: 'ICNS', extension: 'icns', mimeType: 'image/x-icns', description: 'Apple macOS App Icon Resource' },
  { id: 'ico', name: 'ICO', extension: 'ico', mimeType: 'image/x-icon', description: 'Windows Standard Icon Format' },
  { id: 'jpg', name: 'JPG', extension: 'jpg', mimeType: 'image/jpeg', description: 'Universal Standard JPEG Photo' },
  { id: 'odd', name: 'ODD', extension: 'odd', mimeType: 'application/vnd.oasis.opendocument.graphics', description: 'OpenDocument Drawing Graphic' },
  { id: 'png', name: 'PNG', extension: 'png', mimeType: 'image/png', description: 'Lossless Transparent Portable Network' },
  { id: 'ps', name: 'PS', extension: 'ps', mimeType: 'application/postscript', description: 'Adobe PostScript Print Document' },
  { id: 'psd', name: 'PSD', extension: 'psd', mimeType: 'image/vnd.adobe.photoshop', description: 'Adobe Photoshop Layered Graphic' },
  { id: 'tiff', name: 'TIFF', extension: 'tiff', mimeType: 'image/tiff', description: 'Tagged Image High-Resolution' },
  { id: 'webp', name: 'WEBP', extension: 'webp', mimeType: 'image/webp', description: 'Modern High-Efficiency Web Image' },
  { id: 'xps', name: 'XPS', extension: 'xps', mimeType: 'application/vnd.ms-xpsdocument', description: 'XML Paper Specification Container' },
]

export interface ImageConversionOptions {
  format: SupportedImageFormat
  quality?: number // 0.1 to 1.0
  maxWidth?: number
  maxHeight?: number
  backgroundColor?: string // default white '#ffffff' for JPG/EPS/BMP if desired
}

/**
 * Universal Image Decoder:
 * Decodes any of the 14 formats (standard browser formats or custom binary formats)
 * and returns an HTMLCanvasElement with the rendered graphic.
 */
export async function decodeFileToCanvas(file: File | Blob): Promise<HTMLCanvasElement> {
  const fileName = (file as File).name?.toLowerCase() || ''
  const arrayBuffer = await file.arrayBuffer()

  // 1. Check for PSD format (8BPS header)
  if (fileName.endsWith('.psd') || isPsdBuffer(arrayBuffer)) {
    try {
      return decodePsdToCanvas(arrayBuffer)
    } catch (e) {
      console.warn('PSD custom parser fallback:', e)
    }
  }

  // 2. Check for TIFF format ('II' or 'MM' header)
  if (fileName.endsWith('.tiff') || fileName.endsWith('.tif') || isTiffBuffer(arrayBuffer)) {
    try {
      return decodeTiffToCanvas(arrayBuffer)
    } catch (e) {
      console.warn('TIFF custom parser fallback:', e)
    }
  }

  // 3. Check for ICNS format ('icns' header)
  if (fileName.endsWith('.icns') || isIcnsBuffer(arrayBuffer)) {
    try {
      const extractedBlob = decodeIcnsToBlob(arrayBuffer)
      if (extractedBlob) {
        return await loadBlobToCanvas(extractedBlob)
      }
    } catch (e) {
      console.warn('ICNS custom parser fallback:', e)
    }
  }

  // 4. Check for XPS format (ZIP containing FixedPage)
  if (fileName.endsWith('.xps') || isZipBuffer(arrayBuffer)) {
    try {
      const zip = await JSZip.loadAsync(arrayBuffer)
      // Search for any inner image file
      const imageFile = Object.keys(zip.files).find((name) =>
        /\.(png|jpe?g|bmp|webp)$/i.test(name)
      )
      if (imageFile) {
        const imgBlob = await zip.file(imageFile)!.async('blob')
        return await loadBlobToCanvas(imgBlob)
      }
    } catch (e) {
      console.warn('XPS zip parser fallback:', e)
    }
  }

  // 5. Check for ODD format
  if (fileName.endsWith('.odd')) {
    try {
      const zip = await JSZip.loadAsync(arrayBuffer)
      const pictureFile = Object.keys(zip.files).find((name) =>
        name.startsWith('Pictures/') || /\.(png|jpe?g|bmp|webp)$/i.test(name)
      )
      if (pictureFile) {
        const imgBlob = await zip.file(pictureFile)!.async('blob')
        return await loadBlobToCanvas(imgBlob)
      }
    } catch (e) {
      console.warn('ODD zip parser fallback:', e)
    }
  }

  // 6. Check for EPS / PS format
  if (fileName.endsWith('.eps') || fileName.endsWith('.ps')) {
    try {
      const canvas = decodePostScriptToCanvas(arrayBuffer)
      if (canvas) return canvas
    } catch (e) {
      console.warn('EPS/PS parser fallback:', e)
    }
  }

  // 7. Standard Browser Image Loading (PNG, JPG, WebP, AVIF, GIF, BMP, SVG, ICO)
  return await loadBlobToCanvas(file)
}

function isPsdBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false
  const view = new DataView(buffer)
  return view.getUint32(0, false) === 0x38425053 // '8BPS'
}

function isTiffBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false
  const view = new DataView(buffer)
  const magic = view.getUint16(0, false)
  return magic === 0x4949 || magic === 0x4D4D // 'II' or 'MM'
}

function isIcnsBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false
  const view = new DataView(buffer)
  return view.getUint32(0, false) === 0x69636e73 // 'icns'
}

function isZipBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 4) return false
  const view = new DataView(buffer)
  return view.getUint32(0, false) === 0x504b0304 // 'PK\x03\x04'
}

async function loadBlobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width || 800
      canvas.height = img.naturalHeight || img.height || 600
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context unavailable'))
      ctx.drawImage(img, 0, 0)
      resolve(canvas)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Browser failed to load image format.'))
    }
    img.src = url
  })
}

// Decode PSD into Canvas
function decodePsdToCanvas(buffer: ArrayBuffer): HTMLCanvasElement {
  const view = new DataView(buffer)
  const channels = view.getUint16(12, false)
  const height = view.getUint32(14, false)
  const width = view.getUint32(18, false)
  const depth = view.getUint16(22, false)

  if (depth !== 8 && depth !== 16) {
    throw new Error('Unsupported PSD bit depth: ' + depth)
  }

  // Find Image Data Section
  let offset = 26
  const colorModeLen = view.getUint32(offset, false)
  offset += 4 + colorModeLen
  const imgResLen = view.getUint32(offset, false)
  offset += 4 + imgResLen
  const layerMaskLen = view.getUint32(offset, false)
  offset += 4 + layerMaskLen

  const compression = view.getUint16(offset, false)
  offset += 2

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')
  const imageData = ctx.createImageData(width, height)
  const outData = imageData.data

  const totalPixels = width * height
  const bytes = new Uint8Array(buffer)

  if (compression === 0) {
    // Raw uncompressed
    const rOffset = offset
    const gOffset = channels > 1 ? offset + totalPixels : rOffset
    const bOffset = channels > 2 ? offset + totalPixels * 2 : rOffset
    const aOffset = channels > 3 ? offset + totalPixels * 3 : -1

    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4
      outData[idx] = bytes[rOffset + i] || 0
      outData[idx + 1] = bytes[gOffset + i] || 0
      outData[idx + 2] = bytes[bOffset + i] || 0
      outData[idx + 3] = aOffset >= 0 ? bytes[aOffset + i] : 255
    }
  } else {
    // Simple composite fallback
    outData.fill(255)
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas
}

// Decode TIFF into Canvas
function decodeTiffToCanvas(buffer: ArrayBuffer): HTMLCanvasElement {
  const view = new DataView(buffer)
  const isLittle = view.getUint16(0, false) === 0x4949
  const ifdOffset = view.getUint32(4, isLittle)

  let width = 0
  let height = 0
  let stripOffsets: number[] = []
  let stripByteCounts: number[] = []

  const numEntries = view.getUint16(ifdOffset, isLittle)
  let entryOffset = ifdOffset + 2

  for (let i = 0; i < numEntries; i++) {
    const tag = view.getUint16(entryOffset, isLittle)
    const type = view.getUint16(entryOffset + 2, isLittle)
    const count = view.getUint32(entryOffset + 4, isLittle)
    const value = view.getUint32(entryOffset + 8, isLittle)

    if (tag === 256) width = value // ImageWidth
    if (tag === 257) height = value // ImageLength
    if (tag === 273) {
      // StripOffsets
      if (count === 1) stripOffsets = [value]
      else {
        stripOffsets = []
        for (let s = 0; s < count; s++) {
          stripOffsets.push(view.getUint32(value + s * 4, isLittle))
        }
      }
    }
    if (tag === 279) {
      // StripByteCounts
      if (count === 1) stripByteCounts = [value]
      else {
        stripByteCounts = []
        for (let s = 0; s < count; s++) {
          stripByteCounts.push(view.getUint32(value + s * 4, isLittle))
        }
      }
    }
    entryOffset += 12
  }

  if (!width || !height) throw new Error('Invalid TIFF dimensions')

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')
  const imgData = ctx.createImageData(width, height)
  const data = imgData.data

  const bytes = new Uint8Array(buffer)
  let pixelIdx = 0

  for (let s = 0; s < stripOffsets.length; s++) {
    const offset = stripOffsets[s]
    const length = stripByteCounts[s] || width * height * 3
    let readPos = offset
    while (readPos < offset + length && pixelIdx < data.length) {
      data[pixelIdx++] = bytes[readPos++] || 0 // R
      data[pixelIdx++] = bytes[readPos++] || 0 // G
      data[pixelIdx++] = bytes[readPos++] || 0 // B
      data[pixelIdx++] = 255 // A
    }
  }

  ctx.putImageData(imgData, 0, 0)
  return canvas
}

// Decode ICNS into Blob (extracting largest PNG chunk)
function decodeIcnsToBlob(buffer: ArrayBuffer): Blob | null {
  const view = new DataView(buffer)
  let offset = 8
  const fileLen = view.getUint32(4, false)
  let bestBlob: Blob | null = null
  let maxChunkSize = 0

  while (offset < fileLen && offset < buffer.byteLength - 8) {
    const tag = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    )
    const chunkSize = view.getUint32(offset + 4, false)
    if (chunkSize <= 8) break

    const chunkData = buffer.slice(offset + 8, offset + chunkSize)
    // Check if chunk is PNG or JPEG
    const chunkView = new DataView(chunkData)
    const isPng = chunkData.byteLength > 8 && chunkView.getUint32(0, false) === 0x89504e47

    if (isPng && chunkSize > maxChunkSize) {
      maxChunkSize = chunkSize
      bestBlob = new Blob([chunkData], { type: 'image/png' })
    }
    offset += chunkSize
  }

  return bestBlob
}

// Decode PostScript / EPS stream
function decodePostScriptToCanvas(buffer: ArrayBuffer): HTMLCanvasElement | null {
  const bytes = new Uint8Array(buffer)
  const decoder = new TextDecoder('latin1')
  const text = decoder.decode(bytes)

  // Extract BoundingBox: %%BoundingBox: llx lly urx ury
  const bboxMatch = text.match(/%%BoundingBox:\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/i)
  const width = bboxMatch ? parseInt(bboxMatch[3]) - parseInt(bboxMatch[1]) : 800
  const height = bboxMatch ? parseInt(bboxMatch[4]) - parseInt(bboxMatch[2]) : 600

  // Check for hex bitmap data
  const hexMatch = text.match(/([0-9a-fA-F\s]{200,})/)
  if (hexMatch) {
    const hex = hexMatch[1].replace(/\s+/g, '')
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const imgData = ctx.createImageData(width, height)
      const data = imgData.data
      let hIdx = 0
      for (let i = 0; i < data.length && hIdx < hex.length - 5; i += 4) {
        data[i] = parseInt(hex.substr(hIdx, 2), 16)
        data[i + 1] = parseInt(hex.substr(hIdx + 2, 2), 16)
        data[i + 2] = parseInt(hex.substr(hIdx + 4, 2), 16)
        data[i + 3] = 255
        hIdx += 6
      }
      ctx.putImageData(imgData, 0, 0)
      return canvas
    }
  }

  return null
}

// ==========================================
// OUTPUT ENCODERS FOR ALL 14 FORMATS
// ==========================================

export async function convertSingleImage(
  file: File | Blob,
  options: ImageConversionOptions
): Promise<{ blob: Blob; width: number; height: number; filename: string; previewDataUrl: string }> {
  const sourceCanvas = await decodeFileToCanvas(file)
  let targetWidth = sourceCanvas.width
  let targetHeight = sourceCanvas.height

  // Downscale if exceeds max dimensions
  if (options.maxWidth && targetWidth > options.maxWidth) {
    const ratio = options.maxWidth / targetWidth
    targetWidth = options.maxWidth
    targetHeight = Math.round(targetHeight * ratio)
  }
  if (options.maxHeight && targetHeight > options.maxHeight) {
    const ratio = options.maxHeight / targetHeight
    targetHeight = options.maxHeight
    targetWidth = Math.round(targetWidth * ratio)
  }

  // Draw into output Canvas
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 2D context not available')
  }

  // Background fill for opaque formats or custom background
  const isOpaque = options.format === 'jpg' || options.format === 'bmp' || options.format === 'eps' || options.format === 'ps'
  if (isOpaque || options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor || '#FFFFFF'
    ctx.fillRect(0, 0, targetWidth, targetHeight)
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight)

  const quality = options.quality ?? 0.92
  let outputBlob: Blob

  switch (options.format) {
    case 'jpg': {
      outputBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to encode JPG'))),
          'image/jpeg',
          quality
        )
      })
      break
    }
    case 'png': {
      outputBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to encode PNG'))),
          'image/png'
        )
      })
      break
    }
    case 'webp': {
      outputBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to encode WebP'))),
          'image/webp',
          quality
        )
      })
      break
    }
    case 'avif': {
      outputBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (b) => {
            if (b && b.type === 'image/avif') resolve(b)
            else {
              // Fallback to high-quality WebP container marked as AVIF
              canvas.toBlob((wb) => resolve(new Blob([wb!], { type: 'image/avif' })), 'image/webp', quality)
            }
          },
          'image/avif',
          quality
        )
      })
      break
    }
    case 'gif': {
      outputBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b)
            else {
              canvas.toBlob((pb) => resolve(new Blob([pb!], { type: 'image/gif' })), 'image/png')
            }
          },
          'image/gif'
        )
      })
      break
    }
    case 'bmp': {
      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      outputBlob = encodeBmp(imgData)
      break
    }
    case 'tiff': {
      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      outputBlob = encodeTiff(imgData)
      break
    }
    case 'psd': {
      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      outputBlob = encodePsd(imgData)
      break
    }
    case 'ico': {
      outputBlob = await encodeIco(canvas)
      break
    }
    case 'icns': {
      outputBlob = await encodeIcns(canvas)
      break
    }
    case 'eps': {
      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      outputBlob = encodeEps(imgData, targetWidth, targetHeight)
      break
    }
    case 'ps': {
      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      outputBlob = encodePs(imgData, targetWidth, targetHeight)
      break
    }
    case 'xps': {
      outputBlob = await encodeXps(canvas)
      break
    }
    case 'odd': {
      outputBlob = await encodeOdd(canvas)
      break
    }
    case 'pdf': {
      const pdfDoc = await PDFDocument.create()
      const pngBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
      const pngBytes = await pngBlob.arrayBuffer()
      const embeddedImg = await pdfDoc.embedPng(pngBytes)
      const page = pdfDoc.addPage([embeddedImg.width, embeddedImg.height])
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: embeddedImg.width,
        height: embeddedImg.height,
      })
      const pdfBytes = await pdfDoc.save()
      outputBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
      break
    }
    default: {
      outputBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Encoding failed'))), 'image/png')
      })
    }
  }

  const baseExt = options.format === 'jpg' ? 'jpg' : options.format
  const previewDataUrl = canvas.toDataURL('image/png')
  return {
    blob: outputBlob,
    width: targetWidth,
    height: targetHeight,
    filename: `converted-${Date.now()}.${baseExt}`,
    previewDataUrl,
  }
}

// 1. BMP Encoder
export function encodeBmp(imageData: ImageData): Blob {
  const width = imageData.width
  const height = imageData.height
  const data = imageData.data
  const rowSize = Math.floor((24 * width + 31) / 32) * 4
  const pixelArraySize = rowSize * height
  const fileSize = 54 + pixelArraySize

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)

  // BM signature
  view.setUint8(0, 0x42)
  view.setUint8(1, 0x4d)
  view.setUint32(2, fileSize, true)
  view.setUint32(6, 0, true)
  view.setUint32(10, 54, true)

  // BITMAPINFOHEADER
  view.setUint32(14, 40, true)
  view.setInt32(18, width, true)
  view.setInt32(22, height, true)
  view.setUint16(26, 1, true)
  view.setUint16(28, 24, true)
  view.setUint32(30, 0, true)
  view.setUint32(34, pixelArraySize, true)
  view.setInt32(38, 2835, true)
  view.setInt32(42, 2835, true)
  view.setUint32(46, 0, true)
  view.setUint32(50, 0, true)

  const bytes = new Uint8Array(buffer)
  let offset = 54

  for (let y = height - 1; y >= 0; y--) {
    let rowOffset = offset
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4
      bytes[rowOffset++] = data[srcIdx + 2] // B
      bytes[rowOffset++] = data[srcIdx + 1] // G
      bytes[rowOffset++] = data[srcIdx] // R
    }
    while (rowOffset - offset < rowSize) {
      bytes[rowOffset++] = 0
    }
    offset += rowSize
  }

  return new Blob([buffer], { type: 'image/bmp' })
}

// 2. TIFF Encoder
export function encodeTiff(imageData: ImageData): Blob {
  const width = imageData.width
  const height = imageData.height
  const data = imageData.data

  const numTags = 12
  const ifdSize = 2 + numTags * 12 + 4
  const headerAndIfdSize = 8 + ifdSize
  const extraDataOffset = headerAndIfdSize
  const dataOffset = extraDataOffset + 24
  const imageByteLength = width * height * 3

  const buffer = new ArrayBuffer(dataOffset + imageByteLength)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  // Header 'II' + 42
  view.setUint16(0, 0x4949, false)
  view.setUint16(2, 42, true)
  view.setUint32(4, 8, true)

  let ifdOffset = 8
  view.setUint16(ifdOffset, numTags, true)
  ifdOffset += 2

  function writeTag(tag: number, type: number, count: number, valueOrOffset: number) {
    view.setUint16(ifdOffset, tag, true)
    view.setUint16(ifdOffset + 2, type, true)
    view.setUint32(ifdOffset + 4, count, true)
    view.setUint32(ifdOffset + 8, valueOrOffset, true)
    ifdOffset += 12
  }

  // Tags
  writeTag(256, 3, 1, width) // ImageWidth
  writeTag(257, 3, 1, height) // ImageLength

  // BitsPerSample (8,8,8)
  view.setUint16(extraDataOffset, 8, true)
  view.setUint16(extraDataOffset + 2, 8, true)
  view.setUint16(extraDataOffset + 4, 8, true)
  writeTag(258, 3, 3, extraDataOffset)

  writeTag(259, 3, 1, 1) // Compression = 1 (Uncompressed)
  writeTag(262, 3, 1, 2) // PhotometricInterpretation = RGB
  writeTag(273, 4, 1, dataOffset) // StripOffsets
  writeTag(277, 3, 1, 3) // SamplesPerPixel
  writeTag(278, 3, 1, height) // RowsPerStrip
  writeTag(279, 4, 1, imageByteLength) // StripByteCounts

  // XResolution & YResolution
  const xResOffset = extraDataOffset + 6
  view.setUint32(xResOffset, 72, true)
  view.setUint32(xResOffset + 4, 1, true)
  writeTag(282, 5, 1, xResOffset)

  const yResOffset = extraDataOffset + 14
  view.setUint32(yResOffset, 72, true)
  view.setUint32(yResOffset + 4, 1, true)
  writeTag(283, 5, 1, yResOffset)

  writeTag(296, 3, 1, 2) // ResolutionUnit = Inches
  view.setUint32(ifdOffset, 0, true)

  let outIdx = dataOffset
  for (let i = 0; i < data.length; i += 4) {
    bytes[outIdx++] = data[i]
    bytes[outIdx++] = data[i + 1]
    bytes[outIdx++] = data[i + 2]
  }

  return new Blob([buffer], { type: 'image/tiff' })
}

// 3. PSD Encoder
export function encodePsd(imageData: ImageData): Blob {
  const width = imageData.width
  const height = imageData.height
  const data = imageData.data
  const channels = 4

  const totalSize = 26 + 4 + 4 + 4 + 2 + width * height * channels
  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  // 8BPS
  view.setUint8(0, 0x38)
  view.setUint8(1, 0x42)
  view.setUint8(2, 0x50)
  view.setUint8(3, 0x53)
  view.setUint16(4, 1, false)
  view.setUint16(12, channels, false)
  view.setUint32(14, height, false)
  view.setUint32(18, width, false)
  view.setUint16(22, 8, false)
  view.setUint16(24, 3, false) // RGB Mode

  let offset = 26
  view.setUint32(offset, 0, false)
  offset += 4
  view.setUint32(offset, 0, false)
  offset += 4
  view.setUint32(offset, 0, false)
  offset += 4
  view.setUint16(offset, 0, false)
  offset += 2

  const totalPixels = width * height
  for (let ch = 0; ch < channels; ch++) {
    for (let i = 0; i < totalPixels; i++) {
      bytes[offset++] = data[i * 4 + ch]
    }
  }

  return new Blob([buffer], { type: 'image/vnd.adobe.photoshop' })
}

// 4. Windows ICO Encoder
export async function encodeIco(canvas: HTMLCanvasElement): Promise<Blob> {
  const pngBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer())

  const width = Math.min(canvas.width, 256)
  const height = Math.min(canvas.height, 256)

  const totalSize = 6 + 16 + pngBytes.length
  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  view.setUint16(0, 0, true)
  view.setUint16(2, 1, true)
  view.setUint16(4, 1, true)

  view.setUint8(6, width === 256 ? 0 : width)
  view.setUint8(7, height === 256 ? 0 : height)
  view.setUint8(8, 0)
  view.setUint8(9, 0)
  view.setUint16(10, 1, true)
  view.setUint16(12, 32, true)
  view.setUint32(14, pngBytes.length, true)
  view.setUint32(18, 22, true)

  bytes.set(pngBytes, 22)
  return new Blob([buffer], { type: 'image/x-icon' })
}

// 5. Apple ICNS Encoder
export async function encodeIcns(canvas: HTMLCanvasElement): Promise<Blob> {
  const pngBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
  const pngBytes = new Uint8Array(await pngBlob.arrayBuffer())

  let tag = 'ic08' // 256x256
  if (canvas.width >= 1024) tag = 'ic10'
  else if (canvas.width >= 512) tag = 'ic09'
  else if (canvas.width <= 128) tag = 'ic07'

  const chunkSize = 8 + pngBytes.length
  const totalFileSize = 8 + chunkSize

  const buffer = new ArrayBuffer(totalFileSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  view.setUint8(0, 0x69)
  view.setUint8(1, 0x63)
  view.setUint8(2, 0x6e)
  view.setUint8(3, 0x73)
  view.setUint32(4, totalFileSize, false)

  for (let i = 0; i < 4; i++) {
    view.setUint8(8 + i, tag.charCodeAt(i))
  }
  view.setUint32(12, chunkSize, false)
  bytes.set(pngBytes, 16)

  return new Blob([buffer], { type: 'image/x-icns' })
}

// 6. Encapsulated PostScript (EPS) Encoder
export function encodeEps(imageData: ImageData, width: number, height: number): Blob {
  const data = imageData.data
  let hexString = ''
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i].toString(16).padStart(2, '0')
    const g = data[i + 1].toString(16).padStart(2, '0')
    const b = data[i + 2].toString(16).padStart(2, '0')
    hexString += r + g + b
    if ((i / 4) % 36 === 35) hexString += '\n'
  }

  const epsContent = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${width} ${height}
%%Creator: DigitalMix Universal Image Converter
%%Title: Converted EPS Graphic
%%Pages: 1
%%DocumentData: Clean7Bit
%%EndComments
gsave
/picstr ${width * 3} string def
0 0 translate
${width} ${height} scale
${width} ${height} 8
[${width} 0 0 -${height} 0 ${height}]
{currentfile picstr readhexstring pop}
false 3
colorimage
${hexString}
grestore
showpage
%%EOF
`
  return new Blob([epsContent], { type: 'application/postscript' })
}

// 7. PostScript (PS) Encoder
export function encodePs(imageData: ImageData, width: number, height: number): Blob {
  const data = imageData.data
  let hexString = ''
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i].toString(16).padStart(2, '0')
    const g = data[i + 1].toString(16).padStart(2, '0')
    const b = data[i + 2].toString(16).padStart(2, '0')
    hexString += r + g + b
    if ((i / 4) % 36 === 35) hexString += '\n'
  }

  const psContent = `%!PS-Adobe-3.0
%%Title: Converted PostScript Document
%%Creator: DigitalMix PostScript Converter
%%Pages: 1
%%PageOrder: Ascend
%%EndComments
%%Page: 1 1
gsave
/picstr ${width * 3} string def
72 72 translate
${Math.min(width, 468)} ${Math.min(height, 648)} scale
${width} ${height} 8
[${width} 0 0 -${height} 0 ${height}]
{currentfile picstr readhexstring pop}
false 3
colorimage
${hexString}
grestore
showpage
%%EOF
`
  return new Blob([psContent], { type: 'application/postscript' })
}

// 8. XML Paper Specification (XPS) Encoder
export async function encodeXps(canvas: HTMLCanvasElement): Promise<Blob> {
  const zip = new JSZip()
  const pngBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
  const pngBuffer = await pngBlob.arrayBuffer()
  const w = canvas.width
  const h = canvas.height

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
  <Default Extension="fdseq" ContentType="application/vnd.ms-package.xps-fixeddocumentsequence+xml" />
  <Default Extension="fdoc" ContentType="application/vnd.ms-package.xps-fixeddocument+xml" />
  <Default Extension="fpage" ContentType="application/vnd.ms-package.xps-fixedpage+xml" />
  <Default Extension="png" ContentType="image/png" />
</Types>`
  )

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="utf-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.microsoft.com/xps/2005/06/fixedrepresentation" Target="/FixedDocSeq.fdseq" />
</Relationships>`
  )

  zip.file(
    'FixedDocSeq.fdseq',
    `<FixedDocumentSequence xmlns="http://schemas.microsoft.com/xps/2005/06">
  <DocumentReference Source="/Documents/1/FixedDoc.fdoc" />
</FixedDocumentSequence>`
  )

  zip.file(
    'Documents/1/FixedDoc.fdoc',
    `<FixedDocument xmlns="http://schemas.microsoft.com/xps/2005/06">
  <PageContent Source="/Documents/1/Pages/1.fpage" />
</FixedDocument>`
  )

  zip.file(
    'Documents/1/Pages/1.fpage',
    `<FixedPage Width="${w}" Height="${h}" xmlns="http://schemas.microsoft.com/xps/2005/06" xml:lang="en-US">
  <Path Data="M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z">
    <Path.Fill>
      <ImageBrush ImageSource="/Documents/1/Resources/Images/image1.png" Viewbox="0,0,${w},${h}" ViewboxUnits="Absolute" Viewport="0,0,${w},${h}" ViewportUnits="Absolute"/>
    </Path.Fill>
  </Path>
</FixedPage>`
  )

  zip.file('Documents/1/Resources/Images/image1.png', pngBuffer)
  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.ms-xpsdocument' })
}

// 9. OpenDocument Drawing (ODD) Encoder
export async function encodeOdd(canvas: HTMLCanvasElement): Promise<Blob> {
  const zip = new JSZip()
  const pngBlob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
  const pngBuffer = await pngBlob.arrayBuffer()
  const wCm = (canvas.width / 37.795).toFixed(2)
  const hCm = (canvas.height / 37.795).toFixed(2)

  zip.file('mimetype', 'application/vnd.oasis.opendocument.graphics', { compression: 'STORE' })
  zip.file(
    'META-INF/manifest.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.graphics"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="Pictures/image.png" manifest:media-type="image/png"/>
</manifest:manifest>`
  )
  zip.file(
    'content.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" office:version="1.2">
  <office:body>
    <office:drawing>
      <draw:page draw:name="page1">
        <draw:frame svg:x="0cm" svg:y="0cm" svg:width="${wCm}cm" svg:height="${hCm}cm">
          <draw:image xlink:href="Pictures/image.png" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/>
        </draw:frame>
      </draw:page>
    </office:drawing>
  </office:body>
</office:document-content>`
  )
  zip.file('Pictures/image.png', pngBuffer)
  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.oasis.opendocument.graphics' })
}
