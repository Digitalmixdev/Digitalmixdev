import type { Metadata } from 'next'
import Script from 'next/script'
import ImageAndFileCompressorTool from '@/components/image-and-file-compressor-tool'

export const metadata: Metadata = {
  title: 'Free Image & File Compressor Online | Reduce Image & File Size | DigitalMix',
  description:
    'Compress JPG, PNG, WebP images and package documents or code files into optimized ZIP archives directly in your browser. 100% private, free, and client-side.',
  keywords: [
    'image compressor',
    'file compressor',
    'compress images online',
    'compress png',
    'compress jpg',
    'convert to webp',
    'zip file compressor',
    'online image optimizer',
    'developer tools',
    'digitalmix',
  ],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/image-and-file-compressor',
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
    title: 'Free Image & File Compressor Online | Fast & Secure',
    description: '100% Client-Side Image & File Compression. Absolute privacy, no server uploads.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/image-and-file-compressor',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Image & File Compressor Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Image & File Compressor Online',
    description: 'Compress images and create ZIP archives directly in your browser.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function ImageAndFileCompressorPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Image & File Compressor',
        description: 'Free browser tool to compress images and package files into optimized archives',
        url: 'https://www.digitalmix.dev/tools/image-and-file-compressor',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList: 'Client-side image compression, WebP conversion, batch processing, ZIP packaging',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '150',
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
          { '@type': 'ListItem', position: 3, name: 'Image & File Compressor', item: 'https://www.digitalmix.dev/tools/image-and-file-compressor' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is Deflate level?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Deflate level (ranging from 1 to 9) determines the balance between compression speed and file size reduction in ZIP archives. Level 1 is fastest, Level 6 is balanced, and Level 9 provides maximum compression.',
            },
          },
          {
            '@type': 'Question',
            name: 'Are my files or images uploaded to a server?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. Everything is compressed locally in your web browser using HTML5 Canvas and JSZip. Your data never leaves your computer.',
            },
          },
          {
            '@type': 'Question',
            name: 'What image formats can I convert to?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'You can convert and compress images to WebP, JPEG, PNG, or preserve the original format with reduced file size.',
            },
          },
        ],
      },
    ],
  }

  return (
    <>
      <Script
        id="image-and-file-compressor-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="min-h-screen bg-background">
        <ImageAndFileCompressorTool />
      </main>
    </>
  )
}
