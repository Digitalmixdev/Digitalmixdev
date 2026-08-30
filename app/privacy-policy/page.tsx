import React from 'react'
import { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { PrivacyClient } from './privacy-client'

export const metadata: Metadata = {
  title: 'Privacy Policy | DigitalMix',
  description:
    'Our privacy policy: 100% Client-Side processing guarantee, zero server file uploads, and full user control over activity history and account data.',
  keywords: ['privacy policy', 'data security', 'secure tools', 'DigitalMix privacy', 'client-side privacy', 'zero logging'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/privacy-policy',
  },
  openGraph: {
    title: 'Privacy Policy & Data Security | DigitalMix',
    description:
      'Your files and data never leave your browser. Read how DigitalMix guarantees 100% local processing, zero server storage, and complete user privacy.',
    type: 'website',
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <PrivacyClient />
      </main>
      <Footer />
    </div>
  )
}

