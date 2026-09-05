import { Metadata } from 'next'
import Script from 'next/script'
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
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'JSON Validator',
        description: 'Free JSON validator, syntax checker, and error fixer tool',
        url: 'https://www.digitalmix.dev/tools/json-validator',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList: '100% client-side syntax validation, pinpoint line/column error detection, auto-fix trailing commas and quotes, linting and formatting',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '92',
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.digitalmix.dev' },
          { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://www.digitalmix.dev/tools/database' },
          { '@type': 'ListItem', position: 3, name: 'JSON Validator', item: 'https://www.digitalmix.dev/tools/json-validator' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Is the JSON Validator free to use?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, JSON Validator is completely free. It operates 100% client-side in your browser with zero registration required.',
            },
          },
          {
            '@type': 'Question',
            name: 'Does the tool automatically fix syntax errors?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, it provides one-click auto-repair for common JSON mistakes such as unquoted keys, trailing commas, single-to-double quote conversion, and missing enclosing brackets.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is my data secure?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'All JSON validation runs locally in your browser memory. Your data never leaves your device and is never uploaded to any server.',
            },
          },
        ],
      },
    ],
  }

  return (
    <>
      <Script
        id="json-validator-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <JsonValidatorTool />
    </>
  )
}

