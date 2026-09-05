import { Metadata } from 'next'
import Script from 'next/script'
import { QRCodeScannerTool } from '@/components/qr-barcode-scanner-tool'

export const metadata: Metadata = {
  title: 'Free QR & Barcode Scanner Online (Camera, Upload & Clipboard) | DigitalMix',
  description:
    'Scan QR codes, UPC, EAN, Code 128, and 1D/2D barcodes in real time using your webcam, uploaded image files, or clipboard. 100% private in browser.',
  keywords: 'QR scanner, barcode scanner, scan QR code online, webcam barcode scanner, EAN scanner, UPC reader, Code 128 reader',
  openGraph: {
    title: 'Free QR & Barcode Scanner Online',
    description: 'Instant client-side QR & barcode detection with live camera and image upload.',
    url: 'https://www.digitalmix.dev/tools/qr-barcode-scanner',
    type: 'website',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'QR & Barcode Scanner Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free QR & Barcode Scanner Online',
    description: 'Scan QR codes & barcodes instantly using webcam or image files.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/qr-barcode-scanner',
    languages: {
      'en-US': 'https://www.digitalmix.dev/tools/qr-barcode-scanner',
    },
  },
}

export default function QRBarcodeScannerPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: 'QR & Barcode Scanner',
        description: 'Free online QR and Barcode scanner supporting live camera scanning, image upload, and clipboard paste with 100% client-side privacy.',
        url: 'https://www.digitalmix.dev/tools/qr-barcode-scanner',
        applicationCategory: 'UtilityApplication',
        operatingSystem: 'Any',
        image: 'https://www.digitalmix.dev/og-image.png',
        featureList: 'Live camera QR & barcode scanner, UPC, EAN, Code 128, Code 39, Data Matrix support, image file drag-and-drop parsing, clipboard paste scanner, 100% client-side privacy',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          ratingCount: '110',
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
          { '@type': 'ListItem', position: 3, name: 'QR & Barcode Scanner', item: 'https://www.digitalmix.dev/tools/qr-barcode-scanner' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Which barcode formats are supported?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'The scanner supports QR Codes, Aztec, Data Matrix, UPC-A, UPC-E, EAN-13, EAN-8, Code 128, Code 39, Code 93, ITF, and Codabar.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I scan without giving camera permissions?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes, you can upload image files (PNG, JPG, WebP) or directly paste a screenshot from your clipboard without using a webcam.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is camera video sent to external servers?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No, video frames and uploaded images are processed 100% locally in your browser memory. Nothing is ever sent to a server.',
            },
          },
        ],
      },
    ],
  }

  return (
    <>
      <Script
        id="qr-barcode-scanner-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <QRCodeScannerTool />
    </>
  )
}

