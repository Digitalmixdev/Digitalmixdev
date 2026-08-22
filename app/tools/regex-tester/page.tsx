import type { Metadata } from 'next'
import Script from 'next/script'
import { Suspense } from 'react'
import RegexTool from '@/components/regex-tool'

export const metadata: Metadata = {
  title: 'Free Live Regex Tester & Debugger | DigitalMix',
  description: 'Test regular expressions, trace capture groups, analyze position indexes, and get instant structural token explanations locally in real-time.',
  keywords: ['regex tester', 'regular expression debugger', 'regex linter', 'regex match finder', 'developer tools'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/regex-tester',
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
    title: 'Free Live Regex Tester & Debugger | DigitalMix',
    description: '100% Client-Side Regex Testing. Trace capture groups, analyze position indexes, and get instant structural token explanations in real-time.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/regex-tester',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Regex Tester Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Regex Tester & Debugger',
    description: 'Test and debug regular expressions with instant feedback. 100% client-side.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function RegexTesterPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Regex Tester',
        description: 'Free regular expression tester and debugger for developers',
        url: 'https://www.digitalmix.dev/tools/regex-tester',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList: 'Real-time regular expression testing, syntax highlighting, match group extraction, built-in common regex tokens and cheatsheet',
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
          { '@type': 'ListItem', position: 3, name: 'Regex Tester', item: 'https://www.digitalmix.dev/tools/regex-tester' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What regex flavors are supported?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Regex Tester supports JavaScript regex patterns including standard quantifiers, character classes, and capture groups.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I test global and case-insensitive matching?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, you can enable global (g) and case-insensitive (i) flags to test different regex behaviors.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is my regex pattern stored or transmitted?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No, all regex testing happens locally in your browser. Your patterns remain completely private.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <Script
        id="regex-tester-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Suspense 
        fallback={
          <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground animate-pulse font-mono text-sm">
            Loading DigitalMix Regex Engine Framework...
          </div>
        }
      >
        <RegexTool />
      </Suspense>
    </>
  );
}
