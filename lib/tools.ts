import { Tool } from "@/types/tool"

export const allTools: Tool[] = [
  { name: "SQL Formatter", active: true, href: "/tools/sql-formatter", keywords: ["sql", "format", "beautify", "query", "database"] },
  { name: "JSON Formatter", active: true, href: "/tools/json-formatter", keywords: ["json", "format", "beautify"] },
  { name: "CSV to JSON", active: true, href: "/tools/csv-json", keywords: ["csv", "json", "convert", "converter"] },
  { name: "JSON to SQL", active: false },
  { name: "Schema Generator", active: false },
  { name: "Regex Tester", active: true, href: "/tools/regex-tester", keywords: ["regex", "regular expression", "test", "debug"] },
  { name: "KPI Calculator", active: true, href: "/tools/kpi-calculator", keywords: ["kpi", "financial", "calculator", "business"] },
  { name: "JSON to SQL", active: false, keywords: ["json", "sql", "convert"] },
  { name: "Schema Generator", active: false, keywords: ["schema", "database", "generate"] },
  { name: "Base64 Encoder/Decoder", active: true, href: "/tools/base64", keywords: ["base64", "encode", "decode"] },
  { name: "JWT Decoder/Encoder", active: true, href: "/tools/base64", keywords: ["jwt", "encode", "decode"] },
  { name: "Hash Generator", active: true, href: "/tools/hash-generator", keywords: ["hash", "md5", "sha", "generate"] },
  { name: "UUID Generator", active: true, href: "/tools/uuid-generator", keywords: ["uuid", "generate", "unique"] },
  { name: "PDF Merger & Organizer", active: true, href: "/tools/pdf-merge", keywords: ["pdf", "merge", "tool", "reorder", "delete"] },
  { name: "Image Resizer", active: true, href: "/tools/image-resizer", keywords: ["resize", "image", "tool", "crop", "resize image"] },
  { name: "QR Code Generator", active: true, href: "/tools/qr-code-generator", keywords: ["qr", "qr code", "generator", "wifi", "vcard", "encode"] },
]

export const popularSearches = [
  { name: "QR Code Generator", href: "/tools/qr-code-generator" },
  { name: "SQL Formatter", href: "/tools/sql-formatter" },
  { name: "Regex Tester", href: "/tools/regex-tester" },
  { name: "PDF Merger & Organizer", href: "/tools/pdf-merge" },
]