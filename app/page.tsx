import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { CategoriesGrid } from "@/components/categories-grid"
import { CTASection } from "@/components/cta-section"
import { StatsSection } from "@/components/stats-section"
import { Footer } from "@/components/footer"
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DigitalMix - Free Digital Tools for Developers',
  description: 'Free digital tools to simplify your data and dev workflow. Database tools, developer utilities, business calculators, and file tools.',
  keywords: ['free tools', 'developer tools', 'json formatter', 'sql tools', 'csv converter', 'regex tester', 'base64 encoder'],
  openGraph: {
    title: 'DigitalMix - Free Digital Tools',
    description: 'Technical solutions and smart tools for developers and creators.',
    url: 'https://www.digitalmix.dev',
    siteName: 'DigitalMix',
    images: [
      {
        url: 'https://www.digitalmix.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DigitalMix Tools',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DigitalMix - Free Developer Tools',
    description: 'Free tools for developers: JSON, SQL, CSV, Regex, and more.',
    images: ['https://www.digitalmix.dev/og-image.png'],
  },
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <CategoriesGrid />
        <CTASection />
        <StatsSection />
      </main>
      <Footer />
    </div>
  )
}
