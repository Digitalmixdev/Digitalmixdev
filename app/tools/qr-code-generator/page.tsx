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
  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <QRCodeTool />

        {/* SEO Content */}
        <div className="mt-16 space-y-8 prose dark:prose-invert max-w-none">
          <section>
            <h2 className="text-3xl font-bold mb-4">Free QR Code Generator</h2>
            <p className="text-lg text-muted-foreground mb-4">
              Create professional QR codes for any purpose. Whether you need QR codes for marketing, WiFi sharing, contact information, or any other use case, our free online generator makes it simple.
            </p>
          </section>

          <section>
            <h3 className="text-2xl font-bold mb-4">Features</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Multiple QR code types: URLs, text, emails, phone numbers, SMS, WiFi, and vCards</li>
              <li>Customizable colors for foreground and background</li>
              <li>Adjustable size and error correction levels</li>
              <li>Download in PNG, SVG, or JPEG formats</li>
              <li>Works completely offline - no server required</li>
              <li>Instant generation with live preview</li>
              <li>Share functionality for easy distribution</li>
              <li>Add to favorites for quick access</li>
            </ul>
          </section>

          <section>
            <h3 className="text-2xl font-bold mb-4">QR Code Types Supported</h3>
            <div className="grid md:grid-cols-2 gap-4 text-muted-foreground">
              <div>
                <h4 className="font-semibold mb-2">URL</h4>
                <p>Link to websites and web applications</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Text</h4>
                <p>Encode any text message or data</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Email</h4>
                <p>Create mailto links for email contact</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Phone</h4>
                <p>Generate phone call links</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">SMS</h4>
                <p>Share messages via text message</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">WiFi</h4>
                <p>Share WiFi network credentials</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">vCard</h4>
                <p>Digital business cards and contact info</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-bold mb-4">How to Use</h3>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Select the QR code type that matches your use case</li>
              <li>Enter the data you want to encode (URL, text, contact info, etc.)</li>
              <li>Customize the colors and size to match your branding</li>
              <li>Preview the QR code in real-time</li>
              <li>Download in your preferred format (PNG, SVG, or JPEG)</li>
              <li>Share the QR code or the encoded data</li>
            </ol>
          </section>

          <section>
            <h3 className="text-2xl font-bold mb-4">Use Cases</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li><strong>Marketing</strong>: Direct customers to campaigns, landing pages, or product links</li>
              <li><strong>WiFi Sharing</strong>: Let guests connect to your WiFi by scanning a code</li>
              <li><strong>Business Cards</strong>: Add vCard QR codes to your business cards</li>
              <li><strong>Events</strong>: Simplify check-in and ticket distribution</li>
              <li><strong>Restaurants</strong>: Share menus and order links</li>
              <li><strong>Retail</strong>: Link to product pages and promotions</li>
              <li><strong>Education</strong>: Share course materials and resources</li>
              <li><strong>Contact Sharing</strong>: Quickly exchange contact information</li>
            </ul>
          </section>

          <section>
            <h3 className="text-2xl font-bold mb-4">Offline Capability</h3>
            <p className="text-muted-foreground">
              This QR code generator works completely offline. Once loaded, it doesn&apos;t require any internet connection to generate, preview, or download QR codes. Perfect for use in any environment, including presentations, field work, or areas with limited connectivity.
            </p>
          </section>

          <section>
            <h3 className="text-2xl font-bold mb-4">Error Correction Levels</h3>
            <div className="grid md:grid-cols-4 gap-4 text-muted-foreground text-sm">
              <div>
                <h4 className="font-semibold mb-2">Low (7%)</h4>
                <p>For simple applications with minimal damage risk</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Medium (15%)</h4>
                <p>Best balance for most use cases</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Quartile (25%)</h4>
                <p>For outdoor or printed materials</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">High (30%)</h4>
                <p>Maximum redundancy for harsh environments</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
