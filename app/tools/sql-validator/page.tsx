import { Metadata } from 'next'
import Script from 'next/script'
import SqlValidatorTool from '@/components/sql-validator-tool'

export const metadata: Metadata = {
  title: 'Free SQL Validator Online | Check Syntax & Audit Queries | DigitalMix',
  description: 'Validate SQL query syntax, audit clauses, detect unclosed brackets or quote errors, and verify MySQL, PostgreSQL, SQLite, T-SQL, and Oracle queries with 100% client-side privacy.',
  keywords: ['SQL validator', 'SQL syntax checker', 'validate SQL query', 'SQL linter', 'check SQL syntax', 'PostgreSQL validator', 'MySQL validator', 'developer tools'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/sql-validator',
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
    title: 'Free SQL Validator Online | Syntax Audit & Check | DigitalMix',
    description: '100% Client-Side SQL Syntax Audit. Detect syntax errors, missing keywords, and risk warnings instantly.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/sql-validator',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SQL Validator Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free SQL Validator & Syntax Checker',
    description: 'Audit SQL queries for syntax errors, bracket balance, missing keywords, and risk warnings.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function SqlValidatorPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'SQL Validator',
        description: 'Free SQL validator, syntax checker, and query audit tool',
        url: 'https://www.digitalmix.dev/tools/sql-validator',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList: '100% client-side SQL syntax verification, multi-dialect support (PostgreSQL, MySQL, SQLite, T-SQL, Oracle), destructive query risk warnings, bracket and quote audit',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '89',
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
          { '@type': 'ListItem', position: 3, name: 'SQL Validator', item: 'https://www.digitalmix.dev/tools/sql-validator' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Is the SQL Validator free to use?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, SQL Validator is 100% free with unlimited validations and no registration needed.',
            },
          },
          {
            '@type': 'Question',
            name: 'Which SQL dialects are supported?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'It supports Standard SQL (ANSI), PostgreSQL, MySQL, SQLite, Microsoft SQL Server (T-SQL), and Oracle.',
            },
          },
          {
            '@type': 'Question',
            name: 'Are my database queries stored or logged?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No, all SQL parsing runs 100% in your local browser sandbox. Your queries never touch any external server.',
            },
          },
        ],
      },
    ],
  }

  return (
    <>
      <Script
        id="sql-validator-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <SqlValidatorTool />
    </>
  )
}

