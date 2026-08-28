import { PDFDocument, PageSizes } from 'pdf-lib'

export type SupportedImageFormat = 'jpg' | 'png' | 'webp' | 'bmp' | 'pdf'

export interface ImageConversionOptions {
  format: SupportedImageFormat
  quality?: number // 0.1 to 1.0
  maxWidth?: number
  maxHeight?: number
  backgroundColor?: string // default white '#ffffff' for JPG
  pageSize?: 'fit' | 'a4-portrait' | 'a4-landscape' | 'letter'
  margin?: number
}

export async function convertSingleImage(
  file: File | Blob,
  options: ImageConversionOptions
): Promise<{ blob: Blob; width: number; height: number; filename: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = async () => {
      URL.revokeObjectURL(url)
      try {
        let targetWidth = img.naturalWidth || img.width
        let targetHeight = img.naturalHeight || img.height

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

        // If target is PDF
        if (options.format === 'pdf') {
          const pdfBlob = await imagesToPdf([file], {
            pageSize: options.pageSize || 'fit',
            margin: options.margin ?? 20,
          })
          return resolve({
            blob: pdfBlob,
            width: targetWidth,
            height: targetHeight,
            filename: `converted-${Date.now()}.pdf`,
          })
        }

        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          throw new Error('Canvas 2D context not available')
        }

        // Fill background color if JPG or specified
        if (options.format === 'jpg' || options.backgroundColor) {
          ctx.fillStyle = options.backgroundColor || '#FFFFFF'
          ctx.fillRect(0, 0, targetWidth, targetHeight)
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        const mimeMap: Record<string, string> = {
          jpg: 'image/jpeg',
          png: 'image/png',
          webp: 'image/webp',
          bmp: 'image/bmp',
        }

        const mimeType = mimeMap[options.format] || 'image/jpeg'
        const quality = options.quality ?? 0.92

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Failed to generate image blob'))
            }
            resolve({
              blob,
              width: targetWidth,
              height: targetHeight,
              filename: `image-${Date.now()}.${options.format === 'jpg' ? 'jpg' : options.format}`,
            })
          },
          mimeType,
          quality
        )
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load input image'))
    }

    img.src = url
  })
}

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
    // Convert any format to JPG/PNG array buffer for pdf-lib embedding
    const imgData = await fileToJpegOrPngBuffer(file)
    let embeddedImg
    if (imgData.type === 'png') {
      embeddedImg = await pdfDoc.embedPng(imgData.buffer)
    } else {
      embeddedImg = await pdfDoc.embedJpg(imgData.buffer)
    }

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
      // Fit mode: page fits image + margins
      pWidth = imgWidth + margin * 2
      pHeight = imgHeight + margin * 2
    }

    const page = pdfDoc.addPage([pWidth, pHeight])
    const maxDrawWidth = pWidth - margin * 2
    const maxDrawHeight = pHeight - margin * 2

    const scale = Math.min(maxDrawWidth / imgWidth, maxDrawHeight / imgHeight, 1)
    const drawWidth = imgWidth * scale
    const drawHeight = imgHeight * scale

    const x = margin + (maxDrawWidth - drawWidth) / 2
    const y = margin + (maxDrawHeight - drawHeight) / 2

    page.drawImage(embeddedImg, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    })
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
}

async function fileToJpegOrPngBuffer(file: File | Blob): Promise<{ buffer: ArrayBuffer; type: 'jpg' | 'png' }> {
  // If already PNG or JPG, test if readable directly
  if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
    return { buffer: await file.arrayBuffer(), type: 'jpg' }
  }
  if (file.type === 'image/png') {
    return { buffer: await file.arrayBuffer(), type: 'png' }
  }

  // Otherwise, draw on canvas and export as PNG
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context error'))
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(async (blob) => {
        if (!blob) return reject(new Error('Conversion to PNG failed'))
        resolve({ buffer: await blob.arrayBuffer(), type: 'png' })
      }, 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to parse image for PDF'))
    }
    img.src = url
  })
}
