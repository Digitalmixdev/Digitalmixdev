import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: NextRequest) {
  try {
    const rawApiKey = process.env.GEMINI_API_KEY?.trim().replace(/^['"]|['"]$/g, '')
    if (!rawApiKey) {
      return NextResponse.json({ error: 'Gemini API Key not configured' }, { status: 503 })
    }

    const formData = await req.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    const bytes = await imageFile.arrayBuffer()
    const base64Data = Buffer.from(bytes).toString('base64')
    const mimeType = imageFile.type || 'image/jpeg'

    const ai = new GoogleGenAI({ apiKey: rawApiKey })
    const rawModel = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim().replace(/['"]/g, '')
    const selectedModel = rawModel.startsWith('gemini-3') ? 'gemini-2.5-flash' : rawModel

    const prompt = `You are an expert document reconstruction and OCR engine.
Extract ALL text and visual document structure from this document/image into clean HTML markup.

Rules for HTML output:
1. Wrap titles and document headers in <h2> or <h3>.
2. Form tables, grid fields, national ID number boxes, and data tables MUST be reconstructed as HTML <table><thead>...</thead><tbody><tr><td>...</td></tr></tbody></table>. For form fields with labels and input grids (like ID numbers or name rows), represent them with table rows and cells.
3. If there is a photo placeholder frame (e.g. "صورة الطالب / الطالبة 4*6"), wrap it in <div class="photo-frame">.
4. Wrap regular paragraphs in <p> tags.
5. Retain all Arabic and English text, numbers, names, titles, and signatures without summarizing or omitting anything.
6. Return ONLY the HTML markup inside <body>...</body>.`

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt },
          ],
        },
      ],
    })

    let rawOutput = response.text || ''
    // Clean up markdown code blocks if wrapped in ```html ... ```
    rawOutput = rawOutput.replace(/^```html\s*/i, '').replace(/\s*```$/, '').trim()

    // Extract plain text representation from HTML
    const plainText = rawOutput.replace(/<[^>]+>/g, '\n').replace(/\n+/g, '\n').trim()

    return NextResponse.json({ text: plainText, html: rawOutput })
  } catch (err: any) {
    console.error('OCR Route error:', err?.message || err)
    return NextResponse.json({ error: err?.message || 'OCR failed' }, { status: 500 })
  }
}
