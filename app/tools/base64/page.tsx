import { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import Base64Tool from "@/components/base64-tool"

export const metadata: Metadata = {
  title: "Base64 Encoder / Decoder | DigitalMix",
  description: "Instantly convert plain text or binary structures into safe ASCII strings layout. 100% client-side privacy.",
  keywords: ['base64 encoder', 'base64 decoder', 'convert text to base64', 'decode base64', 'developer tools'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/base64',
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
    title: "Base64 Encoder & Decoder Online | DigitalMix",
    description: "100% Client-Side Base64 Conversion Pipeline. Fast, secure, and private text/binary encoding.",
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/base64',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Base64 Encoder Decoder Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Base64 Encoder & Decoder',
    description: 'Convert text to Base64 and decode instantly. 100% client-side.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function Base64Page() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Base64 Encoder Decoder',
        description: 'Free Base64 encoder and decoder tool for text and binary data',
        url: 'https://www.digitalmix.dev/tools/base64',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList: '100% client-side privacy, instant encoding and decoding, binary file support',
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
          { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://www.digitalmix.dev/tools/developer' },
          { '@type': 'ListItem', position: 3, name: 'Base64 Encoder', item: 'https://www.digitalmix.dev/tools/base64' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is Base64 encoding?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Base64 is an encoding standard that converts binary data into a text format using 64 printable ASCII characters, making it safe for transmission.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I encode binary files with this tool?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, Base64 Encoder can encode both text and binary data into Base64 format.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is encoding and decoding done locally?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, all Base64 encoding and decoding happens 100% in your browser with no data sent to servers.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <Script
        id="base64-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground animate-pulse font-mono text-sm">
            Loading DigitalMix Base64 Engine Framework...
          </div>
        }
      >
        <Base64Tool />
      </Suspense>
    </>
  )
}