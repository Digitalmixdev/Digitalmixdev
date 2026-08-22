export interface Tool {
  id: string
  name: string
  description: string
  href: string
  icon?: string
}

export interface ToolCategory {
  id: string
  name: string
  description: string
  slug: string
  tools: Tool[]
  icon?: string
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'database',
    name: 'Database Tools',
    description: 'Tools for working with databases, SQL queries, and data formatting',
    slug: 'database',
    icon: '🗄️',
    tools: [
      {
        id: 'sql-formatter',
        name: 'SQL Formatter',
        description: 'Format, beautify, and minify SQL queries instantly',
        href: '/tools/sql-formatter',
      },
      {
        id: 'json-formatter',
        name: 'JSON Formatter',
        description: 'Validate, format, parse, and minify JSON data',
        href: '/tools/json-formatter',
      },
      {
        id: 'csv-json',
        name: 'CSV to JSON Converter',
        description: 'Convert Excel CSV data into clean structured JSON arrays',
        href: '/tools/csv-json',
      },
    ],
  },
  {
    id: 'developer',
    name: 'Developer Tools',
    description: 'Essential utilities for developers including encoding, hashing, and testing',
    slug: 'developer',
    icon: '👨‍💻',
    tools: [
      {
        id: 'base64',
        name: 'Base64 Encoder/Decoder',
        description: 'Encode and decode base64 text, images, and files instantly',
        href: '/tools/base64',
      },
      {
        id: 'jwt',
        name: 'JWT Decoder/Encoder',
        description: 'Encode , decode and generate JSON Web Tokens (JWT) instantly online.',
        href: '/tools/jwt',
      },
      {
        id: 'uuid-generator',
        name: 'UUID Generator',
        description: 'Generate bulk RFC 4122 UUID v4 tokens cryptographically secure',
        href: '/tools/uuid-generator',
      },
      {
        id: 'hash-generator',
        name: 'Hash Generator',
        description: 'Generate cryptographic hashes (MD5, SHA-256, SHA-512)',
        href: '/tools/hash-generator',
      },
      {
        id: 'regex-tester',
        name: 'Regex Tester',
        description: 'Test and debug regular expressions with instant feedback',
        href: '/tools/regex-tester',
      },
    ],
  },
  {
    id: 'calculators',
    name: 'Calculators',
    description: 'Business calculators for KPI, ROI, and financial metrics',
    slug: 'calculators',
    icon: '🧮',
    tools: [
          {
            id: 'kpi-calculator',
            name: 'CAC & LTV Calculator', // الأداة الأولى
            description: 'Calculate SaaS KPIs, Customer Acquisition Cost, and Lifetime Value',
            href: '/tools/kpi-calculator?tab=product',
          },
          {
            id: 'profit-calculator',
            name: 'Profit Margin Calculator', // الأداة الثانية
            description: 'Calculate profit margins and business value metrics instantly',
            href: '/tools/kpi-calculator?tab=profit',
          },
          {
            id: 'roi-calculator',
            name: 'ROI Calculator', // الأداة الثالثة
            description: 'Calculate return on investment and financial performance',
            href: '/tools/kpi-calculator?tab=roi',
          },
        ],
      },
  {
    id: 'files',
    name: 'File Tools',
    description: 'Tools for working with files, PDFs, and document processing',
    slug: 'files',
    icon: '📄',
    tools: [
      {
        id: 'pdf-merge',
        name: 'PDF Merger & Organizer',
        description: 'Merge PDF files, reorder pages, and organize documents',
        href: '/tools/pdf-merge',
      },
      {
        id: 'image-resizer',
        name: 'Image Resizer',
        description: 'Resize, crop, and convert your images',
        href: '/tools/image-resizer',
      },
      {
        id: 'qr-code-generator',
        name: 'QR Code Generator',
        description: 'Create custom QR codes for URLs, WiFi, vCards, and more',
        href: '/tools/qr-code-generator',
      },
    ],
  },
]

export function getCategoryBySlug(slug: string): ToolCategory | undefined {
  return TOOL_CATEGORIES.find((cat) => cat.slug === slug)
}

export function getAllTools(): Tool[] {
  return TOOL_CATEGORIES.flatMap((cat) => cat.tools)
}

export function getToolById(id: string): Tool | undefined {
  return getAllTools().find((tool) => tool.id === id)
}
