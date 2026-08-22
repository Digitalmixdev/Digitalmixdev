import { Metadata } from 'next'
import Script from 'next/script'
import SqlFormatterTool from '@/components/sql-formatter-tool'

export const metadata: Metadata = {
  title: 'Free SQL Formatter Online | Beautify & Minify SQL Queries | DigitalMix',
  description: 'Format, beautify, and minify your SQL queries instantly. Supports MySQL, PostgreSQL, SQLite, PL/SQL. 100% client-side processing for maximum privacy. No signup required.',
  keywords: ['SQL formatter', 'beautify SQL', 'SQL query cleaner', 'format SQL online', 'minify SQL', 'PostgreSQL formatter', 'MySQL formatter', 'developer tools'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/sql-formatter',
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
    title: 'Free SQL Formatter Online | Beautify & Minify | DigitalMix',
    description: '100% Client-Side SQL Processing. Format and minify MySQL, PostgreSQL, and SQLite queries instantly with absolute privacy.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/sql-formatter',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SQL Formatter Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free SQL Formatter & Beautifier',
    description: 'Format, beautify, minify SQL queries. MySQL, PostgreSQL, SQLite support.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function SqlFormatterPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'SQL Formatter',
        description: 'Free SQL formatter and beautifier tool supporting MySQL, PostgreSQL, SQLite',
        url: 'https://www.digitalmix.dev/tools/sql-formatter',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList: 'Instant SQL query beautification, supports multiple SQL dialects, custom indentation options, clean readable syntax formatting',
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
          { '@type': 'ListItem', position: 3, name: 'SQL Formatter', item: 'https://www.digitalmix.dev/tools/sql-formatter' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Which SQL databases are supported?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'SQL Formatter supports MySQL, PostgreSQL, SQLite, and PL/SQL. It works with all standard SQL syntax.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is SQL Formatter secure and private?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, all processing happens 100% client-side in your browser. Your SQL queries never leave your device.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I minify my SQL queries?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, SQL Formatter can both beautify and minify SQL queries to reduce file size.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <Script
        id="sql-formatter-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <SqlFormatterTool />
    </>
  );
}
