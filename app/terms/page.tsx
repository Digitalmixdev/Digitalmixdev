import React from 'react'
import { Metadata } from 'next'
import { Scale, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Terms of Service | DigitalMix',
  description:
    'Read the terms of service for utilizing DigitalMix tools and platforms safely and legally.',
  keywords: ['terms of service', 'terms and conditions', 'legal', 'DigitalMix terms', 'user agreement'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/terms',
  },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center space-y-3 border-b border-border/60 pb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Terms of Service
            </h1>
            <p className="text-muted-foreground text-sm">Last Updated: May 2026</p>
          </div>

          {/* Terms Content */}
          <div className="space-y-6 text-muted-foreground leading-relaxed text-sm sm:text-base">
            <section className="space-y-3 p-6 rounded-2xl bg-card border border-border/70 shadow-xs">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Scale size={20} className="text-primary" /> 1. Acceptance of Terms
              </h2>
              <p>
                By accessing and using DigitalMix, you agree to these Terms of Service. If you disagree with any part of these terms, please discontinue using the platform and services.
              </p>
            </section>

            <section className="space-y-3 p-6 rounded-2xl bg-card border border-border/70 shadow-xs">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-500" /> 2. Fair & Free Use License
              </h2>
              <p>
                All utilities provided on DigitalMix are 100% free for personal, educational, and commercial purposes. You may format, convert, encode, and process your proprietary or open-source files without licensing fees.
              </p>
            </section>

            <section className="space-y-3 p-6 rounded-2xl bg-card border border-border/70 shadow-xs">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ShieldAlert size={20} className="text-amber-500" /> 3. Warranty Disclaimer
              </h2>
              <p>
                DigitalMix is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind. While our algorithms are tested for high mathematical accuracy, users remain responsible for validating outputs before deployment in mission-critical production environments.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}