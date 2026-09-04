/**
 * SQL Validator Engine - 6-Layer Context-Aware Lexical & Syntax Validation Architecture
 *
 * Layer 1: Lexical / Token Analysis (tokens, qualified identifiers, literals, operators, comments)
 * Layer 2: Dynamic Keyword Typo Detection (Levenshtein/Damerau distance with length-adaptive thresholds & confidence scoring)
 * Layer 3: Context-Aware Expected-Token Detection (clause structure, keyword expectation, alias detection)
 * Layer 4: Structural SQL Validation (bracket/quote balance, clause order, statement rules, comma syntax)
 * Layer 5: Dialect Awareness (ANSI SQL, PostgreSQL, MySQL, SQLite, PL/SQL, T-SQL)
 * Layer 6: Contextual Auto-Fix with Post-Validation Verification
 */

import { format } from 'sql-formatter'

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

// ---------------------------------------------------------------------------
// 1. VOCABULARY & DIALECT KEYWORDS
// ---------------------------------------------------------------------------

export const STANDARD_SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'HAVING', 'ORDER', 'LIMIT', 'OFFSET',
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'CROSS', 'FULL', 'NATURAL', 'ON', 'USING',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'ALTER', 'DROP',
  'TABLE', 'VIEW', 'INDEX', 'DATABASE', 'SCHEMA', 'TRIGGER', 'PROCEDURE', 'FUNCTION',
  'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'LIKE', 'ILIKE', 'BETWEEN', 'EXISTS',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'AS', 'DISTINCT', 'ALL', 'ANY', 'SOME',
  'UNION', 'EXCEPT', 'INTERSECT', 'WITH', 'RECURSIVE', 'PRIMARY', 'KEY', 'FOREIGN',
  'REFERENCES', 'CHECK', 'DEFAULT', 'UNIQUE', 'CONSTRAINT', 'ASC', 'DESC', 'NULLS',
  'FIRST', 'LAST', 'TRUE', 'FALSE', 'TRUNCATE', 'REPLACE', 'EXPLAIN', 'ANALYZE',
  'GRANT', 'REVOKE', 'TRANSACTION', 'BEGIN', 'COMMIT', 'ROLLBACK', 'SAVEPOINT'
]

export const DIALECT_SPECIFIC_KEYWORDS: Record<SqlDialect, string[]> = {
  sql: [],
  postgresql: [
    'RETURNING', 'ILIKE', 'SIMILAR', 'TO', 'CONFLICT', 'DO', 'NOTHING',
    'COLLATE', 'VACUUM', 'CASCADE', 'RESTRICT', 'FETCH', 'NEXT', 'ROWS', 'ONLY'
  ],
  mysql: [
    'AUTO_INCREMENT', 'IF', 'ENGINE', 'INNODB', 'MYISAM', 'USE', 'SHOW', 'DESCRIBE',
    'EXPLAIN', 'DUPLICATE', 'KEY', 'LOCK', 'UNLOCK', 'REGEXP', 'RLIKE', 'STRAIGHT_JOIN'
  ],
  sqlite: [
    'AUTOINCREMENT', 'GLOB', 'MATCH', 'PRAGMA', 'INDEXED', 'VACUUM', 'ATTACH', 'DETACH'
  ],
  plsql: [
    'DECLARE', 'BEGIN', 'EXCEPTION', 'ELSIF', 'LOOP', 'END', 'LOOP', 'ROWNUM',
    'SYSDATE', 'DUAL', 'CONNECT', 'PRIOR', 'START', 'PACKAGE', 'BODY', 'CURSOR', 'OPEN', 'FETCH', 'CLOSE'
  ],
  tsql: [
    'TOP', 'IDENTITY', 'GO', 'OUTPUT', 'MERGE', 'CLUSTERED', 'NONCLUSTERED',
    'NOLOCK', 'CROSS', 'APPLY', 'OUTER', 'APPLY', 'EXEC', 'EXECUTE', 'PRINT', 'GETDATE'
  ]
}

export const COMMON_SQL_FUNCTIONS = [
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'ROUND', 'FLOOR', 'CEIL',
  'ABS', 'CONCAT', 'SUBSTRING', 'SUBSTR', 'TRIM', 'LTRIM', 'RTRIM', 'UPPER',
  'LOWER', 'LENGTH', 'LEN', 'NOW', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP',
  'DATEADD', 'DATEDIFF', 'DATEPART', 'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND',
  'CAST', 'CONVERT', 'EXTRACT', 'POSITION', 'REPLACE', 'INSTR', 'IFNULL', 'NVL', 'ISNULL',
  'NULLIF', 'GREATEST', 'LEAST', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'LAG', 'LEAD'
]

// Identifiers/words that are very frequently used as table names, columns, or aliases
// and must NEVER be flagged as keyword typos unless in unambiguous clause context.
const COMMON_USER_IDENTIFIERS = new Set([
  'ID', 'IDS', 'NAME', 'NAMES', 'TITLE', 'TITLES', 'USER', 'USERS', 'ORDER', 'ORDERS',
  'CUSTOMER', 'CUSTOMERS', 'CLIENT', 'CLIENTS', 'ACCOUNT', 'ACCOUNTS', 'ROLE', 'ROLES',
  'RULE', 'RULES', 'GROUP', 'GROUPS', 'ITEM', 'ITEMS', 'PRODUCT', 'PRODUCTS', 'CATEGORY',
  'CATEGORIES', 'TAG', 'TAGS', 'POST', 'POSTS', 'COMMENT', 'COMMENTS', 'LOG', 'LOGS',
  'FILE', 'FILES', 'IMAGE', 'IMAGES', 'DATA', 'VALUE', 'VALUES', 'STATE', 'STATES',
  'STATUS', 'TYPE', 'TYPES', 'LIMIT', 'LIMITS', 'DATE', 'DATES', 'TIME', 'TIMES',
  'ROW', 'ROWS', 'VIEW', 'VIEWS', 'KEY', 'KEYS', 'CODE', 'CODES', 'TOTAL', 'AMOUNT',
  'PRICE', 'COST', 'COUNT', 'EMAIL', 'PHONE', 'ADDRESS', 'CITY', 'COUNTRY', 'CREATED_AT',
  'UPDATED_AT', 'DELETED_AT', 'ACTIVE', 'IS_ACTIVE', 'IS_DELETED', 'DESCRIPTION', 'NOTE',
  'USER_ID', 'ORDER_ID', 'CUSTOMER_ID', 'PRODUCT_ID', 'CATEGORY_ID', 'PARENT_ID'
])

// ---------------------------------------------------------------------------
// LAYER 1: LEXICAL & TOKEN ANALYSIS
// ---------------------------------------------------------------------------

export type TokenType =
  | 'keyword'
  | 'identifier'
  | 'qualified_identifier'
  | 'string_literal'
  | 'number_literal'
  | 'operator'
  | 'punctuation'
  | 'comment'
  | 'function_call'
  | 'corrupted_token'
  | 'unknown'

export interface SqlToken {
  type: TokenType
  value: string
  raw: string
  line: number
  column: number
  start: number
  end: number
  isQualified?: boolean
  isQuoted?: boolean
  quoteChar?: string
  isUnclosed?: boolean
}

export function tokenizeSql(sql: string, dialect: SqlDialect = 'sql'): SqlToken[] {
  const tokens: SqlToken[] = []
  const len = sql.length
  let i = 0
  let line = 1
  let col = 1

  const dialectKw = new Set([
    ...STANDARD_SQL_KEYWORDS,
    ...(DIALECT_SPECIFIC_KEYWORDS[dialect] || []),
  ])

  const funcSet = new Set(COMMON_SQL_FUNCTIONS)

  while (i < len) {
    const char = sql[i]
    const startIdx = i
    const startLine = line
    const startCol = col

    // 1. Whitespace & Newlines
    if (/\s/.test(char)) {
      if (char === '\n') {
        line++
        col = 1
      } else {
        col++
      }
      i++
      continue
    }

    // 2. Single-line comment (-- ...)
    if (char === '-' && sql[i + 1] === '-') {
      let commentVal = ''
      while (i < len && sql[i] !== '\n') {
        commentVal += sql[i]
        i++
        col++
      }
      tokens.push({
        type: 'comment',
        value: commentVal,
        raw: commentVal,
        line: startLine,
        column: startCol,
        start: startIdx,
        end: i,
      })
      continue
    }

    // 3. Multi-line comment (/* ... */)
    if (char === '/' && sql[i + 1] === '*') {
      let commentVal = ''
      while (i < len && !(sql[i] === '*' && sql[i + 1] === '/')) {
        if (sql[i] === '\n') {
          line++
          col = 1
        } else {
          col++
        }
        commentVal += sql[i]
        i++
      }
      if (i < len) {
        commentVal += '*/'
        i += 2
        col += 2
      }
      tokens.push({
        type: 'comment',
        value: commentVal,
        raw: commentVal,
        line: startLine,
        column: startCol,
        start: startIdx,
        end: i,
      })
      continue
    }

    // 4. String literals ('...' or N'...')
    if (char === "'" || ((char === 'N' || char === 'n') && sql[i + 1] === "'")) {
      const isNational = char === 'N' || char === 'n'
      if (isNational) {
        i++
        col++
      }
      i++ // skip opening quote
      col++
      let strVal = ''
      let isUnclosed = false
      while (i < len) {
        if (sql[i] === "'") {
          if (sql[i + 1] === "'") {
            // Escaped quote ''
            strVal += "'"
            i += 2
            col += 2
            continue
          } else {
            // End of string
            i++
            col++
            break
          }
        }
        if (sql[i] === '\n') {
          // If the next line starts with a SQL statement or clause, do NOT consume it as a string
          const restAfterNewline = sql.slice(i + 1)
          if (/^\s*(SELECT|FROM|WHERE|GROUP|HAVING|ORDER|LIMIT|JOIN|LEFT|RIGHT|INNER|OUTER|UNION|INSERT|UPDATE|DELETE|SET|VALUES)\b/i.test(restAfterNewline)) {
            isUnclosed = true
            break
          }
          line++
          col = 1
        } else {
          col++
        }
        strVal += sql[i]
        i++
      }
      if (i >= len && sql[i - 1] !== "'") {
        isUnclosed = true
      }
      tokens.push({
        type: 'string_literal',
        value: strVal,
        raw: sql.slice(startIdx, i),
        line: startLine,
        column: startCol,
        start: startIdx,
        end: i,
        isQuoted: true,
        quoteChar: "'",
        isUnclosed: isUnclosed || undefined,
      })
      continue
    }

    // 5. Quoted Identifiers ("..." or `...` or [...])
    if (char === '"' || char === '`' || (char === '[' && dialect === 'tsql')) {
      const closeChar = char === '[' ? ']' : char
      i++
      col++
      let identVal = ''
      while (i < len && sql[i] !== closeChar && sql[i] !== '\n') {
        identVal += sql[i]
        i++
        col++
      }
      if (i < len && sql[i] === closeChar) {
        i++
        col++
      }
      tokens.push({
        type: 'identifier',
        value: identVal,
        raw: sql.slice(startIdx, i),
        line: startLine,
        column: startCol,
        start: startIdx,
        end: i,
        isQuoted: true,
        quoteChar: char,
      })
      continue
    }

    // 6. Numbers (including floats, scientific notation)
    if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(sql[i + 1] || ''))) {
      let numVal = ''
      while (i < len && /[0-9.eE+-]/.test(sql[i])) {
        // Guard scientific notation signs
        if ((sql[i] === '+' || sql[i] === '-') && !/[eE]/.test(sql[i - 1] || '')) {
          break
        }
        numVal += sql[i]
        i++
        col++
      }
      tokens.push({
        type: 'number_literal',
        value: numVal,
        raw: numVal,
        line: startLine,
        column: startCol,
        start: startIdx,
        end: i,
      })
      continue
    }

    // 7. Multi-character Operators (::, <>, !=, <=, >=, ||, +=, -=)
    const twoChar = sql.slice(i, i + 2)
    if (['::', '<>', '!=', '<=', '>=', '||', ':=', '+=', '-='].includes(twoChar)) {
      tokens.push({
        type: 'operator',
        value: twoChar,
        raw: twoChar,
        line: startLine,
        column: startCol,
        start: startIdx,
        end: i + 2,
      })
      i += 2
      col += 2
      continue
    }

    // 8. Single-character punctuation & operators
    if (['(', ')', ',', ';', '.', ':', '=', '<', '>', '+', '-', '*', '/', '%', '&', '|', '^', '~'].includes(char)) {
      const isPunct = ['(', ')', ',', ';', '.', ':'].includes(char)
      tokens.push({
        type: isPunct ? 'punctuation' : 'operator',
        value: char,
        raw: char,
        line: startLine,
        column: startCol,
        start: startIdx,
        end: i + 1,
      })
      i++
      col++
      continue
    }

    // 9. Identifiers, Keywords, Qualified names (e.g. u.id, orders.total), and Corrupted words (e.g. D\ESC)
    if (/[a-zA-Z0-9_$@#\\]/.test(char)) {
      let word = ''
      let hasBackslash = false

      while (i < len && /[a-zA-Z0-9_$@#\\]/.test(sql[i])) {
        if (sql[i] === '\\') hasBackslash = true
        word += sql[i]
        i++
        col++
      }

      // Check if this token is qualified with dot(s), e.g., table.col or u.id or db.schema.tbl
      const upperWord = word.toUpperCase()

      // Lookahead: is there a function call '(' right after whitespace?
      let lookahead = i
      while (lookahead < len && (sql[lookahead] === ' ' || sql[lookahead] === '\t')) {
        lookahead++
      }
      const isFollowedByParen = sql[lookahead] === '('

      let tokenType: TokenType = 'unknown'

      if (hasBackslash) {
        tokenType = 'corrupted_token'
      } else if (funcSet.has(upperWord)) {
        tokenType = 'function_call'
      } else if (dialectKw.has(upperWord)) {
        tokenType = 'keyword'
      } else if (isFollowedByParen && /^[A-Za-z_][A-Za-z0-9_]*$/.test(word)) {
        tokenType = 'function_call'
      } else {
        tokenType = 'identifier'
      }

      tokens.push({
        type: tokenType,
        value: word,
        raw: word,
        line: startLine,
        column: startCol,
        start: startIdx,
        end: i,
      })
      continue
    }

    // 10. Unknown fallback char
    tokens.push({
      type: 'unknown',
      value: char,
      raw: char,
      line: startLine,
      column: startCol,
      start: startIdx,
      end: i + 1,
    })
    i++
    col++
  }

  // Post-process tokens to identify qualified identifiers (e.g. u . id -> u.id)
  const consolidatedTokens: SqlToken[] = []
  for (let t = 0; t < tokens.length; t++) {
    const current = tokens[t]
    const next1 = tokens[t + 1]
    const next2 = tokens[t + 2]

    if (
      current &&
      (current.type === 'identifier' || current.type === 'keyword') &&
      next1 &&
      next1.value === '.' &&
      next2 &&
      (next2.type === 'identifier' || next2.type === 'operator' && next2.value === '*')
    ) {
      // Qualified identifier like `u.id` or `users.*`
      consolidatedTokens.push({
        type: 'qualified_identifier',
        value: `${current.value}.${next2.value}`,
        raw: `${current.raw}.${next2.raw}`,
        line: current.line,
        column: current.column,
        start: current.start,
        end: next2.end,
        isQualified: true,
      })
      t += 2 // skip dot and member
      continue
    }

    consolidatedTokens.push(current)
  }

  return consolidatedTokens
}

// ---------------------------------------------------------------------------
// LAYER 2: DYNAMIC KEYWORD TYPO DETECTION & CONFIDENCE SCORING
// ---------------------------------------------------------------------------

/**
 * Calculates Damerau-Levenshtein distance (insertions, deletions, substitutions, and adjacent transpositions)
 */
export function getDamerauLevenshteinDistance(source: string, target: string): number {
  const s = source.toUpperCase()
  const t = target.toUpperCase()
  const sLen = s.length
  const tLen = t.length

  if (sLen === 0) return tLen
  if (tLen === 0) return sLen

  // Create matrix
  const d: number[][] = Array.from({ length: sLen + 1 }, () => new Array(tLen + 1).fill(0))

  for (let i = 0; i <= sLen; i++) d[i][0] = i
  for (let j = 0; j <= tLen; j++) d[0][j] = j

  for (let i = 1; i <= sLen; i++) {
    for (let j = 1; j <= tLen; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1
      d[i][j] = Math.min(
        d[i - 1][j] + 1,      // deletion
        d[i][j - 1] + 1,      // insertion
        d[i - 1][j - 1] + cost // substitution
      )

      // Transposition
      if (
        i > 1 &&
        j > 1 &&
        s[i - 1] === t[j - 2] &&
        s[i - 2] === t[j - 1]
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }

  return d[sLen][tLen]
}

export interface TypoCandidate {
  keyword: string
  distance: number
  confidence: number // 0.0 to 1.0
  reason: string
}

/**
 * Dynamically compares an unknown token against vocabulary to find best candidate match
 */
export function findBestKeywordMatch(
  token: string,
  vocab: string[],
  contextClues?: { isFunctionPosition?: boolean; isClauseStart?: boolean; expectedKeyword?: string }
): TypoCandidate | null {
  const clean = token.toUpperCase().replace(/[\\\/]/g, '')
  if (!clean || (clean.length < 2 && !contextClues?.expectedKeyword)) return null

  // Fast-path: if exact match in vocab, not a typo
  if (vocab.includes(clean)) return null

  let bestCandidate: TypoCandidate | null = null
  let highestScore = -1

  for (const candidate of vocab) {
    const candUpper = candidate.toUpperCase()

    // Skip if target is much shorter/longer
    if (Math.abs(candUpper.length - clean.length) > 3) continue

    const dist = getDamerauLevenshteinDistance(clean, candUpper)
    const maxLen = Math.max(clean.length, candUpper.length)

    // Dynamic threshold based on length
    let maxAllowedDist = 1
    if (candUpper.length >= 7) {
      maxAllowedDist = 3
    } else if (candUpper.length >= 4) {
      if (clean.length >= 4 && clean[0] === candUpper[0] && clean[1] === candUpper[1]) {
        maxAllowedDist = 3
      } else {
        maxAllowedDist = 2
      }
    } else if (candUpper.length <= 3) {
      maxAllowedDist = 1
    }

    if (dist > maxAllowedDist) continue

    // Conservative rules for short words (2-3 chars) to avoid false positives on table/column names
    if (candUpper.length <= 3 && dist >= 2 && !contextClues?.expectedKeyword) continue
    if (candUpper.length <= 2 && dist >= 1 && !contextClues?.expectedKeyword) continue

    // Calculate confidence score (0.0 to 1.0)
    let baseConfidence = 1 - dist / maxLen

    // Bonus for matching first or last letter
    if (clean[0] === candUpper[0]) baseConfidence += 0.08
    if (clean.length >= 2 && candUpper.length >= 2 && clean[1] === candUpper[1]) baseConfidence += 0.08
    if (clean[clean.length - 1] === candUpper[candUpper.length - 1]) baseConfidence += 0.05

    // Bonus for adjacent transposition (e.g. SELETC -> SELECT)
    if (dist === 1 && clean.length === candUpper.length) baseConfidence += 0.05

    // Bonus if context explicitly expects this keyword or clause type
    if (contextClues?.expectedKeyword && contextClues.expectedKeyword === candUpper) {
      baseConfidence += 0.15
    }
    if (contextClues?.isFunctionPosition) {
      baseConfidence += 0.15
    }

    // Penalty for pluralized nouns vs singular keywords (e.g. ORDERS vs ORDER, USERS vs USER, GROUPS vs GROUP)
    if (clean === candUpper + 'S' || clean === candUpper + 'ES') {
      baseConfidence -= 0.40
    }

    // Cap confidence between 0 and 1
    const finalConfidence = Math.min(1.0, Math.max(0.0, baseConfidence))

    if (finalConfidence > highestScore) {
      highestScore = finalConfidence
      bestCandidate = {
        keyword: candidate,
        distance: dist,
        confidence: finalConfidence,
        reason: `Fuzzy edit distance ${dist} (confidence: ${(finalConfidence * 100).toFixed(0)}%)`,
      }
    }
  }

  return highestScore >= 0.70 ? bestCandidate : null
}

// ---------------------------------------------------------------------------
// LAYER 3 & 4: CONTEXT-AWARE & STRUCTURAL VALIDATION ENGINE
// ---------------------------------------------------------------------------

export function validateSqlCode(sql: string, dialect: SqlDialect = 'sql'): SqlValidationResult {
  const errors: SqlValidationError[] = []
  const warnings: SqlValidationError[] = []
  const info: SqlValidationError[] = []

  const trimmed = sql.trim()
  const lines = sql.split('\n')

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

  // Tokenize the SQL input into structured stream
  const tokens = tokenizeSql(sql, dialect)

  // 1. Bracket, Parentheses, Quotes, and Token-level analysis
  let parenDepth = 0
  let parenOpenLine = 1
  let squareDepth = 0
  let squareOpenLine = 1

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]

    // Check unclosed string literals
    if (tok.type === 'string_literal' && tok.isUnclosed) {
      errors.push({
        line: tok.line,
        column: tok.column,
        message: `Syntax error: Unclosed string literal starting on line ${tok.line}`,
        severity: 'error',
        suggestion: "Add a closing single quote \"'\" to properly terminate the string literal.",
      })
    }

    // Check corrupted tokens with backslashes
    if (tok.type === 'corrupted_token' || (tok.value.includes('\\') && !tok.isQuoted)) {
      const cleanVal = tok.value.replace(/[\\\/]/g, '')
      const match = findBestKeywordMatch(cleanVal, STANDARD_SQL_KEYWORDS)
      const suggestion = match ? `Did you mean '${match.keyword}'?` : `Remove invalid backslash '\\' from '${tok.value}'.`

      errors.push({
        line: tok.line,
        column: tok.column,
        message: `Syntax error: Invalid backslash character '\\' found in token '${tok.value}'`,
        severity: 'error',
        suggestion,
      })
    }

    // Check parentheses
    if (tok.value === '(') {
      if (parenDepth === 0) parenOpenLine = tok.line
      parenDepth++
    } else if (tok.value === ')') {
      parenDepth--
      if (parenDepth < 0) {
        errors.push({
          line: tok.line,
          column: tok.column,
          message: `Unexpected closing parenthesis ')' at line ${tok.line}`,
          severity: 'error',
          suggestion: "Remove extra closing parenthesis or add an opening '(' earlier.",
        })
        parenDepth = 0
      }
    } else if (tok.value === '[') {
      if (squareDepth === 0) squareOpenLine = tok.line
      squareDepth++
    } else if (tok.value === ']') {
      squareDepth--
      if (squareDepth < 0) {
        errors.push({
          line: tok.line,
          column: tok.column,
          message: `Unexpected closing bracket ']' at line ${tok.line}`,
          severity: 'error',
          suggestion: "Remove extra closing bracket ']'.",
        })
        squareDepth = 0
      }
    }
  }

  // Unclosed structures check
  if (parenDepth > 0) {
    errors.push({
      line: parenOpenLine,
      message: `Unclosed parenthesis '(' opened around line ${parenOpenLine}`,
      severity: 'error',
      suggestion: `Add ${parenDepth} closing parenthesis ')' to close opened subquery or expression.`,
    })
  }
  if (squareDepth > 0) {
    errors.push({
      line: squareOpenLine,
      message: `Unclosed bracket '[' opened around line ${squareOpenLine}`,
      severity: 'error',
      suggestion: "Add closing bracket ']'.",
    })
  }

  // 2. Trailing Colon Check (e.g. "LIMIT 50:" or "DESC:")
  lines.forEach((lineStr, idx) => {
    const lineNum = idx + 1
    const codePart = lineStr.split('--')[0].trim()
    if (!codePart) return

    if (/(?<!:):(?!\:)\s*$/.test(codePart)) {
      errors.push({
        line: lineNum,
        message: `Syntax error: Invalid trailing colon ':' found at line ${lineNum}`,
        severity: 'error',
        suggestion: "SQL statements do not terminate with a colon ':'. Use a semicolon ';' or remove it.",
      })
    }

    // Check missing comparison operator and unclosed quote in condition (e.g. "u.status 'active AND ...")
    const missingOpQuoteMatch = codePart.match(/\b([a-zA-Z0-9_.]+)\s+'([a-zA-Z0-9_ -]+?)\s+(AND|OR)\b/i)
    if (missingOpQuoteMatch) {
      const col = missingOpQuoteMatch[1]
      const val = missingOpQuoteMatch[2]
      const op = missingOpQuoteMatch[3]
      const upperCol = col.toUpperCase()
      if (!['IN', 'LIKE', 'ILIKE', 'IS', 'NOT', 'BETWEEN', 'AS'].includes(upperCol)) {
        errors.push({
          line: lineNum,
          message: `Syntax error: Missing comparison operator and closing quote in condition '${col} '${val}'`,
          severity: 'error',
          suggestion: `Did you mean '${col} = '${val}' ${op}'?`,
        })
      }
    }

    // Check missing comparison operator in HAVING clause before number literal (e.g. "HAVING COUNT(oid)  2")
    const havingMissingOpMatch = codePart.match(/\bHAVING\s+([A-Za-z0-9_.]+(?:\([^)]*\))?)\s+([0-9]+)\b/i)
    if (havingMissingOpMatch) {
      errors.push({
        line: lineNum,
        message: `Syntax error: Missing comparison operator in HAVING clause before '${havingMissingOpMatch[2]}'`,
        severity: 'error',
        suggestion: `Did you mean 'HAVING ${havingMissingOpMatch[1]} > ${havingMissingOpMatch[2]}'?`,
      })
    }
  })

  // 3. Clause Breakdown & Statement Type Identification
  const majorKeywordsInQuery: string[] = []
  tokens.forEach((t) => {
    if (t.type === 'keyword') majorKeywordsInQuery.push(t.value.toUpperCase())
  })

  let statementType = 'UNKNOWN'
  if (majorKeywordsInQuery.includes('SELECT')) statementType = 'SELECT'
  else if (majorKeywordsInQuery.includes('INSERT')) statementType = 'INSERT'
  else if (majorKeywordsInQuery.includes('UPDATE')) statementType = 'UPDATE'
  else if (majorKeywordsInQuery.includes('DELETE')) statementType = 'DELETE'
  else if (majorKeywordsInQuery.includes('CREATE')) statementType = 'CREATE'
  else if (majorKeywordsInQuery.includes('ALTER')) statementType = 'ALTER'
  else if (majorKeywordsInQuery.includes('DROP')) statementType = 'DROP'

  const clauseBreakdown = {
    select: majorKeywordsInQuery.includes('SELECT'),
    from: majorKeywordsInQuery.includes('FROM'),
    join: majorKeywordsInQuery.includes('JOIN'),
    where: majorKeywordsInQuery.includes('WHERE'),
    groupBy: majorKeywordsInQuery.includes('GROUP') && majorKeywordsInQuery.includes('BY'),
    having: majorKeywordsInQuery.includes('HAVING'),
    orderBy: majorKeywordsInQuery.includes('ORDER') && majorKeywordsInQuery.includes('BY'),
    limit: majorKeywordsInQuery.includes('LIMIT') || majorKeywordsInQuery.includes('TOP'),
  }

  // 4. Dynamic Context-Aware Keyword Typo & Grammar Checking
  // Extract qualified columns in query (e.g. u.name, o.amount) for missing-dot checks
  const qualifiedColumnMap = new Map<string, { alias: string; col: string; line: number }>()
  tokens.forEach((t) => {
    if (t.type === 'qualified_identifier' || t.value.includes('.')) {
      const parts = t.value.split('.')
      if (parts.length === 2) {
        const joint = (parts[0] + parts[1]).toLowerCase()
        qualifiedColumnMap.set(joint, { alias: parts[0], col: parts[1], line: t.line })
      }
    }
  })

  const reportedTokenIndices = new Set<number>()

  for (let i = 0; i < tokens.length; i++) {
    if (reportedTokenIndices.has(i)) continue

    const current = tokens[i]
    const prev = tokens[i - 1]
    const prev2 = tokens[i - 2]
    const next = tokens[i + 1]
    const next2 = tokens[i + 2]

    // Skip string literals, comments, numbers, quoted identifiers, and qualified tokens
    if (
      current.type === 'string_literal' ||
      current.type === 'comment' ||
      current.type === 'number_literal' ||
      current.isQuoted ||
      current.isQualified
    ) {
      continue
    }

    const upperVal = current.value.toUpperCase()

    // Missing dot check (e.g., 'uname' when 'u.name' exists in query)
    if (current.type === 'identifier' && !current.value.includes('.')) {
      const qualMatch = qualifiedColumnMap.get(current.value.toLowerCase())
      if (qualMatch) {
        errors.push({
          line: current.line,
          column: current.column,
          message: `Missing dot '.' in column reference '${current.value}' on line ${current.line}`,
          severity: 'error',
          suggestion: `Did you mean '${qualMatch.alias}.${qualMatch.col}'?`,
        })
        reportedTokenIndices.add(i)
        continue
      }
    }

    // Guard: Common user identifiers (orders, users, customer, etc.) should not be flagged
    if (COMMON_USER_IDENTIFIERS.has(upperVal)) {
      // Exception: If preceding token is ORDER or GROUP and current token is not BY, or if it's start of statement
      if (prev && (prev.value.toUpperCase() === 'ORDER' || prev.value.toUpperCase() === 'GROUP')) {
        // e.g. "ORDER price" or "GROUP category" -> missing "BY"
        if (upperVal !== 'BY') {
          errors.push({
            line: current.line,
            column: current.column,
            message: `Syntax error: Missing 'BY' keyword after '${prev.value}' before '${current.value}'`,
            severity: 'error',
            suggestion: `Did you mean '${prev.value} BY ${current.value}'?`,
          })
        }
      }
      continue
    }

    // 4a. Function Call Typo check (e.g. SM(o.amount) or COUN(o.id) or OUNT(oid))
    if (current.type === 'identifier' || current.type === 'function_call') {
      const isFnCall = current.type === 'function_call' || (next && next.value === '(')
      if (isFnCall) {
        const fnMatch = findBestKeywordMatch(upperVal, COMMON_SQL_FUNCTIONS, { isFunctionPosition: true })
        if (fnMatch && fnMatch.confidence >= 0.70 && fnMatch.keyword !== upperVal) {
          errors.push({
            line: current.line,
            column: current.column,
            message: `Misspelled SQL function '${current.value}(...)' on line ${current.line}`,
            severity: 'error',
            suggestion: `Did you mean '${fnMatch.keyword}(...)'?`,
          })
          reportedTokenIndices.add(i)
          continue
        }
      } else if (next && next.value === ')' && (!prev || prev.value !== '(')) {
        // e.g. "COTod)" where opening paren was omitted
        const fnMatch = findBestKeywordMatch(upperVal, COMMON_SQL_FUNCTIONS, { isFunctionPosition: true })
        if (fnMatch && fnMatch.confidence >= 0.70 && fnMatch.keyword !== upperVal) {
          errors.push({
            line: current.line,
            column: current.column,
            message: `Misspelled function name '${current.value}' before ')' on line ${current.line}`,
            severity: 'error',
            suggestion: `Did you mean '${fnMatch.keyword}(...)'?`,
          })
          reportedTokenIndices.add(i)
          continue
        }
      }
    }

    // 4b. Check start of query for statement keyword typo (e.g., "SEELCT id", "SELEC id", "SLCT id")
    if (i === 0 || (prev && prev.value === ';')) {
      if (current.type === 'identifier') {
        const stmtMatch = findBestKeywordMatch(upperVal, ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'WITH'], {
          isClauseStart: true,
        })
        if (stmtMatch && stmtMatch.confidence >= 0.75) {
          errors.push({
            line: current.line,
            column: current.column,
            message: `Misspelled statement keyword '${current.value}' on line ${current.line}`,
            severity: 'error',
            suggestion: `Did you mean '${stmtMatch.keyword}'?`,
          })
          reportedTokenIndices.add(i)
          continue
        }
      }
    }

    // 4c. Check JOIN clause typos (e.g., "LEFT JOI", "JOI", "LET JOIN", "INNER JOINT")
    if (['LEFT', 'RIGHT', 'INNER', 'OUTER', 'CROSS', 'FULL'].includes(upperVal)) {
      if (next && next.type === 'identifier') {
        const joinMatch = findBestKeywordMatch(next.value.toUpperCase(), ['JOIN'], { expectedKeyword: 'JOIN' })
        if (joinMatch && joinMatch.confidence >= 0.70) {
          errors.push({
            line: next.line,
            column: next.column,
            message: `Misspelled JOIN keyword '${next.value}' in '${current.value} ${next.value}'`,
            severity: 'error',
            suggestion: `Did you mean '${current.value} JOIN'?`,
          })
          reportedTokenIndices.add(i)
          reportedTokenIndices.add(i + 1)
          continue
        }
      }
    }

    // 4d. Check single word typo for JOIN (e.g. "JOI orders o ON ...")
    if (current.type === 'identifier' && (upperVal.startsWith('JOI') || upperVal.startsWith('JON') || upperVal === 'JIN' || upperVal === 'JIO')) {
      const joinMatch = findBestKeywordMatch(upperVal, ['JOIN'], { expectedKeyword: 'JOIN' })
      if (joinMatch && joinMatch.confidence >= 0.80) {
        errors.push({
          line: current.line,
          column: current.column,
          message: `Misspelled SQL keyword '${current.value}' on line ${current.line}`,
          severity: 'error',
          suggestion: `Did you mean 'JOIN'?`,
        })
        reportedTokenIndices.add(i)
        continue
      }
    }

    // 4e. Check "LET" typo for "LEFT" (e.g., "LET JOIN")
    if (upperVal === 'LET' && next && next.value.toUpperCase() === 'JOIN') {
      errors.push({
        line: current.line,
        column: current.column,
        message: `Misspelled JOIN type 'LET' on line ${current.line}`,
        severity: 'error',
        suggestion: "Did you mean 'LEFT JOIN'?",
      })
      reportedTokenIndices.add(i)
      continue
    }

    // 4f. Check ORDER / GROUP without BY or with typo in BY (e.g. "ORDER BY", "ORDR BY", "GROP Y")
    if (['ORDER', 'GROUP'].includes(upperVal)) {
      if (next && next.type === 'identifier' && next.value.toUpperCase() !== 'BY') {
        const byMatch = findBestKeywordMatch(next.value.toUpperCase(), ['BY'], { expectedKeyword: 'BY' })
        if (byMatch && byMatch.confidence >= 0.70) {
          errors.push({
            line: next.line,
            column: next.column,
            message: `Misspelled clause keyword '${next.value}' in '${current.value} ${next.value}'`,
            severity: 'error',
            suggestion: `Did you mean '${current.value} BY'?`,
          })
          reportedTokenIndices.add(i)
          reportedTokenIndices.add(i + 1)
          continue
        } else if (!COMMON_USER_IDENTIFIERS.has(next.value.toUpperCase())) {
          errors.push({
            line: current.line,
            column: current.column,
            message: `Missing 'BY' keyword after '${current.value}'`,
            severity: 'error',
            suggestion: `Did you mean '${current.value} BY ${next.value}'?`,
          })
          reportedTokenIndices.add(i)
          continue
        }
      }
    }

    // 4g. Check sort direction typos in ORDER BY (e.g. "DEC", "DES", "ASCC", "D\\ESC")
    if (prev2 && prev2.value.toUpperCase() === 'ORDER' && prev && prev.value.toUpperCase() === 'BY') {
      // Find following sort direction tokens
      let k = i
      while (k < tokens.length && tokens[k].value !== ';' && tokens[k].value !== 'LIMIT' && tokens[k].value !== 'OFFSET') {
        const tokK = tokens[k]
        const upK = tokK.value.toUpperCase()
        if (tokK.type === 'identifier' && !['NULLS', 'FIRST', 'LAST'].includes(upK)) {
          const dirMatch = findBestKeywordMatch(upK, ['DESC', 'ASC'])
          if (dirMatch && dirMatch.confidence >= 0.75) {
            errors.push({
              line: tokK.line,
              column: tokK.column,
              message: `Misspelled sort direction '${tokK.value}' in ORDER BY clause`,
              severity: 'error',
              suggestion: `Did you mean '${dirMatch.keyword}'?`,
            })
            reportedTokenIndices.add(k)
          }
        }
        k++
      }
    }

    // 4h. Check clause-transition keyword typos (e.g. "SELECT id, name FORM users", "WHEER age > 18", "GROP Y")
    if (current.type === 'identifier') {
      // Clause keyword fuzzy match
      const match = findBestKeywordMatch(upperVal, ['FROM', 'WHERE', 'HAVING', 'GROUP', 'ORDER', 'LIMIT', 'JOIN', 'UNION'])
      if (match && match.confidence >= 0.72) {
        // If it matched GROUP or ORDER, check if next token is 'BY' or typo of 'BY' (e.g. 'Y')
        if (['GROUP', 'ORDER'].includes(match.keyword) && next) {
          const byMatch = findBestKeywordMatch(next.value.toUpperCase(), ['BY'], { expectedKeyword: 'BY' })
          if (next.value.toUpperCase() === 'BY' || byMatch) {
            errors.push({
              line: current.line,
              column: current.column,
              message: `Misspelled SQL clause keyword '${current.value} ${next.value}' on line ${current.line}`,
              severity: 'error',
              suggestion: `Did you mean '${match.keyword} BY'?`,
            })
            reportedTokenIndices.add(i)
            reportedTokenIndices.add(i + 1)
            continue
          }
        }

        const isAfterAliasOrColumn = prev && (prev.type === 'identifier' || prev.type === 'qualified_identifier' || prev.value === ')' || prev.type === 'string_literal' || prev.type === 'number_literal')
        const isBeforeIdentifierOrCondition = next && (next.type === 'identifier' || next.type === 'qualified_identifier')

        if (isAfterAliasOrColumn && isBeforeIdentifierOrCondition) {
          errors.push({
            line: current.line,
            column: current.column,
            message: `Misspelled SQL keyword '${current.value}' on line ${current.line}`,
            severity: 'error',
            suggestion: `Did you mean '${match.keyword}'?`,
          })
          reportedTokenIndices.add(i)
          continue
        }
      }

      // General fuzzy check against major keywords for unknown identifiers that are NOT common column names
      if (!COMMON_USER_IDENTIFIERS.has(upperVal) && upperVal.length >= 4) {
        const generalMatch = findBestKeywordMatch(upperVal, STANDARD_SQL_KEYWORDS)
        if (generalMatch && generalMatch.confidence >= 0.85) {
          // Verify it's not preceded by AS or FROM/JOIN/INTO (where valid table/column is expected)
          const isPrecededByDefKeyword = prev && ['AS', 'FROM', 'JOIN', 'INTO', 'UPDATE', 'TABLE'].includes(prev.value.toUpperCase())
          if (!isPrecededByDefKeyword) {
            errors.push({
              line: current.line,
              column: current.column,
              message: `Potentially misspelled SQL keyword '${current.value}' on line ${current.line}`,
              severity: 'error',
              suggestion: `Did you mean '${generalMatch.keyword}'?`,
            })
            reportedTokenIndices.add(i)
          }
        }
      }
    }

    // 4i. Missing comma between adjacent SELECT expressions (e.g. "SELECT id name FROM users")
    // When inside SELECT clause before FROM: if two column expressions are adjacent without a comma and without "AS"
    if (
      statementType === 'SELECT' &&
      current.type === 'identifier' &&
      next &&
      next.type === 'identifier' &&
      !['AS', 'FROM', 'JOIN', 'WHERE', 'GROUP', 'ORDER', 'HAVING', 'LIMIT'].includes(next.value.toUpperCase()) &&
      prev &&
      prev.value.toUpperCase() === 'SELECT'
    ) {
      // e.g. "SELECT id name FROM"
      const afterNext = tokens[i + 2]
      if (afterNext && ['FROM', 'WHERE', ','].includes(afterNext.value.toUpperCase())) {
        errors.push({
          line: current.line,
          column: current.column,
          message: `Syntax error: Missing comma or 'AS' alias keyword between '${current.value}' and '${next.value}'`,
          severity: 'error',
          suggestion: `Did you mean '${current.value}, ${next.value}' or '${current.value} AS ${next.value}'?`,
        })
      }
    }
  }

  // 5. Comma placements (duplicate commas, trailing commas before keywords)
  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i]
    const next = tokens[i + 1]

    if (current.value === ',' && next && next.value === ',') {
      errors.push({
        line: current.line,
        column: current.column,
        message: `Syntax error: Duplicate comma found on line ${current.line}`,
        severity: 'error',
        suggestion: 'Remove the duplicate comma.',
      })
    }

    if (current.value === ',' && next && ['FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', ')'].includes(next.value.toUpperCase())) {
      errors.push({
        line: current.line,
        column: current.column,
        message: `Syntax error: Trailing comma before '${next.value}' keyword`,
        severity: 'error',
        suggestion: 'Remove the trailing comma before the clause keyword.',
      })
    }
  }

  // 6. Statement Structure & Risk Rules
  if (statementType === 'UPDATE') {
    if (!clauseBreakdown.where) {
      warnings.push({
        line: 1,
        message: 'DANGEROUS QUERY: UPDATE statement without a WHERE clause!',
        severity: 'warning',
        suggestion: 'Executing this statement will overwrite data across ALL rows in the table. Add a WHERE clause to restrict changes.',
      })
    }
    if (!majorKeywordsInQuery.includes('SET')) {
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
        suggestion: 'Executing this statement will permanently wipe ALL rows from the target table. Add a WHERE clause.',
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
    if (!majorKeywordsInQuery.includes('INTO')) {
      errors.push({
        line: 1,
        message: 'Syntax Error: INSERT statement missing INTO keyword',
        severity: 'error',
        suggestion: 'Use INSERT INTO table_name (...)',
      })
    }
    if (!majorKeywordsInQuery.includes('VALUES') && !clauseBreakdown.select) {
      errors.push({
        line: 1,
        message: 'Syntax Error: INSERT statement missing VALUES or SELECT subquery',
        severity: 'error',
        suggestion: 'Add VALUES (...) or a valid SELECT subquery.',
      })
    }
  }

  if (statementType === 'SELECT') {
    if (!clauseBreakdown.from && !/\bSELECT\s+[0-9'"]/.test(sql.toUpperCase()) && !/\bSELECT\s+NOW\(|SELECT\s+CURRENT_/i.test(sql)) {
      warnings.push({
        line: 1,
        message: 'SELECT statement has no FROM clause',
        severity: 'warning',
        suggestion: 'If retrieving table records, specify FROM table_name.',
      })
    }

    if (clauseBreakdown.join && !/\b(ON|USING)\b/i.test(sql) && !/\bCROSS\s+JOIN\b/i.test(sql) && !/\bNATURAL\s+JOIN\b/i.test(sql)) {
      errors.push({
        line: 1,
        message: 'Syntax Error: JOIN clause without ON or USING join condition',
        severity: 'error',
        suggestion: 'Add ON tableA.id = tableB.foreign_id or USING (id).',
      })
    }
  }

  // 7. Dialect Parser Verification
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
      const lineMatch = /line\s+(\d+)(?:\s+column\s+(\d+))?/i.exec(errMsg)
      const errLine = lineMatch ? parseInt(lineMatch[1], 10) : 1
      const errCol = lineMatch && lineMatch[2] ? parseInt(lineMatch[2], 10) : undefined

      errors.push({
        line: errLine,
        column: errCol,
        message: `Dialect (${dialect.toUpperCase()}) Parser Error: ${errMsg}`,
        severity: 'error',
        suggestion: `Check SQL syntax near line ${errLine}. You can click "Auto Fix" to correct typos, or select a different database dialect.`,
      })
    }
  }

  // Extract detected table names
  const tablesDetected: string[] = []
  const tableRegex = /\b(?:FROM|JOIN|INTO|UPDATE|TABLE)\s+([`"']?[a-zA-Z0-9_.-]+[`"']?)/gi
  let match
  while ((match = tableRegex.exec(sql)) !== null) {
    const tbl = match[1].replace(/[`"']/g, '')
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

// ---------------------------------------------------------------------------
// LAYER 6: CONTEXTUAL AUTO-FIX WITH POST-VALIDATION
// ---------------------------------------------------------------------------

export function autoFixSqlCode(sql: string, dialect: SqlDialect = 'sql'): {
  fixedSql: string
  fixCount: number
  fixesApplied: string[]
} {
  const fixesApplied: string[] = []
  let fixCount = 0

  let currentSql = sql

  // ---------------------------------------------------------------------------
  // PHASE 1: Pre-tokenization syntax & structural repair
  // ---------------------------------------------------------------------------

  // 1a. Missing operator and closing quote in conditions: u.status 'active AND -> u.status = 'active' AND
  const condQuoteRegex = /\b([a-zA-Z0-9_.]+)\s+'([a-zA-Z0-9_ -]+?)\s+(AND|OR)\b/gi
  currentSql = currentSql.replace(condQuoteRegex, (m, col, val, op) => {
    const upperCol = col.toUpperCase()
    if (['IN', 'LIKE', 'ILIKE', 'IS', 'NOT', 'BETWEEN', 'AS'].includes(upperCol)) return m
    fixesApplied.push(`Added missing '=' operator and closing quote in condition: ${col} = '${val}' ${op}`)
    fixCount++
    return `${col} = '${val}' ${op}`
  })

  // 1b. Missing operator with closed quotes: u.status 'active' AND -> u.status = 'active' AND
  const condClosedQuoteRegex = /\b([a-zA-Z0-9_.]+)\s+('([^'\\]|\\.)*')\s+(AND|OR|WHERE|HAVING|ORDER|GROUP|LIMIT)\b/gi
  currentSql = currentSql.replace(condClosedQuoteRegex, (m, col, val, op) => {
    const upperCol = col.toUpperCase()
    if (['IN', 'LIKE', 'ILIKE', 'IS', 'NOT', 'BETWEEN', 'AS', 'CASE', 'WHEN', 'THEN', 'ELSE'].includes(upperCol)) return m
    fixesApplied.push(`Added missing '=' operator: ${col} = ${val} ${op}`)
    fixCount++
    return `${col} = ${val} ${op}`
  })

  // 1c. Missing comparison operator in HAVING or WHERE before number: HAVING COUNT(...)  2 -> HAVING COUNT(...) > 2
  const havingMissingOpRegex = /\bHAVING\s+([A-Za-z0-9_.]+(?:\([^)]*\))?)\s+([0-9]+)\b/gi
  currentSql = currentSql.replace(havingMissingOpRegex, (m, expr, val) => {
    fixesApplied.push(`Added missing comparison operator '>' in HAVING clause: HAVING ${expr} > ${val}`)
    fixCount++
    return `HAVING ${expr} > ${val}`
  })

  // 1d. Missing dot in column references (e.g. oid when o.id exists in query)
  const qualCols: { full: string; alias: string; col: string; joint: string }[] = []
  const qualRegex = /\b([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\b/g
  let qm: RegExpExecArray | null
  while ((qm = qualRegex.exec(currentSql)) !== null) {
    qualCols.push({ full: qm[0], alias: qm[1], col: qm[2], joint: (qm[1] + qm[2]).toLowerCase() })
  }
  qualCols.forEach((qc) => {
    const jointRegex = new RegExp(`\\b(${qc.joint})\\b(?![.])`, 'gi')
    currentSql = currentSql.replace(jointRegex, (match) => {
      fixesApplied.push(`Restored missing dot: '${match}' -> '${qc.full}'`)
      fixCount++
      return qc.full
    })
  })

  // 1e. Check unclosed single quotes on individual lines when followed by a SQL clause
  const lines = currentSql.split('\n')
  const SQL_CLAUSE_START = /^\s*(SELECT|FROM|WHERE|GROUP|HAVING|ORDER|LIMIT|JOIN|LEFT|RIGHT|INNER|OUTER|UNION|INSERT|UPDATE|DELETE|SET|VALUES)\b/i
  for (let l = 0; l < lines.length; l++) {
    const lineStr = lines[l]
    const quoteMatches = lineStr.match(/'/g)
    if (quoteMatches && quoteMatches.length % 2 !== 0) {
      if (l < lines.length - 1 && SQL_CLAUSE_START.test(lines[l + 1])) {
        lines[l] = lineStr + "'"
        fixesApplied.push(`Closed unclosed string quote at line ${l + 1}`)
        fixCount++
      }
    }
  }
  currentSql = lines.join('\n')

  // ---------------------------------------------------------------------------
  // PHASE 2: Token-level keyword, function, and typo corrections
  // ---------------------------------------------------------------------------

  const initialTokens = tokenizeSql(currentSql, dialect)
  let fixed = currentSql
  let offsetShift = 0

  // All valid standard keywords for dynamic matching
  const majorVocabulary = [
    'SELECT', 'FROM', 'WHERE', 'GROUP', 'BY', 'HAVING', 'ORDER', 'LIMIT', 'OFFSET',
    'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'CROSS', 'FULL', 'INSERT', 'INTO',
    'UPDATE', 'SET', 'DELETE', 'VALUES', 'DISTINCT', 'BETWEEN', 'DESC', 'ASC', 'AS', 'ON'
  ]
  const dialectKw = new Set([
    ...STANDARD_SQL_KEYWORDS,
    ...(DIALECT_SPECIFIC_KEYWORDS[dialect] || []),
  ])
  const funcSet = new Set(COMMON_SQL_FUNCTIONS)

  let inOrderBy = false

  for (let i = 0; i < initialTokens.length; i++) {
    const tok = initialTokens[i]
    const prev = initialTokens[i - 1]
    const prev2 = initialTokens[i - 2]
    const next = initialTokens[i + 1]

    if (tok.type === 'keyword') {
      const kw = tok.value.toUpperCase()
      if (kw === 'ORDER') inOrderBy = true
      else if (['LIMIT', 'OFFSET', 'UNION', ';', 'SELECT'].includes(kw)) inOrderBy = false
    }

    // Skip string literals, comments, numbers, quoted identifiers, and qualified tokens
    if (
      tok.type === 'string_literal' ||
      tok.type === 'comment' ||
      tok.type === 'number_literal' ||
      tok.isQuoted ||
      tok.isQualified
    ) {
      continue
    }

    // 1. Corrupted token with backslash (e.g. D\ESC, SEL\ECT, A\SC)
    if (tok.type === 'corrupted_token' || (tok.value.includes('\\') && !tok.isQuoted)) {
      const cleanVal = tok.value.replace(/[\\\/]/g, '').toUpperCase()
      const match = findBestKeywordMatch(cleanVal, STANDARD_SQL_KEYWORDS)
      const replacement = match ? match.keyword : cleanVal
      const startInFixed = tok.start + offsetShift
      const endInFixed = tok.end + offsetShift

      fixed = fixed.slice(0, startInFixed) + replacement + fixed.slice(endInFixed)
      offsetShift += replacement.length - tok.value.length
      fixesApplied.push(`Corrected corrupted token '${tok.value}' -> '${replacement}'`)
      fixCount++
      continue
    }

    // 2. Trailing Colon at end of query or after statement
    if (tok.value === ':' && (i === initialTokens.length - 1 || (next && next.type === 'comment'))) {
      const startInFixed = tok.start + offsetShift
      const endInFixed = tok.end + offsetShift
      fixed = fixed.slice(0, startInFixed) + ';' + fixed.slice(endInFixed)
      offsetShift += 1 - tok.value.length
      fixesApplied.push("Replaced trailing colon ':' with ';'")
      fixCount++
      continue
    }

    // 3. Dynamic Typo Detection on Identifiers and Function Calls
    if (tok.type === 'identifier' || tok.type === 'function_call') {
      const upperVal = tok.value.toUpperCase()

      // Guard if it's already a valid dialect keyword or built-in function
      if (dialectKw.has(upperVal) || funcSet.has(upperVal)) {
        continue
      }

      // Guard against common user column/table identifiers unless specifically in clause or sort position
      if (COMMON_USER_IDENTIFIERS.has(upperVal) && !inOrderBy) {
        continue
      }

      // Check if preceded by AS, FROM, JOIN, INTO, UPDATE, TABLE (where valid table/alias identifiers belong)
      const isPrecededByDefKeyword = prev && ['AS', 'FROM', 'JOIN', 'INTO', 'UPDATE', 'TABLE'].includes(prev.value.toUpperCase())
      if (isPrecededByDefKeyword) {
        continue
      }

      // Check context clues
      let contextClues: { isFunctionPosition?: boolean; isClauseStart?: boolean; expectedKeyword?: string } = {}
      const prevUpper = prev?.value?.toUpperCase()
      const isGroupOrOrder = Boolean(
        prevUpper &&
          ['ORDER', 'GROUP', 'ORDRE', 'GROP', 'GROUPE'].includes(prevUpper)
      )

      const isFn = tok.type === 'function_call' || (next && next.value === '(')

      if (isFn) {
        contextClues.isFunctionPosition = true
      } else if (i === 0 || (prev && prev.value === ';')) {
        contextClues.isClauseStart = true
      } else if (prev && ['LEFT', 'RIGHT', 'INNER', 'OUTER', 'CROSS', 'FULL'].includes(prev.value.toUpperCase())) {
        contextClues.expectedKeyword = 'JOIN'
      } else if (isGroupOrOrder) {
        contextClues.expectedKeyword = 'BY'
      } else if (inOrderBy) {
        if (upperVal.startsWith('D')) {
          contextClues.expectedKeyword = 'DESC'
        } else if (upperVal.startsWith('A')) {
          contextClues.expectedKeyword = 'ASC'
        }
      }

      const targetVocab = contextClues.isFunctionPosition
        ? COMMON_SQL_FUNCTIONS
        : inOrderBy
        ? ['DESC', 'ASC', ...majorVocabulary]
        : majorVocabulary

      const match = findBestKeywordMatch(upperVal, targetVocab, contextClues)

      // Dynamic confidence threshold
      const requiredConfidence = contextClues.expectedKeyword
        ? 0.65
        : contextClues.isFunctionPosition || inOrderBy
        ? 0.70
        : contextClues.isClauseStart
        ? 0.72
        : 0.76

      if (match && match.confidence >= requiredConfidence && match.keyword !== upperVal) {
        const startInFixed = tok.start + offsetShift
        const endInFixed = tok.end + offsetShift
        const replacement = match.keyword

        fixed = fixed.slice(0, startInFixed) + replacement + fixed.slice(endInFixed)
        offsetShift += replacement.length - tok.value.length

        fixesApplied.push(`Corrected '${tok.value}' -> '${match.keyword}'`)
        fixCount++
      }
    }
  }

  // 4. Token-safe structural cleanup (trailing commas before keywords outside strings)
  // Re-tokenize fixed version to check trailing comma and missing BY
  const pass2Tokens = tokenizeSql(fixed, dialect)
  let pass2Shift = 0

  for (let j = 0; j < pass2Tokens.length; j++) {
    const tok = pass2Tokens[j]
    const next = pass2Tokens[j + 1]

    if (tok.value === ',' && next && next.type === 'keyword' && ['FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT', 'JOIN'].includes(next.value.toUpperCase())) {
      const startInFixed = tok.start + pass2Shift
      const endInFixed = tok.end + pass2Shift
      fixed = fixed.slice(0, startInFixed) + fixed.slice(endInFixed)
      pass2Shift -= tok.value.length
      fixesApplied.push('Removed trailing comma before clause keyword')
      fixCount++
    }
  }

  // 5. Parentheses & Brackets Balance Repair (e.g. IN (18, 21, 25, 30 missing closing paren before ORDER BY or ;)
  const pass3Tokens = tokenizeSql(fixed, dialect)
  interface ParenRecord {
    start: number
    end: number
    line: number
    isSubquery: boolean
    keywordBefore?: string
  }
  const parenStack: ParenRecord[] = []
  const parenFixOperations: { index: number; removeLength: number; insertText: string; desc: string }[] = []

  const CLAUSE_TERMINATORS = new Set([
    'ORDER', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'FETCH'
  ])

  for (let k = 0; k < pass3Tokens.length; k++) {
    const tok = pass3Tokens[k]
    const prevTok = pass3Tokens[k - 1]
    const nextTok = pass3Tokens[k + 1]

    if (tok.type === 'string_literal' || tok.type === 'comment') {
      continue
    }

    if (tok.value === '(') {
      const isSub = nextTok && nextTok.type === 'keyword' && nextTok.value.toUpperCase() === 'SELECT'
      parenStack.push({
        start: tok.start,
        end: tok.end,
        line: tok.line,
        isSubquery: Boolean(isSub),
        keywordBefore: prevTok?.value?.toUpperCase(),
      })
    } else if (tok.value === ')') {
      if (parenStack.length > 0) {
        parenStack.pop()
      } else {
        // Unmatched extra closing parenthesis
        parenFixOperations.push({
          index: tok.start,
          removeLength: tok.end - tok.start,
          insertText: '',
          desc: `Removed unmatched extra closing parenthesis ')' at line ${tok.line}`,
        })
      }
    } else if (
      tok.value === ';' ||
      (tok.type === 'keyword' && CLAUSE_TERMINATORS.has(tok.value.toUpperCase()))
    ) {
      if (parenStack.length > 0) {
        // Semicolon closes all unclosed parens. Clause terminators like ORDER/GROUP close non-subquery parens.
        let countToClose = 0
        if (tok.value === ';') {
          countToClose = parenStack.length
          parenStack.length = 0
        } else {
          while (parenStack.length > 0 && !parenStack[parenStack.length - 1].isSubquery) {
            parenStack.pop()
            countToClose++
          }
        }

        if (countToClose > 0) {
          const insertPos = prevTok ? prevTok.end : tok.start
          parenFixOperations.push({
            index: insertPos,
            removeLength: 0,
            insertText: ')'.repeat(countToClose),
            desc: `Added ${countToClose} missing closing parenthesis ')' before ${tok.value.toUpperCase()}`,
          })
        }
      }
    }
  }

  // Check end of query for any remaining unclosed parens
  if (parenStack.length > 0) {
    const countToClose = parenStack.length
    const lastTok = pass3Tokens[pass3Tokens.length - 1]
    const insertPos = lastTok ? lastTok.end : fixed.length
    parenFixOperations.push({
      index: insertPos,
      removeLength: 0,
      insertText: ')'.repeat(countToClose),
      desc: `Added ${countToClose} missing closing parenthesis ')' at end of query`,
    })
    parenStack.length = 0
  }

  // Apply parenFixOperations from back to front (descending by index)
  if (parenFixOperations.length > 0) {
    parenFixOperations.sort((a, b) => b.index - a.index)
    for (const op of parenFixOperations) {
      fixed = fixed.slice(0, op.index) + op.insertText + fixed.slice(op.index + op.removeLength)
      fixesApplied.push(op.desc)
      fixCount++
    }
  }

  // 5. Post-fix validation verification
  const postValidation = validateSqlCode(fixed, dialect)

  return {
    fixedSql: fixed,
    fixCount,
    fixesApplied,
  }
}
