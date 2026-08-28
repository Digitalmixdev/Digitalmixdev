import type { Metadata } from 'next'
import Script from 'next/script'
import ImageConverterTool from '@/components/image-converter-tool'

export const metadata: Metadata = {
  title: 'Universal Image Converter (AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, XPS) | DigitalMix',
  description:
    'Convert between 14 image formats: AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, and XPS with 100% browser-side privacy and instant download.',
  keywords: [
    'image converter',
    'avif converter',
    'psd to png',
    'icns to ico',
    'tiff to jpg',
    'eps converter',
    'webp converter',
    'png to jpg',
    'jpg to png',
    'odd converter',
    'xps to image',
    'free image converter online',
  ],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/image-converter',
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
    title: 'Universal Image Converter | DigitalMix',
    description: 'Convert between 14 image formats: AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, and XPS with client-side privacy.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/image-converter',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Universal Image Converter',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Universal Image Converter',
    description: 'Convert between 14 image formats (AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, XPS) directly in browser.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function ImageConverterPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Universal Image Converter',
        description: 'Free tool to convert between 14 image formats: AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, and XPS',
        url: 'https://www.digitalmix.dev/tools/image-converter',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList:
          '100% client-side conversion across AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, and XPS, quality scaling, zero server uploads',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '88',
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
            name: 'Image Converter',
            item: 'https://www.digitalmix.dev/tools/image-converter',
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Which image formats are supported by this tool?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'You can convert between 14 popular and specialized image formats: AVIF, BMP, EPS, GIF, ICNS, ICO, JPG, ODD, PNG, PS, PSD, TIFF, WEBP, and XPS.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do I convert or combine photos into a PDF?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'To convert single or multiple photos into PDF with custom page layouts (A4, Fit, Letter), margins, and live preview, use our Document & Office Converter tool.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I convert Adobe Photoshop PSD or Apple ICNS files in the browser?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! Our custom decoders parse PSD layers and ICNS icon bundles directly inside your browser memory without uploading any files to a server.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is there any quality loss during image conversion?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'You have full control over the quality slider. When converting to lossless formats like PNG, BMP, or TIFF, zero compression artifacts are introduced.',
            },
          },
        ],
      },
    ],
  }

  return (
    <>
      <Script
        id="image-converter-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="min-h-screen bg-background">
        <ImageConverterTool />
      </main>
    </>
  )
}
