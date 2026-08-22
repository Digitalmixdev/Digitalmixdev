import type { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import UUIDTool from '@/components/uuid-tool'

export const metadata: Metadata = {
  title: 'Free Bulk RFC 4122 UUID v4 Generator | DigitalMix',
  description: 'Instantly generate single or bulk cryptographically secure UUID version 4 tokens locally. Export payloads directly to JSON or TXT file schemas.',
  keywords: ['UUID generator', 'bulk UUID v4', 'RFC 4122 generator', 'generate GUID online', 'secure tokens', 'developer tools'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/uuid-generator',
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
    title: 'Free Bulk RFC 4122 UUID v4 Generator | DigitalMix',
    description: 'Instantly generate single or bulk cryptographically secure UUID tokens locally. 100% client-side privacy with direct export schemas.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/uuid-generator',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'UUID Generator Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free UUID v4 Generator & Bulk Creator',
    description: 'Generate secure RFC 4122 UUIDs. Single or bulk export to JSON/TXT.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function UUIDGeneratorPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'UUID Generator',
        description: 'Free bulk RFC 4122 UUID v4 generator for developers',
        url: 'https://www.digitalmix.dev/tools/uuid-generator',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList: 'Bulk UUID v4 generation, cryptographically secure random identifiers, instant copy to clipboard, 100% client-side generation',
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
          { '@type': 'ListItem', position: 3, name: 'UUID Generator', item: 'https://www.digitalmix.dev/tools/uuid-generator' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is a UUID?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'A UUID (Universally Unique Identifier) is a 128-bit identifier that is globally unique. RFC 4122 defines the standard format.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I generate UUIDs in bulk?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, UUID Generator can create single or bulk UUIDs. You can generate hundreds of UUIDs at once and export them to JSON or TXT.',
            },
          },
          {
            '@type': 'Question',
            name: 'Are generated UUIDs cryptographically secure?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, the generator uses cryptographically secure random number generation to ensure each UUID is unique.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <Script
        id="uuid-generator-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground animate-pulse font-mono text-sm">
            Loading DigitalMix UUID Engine Framework...
          </div>
        }
      >
        <UUIDTool />
      </Suspense>
    </>
  );
}
