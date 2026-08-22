import { Metadata } from 'next'
import Script from 'next/script'
import CsvToJsonTool from '@/components/csv-to-json-tool'

export const metadata: Metadata = {
  title: 'Free CSV to JSON Converter Online | DigitalMix',
  description: 'Convert your Excel CSV data into clean structured JSON arrays instantly. 100% client-side privacy.',
  keywords: ['csv to json', 'convert csv to json', 'excel to json', 'csv parser', 'developer tools'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/csv-json',
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
    title: 'Free CSV to JSON Converter Online | DigitalMix',
    description: '100% Client-Side Privacy. Convert Excel CSV data into clean structured JSON arrays instantly.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/csv-json',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CSV to JSON Converter Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free CSV to JSON Converter',
    description: 'Convert CSV and Excel data to JSON instantly. 100% client-side.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function CsvToJsonPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'CSV to JSON Converter',
        description: 'Free tool to convert CSV and Excel data to JSON format',
        url: 'https://www.digitalmix.dev/tools/csv-json',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList: '100% client-side privacy, instant conversion, Excel support',
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
          { '@type': 'ListItem', position: 3, name: 'CSV to JSON', item: 'https://www.digitalmix.dev/tools/csv-json' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Can I convert Excel files to JSON?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, you can export Excel files as CSV and then convert them to JSON using this tool.',
            },
          },
          {
            '@type': 'Question',
            name: 'How does the tool handle CSV with headers?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The tool automatically uses the first row as headers and creates JSON objects with those headers as keys.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is my CSV data processed locally?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, CSV to JSON conversion happens 100% client-side in your browser. Your data remains private.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <Script
        id="csv-json-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <CsvToJsonTool />
    </>
  );
}
