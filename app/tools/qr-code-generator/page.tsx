import { Metadata } from 'next'
import { QRCodeTool } from '@/components/qr-code-tool'

export const metadata: Metadata = {
  title: 'QR Code Generator - Create Custom QR Codes Online',
  description: 'Generate QR codes for URLs, text, emails, phone numbers, WiFi, vCards and more. Customize colors, size, and download in multiple formats. Free and works offline.',
  keywords: 'QR code generator, QR code creator, custom QR codes, WiFi QR, vCard QR, SMS QR',
  openGraph: {
    title: 'QR Code Generator',
    description: 'Create custom QR codes instantly. Works offline, multiple formats supported.',
    url: 'https://www.digitalmix.dev/tools/qr-code-generator',
    type: 'website',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QR Code Generator',
    description: 'Create custom QR codes instantly. Works offline, multiple formats supported.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools/qr-code-generator',
    languages: {
      'en-US': 'https://www.digitalmix.dev/tools/qr-code-generator',
    },
  },
}

export default function QRCodeGeneratorPage() {
  return <QRCodeTool />
}
