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
    description: 'Convert Images (JPG, PNG, WEBP), Word, PowerPoint, Excel, HTML, and PDF with custom page layouts and 100% client-side privacy.',
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
    description: 'Convert multiple images to PDF with A4 layouts & live preview, plus Word, PPTX, Excel, HTML, and PDF.',
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
        description: 'Free tool to convert between PDF, Word DOCX, PowerPoint PPTX, Excel XLSX, HTML, and multiple Images (PNG, JPG, WEBP)',
        url: 'https://www.digitalmix.dev/tools/document-converter',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList:
          'Multi-image to PDF conversion, custom page layouts (A4, Fit, Letter), visual page preview, Word to PDF, PDF to Word, Excel to PDF and HTML, PowerPoint to PDF, HTML to PDF, zero server uploads',
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
            name: 'How do I convert multiple PNG or JPG photos to PDF at once?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'You can multi-select or drag & drop multiple JPG, PNG, WEBP, or AVIF photos into the upload area. You can reorder pages, configure layouts (A4, Fit, margins), preview the simulated PDF pages, and export them as a single merged PDF or individual PDF files.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I customize the PDF page dimensions (A4, Fit to Image, Letter) and margins?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! You can choose between A4 Portrait, A4 Landscape, Fit to Image (dynamic aspect ratio), US Letter, adjust image scaling (Contain vs. Cover), and set custom page margins (0mm borderless, 5mm, 10mm, 18mm).',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I preview how my images look in the PDF before downloading?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, an interactive visual preview panel simulates the exact page dimensions, orientation, image positioning, and margins in real time, allowing you to browse through pages before exporting.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I download each converted image PDF separately or all together?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Both options are supported: you can download a consolidated multi-page PDF, download each page as an individual PDF file, or click "Download All ZIP" to get all individual PDFs in a single archive.',
            },
          },
          {
            '@type': 'Question',
            name: 'Are my confidential files or photos uploaded to any external server?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No, all file conversions and PDF rendering happen entirely within your browser memory using WebAssembly. Your files never leave your device.',
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
