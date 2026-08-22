import type { Metadata } from 'next'
import Script from 'next/script'
import ImageResizerTool from '@/components/image-resizer-tool'

export const metadata: Metadata = {
  title: 'Free Image Resizer Online | Resize Images Instantly | DigitalMix',
  description: 'Resize, crop, and convert your images (PNG, JPG, WebP) instantly in your browser. Fast, secure, and privacy-focused image tool with no uploads required.',
  keywords: [
    'image resizer',
    'resize image online',
    'resize photo',
    'crop image',
    'bulk image resizer',
    'convert image format',
    'developer tools'
  ],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/image-resizer',
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
    title: 'Free Image Resizer Online | Fast & Secure',
    description: '100% Client-Side Image Resizing & Processing. Absolute privacy.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools/image-resizer',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Image Resizer Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Image Resizer & Converter',
    description: 'Resize, crop, and compress images. 100% client-side and secure.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function ImageResizerPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'Image Resizer',
        description: 'Free tool to resize, crop, compress, and convert images online',
        url: 'https://www.digitalmix.dev/tools/image-resizer',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList: '100% client-side image resizing, bulk processing, no image uploads to servers, safe and private photo editing',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '120',
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
          { '@type': 'ListItem', position: 3, name: 'Image Resizer', item: 'https://www.digitalmix.dev/tools/image-resizer' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Will my images lose quality after resizing?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The tool uses advanced browser-based scaling algorithms to maintain the best possible quality while adjusting the dimensions.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I resize multiple images at once?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, the Image Resizer supports bulk processing, allowing you to upload and adjust multiple photos simultaneously.',
            },
          },
          {
            '@type': 'Question',
            name: 'Are my uploaded images safe?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Absolutely. All processing is done 100% locally on your computer using JavaScript. Your images are never uploaded to any server.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <Script
        id="image-resizer-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="min-h-screen bg-background">
        <ImageResizerTool />
      </main>
    </>
  );
}