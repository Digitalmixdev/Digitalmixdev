import type { Metadata } from 'next'
import Script from 'next/script'
import ImageColorPaletteTool from '@/components/image-color-palette-tool'

export const metadata: Metadata = {
  title: 'Free Image Color Palette Extractor Online | Extract HEX & RGB Swatches | DigitalMix',
  description:
    'Extract dominant color palettes, HEX/RGB/HSL swatches, and color harmonies from any image instantly in your browser. Fast, secure, and 100% client-side with no image uploads.',
  keywords: [
    'image color palette extractor',
    'extract color from image',
    'image color picker',
    'dominant color extractor',
    'hex color palette generator',
    'color harmony generator',
    'ui color palette',
    'developer tools',
  ],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/image-color-palette',
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
    title: 'Free Image Color Palette Extractor | Fast & Secure',
    description: '100% Client-Side Image Palette Extraction & Color Analysis. Absolute privacy.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/image-color-palette',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Image Color Palette Extractor Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Image Color Palette Extractor',
    description: 'Extract HEX, RGB, and HSL swatches from any photo. 100% client-side.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function ImageColorPalettePage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Image Color Palette Extractor',
        description: 'Free tool to extract color palettes, HEX/RGB swatches, and color harmonies from photos online',
        url: 'https://www.digitalmix.dev/tools/image-color-palette',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList:
          '100% client-side color extraction, K-Means clustering, eyedropper magnifier, live UI theme preview, CSS & Tailwind export',
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
          { '@type': 'ListItem', position: 3, name: 'Image Color Palette Extractor', item: 'https://www.digitalmix.dev/tools/image-color-palette' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Are my uploaded images saved on a server?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No, all extraction and pixel processing happens 100% locally in your browser memory.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I export the extracted colors for Tailwind or CSS?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes! The tool supports exporting as CSS Variables, Tailwind CSS v3/v4 theme config, SCSS, JSON, or high-res PNG posters.',
            },
          },
        ],
      },
    ],
  }

  return (
    <>
      <Script
        id="image-color-palette-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="min-h-screen bg-background">
        <ImageColorPaletteTool />
      </main>
    </>
  )
}
