import { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import JwtTool from "@/components/jwt-tool"

export const metadata: Metadata = {
  title: "JWT Decoder & Encoder | DigitalMix",
  description: "Decode, Encode, verify, and generate JSON Web Tokens (JWT) instantly online. 100% client-side privacy with real-time payload breakdown.",
  keywords: ['jwt decoder', 'jwt encoder', 'decode json web token', 'verify jwt', 'jwt debugger', 'developer tools'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/jwt',
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
    title: "JWT Decoder & Encoder Online | DigitalMix",
    description: "100% Client-Side JSON Web Token Debugger. Inspect headers, claims, and signatures instantly.",
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/jwt',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'JWT Decoder Encoder Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free JWT Decoder & Encoder',
    description: 'Decode and inspect JSON Web Tokens instantly. 100% client-side security.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function JwtPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'JWT Decoder & Encoder',
        description: 'Free online tool to inspect, decode, and generate JSON Web Tokens (JWT) safely.',
        url: 'https://www.digitalmix.dev/tools/jwt',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList: '100% client-side execution, real-time payload syntax parsing, signature verification status simulation',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '112',
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
          { '@type': 'ListItem', position: 3, name: 'JWT Decoder/Encoder', item: 'https://www.digitalmix.dev/tools/jwt' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is a JWT?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'A JSON Web Token (JWT) is a compact, URL-safe means of representing claims to be transferred between two parties. It consists of a Header, Payload, and Signature separated by dots.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is my token secure when pasting it here?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, all JWT decoding and parsing happens 100% locally in your web browser. No token data is ever transmitted to external servers, protecting your sensitive API keys and session information.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can this tool decode encrypted JWTs (JWE)?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'This tool is built to decode and parse standard encoded JSON Web Tokens (JWS). Encrypted tokens (JWE) require structural decryption keys that cannot be processed without cryptographic specifications.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <Script
        id="jwt-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground animate-pulse font-mono text-sm">
            Loading DigitalMix JWT Engine Framework...
          </div>
        }
      >
        <JwtTool />
      </Suspense>
    </>
  )
}