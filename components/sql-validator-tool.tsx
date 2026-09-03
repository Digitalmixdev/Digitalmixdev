'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { format } from 'sql-formatter'
import {
  Database,
  Code,
  Copy,
  Trash2,
  Download,
  Check,
  Sparkles,
  Upload,
  AlertTriangle,
  Zap,
  ShieldCheck,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  RotateCcw,
  Wand2,
  ArrowRight,
  Search,
  ExternalLink,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ToolLayout, type ToolMetadata } from '@/components/tool-layout'
import { incrementToolUsage } from '@/actions/incrementUsage'
import { markToolUsed } from '@/actions/toolUsage'
import { useLanguage } from '@/lib/i18n/context'
import { logToolActivity, deleteActivityItem, getToolHistoryFromActivities } from '@/lib/history-service'
import { registerToolInputGetter } from '@/lib/ai/tool-input-bus'
import Link from 'next/link'

type SqlDialect = 'sql' | 'mysql' | 'postgresql' | 'sqlite' | 'plsql' | 'tsql'

export interface SqlValidationError {
  line: number
  column?: number
  message: string
  severity: 'error' | 'warning' | 'info'
  suggestion?: string
}

export interface SqlValidationResult {
  isValid: boolean
  hasWarnings: boolean
  statementType: string
  errors: SqlValidationError[]
  warnings: SqlValidationError[]
  info: SqlValidationError[]
  clauseBreakdown: {
    select: boolean
    from: boolean
    join: boolean
    where: boolean
    groupBy: boolean
    having: boolean
    orderBy: boolean
    limit: boolean
  }
  tablesDetected: string[]
  stats: {
    lines: number
    chars: number
    words: number
  }
}

export interface SqlValidatorHistoryItem {
  id: string
  title: string
  input: string
  dialect: SqlDialect
  isValid: boolean
  errorCount: number
  warningCount: number
  timestamp: number
}

const toolMeta: ToolMetadata = {
  id: 'sql-validator',
  name: 'SQL Validator',
  name_ar: 'مدقق ومحلل استعلامات SQL',
  description:
    'Validate SQL query syntax, detect errors, verify clause structures, check quote/bracket balance, and audit database queries with 100% client-side privacy.',
  description_ar:
    'قم بتدقيق وفحص صحة استعلامات SQL، واكتشاف الأخطاء النحوية والأقواس المفقودة والجداول والمخاطر، مع حماية كاملة لخصوصيتك 100%.',
  category: {
    id: 'database',
    name: 'Database Tools',
    slug: 'database',
  },
  icon: CheckCircle2,
  privacyBadge: '100% Client-Side • Multi-Dialect Syntax Audit',
  privacyBadge_ar: 'معالجة محلية 100% • تدقيق نحوي متعدد اللهجات',
  features: [
    {
      icon: CheckCircle2,
      title: 'Multi-Dialect Syntax Check',
      desc: 'Validates syntax for ANSI SQL, PostgreSQL, MySQL, SQLite, PL/SQL, and T-SQL.',
    },
    {
      icon: Zap,
      title: 'Real-time Error Detection',
      desc: 'Pinpoints unclosed quotes, missing parentheses, misspelled keywords, and structural flaws.',
    },
    {
      icon: AlertTriangle,
      title: 'Query Risk & Safety Audit',
      desc: 'Alerts you to dangerous queries like DELETE or UPDATE without WHERE clauses.',
    },
    {
      icon: Wand2,
      title: 'One-Click Auto Fixer',
      desc: 'Automatically corrects keyword casing, misspelled syntax, and cleans up formatting.',
    },
  ],
  features_ar: [
    {
      icon: CheckCircle2,
      title: 'تدقيق نحوي متعدد اللهجات',
      desc: 'فحص صحة الأكواد لـ PostgreSQL و MySQL و SQLite و PL/SQL و T-SQL.',
    },
    {
      icon: Zap,
      title: 'اكتشاف الأخطاء فورياً',
      desc: 'تحديد الأقواس المفتوحة، الاقتباسات المفقودة، والكلمات المفتاحية المكتوبة بأسلوب خاطئ.',
    },
    {
      icon: AlertTriangle,
      title: 'تدقيق الأمان والمخاطر',
      desc: 'تنبيهك فوراً عند وجود استعلامات خطيرة مثل DELETE أو UPDATE بدون شرط WHERE.',
    },
    {
      icon: Wand2,
      title: 'إصلاح تلقائي بنقرة واحدة',
      desc: 'تصحيح حالة الأحرف للكلمات المفتاحية وإصلاح الأخطاء الإملائية الشائعة فورياً.',
    },
  ],
  faqs: [
    {
      q: 'Which SQL dialects are supported by the SQL Validator?',
      a: 'We support Standard ANSI SQL, PostgreSQL, MySQL / MariaDB, SQLite, Oracle (PL/SQL), and Microsoft SQL Server (T-SQL).',
    },
    {
      q: 'Does SQL Validator send my queries to any external server?',
      a: 'No. All parsing, syntax checks, and validation logic execute 100% locally in your browser runtime. Your queries and schema structures remain strictly private.',
    },
    {
      q: 'Can I fix my SQL query after validating?',
      a: 'Yes! Click the "Auto Fix" button to automatically fix misspelled keywords, function typos, punctuation mistakes, and syntax errors in-place without altering your layout.',
    },
  ],
  faqs_ar: [
    {
      q: 'ما هي لغات ولهجات SQL المدعومة؟',
      a: 'ندعم SQL القياسية ANSI، PostgreSQL، MySQL، SQLite، Oracle PL/SQL، و Microsoft SQL Server (T-SQL).',
    },
    {
      q: 'هل تقوم الأداة بإرسال استعلاماتي إلى أي خوادم خارجية؟',
      a: 'لا. كل عمليات الفحص والتدقيق تتم بنسبة 100% داخل متصفحك المحلي دون أي نقل للبيانات عبر الشبكة.',
    },
    {
      q: 'هل يمكنني إصلاح الاستعلام بعد الفحص؟',
      a: 'نعم! اضغط على زر "إصلاح تلقائي" لتصحيح الأخطاء الإملائية، وتعديل الترقيم، وضبط الاستعلام فورياً مع الحفاظ على تنسيقك.',
    },
  ],
}

const SAMPLE_QUERIES: { label: string; label_ar: string; dialect: SqlDialect; sql: string }[] = [
  {
    label: 'Query with Typos & Trailing Colon',
    label_ar: 'استعلام به أخطاء وترقيم خاطئ',
    dialect: 'postgresql',
    sql: `SElET u.id,
u.name,
COUNT(o.id) AS total_orders,
SM (o.amount) AS total_spent
FROM
  users u LET
  JOIN orders o ON u.id = o.user_id WHEE u.status = 'active'
  AND o.created_at >= '2025-01-01'
GROUP BY
  u.id,
  u.name HAVIG CoUNT(o.id) > 2 ORDR BY total_spent DESC
LIMIT
  50:`,
  },
  {
    label: 'Valid Complex Query',
    label_ar: 'استعلام معقد صحيح',
    dialect: 'postgresql',
    sql: `SELECT u.id, u.name, COUNT(o.id) AS total_orders, SUM(o.amount) AS total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active' AND o.created_at >= '2025-01-01'
GROUP BY u.id, u.name
HAVING COUNT(o.id) > 2
ORDER BY total_spent DESC
LIMIT 50;`,
  },
  {
    label: 'Syntax Error (Unclosed Bracket)',
    label_ar: 'خطأ نصوص (قوس غير مغلق)',
    dialect: 'sql',
    sql: `SELECT id, name, email
FROM users
WHERE age IN (18, 21, 25, 30
ORDER BY name ASC;`,
  },
  {
    label: 'Dangerous UPDATE (Missing WHERE)',
    label_ar: 'تحديث خطير (بدون WHERE)',
    dialect: 'mysql',
    sql: `UPDATE users
SET status = 'suspended', login_attempts = 0;`,
  },
  {
    label: 'Misspelled Keywords',
    label_ar: 'أخطاء إملائية بالكلمات',
    dialect: 'sql',
    sql: `SEELCT id, title, price
FORM products
WHER price > 100
ORDRE BY price DESC;`,
  },
]

// Comprehensive dictionary of common SQL keyword typos
const KNOWN_TYPOS: Record<string, string> = {
  // SELECT typos
  SELET: 'SELECT',
  SELEt: 'SELECT',
  SElET: 'SELECT',
  SEELCT: 'SELECT',
  SELEC: 'SELECT',
  SLCT: 'SELECT',
  SELCT: 'SELECT',
  SLEECT: 'SELECT',
  SLECT: 'SELECT',
  SELETC: 'SELECT',

  // FROM typos
  FORM: 'FROM',
  FROMM: 'FROM',
  FRM: 'FROM',
  FOM: 'FROM',
  FRO: 'FROM',
  FORMM: 'FROM',

  // WHERE typos
  WHEE: 'WHERE',
  WHER: 'WHERE',
  WHEREER: 'WHERE',
  WHERER: 'WHERE',
  WEHRE: 'WHERE',
  WHEREE: 'WHERE',
  WHRE: 'WHERE',
  WERE: 'WHERE',

  // HAVING typos
  HAVIG: 'HAVING',
  HAVNG: 'HAVING',
  HAVIN: 'HAVING',
  HAVG: 'HAVING',
  HVING: 'HAVING',

  // ORDER typos
  ORDR: 'ORDER',
  ORDRE: 'ORDER',
  ODER: 'ORDER',
  ORER: 'ORDER',
  ORDRR: 'ORDER',

  // GROUP typos
  GRP: 'GROUP',
  GROP: 'GROUP',
  GROPU: 'GROUP',
  GROPP: 'GROUP',
  GROU: 'GROUP',

  // JOIN & JOIN types
  JION: 'JOIN',
  JOIM: 'JOIN',
  JOINN: 'JOIN',
  JON: 'JOIN',
  LET: 'LEFT',
  LFFT: 'LEFT',
  LEET: 'LEFT',
  LFT: 'LEFT',
  RIGTH: 'RIGHT',
  RGHT: 'RIGHT',
  RIGH: 'RIGHT',
  INER: 'INNER',
  INNR: 'INNER',
  INERR: 'INNER',
  CROS: 'CROSS',
  FUL: 'FULL',
  OUTR: 'OUTER',

  // INSERT / UPDATE / DELETE / VALUES
  INSRT: 'INSERT',
  INSERTT: 'INSERT',
  ISNERT: 'INSERT',
  UPDAT: 'UPDATE',
  UPDT: 'UPDATE',
  UPDTE: 'UPDATE',
  UPADTE: 'UPDATE',
  DELTE: 'DELETE',
  DELET: 'DELETE',
  DLETE: 'DELETE',
  DELEET: 'DELETE',
  VALUS: 'VALUES',
  VALUSE: 'VALUES',
  VAULES: 'VALUES',
  VALS: 'VALUES',

  // DISTINCT / LIMIT / OFFSET / BETWEEN
  DISTINT: 'DISTINCT',
  DISTINC: 'DISTINCT',
  DISTINCTT: 'DISTINCT',
  DISTICNT: 'DISTINCT',
  LIMT: 'LIMIT',
  LMIT: 'LIMIT',
  LIMTT: 'LIMIT',
  OFFST: 'OFFSET',
  OFSET: 'OFFSET',
  BETWEN: 'BETWEEN',
  BTWEEN: 'BETWEEN',
}

// Function typos before "("
const KNOWN_FUNCTION_TYPOS: Record<string, string> = {
  SM: 'SUM',
  SUMM: 'SUM',
  SU: 'SUM',
  CONT: 'COUNT',
  COUTN: 'COUNT',
  CUONT: 'COUNT',
  CNUT: 'COUNT',
  AVRG: 'AVG',
  AVARAGE: 'AVG',
  AVERAGE: 'AVG',
  MAXX: 'MAX',
  MINN: 'MIN',
  COALESC: 'COALESCE',
  COALESE: 'COALESCE',
  ROUNDD: 'ROUND',
  FLOORR: 'FLOOR',
  CONCT: 'CONCAT',
  SUBSTRG: 'SUBSTRING',
}

const COMMON_SQL_FUNCS = [
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'ROUND', 'FLOOR', 'CEIL',
  'ABS', 'CONCAT', 'SUBSTRING', 'TRIM', 'UPPER', 'LOWER', 'LENGTH', 'NOW'
]

const MAJOR_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', 'OFFSET',
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'CROSS', 'FULL', 'INSERT',
  'UPDATE', 'DELETE', 'VALUES', 'DISTINCT', 'BETWEEN'
]

// Levenshtein distance for fuzzy typo catching
function getLevenshteinDistance(a: string, b: string): number {
  const an = a.length
  const bn = b.length
  if (an === 0) return bn
  if (bn === 0) return an

  const matrix: number[][] = []
  for (let i = 0; i <= bn; i++) matrix[i] = [i]
  for (let j = 0; j <= an; j++) matrix[0][j] = j

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }
  return matrix[bn][an]
}

// Auto-Fix implementation: fixes typos, punctuation & clauses without altering user formatting
export function autoFixSqlCode(sql: string, dialect: SqlDialect): {
  fixedSql: string
  fixCount: number
  fixesApplied: string[]
} {
  let fixed = sql
  const fixesApplied: string[] = []
  let fixCount = 0

  // 1. Fix trailing colon ":" at the very end of statement (e.g. "50:" -> "50;")
  if (/(?<!:):(?!\:)\s*$/m.test(fixed)) {
    fixed = fixed.replace(/(?<!:):(?!\:)\s*$/m, ';')
    fixesApplied.push("Replaced trailing colon ':' with ';'")
    fixCount++
  }

  // 1b. Fix trailing colons before newlines on numeric/keyword lines (e.g. "50:\n" or "DESC:\n")
  const inlineTrailingColon = /([0-9a-zA-Z_])\s*:\s*(\r?\n)/g
  if (inlineTrailingColon.test(fixed)) {
    fixed = fixed.replace(inlineTrailingColon, '$1;$2')
    fixesApplied.push("Replaced invalid trailing colon ':' with ';'")
    fixCount++
  }

  // 2. Fix multi-word clause typos before single word replace
  // "LET JOIN" -> "LEFT JOIN" (both same line and across newlines)
  const letJoinRegex = /\bLET\s+(\r?\n\s*)?(JOIN\b)/gi
  if (letJoinRegex.test(fixed)) {
    fixed = fixed.replace(letJoinRegex, (match, nl, joinWord) => {
      fixCount++
      return nl ? `LEFT ${nl}${joinWord}` : `LEFT ${joinWord}`
    })
    fixesApplied.push("Corrected 'LET JOIN' to 'LEFT JOIN'")
  }

  // "ORDR BY" / "ODER BY" / "ORDRE BY" -> "ORDER BY"
  const ordrByRegex = /\b(?:ORDR|ODER|ORDRE)\s+BY\b/gi
  if (ordrByRegex.test(fixed)) {
    fixed = fixed.replace(ordrByRegex, 'ORDER BY')
    fixesApplied.push("Corrected 'ORDR BY' to 'ORDER BY'")
    fixCount++
  }

  // "GROP BY" / "GRP BY" -> "GROUP BY"
  const gropByRegex = /\b(?:GROP|GRP|GROPU)\s+BY\b/gi
  if (gropByRegex.test(fixed)) {
    fixed = fixed.replace(gropByRegex, 'GROUP BY')
    fixesApplied.push("Corrected 'GROP BY' to 'GROUP BY'")
    fixCount++
  }

  // 3. Fix misspelled functions before "(" (e.g. "SM (o.amount)" -> "SUM (o.amount)")
  Object.entries(KNOWN_FUNCTION_TYPOS).forEach(([typo, correct]) => {
    const fnRegex = new RegExp(`\\b${typo}\\s*(?=\\()`, 'gi')
    if (fnRegex.test(fixed)) {
      fixed = fixed.replace(fnRegex, (match) => {
        fixCount++
        return correct + (match.includes(' ') ? ' ' : '')
      })
      fixesApplied.push(`Corrected function '${typo}(...)' to '${correct}(...)'`)
    }
  })

  // 4. Fix individual misspelled keywords
  Object.entries(KNOWN_TYPOS).forEach(([typo, correct]) => {
    // Skip if handled by multi-word checks
    if (['LET', 'ORDR', 'ODER', 'ORDRE', 'GROP', 'GRP'].includes(typo)) return

    const kwRegex = new RegExp(`\\b${typo}\\b`, 'gi')
    if (kwRegex.test(fixed)) {
      fixed = fixed.replace(kwRegex, correct)
      fixesApplied.push(`Corrected keyword '${typo}' to '${correct}'`)
      fixCount++
    }
  })

  // 5. Trailing commas before major clauses
  const trailingCommaRegex = /,\s*(\r?\n\s*)?(FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/gi
  if (trailingCommaRegex.test(fixed)) {
    fixed = fixed.replace(trailingCommaRegex, '$1$2')
    fixesApplied.push('Removed trailing comma before major SQL clause')
    fixCount++
  }

  // 6. Duplicate commas ",," -> ","
  const dupCommaRegex = /,(?:\s*,)+/g
  if (dupCommaRegex.test(fixed)) {
    fixed = fixed.replace(dupCommaRegex, ',')
    fixesApplied.push('Cleaned duplicate commas')
    fixCount++
  }

  return { fixedSql: fixed, fixCount, fixesApplied }
}

export function validateSqlCode(sql: string, dialect: SqlDialect): SqlValidationResult {
  const trimmed = sql.trim()
  if (!trimmed) {
    return {
      isValid: true,
      hasWarnings: false,
      statementType: 'EMPTY',
      errors: [],
      warnings: [],
      info: [],
      clauseBreakdown: {
        select: false,
        from: false,
        join: false,
        where: false,
        groupBy: false,
        having: false,
        orderBy: false,
        limit: false,
      },
      tablesDetected: [],
      stats: { lines: 0, chars: 0, words: 0 },
    }
  }

  const lines = sql.split('\n')
  const errors: SqlValidationError[] = []
  const warnings: SqlValidationError[] = []
  const info: SqlValidationError[] = []

  // 1. Check Quote and Bracket Balances line-by-line & overall
  let parenDepth = 0
  let parenOpenLine = 1
  let squareDepth = 0
  let squareOpenLine = 1
  let inSingleQuote = false
  let inDoubleQuote = false
  let inBacktick = false

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i]
    const lineNum = sql.substring(0, i).split('\n').length

    if (char === "'" && !inDoubleQuote && !inBacktick) {
      if (i > 0 && sql[i - 1] === '\\') {
        // escaped
      } else {
        inSingleQuote = !inSingleQuote
      }
    } else if (char === '"' && !inSingleQuote && !inBacktick) {
      if (i > 0 && sql[i - 1] === '\\') {
        // escaped
      } else {
        inDoubleQuote = !inDoubleQuote
      }
    } else if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick
    }

    if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (char === '(') {
        if (parenDepth === 0) parenOpenLine = lineNum
        parenDepth++
      } else if (char === ')') {
        parenDepth--
        if (parenDepth < 0) {
          errors.push({
            line: lineNum,
            message: `Unexpected closing parenthesis ')' at line ${lineNum}`,
            severity: 'error',
            suggestion: "Remove extra closing parenthesis or add an opening '(' earlier.",
          })
          parenDepth = 0
        }
      } else if (char === '[') {
        if (squareDepth === 0) squareOpenLine = lineNum
        squareDepth++
      } else if (char === ']') {
        squareDepth--
        if (squareDepth < 0) {
          errors.push({
            line: lineNum,
            message: `Unexpected closing bracket ']' at line ${lineNum}`,
            severity: 'error',
            suggestion: 'Remove extra closing bracket.',
          })
          squareDepth = 0
        }
      }
    }
  }

  if (inSingleQuote) {
    errors.push({
      line: lines.length,
      message: "Unclosed single quote (') string literal",
      severity: 'error',
      suggestion: "Add a closing single quote (') to terminate the string literal.",
    })
  }
  if (inDoubleQuote) {
    errors.push({
      line: lines.length,
      message: 'Unclosed double quote (") identifier literal',
      severity: 'error',
      suggestion: 'Add a closing double quote (") to complete the identifier.',
    })
  }
  if (inBacktick) {
    errors.push({
      line: lines.length,
      message: 'Unclosed backtick (`) identifier literal',
      severity: 'error',
      suggestion: 'Add a closing backtick (`) to complete the table or column name.',
    })
  }
  if (parenDepth > 0) {
    errors.push({
      line: parenOpenLine,
      message: `Unclosed parenthesis '(' opened around line ${parenOpenLine}`,
      severity: 'error',
      suggestion: `Add ${parenDepth} closing parenthesis ')' at the end of the statement or clause.`,
    })
  }
  if (squareDepth > 0) {
    errors.push({
      line: squareOpenLine,
      message: `Unclosed square bracket '[' opened around line ${squareOpenLine}`,
      severity: 'error',
      suggestion: 'Add closing square bracket \']\'.',
    })
  }

  // 2. Trailing Colon Check (e.g. "50:", "LIMIT 50:", "DESC:")
  lines.forEach((lineStr, idx) => {
    const lineNum = idx + 1
    const codePart = lineStr.split('--')[0].trim()
    if (!codePart) return

    // Colon at the end of line that is not part of postgres cast "::" and not a parameter ":param"
    if (/(?<!:):(?!\:)\s*$/.test(codePart)) {
      errors.push({
        line: lineNum,
        message: `Syntax error: Invalid trailing colon ':' found at line ${lineNum}`,
        severity: 'error',
        suggestion: "SQL statements do not end with a colon ':'. Use a semicolon ';' or remove it.",
      })
    }
  })

  // 3. Multi-word clause and JOIN typo checks
  // Check "LET JOIN" (same line or across consecutive lines)
  lines.forEach((lineStr, idx) => {
    const lineNum = idx + 1
    const codePart = lineStr.split('--')[0]

    // "LET" at end of line followed by "JOIN" on next line
    if (/\bLET\s*$/i.test(codePart.trim())) {
      const nextLine = (lines[idx + 1] || '').split('--')[0].trim()
      if (/^JOIN\b/i.test(nextLine)) {
        errors.push({
          line: lineNum,
          message: `Misspelled JOIN keyword 'LET' on line ${lineNum}`,
          severity: 'error',
          suggestion: "Did you mean 'LEFT JOIN'?",
        })
      }
    } else if (/\bLET\s+JOIN\b/i.test(codePart)) {
      errors.push({
        line: lineNum,
        message: `Misspelled JOIN keyword 'LET JOIN' on line ${lineNum}`,
        severity: 'error',
        suggestion: "Did you mean 'LEFT JOIN'?",
      })
    }

    // "ORDR BY" / "ODER BY"
    if (/\b(ORDR|ODER|ORDRE)\s+BY\b/i.test(codePart)) {
      const match = codePart.match(/\b(ORDR|ODER|ORDRE)\s+BY\b/i)
      errors.push({
        line: lineNum,
        message: `Misspelled SQL clause '${match ? match[1] : 'ORDR'} BY' on line ${lineNum}`,
        severity: 'error',
        suggestion: "Did you mean 'ORDER BY'?",
      })
    }

    // "GROP BY" / "GRP BY"
    if (/\b(GROP|GRP|GROPU)\s+BY\b/i.test(codePart)) {
      const match = codePart.match(/\b(GROP|GRP|GROPU)\s+BY\b/i)
      errors.push({
        line: lineNum,
        message: `Misspelled SQL clause '${match ? match[1] : 'GROP'} BY' on line ${lineNum}`,
        severity: 'error',
        suggestion: "Did you mean 'GROUP BY'?",
      })
    }
  })

  // 4. Function typos check before "(" (e.g., "SM (o.amount)")
  lines.forEach((lineStr, idx) => {
    const lineNum = idx + 1
    const codePart = lineStr.split('--')[0]

    // Find function-call patterns: word followed by optional space then "("
    const fnRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g
    let fnMatch
    while ((fnMatch = fnRegex.exec(codePart)) !== null) {
      const fnName = fnMatch[1]
      const upperFn = fnName.toUpperCase()

      if (KNOWN_FUNCTION_TYPOS[upperFn]) {
        errors.push({
          line: lineNum,
          message: `Misspelled SQL function '${fnName}(...)' on line ${lineNum}`,
          severity: 'error',
          suggestion: `Did you mean '${KNOWN_FUNCTION_TYPOS[upperFn]}(...)'?`,
        })
      } else if (!COMMON_SQL_FUNCS.includes(upperFn) && upperFn.length >= 2 && upperFn.length <= 6) {
        // Check fuzzy distance to common functions
        for (const validFn of COMMON_SQL_FUNCS) {
          const dist = getLevenshteinDistance(upperFn, validFn)
          if (dist === 1 || (dist === 2 && upperFn.length >= 5)) {
            errors.push({
              line: lineNum,
              message: `Potentially misspelled SQL function '${fnName}(...)' on line ${lineNum}`,
              severity: 'error',
              suggestion: `Did you mean '${validFn}(...)'?`,
            })
            break
          }
        }
      }
    }
  })

  // 5. Keyword Typos and Spelling Check per word
  lines.forEach((lineStr, idx) => {
    const lineNum = idx + 1
    const codePart = lineStr.split('--')[0]

    // Tokenize line while capturing context
    const tokenRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g
    let match
    while ((match = tokenRegex.exec(codePart)) !== null) {
      const word = match[1]
      const upperWord = word.toUpperCase()
      const matchIndex = match.index

      // Check if word is preceded by dot (table.column) or followed by dot
      const prevChar = matchIndex > 0 ? codePart[matchIndex - 1] : ''
      const nextChar = matchIndex + word.length < codePart.length ? codePart[matchIndex + word.length] : ''
      if (prevChar === '.' || nextChar === '.') {
        // This is a qualified identifier like u.id or o.amount, skip keyword typo check
        continue
      }

      // If next non-space char is '(', this is a function call which was checked in step 4
      const afterSlice = codePart.slice(matchIndex + word.length).trim()
      if (afterSlice.startsWith('(')) {
        continue
      }

      // Check known keyword typos dictionary
      if (KNOWN_TYPOS[upperWord]) {
        // Skip if already reported as part of a multi-word combo (e.g. LET before JOIN, ORDR before BY)
        if (upperWord === 'LET' && /\bLET\s+(\r?\n\s*)?JOIN\b/i.test(sql)) continue
        if (['ORDR', 'ODER', 'ORDRE'].includes(upperWord) && /\b(?:ORDR|ODER|ORDRE)\s+BY\b/i.test(sql)) continue
        if (['GROP', 'GRP'].includes(upperWord) && /\b(?:GROP|GRP)\s+BY\b/i.test(sql)) continue

        errors.push({
          line: lineNum,
          message: `Misspelled SQL keyword '${word}' on line ${lineNum}`,
          severity: 'error',
          suggestion: `Did you mean '${KNOWN_TYPOS[upperWord]}'?`,
        })
      } else if (!MAJOR_KEYWORDS.includes(upperWord) && upperWord.length >= 4) {
        // Fuzzy check against major keywords
        for (const kw of MAJOR_KEYWORDS) {
          const dist = getLevenshteinDistance(upperWord, kw)
          if (dist === 1) {
            errors.push({
              line: lineNum,
              message: `Misspelled SQL keyword '${word}' on line ${lineNum}`,
              severity: 'error',
              suggestion: `Did you mean '${kw}'?`,
            })
            break
          }
        }
      }
    }

    // Check duplicate commas ",,"
    if (/,(?:\s*,)+/.test(codePart)) {
      errors.push({
        line: lineNum,
        message: `Syntax error: Duplicate comma found on line ${lineNum}`,
        severity: 'error',
        suggestion: 'Remove the duplicate comma.',
      })
    }

    // Check trailing comma before FROM / WHERE / JOIN / GROUP BY / HAVING / ORDER BY
    if (/,\s*$/i.test(codePart.trim())) {
      const nextLine = (lines[idx + 1] || '').split('--')[0].trim().toUpperCase()
      if (
        nextLine.startsWith('FROM') ||
        nextLine.startsWith('WHERE') ||
        nextLine.startsWith('JOIN') ||
        nextLine.startsWith('LEFT') ||
        nextLine.startsWith('RIGHT') ||
        nextLine.startsWith('GROUP BY') ||
        nextLine.startsWith('HAVING') ||
        nextLine.startsWith('ORDER BY')
      ) {
        errors.push({
          line: lineNum,
          message: `Syntax error: Trailing comma at end of line ${lineNum} before '${nextLine.split(' ')[0]}'`,
          severity: 'error',
          suggestion: 'Remove the trailing comma before the clause keyword.',
        })
      }
    }
  })

  // 6. Statement Type & Clause Analysis
  const upperSql = sql.toUpperCase()
  let statementType = 'UNKNOWN'
  if (/\bSELECT\b/.test(upperSql) || /\b(SElET|SELET|SEELCT|SLCT|SELCT)\b/i.test(sql)) statementType = 'SELECT'
  else if (/\bINSERT\b/.test(upperSql) || /\b(INSRT|INSERTT)\b/i.test(sql)) statementType = 'INSERT'
  else if (/\bUPDATE\b/.test(upperSql) || /\b(UPDAT|UPDT)\b/i.test(sql)) statementType = 'UPDATE'
  else if (/\bDELETE\b/.test(upperSql) || /\b(DELTE|DELET)\b/i.test(sql)) statementType = 'DELETE'
  else if (/\bCREATE\b/.test(upperSql)) statementType = 'CREATE'
  else if (/\bALTER\b/.test(upperSql)) statementType = 'ALTER'
  else if (/\bDROP\b/.test(upperSql)) statementType = 'DROP'

  const clauseBreakdown = {
    select: /\bSELECT\b/.test(upperSql) || /\b(SElET|SELET|SEELCT|SLCT)\b/i.test(sql),
    from: /\bFROM\b/.test(upperSql) || /\b(FORM|FROMM)\b/i.test(sql),
    join: /\b(LEFT|RIGHT|INNER|OUTER|CROSS|FULL|LET)?\s*JOIN\b/i.test(sql),
    where: /\bWHERE\b/.test(upperSql) || /\b(WHEE|WHER|WEHRE)\b/i.test(sql),
    groupBy: /\bGROUP\s+BY\b/.test(upperSql) || /\b(GROP|GRP)\s+BY\b/i.test(sql),
    having: /\bHAVING\b/.test(upperSql) || /\b(HAVIG|HAVNG)\b/i.test(sql),
    orderBy: /\bORDER\s+BY\b/.test(upperSql) || /\b(ORDR|ODER|ORDRE)\s+BY\b/i.test(sql),
    limit: /\b(LIMIT|TOP|FETCH|LIMT)\b/i.test(sql),
  }

  // 7. Specific Structural Checks & Risk Audits
  if (statementType === 'UPDATE') {
    if (!clauseBreakdown.where) {
      warnings.push({
        line: 1,
        message: 'DANGEROUS QUERY: UPDATE statement without a WHERE clause!',
        severity: 'warning',
        suggestion:
          'Executing this statement will overwrite data across ALL rows in the table. Add a WHERE clause to restrict changes.',
      })
    }
    if (!/\bSET\b/.test(upperSql)) {
      errors.push({
        line: 1,
        message: 'Syntax Error: UPDATE statement missing mandatory SET clause',
        severity: 'error',
        suggestion: 'Add SET column_name = value clause.',
      })
    }
  }

  if (statementType === 'DELETE') {
    if (!clauseBreakdown.where) {
      warnings.push({
        line: 1,
        message: 'DANGEROUS QUERY: DELETE statement without a WHERE clause!',
        severity: 'warning',
        suggestion:
          'Executing this statement will permanently wipe ALL rows from the target table. Add a WHERE clause.',
      })
    }
    if (!clauseBreakdown.from) {
      errors.push({
        line: 1,
        message: 'Syntax Error: DELETE statement missing FROM clause',
        severity: 'error',
        suggestion: 'Specify target table with FROM table_name.',
      })
    }
  }

  if (statementType === 'INSERT') {
    if (!/\bINTO\b/.test(upperSql)) {
      errors.push({
        line: 1,
        message: 'Syntax Error: INSERT statement missing INTO keyword',
        severity: 'error',
        suggestion: 'Use INSERT INTO table_name (...)',
      })
    }
    if (!/\bVALUES\b/.test(upperSql) && !/\bSELECT\b/.test(upperSql)) {
      errors.push({
        line: 1,
        message: 'Syntax Error: INSERT statement missing VALUES or SELECT subquery',
        severity: 'error',
        suggestion: 'Add VALUES (...) or a valid SELECT subquery.',
      })
    }
  }

  if (statementType === 'SELECT') {
    if (!clauseBreakdown.from && !/\bSELECT\s+[0-9'"]/.test(upperSql) && !/\bSELECT\s+NOW\(|SELECT\s+CURRENT_/i.test(upperSql)) {
      warnings.push({
        line: 1,
        message: 'SELECT statement has no FROM clause',
        severity: 'warning',
        suggestion: 'If retrieving table records, specify FROM table_name.',
      })
    }

    if (clauseBreakdown.join && !/\b(ON|USING)\b/.test(upperSql) && !/\bCROSS\s+JOIN\b/.test(upperSql) && !/\bNATURAL\s+JOIN\b/.test(upperSql)) {
      errors.push({
        line: 1,
        message: 'Syntax Error: JOIN clause without ON or USING join condition',
        severity: 'error',
        suggestion: 'Add ON tableA.id = tableB.foreign_id or USING (id).',
      })
    }

    if (/\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/.test(upperSql) && !clauseBreakdown.groupBy && /SELECT\s+[^,]+\s*,/.test(upperSql)) {
      info.push({
        line: 1,
        message: 'Query combines aggregate functions with individual columns without GROUP BY',
        severity: 'info',
        suggestion: 'Most SQL engines require non-aggregated SELECT columns to be listed in a GROUP BY clause.',
      })
    }
  }

  // 8. Run secondary dialect parser check
  try {
    const formatted = format(sql, { language: dialect === 'tsql' ? 'sql' : dialect === 'plsql' ? 'plsql' : dialect })
    if (formatted && errors.length === 0) {
      info.push({
        line: 1,
        message: `Query parsed cleanly for dialect: ${dialect.toUpperCase()}`,
        severity: 'info',
      })
    }
  } catch (err: any) {
    if (errors.length === 0) {
      const errMsg = err?.message || 'SQL Parser error'
      errors.push({
        line: 1,
        message: `Dialect (${dialect.toUpperCase()}) Parser Error: ${errMsg}`,
        severity: 'error',
        suggestion: 'Check SQL keyword arrangement and syntax according to your target database dialect.',
      })
    }
  }

  // Extract Table Names
  const tablesDetected: string[] = []
  const tableRegex = /\b(?:FROM|JOIN|INTO|UPDATE|TABLE)\s+([`"']?[a-zA-Z0-9_.-]+[`"']?)/gi
  let tableMatch
  while ((tableMatch = tableRegex.exec(sql)) !== null) {
    const tbl = tableMatch[1].replace(/[`"']/g, '')
    if (tbl && !['SELECT', 'WHERE', 'SET', 'VALUES', '(', ')'].includes(tbl.toUpperCase()) && !tablesDetected.includes(tbl)) {
      tablesDetected.push(tbl)
    }
  }

  const isValid = errors.length === 0

  return {
    isValid,
    hasWarnings: warnings.length > 0,
    statementType,
    errors,
    warnings,
    info,
    clauseBreakdown,
    tablesDetected,
    stats: {
      lines: lines.length,
      chars: sql.length,
      words: sql.trim().split(/\s+/).length,
    },
  }
}

export function SqlValidatorTool() {
  const { t, language } = useLanguage()
  const isAr = language === 'ar'

  const [sqlInput, setSqlInput] = useState<string>(SAMPLE_QUERIES[0].sql)
  const [dialect, setDialect] = useState<SqlDialect>('postgresql')
  const [copied, setCopied] = useState<boolean>(false)
  const [history, setHistory] = useState<SqlValidatorHistoryItem[]>([])
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor')

  // Load history from localStorage
  useEffect(() => {
    const stored = getToolHistoryFromActivities('sql-validator')
    if (stored && stored.length > 0) {
      const parsed: SqlValidatorHistoryItem[] = stored.map((item) => {
        const meta = (typeof item.metadata === 'object' && item.metadata !== null ? item.metadata : {}) as Record<string, any>
        return {
          id: item.id,
          title: item.actionTitle || 'SQL Validation',
          input: item.inputSnippet || meta?.input || '',
          dialect: (meta?.dialect as SqlDialect) || 'sql',
          isValid: meta?.isValid ?? true,
          errorCount: meta?.errorCount || 0,
          warningCount: meta?.warningCount || 0,
          timestamp: new Date(item.createdAt).getTime(),
        }
      })
      setHistory(parsed)
    }
  }, [])

  // Register AI tool input getter
  useEffect(() => {
    registerToolInputGetter('sql-validator', () => sqlInput)
  }, [sqlInput])

  // Validation Result Memo
  const validationResult = useMemo(() => {
    return validateSqlCode(sqlInput, dialect)
  }, [sqlInput, dialect])

  // Log activity on validation
  const handleValidate = useCallback(() => {
    if (!sqlInput.trim()) return
    markToolUsed('sql-validator')
    incrementToolUsage()

    const res = validateSqlCode(sqlInput, dialect)
    const newHistItem: SqlValidatorHistoryItem = {
      id: Date.now().toString(),
      title: `${res.statementType} Query (${dialect.toUpperCase()})`,
      input: sqlInput,
      dialect,
      isValid: res.isValid,
      errorCount: res.errors.length,
      warningCount: res.warnings.length,
      timestamp: Date.now(),
    }

    logToolActivity({
      toolId: 'sql-validator',
      toolName: 'SQL Validator',
      category: 'database',
      actionTitle: `${res.statementType} Query (${dialect.toUpperCase()})`,
      details: `${res.statementType} query validated in ${dialect.toUpperCase()} (${res.isValid ? 'Valid' : 'Errors found'})`,
      inputSnippet: sqlInput.slice(0, 300),
      metadata: {
        input: sqlInput,
        dialect,
        isValid: res.isValid,
        errorCount: res.errors.length,
        warningCount: res.warnings.length,
        statementType: res.statementType,
      },
    })

    setHistory((prev) => [newHistItem, ...prev.filter((h) => h.input !== sqlInput).slice(0, 19)])
  }, [sqlInput, dialect])

  // Copy to clipboard
  const handleCopy = () => {
    if (!sqlInput.trim()) return
    navigator.clipboard.writeText(sqlInput)
    setCopied(true)
    toast.success(isAr ? 'تم نسخ استعلام SQL' : 'SQL Query copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  // Auto-Fix (Fixes typos, syntax, and punctuation in-place WITHOUT formatting)
  const handleAutoFix = () => {
    if (!sqlInput.trim()) return

    const { fixedSql, fixCount, fixesApplied } = autoFixSqlCode(sqlInput, dialect)

    if (fixCount > 0) {
      toast.success(
        isAr
          ? `تم الإصلاح التلقائي بنجاح (${fixCount} أخطاء تم تصحيحها)!`
          : `Auto-fixed ${fixCount} issue(s) successfully without reformatting!`
      )
    } else {
      toast.info(
        isAr
          ? 'لم يتم العثور على أخطاء إملائية أو ترقيم تحتاج لإصلاح.'
          : 'No typo or punctuation fixes needed in this query.'
      )
    }

    setSqlInput(fixedSql)
  }

  // Download SQL File
  const handleDownload = () => {
    if (!sqlInput.trim()) return
    const blob = new Blob([sqlInput], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `validated-query-${dialect}.sql`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(isAr ? 'تم تحميل ملف SQL' : 'Downloaded SQL file')
  }

  // Clear Input
  const handleClear = () => {
    setSqlInput('')
    toast.info(isAr ? 'تم تفريغ المحرر' : 'Cleared editor')
  }

  // Upload File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      if (content) {
        setSqlInput(content)
        toast.success(isAr ? 'تم تحميل استعلام SQL من الملف' : 'Loaded SQL from file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <ToolLayout metadata={toolMeta}>
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'editor' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('editor')}
              className="rounded-xl gap-2 text-xs font-semibold"
            >
              <Code className="h-3.5 w-3.5" />
              {isAr ? 'محرر التدقيق' : 'Validator Editor'}
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('history')}
              className="rounded-xl gap-2 text-xs font-semibold relative"
            >
              <History className="h-3.5 w-3.5" />
              {isAr ? 'سجل التدقيق' : 'Validation History'}
              {history.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-primary/20 text-primary text-[10px] font-bold rounded-full">
                  {history.length}
                </span>
              )}
            </Button>
          </div>

          {/* Dialect Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
              {isAr ? 'قاعدة البيانات / اللهجة:' : 'SQL Dialect:'}
            </span>
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value as SqlDialect)}
              className="h-9 rounded-xl border border-border/80 bg-background px-3 py-1 text-xs font-semibold text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL / MariaDB</option>
              <option value="sql">Standard ANSI SQL</option>
              <option value="sqlite">SQLite</option>
              <option value="plsql">Oracle (PL/SQL)</option>
              <option value="tsql">MS SQL Server (T-SQL)</option>
            </select>
          </div>
        </div>

        {activeTab === 'history' ? (
          /* History View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                {isAr ? 'سجل الفحوصات السابقة' : 'Recent Validations'}
              </h3>
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    history.forEach((h) => deleteActivityItem(h.id))
                    setHistory([])
                    toast.success(isAr ? 'تم مسح سجل التدقيق' : 'Cleared history')
                  }}
                  className="text-xs text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  {isAr ? 'مسح السجل' : 'Clear All'}
                </Button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border/60 rounded-2xl bg-muted/20">
                <History className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-muted-foreground">
                  {isAr ? 'لا يوجد استعلامات مسجلة في السجل بعد' : 'No validation history records yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-border/70 bg-card hover:bg-accent/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        {item.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                            <XCircle className="h-3 w-3" /> Syntax Error ({item.errorCount})
                          </span>
                        )}
                        <span className="text-xs font-bold text-foreground">{item.title}</span>
                      </div>
                      <pre className="text-xs font-mono text-muted-foreground truncate max-w-xl bg-muted/40 p-1.5 rounded-lg">
                        {item.input}
                      </pre>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSqlInput(item.input)
                          setDialect(item.dialect)
                          setActiveTab('editor')
                        }}
                        className="h-8 rounded-lg text-xs gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {isAr ? 'استعادة' : 'Load Query'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Editor & Validator Main View */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Editor & Controls */}
            <div className="lg:col-span-7 space-y-4">
              {/* Sample Queries Bar */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground mr-1">
                  {isAr ? 'نماذج جاهزة:' : 'Samples:'}
                </span>
                {SAMPLE_QUERIES.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSqlInput(sample.sql)
                      setDialect(sample.dialect)
                      toast.info(isAr ? `تم تحميل: ${sample.label_ar}` : `Loaded sample: ${sample.label}`)
                    }}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-border/60 bg-muted/30 hover:bg-primary/10 hover:border-primary/30 transition-all text-foreground"
                  >
                    {isAr ? sample.label_ar : sample.label}
                  </button>
                ))}
              </div>

              {/* Code Textarea Container */}
              <div className="relative rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 transition-all">
                <div className="flex items-center justify-between px-3.5 py-2 bg-muted/40 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      {isAr ? 'استعلام SQL للتدقيق' : 'SQL Query Input'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".sql,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border border-border/60 hover:bg-secondary text-muted-foreground transition-all">
                        <Upload className="h-3 w-3" />
                        {isAr ? 'رفع ملف' : 'Upload .sql'}
                      </span>
                    </label>

                    {sqlInput && (
                      <button
                        onClick={handleClear}
                        className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-destructive/10 text-destructive transition-all"
                      >
                        <Trash2 className="h-3 w-3 inline mr-0.5" />
                        {isAr ? 'مسح' : 'Clear'}
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={sqlInput}
                  onChange={(e) => setSqlInput(e.target.value)}
                  placeholder={
                    isAr
                      ? 'الصق استعلام SQL هنا لتدقيقه واكتشاف الأخطاء النحوية والهيكلية...'
                      : 'Paste your SQL query here to validate syntax, quotes, clauses, and structure...'
                  }
                  rows={14}
                  className="w-full bg-transparent p-4 font-mono text-xs sm:text-sm text-foreground focus:outline-none resize-y min-h-[320px] leading-relaxed"
                  spellCheck={false}
                />

                {/* Bottom Action Bar */}
                <div className="flex flex-wrap items-center justify-between p-3 bg-muted/20 border-t border-border/60 gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleAutoFix}
                      variant="secondary"
                      size="sm"
                      disabled={!sqlInput.trim()}
                      className="rounded-xl text-xs gap-1.5 font-bold hover:bg-primary/10 hover:text-primary transition-all shadow-xs"
                      title={isAr ? 'إصلاح الأخطاء الإملائية وعلامات الترقيم تلقائياً دون إعادة تنسيق' : 'Auto-fix typos, invalid colons, and syntax errors without reformatting'}
                    >
                      <Wand2 className="h-3.5 w-3.5 text-primary" />
                      {isAr ? 'إصلاح تلقائي' : 'Auto Fix'}
                    </Button>

                    <Link href={`/tools/sql-formatter`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-xs gap-1 font-semibold text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {isAr ? 'منسق SQL' : 'SQL Formatter'}
                      </Button>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      size="sm"
                      disabled={!sqlInput.trim()}
                      className="rounded-xl text-xs gap-1"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ' : 'Copy'}
                    </Button>

                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      size="sm"
                      disabled={!sqlInput.trim()}
                      className="rounded-xl text-xs gap-1"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {isAr ? 'تنزيل' : 'Download'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Validation Status & Audit Report */}
            <div className="lg:col-span-5 space-y-4">
              {/* Overall Status Banner */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  !sqlInput.trim()
                    ? 'border-border/60 bg-card'
                    : validationResult.isValid
                    ? validationResult.hasWarnings
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-destructive/30 bg-destructive/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  {!sqlInput.trim() ? (
                    <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  ) : validationResult.isValid ? (
                    validationResult.hasWarnings ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    )
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-foreground">
                        {!sqlInput.trim()
                          ? isAr
                            ? 'جاهز للفحص'
                            : 'Ready to Validate'
                          : validationResult.isValid
                          ? validationResult.hasWarnings
                            ? isAr
                              ? 'الاستعلام صحيح مع تحذيرات'
                              : 'Valid Query (with Risk Warnings)'
                            : isAr
                            ? 'الاستعلام صحيح 100%'
                            : 'Valid SQL Syntax'
                          : isAr
                          ? 'تم اكتشاف أخطاء نحوية'
                          : 'Syntax Errors Found'}
                      </h4>

                      {sqlInput.trim() && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {validationResult.statementType}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {!sqlInput.trim()
                        ? isAr
                          ? 'أدخل استعلام SQL الخاص بك لمراجعته وتدقيق الأخطاء الهيكلية.'
                          : 'Enter a SQL query to audit syntax, quotes, and structure.'
                        : validationResult.isValid
                        ? isAr
                          ? `لم يتم العثور على أخطاء قاتلة. تم الفحص على لهجة ${dialect.toUpperCase()}.`
                          : `No syntax errors detected for ${dialect.toUpperCase()} dialect.`
                        : isAr
                        ? `تمت إتاحة ${validationResult.errors.length} أخطاء تحتاج إلى تصحيح.`
                        : `Found ${validationResult.errors.length} syntax error(s) that need attention.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Errors List */}
              {validationResult.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-destructive flex items-center gap-1.5">
                      <XCircle className="h-3.5 w-3.5" />
                      {isAr ? 'الأخطاء النحوية:' : 'Syntax Errors:'} ({validationResult.errors.length})
                    </h5>

                    <Button
                      onClick={handleAutoFix}
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs font-bold gap-1 rounded-lg border-destructive/40 hover:bg-destructive/10 text-destructive hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Wand2 className="h-3 w-3" />
                      {isAr ? 'إصلاح تلقائي' : 'Auto Fix'}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {validationResult.errors.map((err, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-xs space-y-1"
                      >
                        <div className="font-bold text-destructive flex items-center justify-between">
                          <span>{err.message}</span>
                          <span className="text-[10px] bg-destructive/20 px-1.5 py-0.5 rounded text-destructive">
                            Line {err.line}
                          </span>
                        </div>
                        {err.suggestion && (
                          <p className="text-muted-foreground text-[11px] font-medium">
                            💡 <span className="font-semibold text-foreground">Suggestion:</span> {err.suggestion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings List */}
              {validationResult.warnings.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {isAr ? 'تحذيرات الأمان والمخاطر:' : 'Safety & Risk Alerts:'} ({validationResult.warnings.length})
                  </h5>
                  <div className="space-y-2">
                    {validationResult.warnings.map((warn, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs space-y-1"
                      >
                        <div className="font-bold text-amber-600 dark:text-amber-400">
                          {warn.message}
                        </div>
                        {warn.suggestion && (
                          <p className="text-muted-foreground text-[11px]">
                            👉 {warn.suggestion}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clauses Detected & Tables Breakdown */}
              {sqlInput.trim() && (
                <div className="p-4 rounded-2xl border border-border/70 bg-card space-y-3">
                  <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {isAr ? 'تحليل هيكل الاستعلام والجداول' : 'Clause & Table Breakdown'}
                  </h5>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground">SELECT</span>
                      <span className={validationResult.clauseBreakdown.select ? 'font-bold text-emerald-500' : 'text-muted-foreground/40'}>
                        {validationResult.clauseBreakdown.select ? 'Yes' : 'No'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground">FROM</span>
                      <span className={validationResult.clauseBreakdown.from ? 'font-bold text-emerald-500' : 'text-muted-foreground/40'}>
                        {validationResult.clauseBreakdown.from ? 'Yes' : 'No'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground">JOIN</span>
                      <span className={validationResult.clauseBreakdown.join ? 'font-bold text-emerald-500' : 'text-muted-foreground/40'}>
                        {validationResult.clauseBreakdown.join ? 'Yes' : 'No'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground">WHERE</span>
                      <span className={validationResult.clauseBreakdown.where ? 'font-bold text-emerald-500' : 'text-muted-foreground/40'}>
                        {validationResult.clauseBreakdown.where ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>

                  {validationResult.tablesDetected.length > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        {isAr ? 'الجداول المكتشفة:' : 'Tables Detected:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {validationResult.tablesDetected.map((tbl, i) => (
                          <span
                            key={i}
                            className="text-[11px] font-mono font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20"
                          >
                            {tbl}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
export default SqlValidatorTool
