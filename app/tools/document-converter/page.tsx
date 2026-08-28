import type { Metadata } from 'next'
import Script from 'next/script'
import DocumentConverterTool from '@/components/document-converter-tool'

export const metadata: Metadata = {
  title: 'Free Document & Office Converter Online (PDF, Word, Excel, PPTX, HTML) | DigitalMix',
  description:
    'Convert files between PDF, Word (DOCX), Excel (XLSX), PowerPoint (PPTX), HTML, and JPG images 100% privately in your browser with zero server uploads.',
  keywords: [
    'document converter',
    'word to pdf',
    'pdf to word',
    'excel to pdf',
    'powerpoint to pdf',
    'pptx converter',
    'xlsx to html',
    'pdf to jpg',
    'html to pdf',
    'office converter',
    'file converter online',
  ],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/document-converter',
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
    title: 'Free Document & Office Converter | DigitalMix',
    description: 'Convert between PDF, Word, PowerPoint, Excel, HTML, and Images with 100% client-side privacy.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/document-converter',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Document & Office Converter',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Document & Office Converter',
    description: 'Convert Word, PDF, PPTX, Excel, HTML, and JPG safely in your browser memory.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function DocumentConverterPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Document & Office Converter',
        description: 'Free tool to convert between PDF, Word DOCX, PowerPoint PPTX, Excel XLSX, HTML, and Images',
        url: 'https://www.digitalmix.dev/tools/document-converter',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList:
          '100% client-side document conversion, Word to PDF, PDF to Word, Excel to PDF and HTML, PowerPoint to PDF, HTML to PDF, zero server uploads',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '124',
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
          { '@type': 'ListItem', position: 2, name: 'File Utilities', item: 'https://www.digitalmix.dev/tools/files' },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Document Converter',
            item: 'https://www.digitalmix.dev/tools/document-converter',
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Are my confidential documents uploaded to any server?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No, all file conversions occur entirely within your browser memory using WebAssembly and client-side JavaScript. No file data is ever transmitted to a server.',
            },
          },
          {
            '@type': 'Question',
            name: 'What formats can I convert?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'You can convert between PDF, Microsoft Word (.docx), Microsoft PowerPoint (.pptx), Microsoft Excel (.xlsx, .csv), HTML, JPG, PNG, and Plain Text.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I convert PowerPoint presentations to PDF?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! The converter parses XML slide outlines and formatting inside the presentation and compiles them into a clean, multi-page PDF document.',
            },
          },
        ],
      },
    ],
  }

  return (
    <>
      <Script
        id="document-converter-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="min-h-screen bg-background">
        <DocumentConverterTool />
      </main>
    </>
  )
}
