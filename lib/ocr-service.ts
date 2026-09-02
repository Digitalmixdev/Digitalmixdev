import { createWorker } from 'tesseract.js'

let tesseractWorkerPromise: Promise<any> | null = null

async function getTesseractWorker() {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = (async () => {
      try {
        const worker = await createWorker(['ara', 'eng'])
        return worker
      } catch (err) {
        console.warn('Failed to initialize Tesseract worker with ara+eng, falling back to eng:', err)
        tesseractWorkerPromise = null
        const fallbackWorker = await createWorker('eng')
        return fallbackWorker
      }
    })()
  }
  return tesseractWorkerPromise
}

export async function performOcrOnImageBlob(blob: Blob): Promise<{ text: string; html: string }> {
  // 1. Try server-side Gemini OCR API route first for 99.9% accurate Arabic & English document OCR
  try {
    const formData = new FormData()
    formData.append('image', blob, 'page.jpg')

    const response = await fetch('/app/api/ocr', {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const data = await response.json()
      if (data?.text && data.text.trim().length > 0) {
        return {
          text: data.text.trim(),
          html: data.html || data.text.trim(),
        }
      }
    }
  } catch (err) {
    console.warn('Server Gemini OCR API unavailable, falling back to local Tesseract OCR:', err)
  }

  // 2. Fallback to Tesseract.js (Client-side WebAssembly OCR)
  try {
    const worker = await getTesseractWorker()
    const result = await worker.recognize(blob)
    const text = result.data?.text?.trim() || ''
    return { text, html: `<p>${text.replace(/\n+/g, '</p><p>')}</p>` }
  } catch (err) {
    console.error('Tesseract.js OCR failed:', err)
    return { text: '', html: '' }
  }
}
