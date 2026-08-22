import React from 'react'
import { Metadata } from 'next'
import { ShieldCheck, EyeOff, Lock, ServerOff } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Privacy Policy | DigitalMix',
  description:
    'Our privacy policy is simple: Your data never leaves your browser. Read how DigitalMix guarantees 100% local, secure data processing.',
  keywords: ['privacy policy', 'data security', 'secure tools', 'DigitalMix privacy', 'client-side privacy'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/privacy-policy',
  },
  openGraph: {
    title: 'Privacy Policy & Data Security | DigitalMix',
    description:
      'Your data never leaves your browser. Read how DigitalMix guarantees 100% local, secure data processing and absolute privacy.',
    type: 'website',
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center space-y-3 border-b border-border/60 pb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Privacy Policy & Security
            </h1>
            <p className="text-muted-foreground text-sm">Last Updated: May 2026</p>
          </div>

          {/* Core Privacy Highlight */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex gap-4 items-start shadow-xs">
            <ShieldCheck className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-1" size={26} />
            <div className="space-y-1">
              <h4 className="font-bold text-emerald-700 dark:text-emerald-300 text-base">
                Our Absolute Client-Side Guarantee
              </h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                DigitalMix is engineered with a strict privacy-first architecture. All parsing, hashing, formatting, converting, and resizing occurs entirely within your local browser runtime. Your inputs, tokens, and files are never transmitted to or logged on our servers.
              </p>
            </div>
          </div>

          {/* Policy Sections */}
          <div className="space-y-8 text-muted-foreground leading-relaxed text-sm sm:text-base">
            <section className="space-y-3 p-6 rounded-2xl bg-card border border-border/70 shadow-xs">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ServerOff size={20} className="text-primary" /> 1. Zero Input Logging
              </h2>
              <p>
                We do not collect, retain, or monitor the contents of your SQL queries, JSON files, JWT tokens, images, or regular expressions. As soon as you refresh or close your browser tab, all ephemeral memory buffers are instantly purged by your operating system.
              </p>
            </section>

            <section className="space-y-3 p-6 rounded-2xl bg-card border border-border/70 shadow-xs">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Lock size={20} className="text-primary" /> 2. Local Storage & Preferences
              </h2>
              <p>
                Certain features (such as your preferred color theme or favorited tools) may be persisted locally in your browser’s localStorage or securely tied to your authenticated profile if you choose to create an account. No sensitive payload data is stored.
              </p>
            </section>

            <section className="space-y-3 p-6 rounded-2xl bg-card border border-border/70 shadow-xs">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <EyeOff size={20} className="text-primary" /> 3. Anonymous Analytics
              </h2>
              <p>
                We use privacy-friendly aggregated analytics (such as Vercel Analytics and Google Analytics) strictly to monitor high-level traffic metrics, measure page load performance, and identify platform uptime. No personal identifiers or payload queries are collected.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}