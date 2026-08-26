export type ToolId =
  | 'sql-formatter'
  | 'json-formatter'
  | 'csv-json'
  | 'base64'
  | 'jwt'
  | 'uuid-generator'
  | 'hash-generator'
  | 'regex-tester'
  | 'kpi-calculator'
  | 'profit-calculator'
  | 'roi-calculator'
  | 'calorie-calculator'
  | 'pdf-merge'
  | 'image-resizer'
  | 'qr-code-generator'
  | 'image-and-file-compressor'

export type CategoryId = 'database' | 'developer' | 'calculators' | 'files'

export interface ToolDefinition {
  id: ToolId
  name: string
  slug: string
  href: string
  description: string
  categoryId: CategoryId
  icon: string
  active: boolean
  keywords: string[]
  faqs?: { q: string; a: string }[]
  features?: { title: string; desc: string; iconName?: string }[]
}

export interface ToolCategory {
  id: CategoryId
  name: string
  description: string
  slug: string
  icon?: string
  color?: string
  borderColor?: string
  iconColor?: string
  tools: ToolDefinition[]
}

export const ALL_TOOLS: ToolDefinition[] = [
  // Database Tools
  {
    id: 'sql-formatter',
    name: 'SQL Formatter',
    slug: 'sql-formatter',
    href: '/tools/sql-formatter',
    description: 'Format, beautify, and minify SQL queries instantly with dialect support.',
    categoryId: 'database',
    icon: 'Database',
    active: true,
    keywords: ['sql', 'format', 'beautify', 'query', 'database', 'minify', 'postgres', 'mysql'],
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    slug: 'json-formatter',
    href: '/tools/json-formatter',
    description: 'Validate, format, parse, and minify JSON data with instant error highlighting.',
    categoryId: 'database',
    icon: 'FileCode',
    active: true,
    keywords: ['json', 'format', 'beautify', 'validate', 'parse', 'minify'],
  },
  {
    id: 'csv-json',
    name: 'CSV to JSON Converter',
    slug: 'csv-json',
    href: '/tools/csv-json',
    description: 'Convert Excel CSV data into clean structured JSON arrays with automatic type detection.',
    categoryId: 'database',
    icon: 'FileSpreadsheet',
    active: true,
    keywords: ['csv', 'json', 'convert', 'converter', 'excel', 'sheets', 'transform'],
  },

  // Developer Tools
  {
    id: 'base64',
    name: 'Base64 Encoder/Decoder',
    slug: 'base64',
    href: '/tools/base64',
    description: 'Encode and decode base64 text, images, and files instantly.',
    categoryId: 'developer',
    icon: 'Binary',
    active: true,
    keywords: ['base64', 'encode', 'decode', 'ascii', 'binary', 'string'],
  },
  {
    id: 'jwt',
    name: 'JWT Decoder/Encoder',
    slug: 'jwt',
    href: '/tools/jwt',
    description: 'Decode, encode, verify, and generate JSON Web Tokens (JWT) instantly online.',
    categoryId: 'developer',
    icon: 'Shield',
    active: true,
    keywords: ['jwt', 'token', 'encode', 'decode', 'verify', 'json web token', 'auth'],
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    slug: 'uuid-generator',
    href: '/tools/uuid-generator',
    description: 'Generate bulk RFC 4122 UUID v4 tokens cryptographically secure.',
    categoryId: 'developer',
    icon: 'Fingerprint',
    active: true,
    keywords: ['uuid', 'guid', 'v4', 'generator', 'unique', 'identifier', 'crypto'],
  },
  {
    id: 'hash-generator',
    name: 'Hash Generator',
    slug: 'hash-generator',
    href: '/tools/hash-generator',
    description: 'Generate cryptographic hashes (MD5, SHA-256, SHA-512) for texts and strings.',
    categoryId: 'developer',
    icon: 'Key',
    active: true,
    keywords: ['hash', 'md5', 'sha256', 'sha512', 'crypto', 'digest', 'checksum'],
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    slug: 'regex-tester',
    href: '/tools/regex-tester',
    description: 'Test and debug regular expressions with instant syntax highlighting and match feedback.',
    categoryId: 'developer',
    icon: 'Code',
    active: true,
    keywords: ['regex', 'regular expression', 'test', 'debug', 'pattern', 'match'],
  },

  // Calculators
  {
    id: 'kpi-calculator',
    name: 'CAC & LTV Calculator',
    slug: 'kpi-calculator',
    href: '/tools/kpi-calculator?tab=product',
    description: 'Calculate SaaS KPIs, Customer Acquisition Cost, and Lifetime Value.',
    categoryId: 'calculators',
    icon: 'BarChart3',
    active: true,
    keywords: ['kpi', 'cac', 'ltv', 'saas', 'metrics', 'calculator', 'business'],
  },
  {
    id: 'profit-calculator',
    name: 'Profit Margin Calculator',
    slug: 'profit-calculator',
    href: '/tools/kpi-calculator?tab=profit',
    description: 'Calculate gross profit, net margins, and business revenue metrics instantly.',
    categoryId: 'calculators',
    icon: 'Calculator',
    active: true,
    keywords: ['profit', 'margin', 'finance', 'revenue', 'calculator', 'business'],
  },
  {
    id: 'roi-calculator',
    name: 'ROI Calculator',
    slug: 'roi-calculator',
    href: '/tools/kpi-calculator?tab=roi',
    description: 'Calculate return on investment, payback period, and financial performance.',
    categoryId: 'calculators',
    icon: 'Calculator',
    active: true,
    keywords: ['roi', 'investment', 'return', 'finance', 'calculator'],
  },
  {
    id: 'calorie-calculator',
    name: 'Calorie & BMR Calculator',
    slug: 'calorie-calculator',
    href: '/tools/calorie-calculator',
    description: 'Calculate daily calorie needs, BMR, TDEE, and custom macronutrient breakdowns.',
    categoryId: 'calculators',
    icon: 'Flame',
    active: true,
    keywords: ['calorie', 'bmr', 'tdee', 'diet', 'macros', 'calculator', 'health', 'weight loss'],
  },

  // File Tools
  {
    id: 'pdf-merge',
    name: 'PDF Merger & Organizer',
    slug: 'pdf-merge',
    href: '/tools/pdf-merge',
    description: 'Merge PDF files, reorder pages, and organize documents with drag and drop.',
    categoryId: 'files',
    icon: 'Layers',
    active: true,
    keywords: ['pdf', 'merge', 'organize', 'combine', 'reorder', 'document'],
  },
  {
    id: 'image-resizer',
    name: 'Image Resizer',
    slug: 'image-resizer',
    href: '/tools/image-resizer',
    description: 'Resize, crop, and convert your images with custom dimensions and aspect ratios.',
    categoryId: 'files',
    icon: 'Maximize2',
    active: true,
    keywords: ['resize', 'image', 'crop', 'convert', 'scale', 'photo', 'png', 'jpg'],
  },
  {
    id: 'qr-code-generator',
    name: 'QR Code Generator',
    slug: 'qr-code-generator',
    href: '/tools/qr-code-generator',
    description: 'Create custom QR codes for URLs, WiFi credentials, vCards, and text.',
    categoryId: 'files',
    icon: 'QrCode',
    active: true,
    keywords: ['qr', 'qr code', 'generator', 'wifi', 'vcard', 'barcode', 'scan'],
  },
  {
    id: 'image-and-file-compressor',
    name: 'Image & File Compressor',
    slug: 'image-and-file-compressor',
    href: '/tools/image-and-file-compressor',
    description: 'Compress images (JPG, PNG, WebP) and pack files into optimized ZIP archives with instant size reduction.',
    categoryId: 'files',
    icon: 'FileText',
    active: true,
    keywords: ['compress', 'image optimizer', 'file compression', 'zip', 'shrink', 'media', 'deflate'],
  },
]

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'database',
    name: 'Database Tools',
    description: 'SQL formatters, JSON beautifiers, CSV converters and more',
    slug: 'database',
    icon: '🗄️',
    color: 'from-blue-500/20 to-blue-600/5',
    borderColor: 'hover:border-blue-500/50',
    iconColor: 'text-blue-500',
    tools: ALL_TOOLS.filter((tool) => tool.categoryId === 'database'),
  },
  {
    id: 'developer',
    name: 'Developer Tools',
    description: 'Regex testers, encoders, hash generators for developers',
    slug: 'developer',
    icon: '👨‍💻',
    color: 'from-emerald-500/20 to-emerald-600/5',
    borderColor: 'hover:border-emerald-500/50',
    iconColor: 'text-emerald-500',
    tools: ALL_TOOLS.filter((tool) => tool.categoryId === 'developer'),
  },
  {
    id: 'calculators',
    name: 'Calculators',
    description: 'Calorie, ROI, CAC, LTV and other professional calculators',
    slug: 'calculators',
    icon: '🧮',
    color: 'from-amber-500/20 to-amber-600/5',
    borderColor: 'hover:border-amber-500/50',
    iconColor: 'text-amber-500',
    tools: ALL_TOOLS.filter((tool) => tool.categoryId === 'calculators'),
  },
  {
    id: 'files',
    name: 'File Utilities',
    description: 'Convert, compress and transform files instantly',
    slug: 'files',
    icon: '📄',
    color: 'from-rose-500/20 to-rose-600/5',
    borderColor: 'hover:border-rose-500/50',
    iconColor: 'text-rose-500',
    tools: ALL_TOOLS.filter((tool) => tool.categoryId === 'files'),
  },
]

export const popularSearches = [
  { name: 'QR Code Generator', href: '/tools/qr-code-generator' },
  { name: 'SQL Formatter', href: '/tools/sql-formatter' },
  { name: 'JWT Decoder/Encoder', href: '/tools/jwt' },
  { name: 'Regex Tester', href: '/tools/regex-tester' },
  { name: 'PDF Merger & Organizer', href: '/tools/pdf-merge' },
]

export function getAllTools(): ToolDefinition[] {
  return ALL_TOOLS
}

export function getAllActiveTools(): ToolDefinition[] {
  return ALL_TOOLS.filter((tool) => tool.active)
}

export function getToolById(id: string): ToolDefinition | undefined {
  return ALL_TOOLS.find((tool) => tool.id === id || tool.slug === id)
}

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return ALL_TOOLS.find((tool) => tool.slug === slug || tool.id === slug)
}

export function getToolsByCategory(catId: CategoryId | string): ToolDefinition[] {
  return ALL_TOOLS.filter((tool) => tool.categoryId === catId)
}

export function getCategoryById(id: string): ToolCategory | undefined {
  return TOOL_CATEGORIES.find((cat) => cat.id === id)
}

export function getCategoryBySlug(slug: string): ToolCategory | undefined {
  return TOOL_CATEGORIES.find((cat) => cat.slug === slug)
}
