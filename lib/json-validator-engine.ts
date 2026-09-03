/**
 * JSON Validator & Diagnostic Engine
 *
 * Provides generic, context-aware structural diagnostic parsing around native JSON.parse()
 * and structural auto-repair with post-fix JSON.parse validation.
 */

import { jsonrepair } from 'jsonrepair'

export interface JsonDiagnosticResult {
  line: number
  column: number
  message: string
  suggestion: string
  suggestion_ar: string
  errorClass:
    | 'missing_comma'
    | 'trailing_comma'
    | 'duplicate_comma'
    | 'missing_colon'
    | 'duplicate_colon'
    | 'unquoted_key'
    | 'single_quotes'
    | 'unclosed_string'
    | 'missing_closing_brace'
    | 'missing_closing_bracket'
    | 'missing_opening_brace'
    | 'missing_opening_bracket'
    | 'mismatched_brackets'
    | 'unexpected_closing'
    | 'js_comments'
    | 'invalid_number'
    | 'invalid_escape'
    | 'multiple_roots'
    | 'missing_value'
    | 'unexpected_token'
    | 'syntax_error'
}

export interface JsonRepairResult {
  success: boolean
  output: string
  fixesApplied: string[]
  error?: string
}

export interface JsonRepairOptions {
  indent?: number
  format?: boolean
}

/**
 * Counts and checks structural braces and brackets tracking quotes and escapes
 */
export function analyzeStructuralBrackets(str: string): {
  openBraces: number
  closeBraces: number
  openBrackets: number
  closeBrackets: number
  isQuoteUnclosed: boolean
  hasSingleQuotes: boolean
  hasComments: boolean
  stack: { char: string; line: number; col: number }[]
  mismatch?: { expected: string; found: string; line: number; col: number }
} {
  let openBraces = 0
  let closeBraces = 0
  let openBrackets = 0
  let closeBrackets = 0
  let inDoubleQuote = false
  let inSingleQuote = false
  let escape = false
  let hasSingleQuotes = false
  let hasComments = false

  const stack: { char: string; line: number; col: number }[] = []
  let mismatch: { expected: string; found: string; line: number; col: number } | undefined

  let line = 1
  let col = 1

  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    const nextCh = str[i + 1]

    if (ch === '\n') {
      line++
      col = 1
    } else {
      col++
    }

    if (escape) {
      escape = false
      continue
    }

    if (ch === '\\') {
      escape = true
      continue
    }

    // Single-line comment detection outside quotes
    if (!inDoubleQuote && !inSingleQuote && ch === '/' && nextCh === '/') {
      hasComments = true
      while (i < str.length && str[i] !== '\n') i++
      line++
      col = 1
      continue
    }

    // Multi-line comment detection outside quotes
    if (!inDoubleQuote && !inSingleQuote && ch === '/' && nextCh === '*') {
      hasComments = true
      i += 2
      while (i < str.length && !(str[i] === '*' && str[i + 1] === '/')) {
        if (str[i] === '\n') {
          line++
          col = 1
        }
        i++
      }
      i++
      continue
    }

    if (ch === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote
      continue
    }

    if (ch === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote
      hasSingleQuotes = true
      continue
    }

    if (!inDoubleQuote && !inSingleQuote) {
      if (ch === '{') {
        openBraces++
        stack.push({ char: '{', line, col })
      } else if (ch === '}') {
        closeBraces++
        const last = stack.pop()
        if (last && last.char !== '{' && !mismatch) {
          mismatch = { expected: ']', found: '}', line, col }
        }
      } else if (ch === '[') {
        openBrackets++
        stack.push({ char: '[', line, col })
      } else if (ch === ']') {
        closeBrackets++
        const last = stack.pop()
        if (last && last.char !== '[' && !mismatch) {
          mismatch = { expected: '}', found: ']', line, col }
        }
      }
    }
  }

  return {
    openBraces,
    closeBraces,
    openBrackets,
    closeBrackets,
    isQuoteUnclosed: inDoubleQuote || inSingleQuote,
    hasSingleQuotes,
    hasComments,
    stack,
    mismatch,
  }
}

/**
 * Generic structural diagnostic analyzer for JSON parse failures
 */
export function diagnoseJsonIssue(err: Error, raw: string): JsonDiagnosticResult {
  const msg = err.message || 'Invalid JSON syntax'
  const trimmed = raw.trim()
  const lines = raw.split('\n')

  let line = 1
  let column = 1

  // Extract location from error message
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
        column = Math.max(1, pos - count + 1)
        break
      }
      count += lines[i].length + 1
    }
  }

  const analysis = analyzeStructuralBrackets(raw)

  // 1. Missing opening curly brace '{' or square bracket '['
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    const isObjectLike =
      /^(\s*("[^"\\]*"|'[^'\\]*'|[a-zA-Z0-9_$]+)\s*:)/m.test(trimmed) ||
      (trimmed.endsWith('}') && analysis.closeBraces > analysis.openBraces) ||
      trimmed.endsWith('}')

    if (isObjectLike) {
      return {
        line: 1,
        column: 1,
        message: "Missing opening curly brace '{' at the beginning of the JSON object.",
        suggestion: "The payload starts with properties but is missing '{' on line 1. Click 'Auto Fix' to add it.",
        suggestion_ar: "يبدأ الكود بخصائص كائن لكن ينقصه قوس البداية '{' في السطر الأول. اضغط على 'إصلاح تلقائي' لإضافته.",
        errorClass: 'missing_opening_brace',
      }
    }

    const isArrayLike =
      trimmed.endsWith(']') ||
      (trimmed.endsWith(']') && analysis.closeBrackets > analysis.openBrackets) ||
      /^(\s*(\d+|true|false|null|"[^"\\]*"|'[^'\\]*'|\{)\s*,)/m.test(trimmed)

    if (isArrayLike) {
      return {
        line: 1,
        column: 1,
        message: "Missing opening square bracket '[' at the beginning of the JSON array.",
        suggestion: "The payload contains array elements but is missing '[' on line 1. Click 'Auto Fix' to add it.",
        suggestion_ar: "يبدأ الكود بعناصر مصفوفة لكن ينقصه قوس البداية '[' في السطر الأول. اضغط على 'إصلاح تلقائي' لإضافته.",
        errorClass: 'missing_opening_bracket',
      }
    }
  }

  // 2. Mismatched bracket types (e.g. opened [ but closed with }, or opened { and closed with ])
  if (analysis.mismatch) {
    return {
      line: analysis.mismatch.line,
      column: analysis.mismatch.col,
      message: `Mismatched bracket: Found '${analysis.mismatch.found}' when '${analysis.mismatch.expected}' was expected.`,
      suggestion: `Replace '${analysis.mismatch.found}' with '${analysis.mismatch.expected}' to correctly match the opening bracket.`,
      suggestion_ar: `عدم تطابق في الأقواس: تم إغلاق القوس بـ '${analysis.mismatch.found}' بينما المتوقع هو '${analysis.mismatch.expected}'.`,
      errorClass: 'mismatched_brackets',
    }
  }

  // 3. Unclosed String Literal
  if (analysis.isQuoteUnclosed || /Unterminated string/i.test(msg) || /Unclosed string/i.test(msg)) {
    return {
      line,
      column,
      message: 'Unterminated string literal: String opened without a closing double quote.',
      suggestion: 'Add a closing double quote (") before the end of the line or next property.',
      suggestion_ar: 'نص غير مغلق: تم فتح علامة تنصيص ولم يتم إغلاقها. أضف علامة تنصيص (") في نهاية النص.',
      errorClass: 'unclosed_string',
    }
  }

  // 4. Trailing commas before } or ]
  const lineText = lines[line - 1] || ''
  const prevLineText = lines[line - 2] || ''
  const isTrailingCommaNear =
    /,\s*[\}\]]/.test(lineText) ||
    /,\s*$/.test(prevLineText) && /^\s*[\}\]]/.test(lineText) ||
    /trailing comma/i.test(msg) ||
    (/Unexpected token \}/i.test(msg) && /,\s*$/.test(prevLineText))

  if (isTrailingCommaNear) {
    return {
      line,
      column,
      message: "Trailing comma: Illegal comma before closing brace '}' or bracket ']'.",
      suggestion: "Remove the trailing comma before '}' or ']' as JSON specification does not allow trailing commas.",
      suggestion_ar: "فاصلة زائدة (Trailing comma): لا يُسمح بوجود فاصلة قبل إغلاق القوس '}' أو ']'. اضغط على 'إصلاح تلقائي' لإزالتها.",
      errorClass: 'trailing_comma',
    }
  }

  // 5. JavaScript Comments in JSON
  if (analysis.hasComments || /comment/i.test(msg)) {
    return {
      line,
      column,
      message: 'Non-standard JavaScript comments (// or /* */) found in JSON.',
      suggestion: "Standard JSON does not support comments. Click 'Auto Fix' to strip comments automatically.",
      suggestion_ar: "يحتوي كود JSON على تعليقات (// أو /* */). مواصفات JSON القياسية لا تدعم التعليقات. اضغط على 'إصلاح تلقائي' لإزالتها.",
      errorClass: 'js_comments',
    }
  }

  // 6. Single quotes used instead of double quotes
  if (analysis.hasSingleQuotes || /Expected double-quoted property name/i.test(msg) || /single quote/i.test(msg)) {
    return {
      line,
      column,
      message: "Single quotes used: JSON requires double quotes (\") for both keys and string values.",
      suggestion: "Replace single quotes (') with double quotes (\"). Click 'Auto Fix' to convert them automatically.",
      suggestion_ar: "تم استخدام علامات تنصيص مفردة: يتطلب معيار JSON علامات تنصيص مزدوجة (\") لجميع المفاتيح والنصوص. اضغط على 'إصلاح تلقائي'.",
      errorClass: 'single_quotes',
    }
  }

  // 7. Unquoted keys (e.g. { name: "John" })
  if (
    /Expected property name or '\}'/i.test(msg) ||
    /Expected double-quoted property/i.test(msg) ||
    /^[ \t]*[a-zA-Z0-9_$]+[ \t]*:/m.test(lineText)
  ) {
    const unquotedMatch = lineText.match(/^[ \t]*([a-zA-Z0-9_$]+)[ \t]*:/)
    const keyName = unquotedMatch ? unquotedMatch[1] : 'property'
    return {
      line,
      column,
      message: `Unquoted object key: '${keyName}' is not wrapped in double quotes.`,
      suggestion: `Wrap key in double quotes like "${keyName}": value. Click 'Auto Fix' to quote keys automatically.`,
      suggestion_ar: `مفتاح غير محاط بعلامات تنصيص: المفتاح '${keyName}' يجب أن يكون بين علامتي تنصيص مزدوجتين "${keyName}". اضغط على 'إصلاح تلقائي'.`,
      errorClass: 'unquoted_key',
    }
  }

  // 8. Missing comma between properties or array elements
  if (
    /Expected ',' or '\}'/i.test(msg) ||
    /Expected ',' or '\]'/i.test(msg) ||
    /Expected ','/i.test(msg) ||
    /after property value/i.test(msg)
  ) {
    return {
      line,
      column,
      message: "Missing comma: Properties or elements must be separated by a comma ','.",
      suggestion: "Insert a comma ',' after the preceding property or element before starting a new one.",
      suggestion_ar: "فاصلة مفقودة: يجب الفصل بين الخصائص أو العناصر بفاصلة ','. أضف فاصلة في نهاية السطر السابق.",
      errorClass: 'missing_comma',
    }
  }

  // 9. Missing colon between key and value
  if (/Expected ':'/i.test(msg) || /after property name/i.test(msg)) {
    return {
      line,
      column,
      message: "Missing colon ':': Property key must be followed by a colon ':' before its value.",
      suggestion: "Add a colon ':' after the property name.",
      suggestion_ar: "نقطتان رأسيتان مفقودتان ':': يجب وضع ':' بعد اسم المفتاح وقبل القيمة.",
      errorClass: 'missing_colon',
    }
  }

  // 10. Missing closing braces or brackets at end of input
  if (analysis.openBraces > analysis.closeBraces) {
    const missing = analysis.openBraces - analysis.closeBraces
    return {
      line: lines.length,
      column: (lines[lines.length - 1] || '').length + 1,
      message: `Missing closing curly brace: Unclosed ${missing} '{' in the JSON structure.`,
      suggestion: `Add ${missing} closing brace(s) '}' at the end of the JSON object.`,
      suggestion_ar: `قوس إغلاق مفقود: يوجد ${missing} قوس '{' غير مغلق. أضف '}' في نهاية الملف.`,
      errorClass: 'missing_closing_brace',
    }
  }

  if (analysis.openBrackets > analysis.closeBrackets) {
    const missing = analysis.openBrackets - analysis.closeBrackets
    return {
      line: lines.length,
      column: (lines[lines.length - 1] || '').length + 1,
      message: `Missing closing square bracket: Unclosed ${missing} '[' in the JSON structure.`,
      suggestion: `Add ${missing} closing bracket(s) ']' at the end of the JSON array.`,
      suggestion_ar: `قوس مصفوفة مفقود: يوجد ${missing} قوس '[' غير مغلق. أضف ']' في نهاية الملف.`,
      errorClass: 'missing_closing_bracket',
    }
  }

  // 11. Extra closing bracket/brace
  if (analysis.closeBraces > analysis.openBraces || analysis.closeBrackets > analysis.openBrackets) {
    return {
      line,
      column,
      message: "Unexpected closing brace or bracket: More closing brackets exist than were opened.",
      suggestion: "Remove extra closing '}' or ']' or add the matching opening bracket.",
      suggestion_ar: "قوس إغلاق زائد: عدد أقواس الإغلاق أكثر من الأقواس المفتوحة. احذف القوس الزائد.",
      errorClass: 'unexpected_closing',
    }
  }

  // 12. Multiple root values (e.g. { "a": 1 } { "b": 2 })
  if (/Unexpected non-whitespace character after JSON/i.test(msg) || /after JSON at position/i.test(msg)) {
    return {
      line,
      column,
      message: "Multiple root values: JSON must have exactly ONE top-level object or array.",
      suggestion: "Wrap multiple root objects in an array: [ {...}, {...} ].",
      suggestion_ar: "عناصر جذر متعددة: يجب أن يحتوي ملف JSON على كائن واحد أو مصفوفة واحدة فقط في المستوى الرئيسي. اجمعها داخل مصفوفة [ {...}, {...} ].",
      errorClass: 'multiple_roots',
    }
  }

  // Generic fallback with location
  return {
    line,
    column,
    message: `JSON Syntax Error: ${msg}`,
    suggestion: `Check syntax near line ${line}, column ${column}. Click 'Auto Fix' to attempt automated repair.`,
    suggestion_ar: `خطأ في صياغة JSON بالقرب من السطر ${line} والعمود ${column}. اضغط على 'إصلاح تلقائي' لمحاولة التصحيح.`,
    errorClass: 'syntax_error',
  }
}

/**
 * Intelligent Structural Auto-Repair with in-place format preservation & Post-Validation
 */
export function autoRepairJson(
  raw: string,
  optionsOrIndent: number | JsonRepairOptions = 2
): JsonRepairResult {
  const options: JsonRepairOptions =
    typeof optionsOrIndent === 'number'
      ? { indent: optionsOrIndent, format: true }
      : { indent: 2, format: true, ...optionsOrIndent }

  const shouldFormat = options.format !== false
  const indent = options.indent ?? 2

  const fixesApplied: string[] = []
  let input = raw

  if (!input.trim()) {
    return { success: true, output: '', fixesApplied: [] }
  }

  // Stage 1: Direct jsonrepair attempt on raw input
  try {
    const directRepaired = jsonrepair(input)
    const parsed = JSON.parse(directRepaired)
    return {
      success: true,
      output: shouldFormat ? JSON.stringify(parsed, null, indent) : directRepaired,
      fixesApplied: ['Repaired syntax and resolved JSON errors'],
    }
  } catch {
    // Continue to preprocessing
  }

  // Stage 2: Strip trailing semicolons or colons after closing bracket/brace
  let trimmed = input.trim()
  if (/([\}\]])\s*[;:]+\s*$/.test(trimmed)) {
    input = input.replace(/([\}\]])\s*[;:]+\s*$/g, '$1')
    trimmed = input.trim()
    fixesApplied.push('Removed trailing semicolon/colon after closing bracket')
  }
  if (/;+\s*$/.test(trimmed)) {
    input = input.replace(/;+\s*$/g, '')
    trimmed = input.trim()
    fixesApplied.push('Removed trailing semicolon')
  }

  // Stage 3: Pre-process missing outer wrapper (e.g. missing opening { or [)
  const analysis = analyzeStructuralBrackets(trimmed)
  const startsWithBrace = trimmed.startsWith('{')
  const startsWithBracket = trimmed.startsWith('[')
  const endsWithBrace = trimmed.endsWith('}')
  const endsWithBracket = trimmed.endsWith(']')

  let wrapped = input

  if (!startsWithBrace && !startsWithBracket) {
    const isObjectLike =
      /^(\s*("[^"\\]*"|'[^'\\]*'|[a-zA-Z0-9_$]+)\s*:)/m.test(trimmed) ||
      (endsWithBrace && analysis.closeBraces >= analysis.openBraces) ||
      endsWithBrace

    const isArrayLike =
      (endsWithBracket && analysis.closeBrackets >= analysis.openBrackets) ||
      endsWithBracket ||
      /^(\s*(\d+|true|false|null|"[^"\\]*"|'[^'\\]*'|\{)\s*,)/m.test(trimmed)

    if (isObjectLike) {
      wrapped = '{\n' + wrapped
      if (!endsWithBrace) wrapped = wrapped + '\n}'
      fixesApplied.push("Added missing outer curly braces '{}'")
    } else if (isArrayLike) {
      wrapped = '[\n' + wrapped
      if (!endsWithBracket) wrapped = wrapped + '\n]'
      fixesApplied.push("Added missing outer square brackets '[]'")
    }
  }

  // Stage 4: Repair wrapped payload with jsonrepair
  try {
    const rep = jsonrepair(wrapped)
    const parsed = JSON.parse(rep)
    return {
      success: true,
      output: shouldFormat ? JSON.stringify(parsed, null, indent) : rep,
      fixesApplied: fixesApplied.length > 0 ? fixesApplied : ['Repaired syntax errors'],
    }
  } catch {
    // Stage 5: Structural manual transformations fallback
    let cleaned = wrapped

    // Replace unescaped single quotes
    if (analysis.hasSingleQuotes) {
      cleaned = cleaned.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
      fixesApplied.push('Converted single quotes to double quotes')
    }

    // Strip JS comments
    if (analysis.hasComments) {
      cleaned = cleaned.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '')
      fixesApplied.push('Removed non-standard JavaScript comments')
    }

    // Strip trailing commas before } or ]
    cleaned = cleaned.replace(/,\s*([\}\]])/g, '$1')

    // Quote unquoted keys
    cleaned = cleaned.replace(/^([ \t]*)([a-zA-Z0-9_$]+)[ \t]*:/gm, '$1"$2":')

    // Check bracket balance and append missing closers
    const newCounts = analyzeStructuralBrackets(cleaned)
    if (newCounts.openBraces > newCounts.closeBraces) {
      cleaned += '\n' + '}'.repeat(newCounts.openBraces - newCounts.closeBraces)
      fixesApplied.push('Closed missing curly braces')
    }
    if (newCounts.openBrackets > newCounts.closeBrackets) {
      cleaned += '\n' + ']'.repeat(newCounts.openBrackets - newCounts.closeBrackets)
      fixesApplied.push('Closed missing square brackets')
    }

    // Test with jsonrepair
    try {
      const rep = jsonrepair(cleaned)
      const parsed = JSON.parse(rep)
      return {
        success: true,
        output: shouldFormat ? JSON.stringify(parsed, null, indent) : rep,
        fixesApplied: fixesApplied.length > 0 ? fixesApplied : ['Repaired syntax errors'],
      }
    } catch {
      // Direct JSON.parse verification on cleaned
      try {
        const parsed = JSON.parse(cleaned)
        return {
          success: true,
          output: shouldFormat ? JSON.stringify(parsed, null, indent) : cleaned,
          fixesApplied: fixesApplied.length > 0 ? fixesApplied : ['Repaired syntax errors'],
        }
      } catch (err: any) {
        return {
          success: false,
          output: cleaned,
          fixesApplied,
          error: err?.message || 'Could not automatically resolve all JSON syntax issues',
        }
      }
    }
  }
}
