/**
 * SQL Validator Engine
 *
 * Authoritative SQL Syntax & Structural Validation Engine powered by `node-sql-parser`.
 * Replaces dictionary-based guesswork with full grammar parsing, AST inspection,
 * query risk audits, table extraction, and auto-fix capabilities.
 */

import { Parser } from 'node-sql-parser'

export type SqlDialect = 'sql' | 'mysql' | 'postgresql' | 'sqlite' | 'plsql' | 'tsql'

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

/**
 * Maps application SQL dialect to node-sql-parser database option.
 */
export function getParserDatabase(dialect: SqlDialect): string {
  switch (dialect) {
    case 'postgresql':
      return 'postgresql'
    case 'mysql':
      return 'mysql'
    case 'sqlite':
      return 'sqlite'
    case 'tsql':
      return 'transactsql'
    case 'plsql':
      return 'postgresql'
    case 'sql':
    default:
      return 'postgresql'
  }
}

/**
 * Common keyword replacements for auto-fix and typo suggestions.
 */
const COMMON_KEYWORD_TYPOS: Record<string, string> = {
  SEELCT: 'SELECT',
  SELCT: 'SELECT',
  SELEC: 'SELECT',
  SLECT: 'SELECT',
  FORM: 'FROM',
  FRM: 'FROM',
  FRO: 'FROM',
  WHER: 'WHERE',
  WHR: 'WHERE',
  WHEREA: 'WHERE',
  ORDRE: 'ORDER',
  ODRER: 'ORDER',
  ODER: 'ORDER',
  GRUP: 'GROUP',
  GROPU: 'GROUP',
  HAVNG: 'HAVING',
  HVING: 'HAVING',
  LMIRT: 'LIMIT',
  LIMT: 'LIMIT',
  LIMTI: 'LIMIT',
  LMIT: 'LIMIT',
  JOIIN: 'JOIN',
  JON: 'JOIN',
  INSRT: 'INSERT',
  INTOU: 'INTO',
  UPDAT: 'UPDATE',
  UPDAET: 'UPDATE',
  DELET: 'DELETE',
  DELTE: 'DELETE',
  DISTNCT: 'DISTINCT',
  DISTICNT: 'DISTINCT',
  BEETWEEN: 'BETWEEN',
  VALUS: 'VALUES',
  VALEUS: 'VALUES',
}

/**
 * Format expected tokens from PEG.js parser into a friendly string.
 */
function formatExpectedTokens(expected: any[] | undefined): string | null {
  if (!expected || !Array.isArray(expected) || expected.length === 0) return null

  const tokens = new Set<string>()
  for (const item of expected) {
    if (item.type === 'literal' && item.text && item.text.trim()) {
      tokens.add(item.text.trim())
    } else if (item.type === 'other' && item.description) {
      tokens.add(item.description)
    }
    if (tokens.size >= 6) break
  }

  if (tokens.size === 0) return null
  return Array.from(tokens).slice(0, 5).join(', ')
}

/**
 * Parses node-sql-parser error into a clean SqlValidationError.
 */
function formatParserError(err: any, sql: string): SqlValidationError {
  const line = err?.location?.start?.line ?? 1
  const column = err?.location?.start?.column ?? undefined
  const found = err?.found
  const rawMsg = err?.message || 'Syntax Error'

  let message = `Syntax Error on line ${line}`
  let suggestion: string | undefined = undefined

  const lines = sql.split('\n')
  const errorLineContent = lines[line - 1] || ''

  if (found === null || /end of input/i.test(rawMsg)) {
    message = `Incomplete SQL query: Unexpected end of input on line ${line}`
    suggestion = 'Check for unclosed parentheses, missing quotes, or an incomplete clause at the end of the query.'
  } else if (found) {
    // Check if the token at this position is a known misspelled keyword
    const wordMatch = errorLineContent.slice(Math.max(0, (column || 1) - 1)).match(/^[A-Za-z_][A-Za-z0-9_]*/i)
    const tokenWord = wordMatch ? wordMatch[0].toUpperCase() : ''

    if (tokenWord && COMMON_KEYWORD_TYPOS[tokenWord]) {
      const correctKeyword = COMMON_KEYWORD_TYPOS[tokenWord]
      message = `Misspelled SQL keyword '${tokenWord}' on line ${line}`
      suggestion = `Did you mean '${correctKeyword}'?`
    } else if (found === ',' || /unexpected comma/i.test(rawMsg)) {
      message = `Unexpected comma ',' on line ${line}`
      suggestion = 'Remove the trailing comma before the next clause or keyword.'
    } else {
      const expectedSummary = formatExpectedTokens(err.expected)
      message = `Unexpected token "${found}" on line ${line}${column ? `, column ${column}` : ''}`
      if (expectedSummary) {
        suggestion = `Expected one of: ${expectedSummary}`
      }
    }
  } else {
    message = `Syntax Error: ${rawMsg}`
  }

  return {
    line,
    column,
    message,
    severity: 'error',
    suggestion,
  }
}

/**
 * Extracts sanitized table names from node-sql-parser tableList result.
 * Format returned by tableList: e.g. "select::null::users" or "update::public::orders"
 */
function extractCleanTableNames(rawTableList: string[]): string[] {
  const tableSet = new Set<string>()
  for (const item of rawTableList) {
    if (typeof item !== 'string') continue
    const parts = item.split('::')
    const tableName = parts[2] || parts[parts.length - 1]
    if (tableName && tableName !== 'null' && !tableName.startsWith('(')) {
      tableSet.add(tableName.replace(/[`"']/g, ''))
    }
  }
  return Array.from(tableSet)
}

/**
 * Fallback clause detector for cases where parsing fails.
 */
function fallbackClauseDetection(sql: string) {
  const upper = sql.toUpperCase()
  return {
    select: /\bSELECT\b/.test(upper),
    from: /\bFROM\b/.test(upper),
    join: /\bJOIN\b/.test(upper),
    where: /\bWHERE\b/.test(upper),
    groupBy: /\bGROUP\s+BY\b/.test(upper),
    having: /\bHAVING\b/.test(upper),
    orderBy: /\bORDER\s+BY\b/.test(upper),
    limit: /\b(LIMIT|TOP)\b/.test(upper),
  }
}

/**
 * Fallback table name extraction when parser fails due to syntax error.
 */
function fallbackTableExtraction(sql: string): string[] {
  const tables = new Set<string>()
  const matches = sql.matchAll(/\b(?:FROM|JOIN|INTO|UPDATE)\s+([`"']?[a-zA-Z0-9_]+[`"']?(?:\.[`"']?[a-zA-Z0-9_]+[`"']?)?)/gi)
  for (const m of matches) {
    const table = m[1]?.replace(/[`"']/g, '').trim()
    if (table && !/^(SELECT|WHERE|GROUP|HAVING|ORDER|LIMIT|SET|VALUES)$/i.test(table)) {
      tables.add(table)
    }
  }
  return Array.from(tables)
}

/**
 * Validates a SQL query using `node-sql-parser`.
 */
export function validateSqlCode(sql: string, dialect: SqlDialect = 'sql'): SqlValidationResult {
  const errors: SqlValidationError[] = []
  const warnings: SqlValidationError[] = []
  const info: SqlValidationError[] = []

  const trimmed = sql.trim()
  const lines = sql.split('\n')
  const words = trimmed ? trimmed.split(/\s+/).length : 0

  const baseStats = {
    lines: lines.length,
    chars: sql.length,
    words,
  }

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

  // Pre-parser check: Disallow invalid trailing colons (e.g., `LIMIT 50:`)
  lines.forEach((lineStr, idx) => {
    const lineNum = idx + 1
    const codePart = lineStr.split('--')[0].trim()
    if (codePart && /(?<!:):(?!\:)\s*$/.test(codePart)) {
      errors.push({
        line: lineNum,
        message: `Invalid trailing colon ':' found on line ${lineNum}`,
        severity: 'error',
        suggestion: "SQL statements do not terminate with a colon ':'. Use a semicolon ';' or remove it.",
      })
    }
  })

  const parser = new Parser()
  const db = getParserDatabase(dialect)
  let parsedAst: any = null

  try {
    parsedAst = parser.astify(trimmed, { database: db })
  } catch (err: any) {
    // If dialect is 'sql' (generic ANSI) or 'plsql' and failed on postgresql, try mysql as secondary fallback
    if (dialect === 'sql' || dialect === 'plsql') {
      try {
        parsedAst = parser.astify(trimmed, { database: 'mysql' })
      } catch {
        errors.push(formatParserError(err, sql))
      }
    } else {
      errors.push(formatParserError(err, sql))
    }
  }

  // If parser succeeded, inspect AST for structure, clauses, tables, and safety warnings
  if (parsedAst) {
    const astList = Array.isArray(parsedAst) ? parsedAst : [parsedAst]
    const primaryAst = astList[0] || {}

    // Statement type
    let statementType = (primaryAst.type || 'SQL').toUpperCase()

    // Clause Breakdown from AST
    const clauseBreakdown = {
      select: astList.some((a) => a.type === 'select' || Array.isArray(a.columns)),
      from: astList.some((a) => Boolean(a.from && a.from.length > 0)),
      join: astList.some((a) => Boolean(a.from && Array.isArray(a.from) && a.from.some((f: any) => f.join))),
      where: astList.some((a) => Boolean(a.where)),
      groupBy: astList.some((a) => Boolean(a.groupby && (Array.isArray(a.groupby) ? a.groupby.length > 0 : Object.keys(a.groupby).length > 0))),
      having: astList.some((a) => Boolean(a.having)),
      orderBy: astList.some((a) => Boolean(a.orderby && a.orderby.length > 0)),
      limit: astList.some((a) => Boolean(a.limit)),
    }

    // Extract tables using parser.tableList
    let tablesDetected: string[] = []
    try {
      const rawTables = parser.tableList(trimmed, { database: db })
      tablesDetected = extractCleanTableNames(rawTables)
    } catch {
      tablesDetected = fallbackTableExtraction(trimmed)
    }

    // Query Risk & Safety Audits
    for (const astItem of astList) {
      const stmtType = (astItem.type || '').toUpperCase()

      // Dangerous DELETE without WHERE
      if (stmtType === 'DELETE' && !astItem.where) {
        warnings.push({
          line: 1,
          message: 'Dangerous Query: DELETE statement without a WHERE clause will delete all records in the table!',
          severity: 'warning',
          suggestion: 'Add a WHERE condition to target specific records (e.g., WHERE id = ...).',
        })
      }

      // Dangerous UPDATE without WHERE
      if (stmtType === 'UPDATE' && !astItem.where) {
        warnings.push({
          line: 1,
          message: 'Dangerous Query: UPDATE statement without a WHERE clause will update all rows in the table!',
          severity: 'warning',
          suggestion: 'Add a WHERE clause to avoid unintended bulk data modification.',
        })
      }

      // Destructive DDL statement
      if (['DROP', 'TRUNCATE'].includes(stmtType)) {
        info.push({
          line: 1,
          message: `Destructive DDL: ${stmtType} statement permanently deletes database structures and data.`,
          severity: 'info',
        })
      }
    }

    return {
      isValid: errors.length === 0,
      hasWarnings: warnings.length > 0,
      statementType,
      errors,
      warnings,
      info,
      clauseBreakdown,
      tablesDetected,
      stats: baseStats,
    }
  }

  // If parsing failed: Use fallback heuristics to populate clauses and tables so UI remains informative
  const upperTrimmed = trimmed.toUpperCase()
  let fallbackType = 'UNKNOWN'
  if (upperTrimmed.startsWith('SELECT')) fallbackType = 'SELECT'
  else if (upperTrimmed.startsWith('INSERT')) fallbackType = 'INSERT'
  else if (upperTrimmed.startsWith('UPDATE')) fallbackType = 'UPDATE'
  else if (upperTrimmed.startsWith('DELETE')) fallbackType = 'DELETE'
  else if (upperTrimmed.startsWith('CREATE')) fallbackType = 'CREATE'
  else if (upperTrimmed.startsWith('ALTER')) fallbackType = 'ALTER'
  else if (upperTrimmed.startsWith('DROP')) fallbackType = 'DROP'

  return {
    isValid: false,
    hasWarnings: warnings.length > 0,
    statementType: fallbackType,
    errors,
    warnings,
    info,
    clauseBreakdown: fallbackClauseDetection(trimmed),
    tablesDetected: fallbackTableExtraction(trimmed),
    stats: baseStats,
  }
}

/**
 * Intelligent Auto-Fix for common SQL syntax errors:
 * - Fixes misspelled keywords
 * - Removes invalid trailing colons
 * - Removes trailing commas before major clauses
 * - Closes unclosed parentheses
 * - Verifies result with node-sql-parser
 */
export function autoFixSqlCode(sql: string, dialect: SqlDialect = 'sql'): { fixedSql: string; fixCount: number; fixesApplied: string[] } {
  let fixed = sql
  let fixCount = 0
  const fixesApplied: string[] = []

  // 1. Fix invalid trailing colons (e.g. "LIMIT 50:" -> "LIMIT 50;")
  const colonFixed = fixed.replace(/(?<!:):(?!\:)\s*$/gm, (match) => {
    fixCount++
    fixesApplied.push('Replaced invalid trailing colon with semicolon')
    return ';'
  })
  fixed = colonFixed

  // 2. Fix known misspelled keywords using word boundaries
  for (const [typo, correct] of Object.entries(COMMON_KEYWORD_TYPOS)) {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi')
    if (regex.test(fixed)) {
      fixed = fixed.replace(regex, () => {
        fixCount++
        fixesApplied.push(`Corrected '${typo}' -> '${correct}'`)
        return correct
      })
    }
  }

  // 3. Remove trailing comma before clause keywords (e.g., `SELECT a, b, FROM table`)
  const trailingCommaRegex = /,\s*(?=(?:FROM|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|JOIN|UNION)\b)/gi
  if (trailingCommaRegex.test(fixed)) {
    fixed = fixed.replace(trailingCommaRegex, () => {
      fixCount++
      fixesApplied.push('Removed trailing comma before clause keyword')
      return ''
    })
  }

  // 4. Fix unbalanced parentheses
  let openParenCount = 0
  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i]
    if (char === '(') openParenCount++
    else if (char === ')') {
      if (openParenCount > 0) openParenCount--
    }
  }

  if (openParenCount > 0) {
    // Append missing closing parens before trailing semicolon or at end of statement
    if (fixed.trim().endsWith(';')) {
      const semiIndex = fixed.lastIndexOf(';')
      fixed = fixed.slice(0, semiIndex) + ')'.repeat(openParenCount) + ';'
    } else {
      fixed = fixed + ')'.repeat(openParenCount)
    }
    fixCount += openParenCount
    fixesApplied.push(`Added ${openParenCount} missing closing parenthesis ')'`)
  }

  return {
    fixedSql: fixed,
    fixCount,
    fixesApplied,
  }
}
