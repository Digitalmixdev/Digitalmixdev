import { Metadata } from 'next'
import JsonValidatorTool from '@/components/json-validator-tool'

export const metadata: Metadata = {
  title: 'Free JSON Validator Online | Check Syntax & Fix Errors | DigitalMix',
  description: 'Validate JSON syntax, pinpoint line and column error locations, repair trailing commas and quoting issues, and lint JSON payloads with 100% client-side privacy.',
  keywords: ['JSON validator', 'JSON syntax checker', 'validate JSON payload', 'JSON linter', 'check JSON syntax', 'JSON auto fix', 'developer tools'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/json-validator',
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
    title: 'Free JSON Validator Online | Syntax & Structure Audit | DigitalMix',
    description: '100% Client-Side JSON Syntax Audit. Pinpoint line errors, auto-fix trailing commas, and validate JSON payloads instantly.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/json-validator',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'JSON Validator Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free JSON Validator & Syntax Checker',
    description: 'Audit JSON payloads for syntax errors, bracket balance, quotes, and structural issues.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function JsonValidatorPage() {
  return <JsonValidatorTool />
}
