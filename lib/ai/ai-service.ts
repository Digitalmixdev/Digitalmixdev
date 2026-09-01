import {
  DIGITALMIX_TOOLS_KNOWLEDGE,
  getToolKnowledge,
  findRecommendedTools,
  ToolKnowledgeItem,
} from './tools-knowledge'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  toolRecommendations?: ToolKnowledgeItem[]
  sharedInputSnippet?: string
  isError?: boolean
}

export interface AiRequestPayload {
  message: string
  history: { role: 'user' | 'assistant'; content: string }[]
  currentToolSlug?: string
  sharedInput?: string
  language: 'en' | 'ar'
}

export interface AiResponsePayload {
  content: string
  recommendedTools?: ToolKnowledgeItem[]
  source: 'gemini' | 'fallback'
}

/**
 * Send user query to AI Assistant server route with robust fallback.
 */
export async function sendAiMessage(payload: AiRequestPayload): Promise<AiResponsePayload> {
  try {
    const response = await fetch('/api/ai-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      const data = await response.json()
      if (data && typeof data.content === 'string' && data.content.trim().length > 0) {
        // Look for tool matches if not already provided
        const recommended = data.recommendedTools || findRecommendedTools(payload.message, payload.currentToolSlug, 2).map((r) => r.tool)
        return {
          content: data.content,
          recommendedTools: recommended.length > 0 ? recommended : undefined,
          source: 'gemini',
        }
      }
    }
  } catch {
    // Network or server failure, proceed to intelligent fallback engine
  }

  // Fallback Engine
  return generateIntelligentFallback(payload)
}

/**
 * Client-side knowledge-grounded fallback engine.
 * Guarantees that users always receive helpful, accurate answers about DigitalMix tools even without an active AI server.
 */
export function generateIntelligentFallback(payload: AiRequestPayload): AiResponsePayload {
  const { message, currentToolSlug, sharedInput, language } = payload
  const isAr = language === 'ar' || isArabicText(message)
  const q = message.toLowerCase().trim()

  const currentTool = currentToolSlug ? getToolKnowledge(currentToolSlug) : undefined

  // 1. If user explicitly shared code/input for analysis
  if (sharedInput && sharedInput.trim().length > 0) {
    return analyzeInputFallback(sharedInput, currentTool, isAr)
  }

  // 2. Questions about current tool
  if (currentTool) {
    if (q.includes('minify') || q.includes('تصغير') || q.includes('ضغط')) {
      return {
        content: isAr
          ? `**ماذا يفعل خيار الضغط (Minify) في أداة ${currentTool.name}؟**\n\nيقوم خيار **Minify** بإزالة المسافات الفارغة، وفواصل الأسطر، والتعليقات غير الضرورية من النص/الكود دون التأثير إطلاقاً على صحة الاستعلام أو المنطق البرمجي.\n\n• **الفائدة الأساسية:** تقليل حجم البيانات لتسريع نقلها عبر الشبكة وتوفير مساحة التخزين.\n• **الاستخدام:** اضغط على زر **"Minify"** داخل المحرر للحصول على أصغر صيغة ممكنة.`
          : `**What does "Minify" do in ${currentTool.name}?**\n\nMinifying removes unnecessary whitespace, indentations, line breaks, and comments while keeping the data/query logic 100% intact.\n\n• **Main benefit:** Reduces payload size for faster network transfer and lower bandwidth.\n• **How to use:** Click the **"Minify"** action inside the tool editor to produce a compact, single-line representation.`,
        source: 'fallback',
      }
    }

    if (q.includes('dialect') || q.includes('لهجات') || q.includes('قواعد بيانات') || q.includes('mysql') || q.includes('postgres')) {
      return {
        content: isAr
          ? `تدعم أداة **${currentTool.name}** اللهجات القياسية التالية:\n\n• **PostgreSQL**\n• **MySQL**\n• **SQLite**\n• **PL/SQL (Oracle)**\n• **Standard SQL**\n\nيمكنك التبديل بينها من القائمة العلوية داخل الأداة لضمان التنسيق المتوافق مع محرك قاعدة بياناتك.`
          : `**${currentTool.name}** supports these SQL dialects:\n\n• **Standard SQL** (ANSI SQL)\n• **PostgreSQL**\n• **MySQL / MariaDB**\n• **SQLite**\n• **PL/SQL** (Oracle)\n\nYou can select your dialect from the dropdown above the query editor.`,
        source: 'fallback',
      }
    }

    if (q.includes('how to use') || q.includes('كيف استخدم') || q.includes('طريقة الاستخدام') || q.includes('help') || q.includes('مساعدة')) {
      const steps = isAr ? currentTool.howToUseAr : currentTool.howToUseEn
      const stepList = steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
      return {
        content: isAr
          ? `**طريقة استخدام أداة ${currentTool.name}:**\n\n${stepList}\n\nجميع العمليات تتم محلياً وبشكل فوري داخل متصفحك!`
          : `**How to use ${currentTool.name}:**\n\n${stepList}\n\nAll operations process 100% locally and privately in your browser!`,
        source: 'fallback',
      }
    }

    if (q.includes('what can') || q.includes('capabilities') || q.includes('ماذا تفعل') || q.includes('مميزات')) {
      const caps = isAr ? currentTool.capabilitiesAr : currentTool.capabilitiesEn
      const capList = caps.map((c) => `• ${c}`).join('\n')
      return {
        content: isAr
          ? `**إمكانيات ومميزات أداة ${currentTool.name}:**\n\n${capList}`
          : `**Capabilities of ${currentTool.name}:**\n\n${capList}`,
        source: 'fallback',
      }
    }
  }

  // 3. Search and tool discovery
  const searchResults = findRecommendedTools(message, currentToolSlug, 2)
  if (searchResults.length > 0 && searchResults[0].score >= 20) {
    const topTool = searchResults[0].tool
    const reason = isAr ? searchResults[0].reasonAr : searchResults[0].reasonEn
    const desc = isAr ? topTool.descriptionAr : topTool.descriptionEn

    const otherTools = searchResults.slice(1).map((r) => r.tool)

    return {
      content: isAr
        ? `يمكنك استخدام أداة **${topTool.name}**.\n\n${desc}\n\n${reason}`
        : `You can use **${topTool.name}**.\n\n${desc}\n\n${reason}`,
      recommendedTools: [topTool, ...otherTools],
      source: 'fallback',
    }
  }

  // 4. Privacy & General DigitalMix questions
  if (q.includes('privacy') || q.includes('خصوصية') || q.includes('free') || q.includes('مجاني') || q.includes('safe') || q.includes('أمان')) {
    return {
      content: isAr
        ? `**منصة DigitalMix مصممة بمبدأ الخصوصية أولاً (Privacy-First):**\n\n• **معالجة محلية بالكامل:** تعمل جميع الأدوات (تنسيق الأكواد، ضغط الصور، تحويل المستندات) داخل متصفحك مباشرة.\n• **لا يتم رفع ملفاتك أو استعلاماتك:** لا نقوم بتخزين أو مشاركة أي بيانات حساسة.\n• **مجانية 100%:** جميع الأدوات متاحة للجميع بدون أي رسوم أو اشتراكات مخفية.`
        : `**DigitalMix is built with a Privacy-First philosophy:**\n\n• **100% In-Browser Execution:** All tools (formatting, image compression, PDF merge, converters) run locally on your device.\n• **Zero File Uploads:** We do not store, inspect, or share your files or database queries.\n• **Completely Free:** No subscription tiers, paywalls, or usage caps.`,
      source: 'fallback',
    }
  }

  // 5. Default General Assistance
  if (currentTool) {
    return {
      content: isAr
        ? `أنت الآن في صفحة أداة **${currentTool.name}**.\n\nيمكنني مساعدتك في شرح خيارات الأداة، طريقة استخدامها، أو اقتراح أدوات أخرى تناسب احتياجاتك. ما الذي تود معرفته؟`
        : `You are currently viewing **${currentTool.name}**.\n\nI can help you understand its formatting options, explain its features, or recommend other DigitalMix tools for your workflow. What would you like to know?`,
      source: 'fallback',
    }
  }

  return {
    content: isAr
      ? `أهلاً بك! أنا مساعد **DigitalMix AI** 🤖\n\nيمكنني مساعدتك في العثور على الأداة المناسبة لمهامك (مثل تحويل الملفات، فحص JWT، تنسيق JSON أو SQL، دمج الـ PDF، وحساب المؤشرات المالية). كيف يمكنني خدمتك اليوم؟`
      : `Hi! I'm **DigitalMix AI** 🤖\n\nI can help you discover the right tool for your task (such as file conversion, JWT inspection, JSON/SQL formatting, PDF merging, or business calculations). What are you looking to do?`,
    recommendedTools: findRecommendedTools('popular tools', undefined, 2).map((r) => r.tool),
    source: 'fallback',
  }
}

/**
 * Fallback analyzer when code/text input is explicitly shared.
 */
function analyzeInputFallback(input: string, tool: ToolKnowledgeItem | undefined, isAr: boolean): AiResponsePayload {
  const clean = input.trim()

  if (tool?.codeType === 'json' || clean.startsWith('{') || clean.startsWith('[')) {
    try {
      JSON.parse(clean)
      const lineCount = clean.split('\n').length
      return {
        content: isAr
          ? `✅ **تحليل كود JSON:**\n\n• **صحة الصياغة:** كود JSON صالح تماماً وخالٍ من الأخطاء النحوية.\n• **الحجم:** يحتوي على ${clean.length} حرفاً موزعة على ${lineCount} سطر.\n• **نصيحة:** يمكنك استخدام خيار **Format** لترتيب المفاتيح وتجميلها، أو **Minify** إذا كنت تريد إرسالها عبر الـ API.`
          : `✅ **JSON Analysis Result:**\n\n• **Syntax Status:** Valid JSON syntax with no parsing errors detected.\n• **Metrics:** ${clean.length} characters across ${lineCount} lines.\n• **Tip:** You can format it with 2 or 4 spaces for readability, or use **Minify** for compact API transport.`,
        source: 'fallback',
      }
    } catch (e: any) {
      return {
        content: isAr
          ? `⚠️ **تم اكتشاف خطأ في صياغة JSON:**\n\n• **تفاصيل الخطأ:** ${e?.message || 'صياغة JSON غير صالحة'}\n• **الأسباب الشائعة:**\n  - نسيان فاصلة (comma) بين الخصائص أو العناصر.\n  - وجود فاصلة زائدة في نهاية المصفوفة أو الكائن (trailing comma).\n  - استخدام علامات اقتباس مفردة \`'\` بدلاً من المزدوجة \`"\` لأسماء المفاتيح.`
          : `⚠️ **JSON Syntax Error Detected:**\n\n• **Error Details:** ${e?.message || 'Invalid JSON syntax'}\n• **Common causes:**\n  - Missing comma between keys or array items.\n  - Trailing comma at the end of an object or array.\n  - Single quotes used instead of double quotes \`"\` for property names.`,
        source: 'fallback',
      }
    }
  }

  if (tool?.codeType === 'sql' || /select|insert|update|delete|create|table/i.test(clean)) {
    const hasFormTypo = /\bform\b/i.test(clean) && !/\bfrom\b/i.test(clean)
    if (hasFormTypo) {
      return {
        content: isAr
          ? `🔍 **تحليل استعلام SQL:**\n\n⚠️ تم اكتشاف خطأ إملائي محتمل: تم كتابة \`FORM\` بدلاً من \`FROM\`.\n\n• **التصحيح المقترح:** قم باستبدال \`FORM\` بـ \`FROM\` لتصبح صيغة الجملة صحيحة.`
          : `🔍 **SQL Query Analysis:**\n\n⚠️ Potential syntax typo detected: Found \`FORM\` instead of \`FROM\`.\n\n• **Suggested Fix:** Replace \`FORM\` with \`FROM\` so the SQL query parses correctly.`,
        source: 'fallback',
      }
    }

    const selectMatch = clean.match(/\bselect\b/gi) || []
    const joinMatch = clean.match(/\bjoin\b/gi) || []
    const whereMatch = clean.match(/\bwhere\b/gi) || []

    return {
      content: isAr
        ? `🔍 **تحليل استعلام SQL:**\n\n• **الهيكل:** استعلام SQL يحتوي على (${selectMatch.length}) جملة SELECT، و (${joinMatch.length}) عملية JOIN، و (${whereMatch.length}) شرط WHERE.\n• **التحسين:** استخدم خيار **Format SQL** لاختيار اللهجة المناسبة (مثل PostgreSQL أو MySQL) لترتيب الكلمات المفتاحية وضبط المسافات البادئة.`
        : `🔍 **SQL Query Structure:**\n\n• **Structure:** Contains ${selectMatch.length} SELECT statement(s), ${joinMatch.length} JOIN clause(s), and ${whereMatch.length} WHERE condition(s).\n• **Recommendation:** Use the **Format SQL** button with your specific database dialect (PostgreSQL, MySQL, SQLite) to ensure consistent capitalization and indentation.`,
      source: 'fallback',
    }
  }

  return {
    content: isAr
      ? `📄 **تحليل المدخل المشترك:**\n\nتم فحص النص المدخل بنجاح (${clean.length} حرفاً). يمكنك استخدام أدوات DigitalMix لتنسيقه أو تحويله أو فحصه وفقاً لنوع البيانات.`
      : `📄 **Input Analysis:**\n\nSuccessfully inspected the shared input (${clean.length} characters). You can use DigitalMix formatting or conversion tools to optimize this data.`,
    source: 'fallback',
  }
}

function isArabicText(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text)
}
