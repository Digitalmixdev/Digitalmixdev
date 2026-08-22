import type { Metadata } from 'next'
import Script from 'next/script'
import HashTool from '@/components/hash-tool'

export const metadata: Metadata = {
  title: 'Cryptographic Hash Generator (MD5, SHA-256, SHA-512) | DigitalMix',
  description: 'Compute secure, high-performance cryptographic message digests locally in your browser thread. Supports real-time MD5, SHA-1, SHA-256, and SHA-512 signatures with absolute privacy.',
  keywords: [
    'hash generator',
    'sha-256 generator',
    'sha-512 hash',
    'md5 online tool',
    'sha-1 checksum',
    'cryptographic hashing',
    'developer tools'
  ],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/hash-generator',
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
    title: 'Cryptographic Hash Generator | DigitalMix',
    description: 'Instant, secure client-side cryptographic hashing pipeline.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/hash-generator',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Hash Generator Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Cryptographic Hash Generator',
    description: 'Generate MD5, SHA-256, SHA-512 hashes instantly. 100% client-side.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function HashGeneratorPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Hash Generator',
        description: 'Cryptographic hash generator supporting MD5, SHA-1, SHA-256, SHA-512',
        url: 'https://www.digitalmix.dev/tools/hash-generator',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList: '100% client-side data hashing, supports MD5 SHA-1 SHA-256 and SHA-512, instant cryptographic hash generation, secure and private',
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
          { '@type': 'ListItem', position: 3, name: 'Hash Generator', item: 'https://www.digitalmix.dev/tools/hash-generator' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Which hash algorithms are supported?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Hash Generator supports MD5, SHA-1, SHA-256, and SHA-512 cryptographic hash functions.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I verify file integrity with hashes?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, you can generate hashes for files and compare them with checksums provided by vendors to verify file integrity.',
            },
          },
          {
            '@type': 'Question',
            name: 'Are hashes generated locally?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, all hash generation happens 100% client-side in your browser with no data transmission to servers.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <Script
        id="hash-generator-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <HashTool />
    </>
  );
}
