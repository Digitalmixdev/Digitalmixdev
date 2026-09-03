import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import {
  DIGITALMIX_TOOLS_KNOWLEDGE,
  getToolKnowledge,
  findRecommendedTools,
} from '@/lib/ai/tools-knowledge'

// In-memory rate limiter: max 30 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 30

  const record = rateLimitMap.get(ip)
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return false
  }

  if (record.count >= maxRequests) {
    return true
  }

  record.count += 1
  return false
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown-client'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment before sending another message.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { message, history, currentToolSlug, sharedInput, language } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const rawApiKey = process.env.GEMINI_API_KEY?.trim().replace(/^['"]|['"]$/g, '')
    if (!rawApiKey) {
      // Return 503 to trigger client-side fallback gracefully
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
    }

    const ai = new GoogleGenAI({ apiKey: rawApiKey })

    // Build system instructions with DigitalMix tools knowledge
    const toolsSummary = DIGITALMIX_TOOLS_KNOWLEDGE.map((t) => ({
      name: t.name,
      slug: t.slug,
      href: t.href,
      category: t.categoryNameEn,
      description: t.descriptionEn,
      capabilities: t.capabilitiesEn,
      howToUse: t.howToUseEn,
      keywords: t.keywords,
    }))

    const currentTool = currentToolSlug ? getToolKnowledge(currentToolSlug) : null

    let systemInstruction = `You are "DigitalMix AI", the intelligent built-in guide and tool assistant for the DigitalMix website (https://www.digitalmix.dev).

DigitalMix is a free, privacy-first digital tools hub. All tools run 100% locally in the user's browser with zero file uploads or server inspection.

Your Core Role:
1. Help users discover the exact DigitalMix tool they need.
2. Explain how DigitalMix tools work (e.g. Minify, Formatter options, SQL dialects, Base64 modes, Image conversion matrix, ROI/KPI formulas).
3. If the user explicitly shares code/data input for analysis, analyze that input directly and give immediate actionable feedback.
4. BE CONCISE & DIRECT: Give clear, straight-to-the-point answers. Avoid long intro greetings, repetitive filler, or rambling explanations ("رغي"). Use bullet points or short bulleted steps.
5. NEVER invent tools or features that DigitalMix does not have. If no matching tool exists, politely say "I don't think DigitalMix has a tool for that yet." and suggest the closest alternative.
6. COMPLETE RESPONSES: Always deliver complete, fully articulated answers without cutting off mid-sentence.

List of All Real DigitalMix Tools:
${JSON.stringify(toolsSummary, null, 2)}

Current User Context:
- Active Website Language: ${language === 'ar' ? 'Arabic (ar)' : 'English (en)'}
- Current Page / Tool: ${currentTool ? `${currentTool.name} (slug: ${currentTool.slug})` : 'Home or General Page'}
${
  currentTool
    ? `- Current Tool Capabilities: ${currentTool.capabilitiesEn.join(', ')}
- Current Tool Description: ${currentTool.descriptionEn}`
    : ''
}

Language Instructions:
- If the user asks in Arabic, respond in fluent, natural Arabic.
- If the user asks in English, respond in clear, professional English.
- Always keep official technical tool names (such as "SQL Formatter", "JSON Formatter", "JWT Decoder/Encoder", "Base64", "Regex Tester", "PDF Merger", "CSV to JSON") in English or their recognized technical term even when speaking Arabic (e.g. "أداة SQL Formatter").

Privacy Directives:
- The user's tool input remains private unless explicitly shared in the message.
- If user input is shared (${sharedInput ? 'YES - user explicitly clicked share & analyze' : 'NO'}), provide specific, actionable feedback on that input.`

    // Construct conversation history for Gemini
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = []

    if (Array.isArray(history)) {
      for (const msg of history.slice(-6)) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          })
        }
      }
    }

    let userPromptText = message
    if (sharedInput && sharedInput.trim().length > 0) {
      userPromptText = `${message}\n\n[USER SHARED INPUT FROM ${currentTool?.name || 'CURRENT TOOL'}]:\n\`\`\`\n${sharedInput.slice(0, 4000)}\n\`\`\``
    }

    contents.push({
      role: 'user',
      parts: [{ text: userPromptText }],
    })

    const envModel = process.env.GEMINI_MODEL?.trim().replace(/['"]/g, '')
    const candidateModels = Array.from(
      new Set([
        envModel && !envModel.includes('2.5') && !envModel.includes('3.') ? envModel : null,
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-pro',
      ])
    ).filter(Boolean) as string[]

    let responseText = ''
    let lastError: any = null

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.4,
          },
        })
        if (response.text && response.text.trim().length > 0) {
          responseText = response.text
          lastError = null
          break
        }
      } catch (err: any) {
        lastError = err
        console.warn(`[AI Assistant] Model ${modelName} failed:`, err?.message || err)
        continue
      }
    }

    if (lastError && !responseText) {
      console.error('All candidate models failed. Last error details:', JSON.stringify(lastError, Object.getOwnPropertyNames(lastError)))
      throw lastError
    }

    // Detect recommended tools based on the user query & response
    const recommended = findRecommendedTools(message, currentToolSlug, 2).map((r) => r.tool)

    return NextResponse.json({
      content: responseText,
      recommendedTools: recommended.length > 0 ? recommended : undefined,
    })
  } catch (error: any) {
    console.error('AI Assistant API Error:', error?.message || error)
    if (error?.status) console.error('Status:', error.status)
    return NextResponse.json(
      { error: error?.message || 'Failed to generate AI response' },
      { status: 500 }
    )
  }
}
