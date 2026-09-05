import { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import BinaryTranslatorTool from "@/components/binary-translator-tool"

export const metadata: Metadata = {
  title: "Binary Translator | Text to Binary & Binary to Text Byte by Byte | DigitalMix",
  description: "Translate plain text to binary code and binary back to text byte by byte. Interactive bit inspector, UTF-8 multi-byte support, and 100% client-side privacy.",
  keywords: [
    'binary translator',
    'text to binary',
    'binary to text',
    'byte by byte binary',
    'binary converter',
    'ascii to binary',
    'utf-8 binary translator',
    'binary decoder',
    'binary encoder',
    'bits and bytes inspector'
  ],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/binary-translator',
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
    title: "Binary Translator Online | DigitalMix",
    description: "Translate text to binary and binary back to text byte by byte with interactive bit decomposition and real-time statistics.",
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/binary-translator',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Binary Translator Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Binary Translator - Text to Binary Byte by Byte',
    description: 'Convert text to binary and decode binary back to text byte by byte. 100% client-side.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function BinaryTranslatorPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Binary Translator',
        description: 'Free Binary Translator tool for converting text to binary and binary to text byte by byte.',
        url: 'https://www.digitalmix.dev/tools/binary-translator',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList: 'Byte-by-byte translation, interactive bit inspector, UTF-8 multi-byte support, custom delimiters, auto-pad',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '120',
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
          { '@type': 'ListItem', position: 2, name: 'Developer Tools', item: 'https://www.digitalmix.dev/tools/developer' },
          { '@type': 'ListItem', position: 3, name: 'Binary Translator', item: 'https://www.digitalmix.dev/tools/binary-translator' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How does text to binary translation work byte by byte?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Each character in text is encoded into bytes (UTF-8 or ASCII). Each byte consists of 8 bits (0s and 1s) representing values from 0 to 255.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can this tool decode binary back to text?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! You can paste any binary sequence of 0s and 1s and instantly translate it back into human-readable text.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is the binary conversion done in the browser?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, all conversions run 100% locally in your browser with zero data sent to external servers.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <Script
        id="binary-translator-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground animate-pulse font-mono text-sm">
            Loading DigitalMix Binary Translation Engine...
          </div>
        }
      >
        <BinaryTranslatorTool />
      </Suspense>
    </>
  )
}
