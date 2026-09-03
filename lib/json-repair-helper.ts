import { jsonrepair } from 'jsonrepair'

export interface JsonRepairResult {
  success: boolean
  output: string
  fixesApplied: string[]
  error?: string
}

export function countBracesAndBrackets(str: string): {
  openBraces: number
  closeBraces: number
  openBrackets: number
  closeBrackets: number
} {
  let openBraces = 0
  let closeBraces = 0
  let openBrackets = 0
  let closeBrackets = 0
  let inString = false
  let escape = false

  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\') {
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (!inString) {
      if (ch === '{') openBraces++
      else if (ch === '}') closeBraces++
      else if (ch === '[') openBrackets++
      else if (ch === ']') closeBrackets++
    }
  }
  return { openBraces, closeBraces, openBrackets, closeBrackets }
}

/**
 * Enhanced diagnostic analysis for JSON parse errors
 */
export function diagnoseJsonIssue(
  err: Error,
  raw: string
): {
  line: number
  column: number
  message: string
  suggestion: string
  suggestion_ar: string
} {
  const msg = err.message || 'Invalid JSON syntax'
  const trimmed = raw.trim()
  const lines = raw.split('\n')

  let line = 1
  let column = 1

  const lineColMatch = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i)
  const posMatch = msg.match(/position\s+(\d+)/i)

  if (lineColMatch) {
    line = parseInt(lineColMatch[1], 10)
    column = parseInt(lineColMatch[2], 10)
  } else if (posMatch) {
    const pos = parseInt(posMatch[1], 10)
    let count = 0
    for (let i = 0; i < lines.length; i++) {
      if (count + lines[i].length + 1 >= pos) {
        line = i + 1
        column = pos - count + 1
        break
      }
      count += lines[i].length + 1
    }
  }

  // 1. Missing opening curly brace '{' (e.g. starts with "key": value ... and ends with })
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    const counts = countBracesAndBrackets(raw)
    const isObjectLike =
      /^(\s*("[^"\\]*"|'[^'\\]*'|[a-zA-Z0-9_$]+)\s*:)/m.test(trimmed) ||
      (trimmed.endsWith('}') && counts.closeBraces > counts.openBraces) ||
      trimmed.endsWith('}')

    if (isObjectLike) {
      return {
        line: 1,
        column: 1,
        message: "Missing opening curly brace '{' at the beginning of the JSON object.",
        suggestion:
          "The payload starts with object properties but is missing the opening '{' on line 1. Click 'Auto Fix' to add '{' and format automatically.",
        suggestion_ar:
          "يبدأ الكود بخصائص كائن لكن ينقصه قوس البداية '{' في السطر الأول. اضغط على 'إصلاح تلقائي' لإضافة '{' وتنسيق الكود فوراً.",
      }
    }

    const isArrayLike =
      trimmed.endsWith(']') ||
      (trimmed.endsWith(']') && counts.closeBrackets > counts.openBrackets) ||
      /^(\s*(\d+|true|false|null|"[^"\\]*"|'[^'\\]*'|\{)\s*,)/m.test(trimmed)

    if (isArrayLike) {
      return {
        line: 1,
        column: 1,
        message: "Missing opening square bracket '[' at the beginning of the JSON array.",
        suggestion:
          "The payload starts with array elements but is missing the opening '[' on line 1. Click 'Auto Fix' to add '[' and format automatically.",
        suggestion_ar:
          "يبدأ الكود بعناصر مصفوفة لكن ينقصه قوس البداية '[' في السطر الأول. اضغط على 'إصلاح تلقائي' لإضافة '[' وتنسيق الكود فوراً.",
      }
    }
  }

  // 2. Trailing commas
  if (/trailing comma/i.test(msg) || /Unexpected token \}/i.test(msg) || /Unexpected token \]/i.test(msg)) {
    return {
      line,
      column,
      message: msg,
      suggestion: "Trailing comma detected before closing brace or bracket. Click 'Auto Fix' to remove it.",
      suggestion_ar: "تم اكتشاف فاصلة زائدة قبل إغلاق القوس. اضغط على 'إصلاح تلقائي' لإزالتها تلقائياً.",
    }
  }

  // 3. Missing commas
  if (
    /Expected ',' or '\}'/i.test(msg) ||
    /Expected ',' or '\]'/i.test(msg) ||
    /Expected ','/i.test(msg) ||
    /after property value/i.test(msg)
  ) {
    return {
      line,
      column,
      message: msg,
      suggestion:
        "Missing comma (',') between properties or array elements. Click 'Auto Fix' to add it automatically.",
      suggestion_ar:
        "فاصلة مفقودة (',') بين خصائص الكائن أو عناصر المصفوفة. اضغط على 'إصلاح تلقائي' لإضافتها فوراً.",
    }
  }

  // 4. Single quotes
  if (/Unexpected token/i.test(msg) && /'/.test(raw)) {
    return {
      line,
      column,
      message: msg,
      suggestion:
        "JSON standard requires double quotes (\") for keys and strings, not single quotes ('). Click 'Auto Fix' to convert them.",
      suggestion_ar:
        "تتطلب معايير JSON استخدام علامات تنصيص مزدوجة (\") بدلاً من المفردة ('). اضغط على 'إصلاح تلقائي' لتحويلها.",
    }
  }

  // 5. Unquoted keys
  if (/Expected double-quoted property name/i.test(msg) || /Unexpected token/i.test(msg)) {
    return {
      line,
      column,
      message: msg,
      suggestion: "Object property names must be enclosed in double quotes (\"). Click 'Auto Fix' to fix all keys.",
      suggestion_ar: "يجب وضع أسماء المفاتيح داخل علامات تنصيص مزدوجة (\"). اضغط على 'إصلاح تلقائي' لإصلاح المفاتيح.",
    }
  }

  return {
    line,
    column,
    message: msg,
    suggestion: "Check for missing brackets, quotes, or trailing characters. Click 'Auto Fix' to repair syntax errors.",
    suggestion_ar: "تحقق من الأقواس المفتوحة أو علامات التنصيص. اضغط على 'إصلاح تلقائي' لمعالجة الأخطاء تلقائياً.",
  }
}

/**
 * Intelligent Multi-Stage Auto-Repair for JSON
 */
export function autoRepairJson(raw: string, indent: number = 2): JsonRepairResult {
  const fixesApplied: string[] = []
  let input = raw.trim()

  if (!input) {
    return { success: true, output: '', fixesApplied: [] }
  }

  // 1. Strip trailing semicolons or colons after closing bracket/brace
  if (/([\}\]])\s*[;:]+\s*$/.test(input)) {
    input = input.replace(/([\}\]])\s*[;:]+\s*$/g, '$1')
    fixesApplied.push("Removed trailing semicolon/colon after closing bracket")
  }
  if (/;+\s*$/.test(input)) {
    input = input.replace(/;+\s*$/g, '')
    fixesApplied.push("Removed trailing semicolon")
  }

  // 2. Direct jsonrepair attempt (if already wrapped properly)
  try {
    const directRepaired = jsonrepair(input)
    const parsed = JSON.parse(directRepaired)
    return {
      success: true,
      output: JSON.stringify(parsed, null, indent),
      fixesApplied: fixesApplied.length > 0 ? fixesApplied : ['Repaired syntax and formatted JSON'],
    }
  } catch {
    // Continue to preprocessing
  }

  // 3. Pre-process missing outer wrapper (e.g. missing opening { or [)
  const counts = countBracesAndBrackets(input)
  const startsWithBrace = input.startsWith('{')
  const startsWithBracket = input.startsWith('[')
  const endsWithBrace = input.endsWith('}')
  const endsWithBracket = input.endsWith(']')

  let wrapped = input

  if (!startsWithBrace && !startsWithBracket) {
    const isObjectLike =
      /^(\s*("[^"\\]*"|'[^'\\]*'|[a-zA-Z0-9_$]+)\s*:)/m.test(input) ||
      (endsWithBrace && counts.closeBraces >= counts.openBraces) ||
      endsWithBrace

    const isArrayLike =
      (endsWithBracket && counts.closeBrackets >= counts.openBrackets) ||
      endsWithBracket ||
      /^(\s*(\d+|true|false|null|"[^"\\]*"|'[^'\\]*'|\{)\s*,)/m.test(input)

    if (isObjectLike) {
      wrapped = '{\n' + wrapped
      fixesApplied.push("Added missing opening brace '{' at the beginning")
      const c = countBracesAndBrackets(wrapped)
      if (c.openBraces > c.closeBraces) {
        wrapped = wrapped + '\n}'
        fixesApplied.push("Added missing closing brace '}' at the end")
      }
    } else if (isArrayLike) {
      wrapped = '[\n' + wrapped
      fixesApplied.push("Added missing opening bracket '[' at the beginning")
      const c = countBracesAndBrackets(wrapped)
      if (c.openBrackets > c.closeBrackets) {
        wrapped = wrapped + '\n]'
        fixesApplied.push("Added missing closing bracket ']' at the end")
      }
    }
  } else {
    // Starts with brace or bracket but may be missing closing ones
    if (startsWithBrace && counts.openBraces > counts.closeBraces) {
      const diff = counts.openBraces - counts.closeBraces
      wrapped = wrapped + '\n' + '}'.repeat(diff)
      fixesApplied.push(`Added ${diff} missing closing brace${diff > 1 ? 's' : ''} '}'`)
    } else if (startsWithBracket && counts.openBrackets > counts.closeBrackets) {
      const diff = counts.openBrackets - counts.closeBrackets
      wrapped = wrapped + '\n' + ']'.repeat(diff)
      fixesApplied.push(`Added ${diff} missing closing bracket${diff > 1 ? 's' : ''} ']'`)
    }
  }

  // 4. Try jsonrepair on the wrapped candidate
  try {
    const rep = jsonrepair(wrapped)
    const parsed = JSON.parse(rep)
    return {
      success: true,
      output: JSON.stringify(parsed, null, indent),
      fixesApplied: fixesApplied.length > 0 ? fixesApplied : ['Repaired syntax and formatted JSON'],
    }
  } catch {
    // 5. Fallback heuristic transforms
    let cleaned = wrapped

    // Remove comments
    if (/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/m.test(cleaned)) {
      cleaned = cleaned.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1')
      fixesApplied.push('Removed JavaScript comments')
    }

    // Fix missing commas between consecutive lines
    cleaned = cleaned.replace(/(\}|\]|"|true|false|null|\d+)(\s*)(\r?\n\s*)(["{\[])/g, '$1,$2$3$4')

    // Remove trailing commas
    if (/,(\s*[\}\]])/g.test(cleaned)) {
      cleaned = cleaned.replace(/,(\s*[\}\]])/g, '$1')
      fixesApplied.push('Removed trailing commas')
    }

    // Python constants
    cleaned = cleaned
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')

    // Single quotes to double quotes
    cleaned = cleaned.replace(/(')([^'\\]*(\\.[^'\\]*)*)(')(\s*:)/g, '"$2"$5')
    cleaned = cleaned.replace(/(:\s*)(')([^'\\]*(\\.[^'\\]*)*)(')/g, '$1"$3"')

    // Unquoted property keys
    cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_$]+)(\s*:)/g, '$1"$2"$3')

    try {
      const rep = jsonrepair(cleaned)
      const parsed = JSON.parse(rep)
      return {
        success: true,
        output: JSON.stringify(parsed, null, indent),
        fixesApplied: fixesApplied.length > 0 ? fixesApplied : ['Repaired syntax and formatted JSON'],
      }
    } catch {
      try {
        const parsed = JSON.parse(cleaned)
        return {
          success: true,
          output: JSON.stringify(parsed, null, indent),
          fixesApplied: fixesApplied.length > 0 ? fixesApplied : ['Repaired syntax and formatted JSON'],
        }
      } catch (err: any) {
        return {
          success: false,
          output: cleaned,
          fixesApplied,
          error: err.message || 'Unable to automatically repair JSON',
        }
      }
    }
  }
}
