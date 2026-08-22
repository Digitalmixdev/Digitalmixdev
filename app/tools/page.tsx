import { Metadata } from 'next'
import Script from 'next/script'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ToolsDirectory } from '@/components/tools-directory'
import { ALL_TOOLS } from '@/constants/tools'

export const metadata: Metadata = {
  title: 'All Developer & Business Tools | DigitalMix',
  description:
    'Free, fast, and privacy-first online tools for developers and businesses. SQL formatters, JSON validators, JWT decoders, UUID generators, PDF merger, QR code generator, and ROI calculators.',
  keywords: [
    'developer tools',
    'free tools',
    'online utilities',
    'sql formatter',
    'json formatter',
    'csv to json',
    'jwt decoder',
    'base64 encoder',
    'uuid generator',
    'hash generator',
    'regex tester',
    'kpi calculator',
    'pdf merge',
    'qr code generator',
  ],
  alternates: {
    canonical: 'https://www.digitalmix.dev/tools',
  },
  openGraph: {
    title: 'All Developer & Business Tools | DigitalMix',
    description:
      'Explore free, high-performance developer utilities and financial calculators.',
    type: 'website',
    url: 'https://www.digitalmix.dev/tools',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DigitalMix Tools Directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Developer & Business Tools | DigitalMix',
    description:
      'Free, privacy-focused online developer utilities and financial calculators.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function ToolsIndexPage() {
  const siteUrl = 'https://www.digitalmix.dev'

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${siteUrl}/tools#webpage`,
        name: 'All Developer & Business Tools | DigitalMix',
        description:
          'Comprehensive directory of free online developer utilities, database tools, and financial calculators.',
        url: `${siteUrl}/tools`,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: ALL_TOOLS.map((tool, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'WebApplication',
              '@id': `${siteUrl}${tool.href}`,
              name: tool.name,
              url: `${siteUrl}${tool.href}`,
              description: tool.description,
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Any',
            },
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Tools', item: `${siteUrl}/tools` },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Script
        id="tools-directory-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        suppressHydrationWarning
      />
      <Header />
      <main className="flex-1">
        <ToolsDirectory />
      </main>
      <Footer />
    </div>
  )
}
