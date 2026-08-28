import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { CategoriesGrid } from "@/components/categories-grid"
import { CTASection } from "@/components/cta-section"
import { StatsSection } from "@/components/stats-section"
import { Footer } from "@/components/footer"
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DigitalMix - Free Digital Tools Hub',
  description: 'Free Digital Tools to Simplify Your Data & Dev Workflow. Database tools, office & document converters, business calculators, PDF tools, and developer utilities.',
  keywords: ['free digital tools', 'online utilities', 'pdf tools', 'office converter', 'document converter', 'calorie calculator', 'business calculators', 'KPI calculator', 'ROI calculator', 'developer tools', 'json formatter', 'sql formatter', 'data tools'],
  openGraph: {
    title: 'DigitalMix - Free Digital Tools Hub',
    description: 'Free Digital Tools to Simplify Your Data & Dev Workflow. Smart, privacy-first online tools for everyone.',
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
    title: 'DigitalMix - Free Digital Tools Hub',
    description: 'Free Digital Tools to Simplify Your Data & Dev Workflow.',
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
