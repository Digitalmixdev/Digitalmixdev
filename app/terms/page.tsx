import React from 'react'
import { Metadata } from 'next'
import { Scale, CheckCircle2, ShieldAlert, Shield, Users, Database } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

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
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center space-y-3 border-b border-border/60 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
              <Scale size={14} /> Legal & Usage Agreement
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Terms of Service
            </h1>
            <p className="text-muted-foreground text-sm">Last Updated: August 2026</p>
          </div>

          {/* Terms Content */}
          <div className="space-y-6 text-muted-foreground leading-relaxed text-sm sm:text-base">
            <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
                <Scale size={22} className="text-primary" /> 1. Acceptance of Terms
              </h2>
              <p>
                By accessing, browsing, or using any tools provided by DigitalMix, you acknowledge and agree to be bound by these Terms of Service. If you disagree with any part of these terms, you must discontinue using our website and services immediately.
              </p>
            </section>

            <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
                <CheckCircle2 size={22} className="text-emerald-500" /> 2. Fair & Free Commercial / Personal License
              </h2>
              <p>
                All utilities, converters, calculators, and formatters on DigitalMix are provided <strong>100% free of charge</strong> for both personal, commercial, and enterprise workflows. You retain complete, unrestricted ownership of all code, documents, queries, images, and data processed through our tools.
              </p>
            </section>

            <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
                <Users size={22} className="text-blue-500" /> 3. User Accounts & Security
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree not to use the platform for any unlawful activities, malicious reverse engineering, or intentional attempts to disrupt service availability.
              </p>
            </section>

            <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
                <Shield size={22} className="text-indigo-500" /> 4. Local Processing & Zero Liability
              </h2>
              <p>
                Because file conversions and calculations take place directly inside your web browser, DigitalMix does not store, backup, or maintain copies of your inputs. You are solely responsible for keeping independent backups of your important documents, codebases, and assets.
              </p>
            </section>

            <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
                <ShieldAlert size={22} className="text-amber-500" /> 5. Disclaimer of Warranties
              </h2>
              <p>
                DigitalMix is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. While our algorithms undergo continuous verification for precision and compliance, we do not guarantee uninterrupted availability or error-free outputs for mission-critical production operations without your independent validation.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
