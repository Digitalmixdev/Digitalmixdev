# DigitalMix — Developer & Utility Web Platform

DigitalMix is a modern, privacy-first web application providing a comprehensive suite of developer utilities, image processing tools, document converters, financial/business calculators, and database helper tools. Built with Next.js 15, React, TypeScript, and Tailwind CSS.

---

## 🚀 Key Features & Tool Suites

### 🛠️ Developer & Database Tools
- **JSON Validator & Auto-Repair**: Real-time syntax validation with line/column error coordinates and 1-click auto-repair for unquoted keys, trailing commas, and quote formatting.
- **JSON Formatter & Tree Viewer**: Format, minify, and interactively explore complex JSON structures.
- **SQL Validator**: Multi-dialect SQL syntax checking (PostgreSQL, MySQL, SQLite, T-SQL, Oracle) with destructive query warnings (`DELETE` without `WHERE`, `DROP TABLE`).
- **SQL Formatter**: Pretty-print and format raw SQL queries into clean, readable statements.
- **CSV to JSON & JSON to CSV Converter**: High-performance bidirectional converter with column mapping and custom delimiters.
- **Binary & Base Translator**: Convert strings and numbers across Binary, Hexadecimal, Octal, Decimal, and ASCII/UTF-8.
- **JWT Debugger**: Decode and inspect JSON Web Tokens (Header, Payload, Signature) with expiration validation.
- **Hash Generator**: Generate instant MD5, SHA-1, SHA-256, and SHA-512 cryptographic checksums.
- **UUID Generator**: Bulk-generate RFC 4122 v4 compliant unique identifiers.
- **Regex Tester**: Test regular expressions in real-time with pattern highlighting, flag toggles, and regex cheat-sheet.

### 🎨 Design & Media Tools
- **Image Color Palette Extractor**: Extract dominant, vibrant, muted, pastel, and dark swatches using K-Means Centroid clustering, Median Cut quantization, or Histogram frequency. Includes WCAG 2.1 contrast matrix, colorblindness simulation (Protanopia, Deuteranopia, Tritanopia, Achromatopsia), live UI mockup mapping, and export options (PNG poster, CSS, SCSS, Tailwind, JSON).
- **Image & File Compressor**: Client-side image compression (PNG, JPEG, WebP) with target quality sliders and side-by-side preview.
- **Image Converter**: Convert images between PNG, JPEG, WebP, AVIF, and ICO formats.
- **Image Resizer**: Resize and crop images with aspect ratio locking, preset dimensions, and rotation controls.
- **QR Code Generator**: Create customizable QR codes for URLs, WiFi passwords, vCards, Email, SMS, and plain text with SVG and PNG exports.
- **QR & Barcode Scanner**: Scan 1D and 2D barcodes (UPC, EAN-13, Code 128, Data Matrix, QR Code) using webcam, drag-and-drop file upload, or direct clipboard pasting.

### 📄 Document & PDF Tools
- **Document Converter**: Convert documents between PDF, Word (DOCX), HTML, Markdown, and TXT formats.
- **PDF Merger & Organizer**: Combine multiple PDF files into a single document or organize your file(s).

### 📊 Calculators
- **KPI & ROI Calculator**: Calculate key business metrics (Customer Acquisition Cost, Lifetime Value, Churn Rate, ROI).
- **Calorie & BMR Calculator**: Estimate daily caloric needs based on Mifflin-St Jeor and Harris-Benedict formulas.

---

## 🌟 Platform Highlights

- **100% Client-Side Privacy**: File processing, image conversions, QR scanning, and data parsing happen entirely in the user's browser.
- **Bilingual Internationalization (i18n)**: Native English and Arabic support with full RTL (Right-to-Left) and LTR layout adaptations.
- **Content Security Policy (CSP)**: Hardened security headers supporting Google AdSense, Clarity, Google Analytics, and Ad Traffic Quality (`ep1`/`ep2.adtrafficquality.google`) endpoints.
- **Developer Blog & Knowledge Hub**: Technical articles on algorithms, databases, encoding, and web security with real-time client-side search and category filtering.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI & Styling**: React, Tailwind CSS v4, Lucide Icons, Framer Motion
- **Component Primitives**: Radix UI / shadcn primitives
- **Database & Auth**: Prisma ORM, PostgreSQL (Cloud SQL), NextAuth
- **PWA & Caching**: Service Worker with Network-First strategy and offline fallback