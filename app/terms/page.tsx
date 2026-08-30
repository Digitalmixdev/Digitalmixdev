import React from 'react'
import { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { TermsClient } from './terms-client'

export const metadata: Metadata = {
  title: 'Terms of Service | DigitalMix',
  description:
    'Read the terms of service and fair use guidelines for utilizing DigitalMix free developer tools and utilities.',
  keywords: ['terms of service', 'terms and conditions', 'legal', 'DigitalMix terms', 'user agreement', 'fair use'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/terms',
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <TermsClient />
      </main>
      <Footer />
    </div>
  )
}

