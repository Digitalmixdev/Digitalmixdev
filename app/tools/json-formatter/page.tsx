import { Metadata } from 'next'
import Script from 'next/script'
import JsonFormatterTool from '@/components/json-formatter-tool'

export const metadata: Metadata = {
  title: 'Free JSON Formatter Online | Validate & Minify JSON | DigitalMix',
  description: 'Validate, format, parse, and minify your JSON data instantly. Detect nested syntax errors locally. 100% client-side compilation for optimal data security and workflow privacy.',
  keywords: ['JSON formatter', 'beautify JSON', 'JSON validator', 'format JSON online', 'minify JSON', 'JSON lint', 'API payload checker', 'developer tools'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/json-formatter',
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
    title: 'Free JSON Formatter Online | Validate & Minify | DigitalMix',
    description: '100% Client-Side JSON Compilation Pipeline. Format, validate, and minify your data securely with absolute privacy.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/json-formatter',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'JSON Formatter Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free JSON Formatter & Validator',
    description: 'Format, validate, minify JSON instantly. 100% client-side and private.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function JsonFormatterPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'JSON Formatter',
        description: 'Free JSON formatter, validator, and minifier tool',
        url: 'https://www.digitalmix.dev/tools/json-formatter',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        
        featureList: 'Instant JSON beautification and minification, syntax highlighting, invalid JSON error detection, 100% browser-based processing',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '95',
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
          { '@type': 'ListItem', position: 3, name: 'JSON Formatter', item: 'https://www.digitalmix.dev/tools/json-formatter' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Is JSON Formatter free to use?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, JSON Formatter is completely free. It runs 100% client-side in your browser with no sign-up required.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is my data private when using JSON Formatter?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, all processing happens locally in your browser. Your data never leaves your device and is never sent to any server.',
            },
          },
          {
            '@type': 'Question',
            name: 'What can I do with JSON Formatter?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'You can format, validate, minify, parse, and beautify JSON data. It also helps detect syntax errors in your JSON.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <Script
        id="json-formatter-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <JsonFormatterTool />
    </>
  );
}
