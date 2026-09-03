import { Metadata } from 'next'
import SqlValidatorTool from '@/components/sql-validator-tool'

export const metadata: Metadata = {
  title: 'Free SQL Validator Online | Check Syntax & Audit Queries | DigitalMix',
  description: 'Validate SQL query syntax, audit clauses, detect unclosed brackets or quote errors, and verify MySQL, PostgreSQL, SQLite, T-SQL, and Oracle queries with 100% client-side privacy.',
  keywords: ['SQL validator', 'SQL syntax checker', 'validate SQL query', 'SQL linter', 'check SQL syntax', 'PostgreSQL validator', 'MySQL validator', 'developer tools'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/sql-validator',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Free SQL Validator Online | Syntax Audit & Check | DigitalMix',
    description: '100% Client-Side SQL Syntax Audit. Detect syntax errors, missing keywords, and risk warnings instantly.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/sql-validator',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SQL Validator Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free SQL Validator & Syntax Checker',
    description: 'Audit SQL queries for syntax errors, bracket balance, missing keywords, and risk warnings.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function SqlValidatorPage() {
  return <SqlValidatorTool />
}
