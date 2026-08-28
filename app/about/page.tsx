import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { Shield, Zap, Sparkles, Users, Mail, Compass } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'About Us & Contact | DigitalMix',
  description:
    'Learn more about DigitalMix — a privacy-first platform offering free online digital tools, office converters, calculators, PDF utilities, and developer suites.',
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
        <div className="max-w-4xl mx-auto space-y-16">
          {/* 1. Hero / Branding Section */}
          <div className="text-center space-y-4">
            <span className="text-xs font-bold tracking-widest text-primary uppercase px-3.5 py-1 bg-primary/10 rounded-full border border-primary/20">
              Our Mission
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              About DigitalMix
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              A curated suite of lightning-fast, 100% free, and privacy-first digital utilities engineered for professionals, developers, data analysts, content creators, and students. We eliminate latency and complexity so you can streamline your daily workflow.
            </p>
          </div>

          {/* 2. Core Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border/70 p-6 rounded-2xl space-y-3 shadow-xs hover:border-primary/40 transition-colors">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 w-fit">
                <Zap size={22} />
              </div>
              <h3 className="text-base font-bold text-foreground">Fast by Design</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Optimized for instant execution without network delays or server queues, giving you instant results directly in your browser.
              </p>
            </div>

            <div className="bg-card border border-border/70 p-6 rounded-2xl space-y-3 shadow-xs hover:border-primary/40 transition-colors">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 w-fit">
                <Shield size={22} />
              </div>
              <h3 className="text-base font-bold text-foreground">Privacy-First</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Your data stays strictly on your device. Local in-browser processing guarantees total security and confidentiality.
              </p>
            </div>

            <div className="bg-card border border-border/70 p-6 rounded-2xl space-y-3 shadow-xs hover:border-primary/40 transition-colors">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit">
                <Sparkles size={22} />
              </div>
              <h3 className="text-base font-bold text-foreground">100% Free</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                No subscription paywalls, hidden limits, or mandatory registrations. Built freely for everyone.
              </p>
            </div>
          </div>

          {/* 3. The Vision */}
          <div className="bg-card border border-border/70 p-8 rounded-2xl space-y-4 shadow-xs">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
              <Users size={22} className="text-primary" /> Built for Your Daily Digital Workflow
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              DigitalMix was created out of frustration with online tools that are cluttered with intrusive ads, paywalls, or strict limits. Whether you are converting document files, calculating financial metrics, merging PDFs, or formatting code, we strive to provide a clean, high-performance, and privacy-first solution.
            </p>
          </div>

          {/* 4. Contact & Support */}
          <div className="border-t border-border/60 pt-12 text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Mail size={22} className="text-primary" /> Get in Touch
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Have a tool suggestion or discovered an edge-case bug? We love feedback from engineers and creators.
            </p>
            <div className="pt-2">
              <a
                href="mailto:digitalmixcontact@gmail.com"
                className="inline-flex items-center gap-2 text-primary hover:underline font-mono text-sm bg-primary/5 border border-primary/20 px-4 py-2 rounded-xl transition-colors"
              >
                digitalmixcontact@gmail.com
              </a>
            </div>
          </div>

          {/* 5. Call to Action */}
          <div className="flex justify-center pt-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Compass size={18} />
              Explore All Tools
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}