import { Metadata } from 'next'
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
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'QR & Barcode Scanner',
            url: 'https://www.digitalmix.dev/tools/qr-barcode-scanner',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            description:
              'Free online QR and Barcode scanner supporting live camera scanning, image upload, and clipboard paste with 100% client-side privacy.',
          }),
        }}
      />
      <QRCodeScannerTool />
    </>
  )
}
