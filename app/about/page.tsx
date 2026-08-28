import React from 'react'
import { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { AboutClient } from './about-client'

export const metadata: Metadata = {
  title: 'About Us & Contact | DigitalMix',
  description:
    'Learn more about DigitalMix — a privacy-first hub offering fast, free digital tools, document converters, financial calculators, PDF utilities, and developer suites.',
  keywords: ['About DigitalMix', 'Free digital tools', 'Online file converters', 'Business calculators', 'Privacy-first utilities', 'Contact DigitalMix'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/about',
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <AboutClient />
      </main>
      <Footer />
    </div>
  )
}