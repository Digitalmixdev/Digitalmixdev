import type { Metadata } from 'next'
import Script from 'next/script'
import PDFMergeTool from '@/components/pdf-merge-tool'

export const metadata: Metadata = {
  title: 'Free PDF Merger & Page Organizer Online | DigitalMix',
  description: 'Merge PDF files, reorder pages, and remove unwanted sheets instantly in your browser. Fast, secure, and privacy-focused PDF organizer with no uploads required.',
  keywords: [
    'pdf merger tool',
    'merge pdf files',
    'combine pdfs',
    'pdf merge',
    'delete pdf pages',
    'pdf organizer',
    'developer tools'
  ],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/pdf-merge',
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
    title: 'Free PDF Merge Tool Online | Fast & Secure',
    description: '100% Client-Side PDF Compilation Pipeline. Absolute privacy.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/pdf-merge',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PDF Merge Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free PDF Merger & Organizer',
    description: 'Merge, reorder, and edit PDF files. 100% client-side and secure.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function PDFMergePage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'PDF Merger',
        description: 'Free tool to merge, combine, and organize PDF files',
        url: 'https://www.digitalmix.dev/tools/pdf-merge',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList: '100% client-side PDF merging, no file uploads to servers, rapid multiple PDF combining, safe and private document processing',
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
          { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://www.digitalmix.dev/tools/files' },
          { '@type': 'ListItem', position: 3, name: 'PDF Merger', item: 'https://www.digitalmix.dev/tools/pdf-merge' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How many PDFs can I merge at once?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'You can merge multiple PDFs at once. The tool handles files locally, so the limit depends on your browser memory.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I reorder pages after selecting PDFs?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, PDF Merger allows you to reorder pages from different files before merging them together.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is the merged PDF secure and private?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, all PDF merging happens 100% locally in your browser. Your files never leave your device.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <Script
        id="pdf-merge-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="min-h-screen bg-background">
        <PDFMergeTool />
      </main>
    </>
  );
}
