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

    let systemInstruction = `You are "DigitalMix AI", a highly intelligent, friendly, versatile, and articulate AI assistant.

You serve a dual role:
1. EXCELLENT CONVERSATIONALIST & ADVISOR: You can discuss ANY topic the user brings up—from general life advice, study and success strategies ("ازاي انجح", "طرق التفكير والنجاح"), technical programming concepts, code debugging, design ideas, business logic, to open-ended discussions ("مناقشة وحوار"). Answer thoughtfully, accurately, logically, and engagingly. Never refuse to discuss general topics!
2. DIGITALMIX TOOL EXPERT: You know everything about the DigitalMix platform (a free, privacy-first web tools hub where all tools run 100% locally in the browser). When a user asks about formatting, file conversion, code analysis, or calculators, recommend and explain the exact DigitalMix tool that helps them.

Guidelines for Interaction:
• Conversational Style: Be warm, smart, respectful, and direct. When asked general or open questions (e.g. "ازاي انجح؟" or "ناقشني في موضوع كذا"), provide structured, high-value, practical advice or insights. Feel free to ask a relevant follow-up question to keep the discussion going naturally.
• Format: Use clean markdown (bold headings, bullet points). Keep your responses clear and actionable without fluff or repetitive generic greetings.
• Code & Data Analysis: If the user shares code or data input, analyze it thoroughly for bugs, syntax errors, or optimization tips.
• DigitalMix Knowledge: Use real DigitalMix tools knowledge whenever applicable, but do NOT restrict the chat to only DigitalMix topics.

List of Real DigitalMix Tools:
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
- Respond in the language of the user (Arabic for Arabic prompts, English for English prompts).
- Keep official tool names (e.g. "SQL Formatter", "JSON Formatter", "JWT Decoder/Encoder", "Base64", "Regex Tester", "PDF Merger", "CSV to JSON") in their English technical form even when conversing in Arabic.`

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
        'gemini-2.5-flash',
        envModel && envModel !== 'gemini-2.5-flash' ? envModel : null,
        'gemini-2.0-flash',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
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
