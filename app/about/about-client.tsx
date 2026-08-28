'use client'

import React from 'react'
import Link from 'next/link'
import { Shield, Zap, Sparkles, Users, Mail, Compass } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

export function AboutClient() {
  const { t } = useLanguage()

  return (
    <div className="max-w-4xl mx-auto space-y-16">
      {/* 1. Hero / Branding Section */}
      <div className="text-center space-y-4">
        <span className="text-xs font-bold tracking-widest text-primary uppercase px-3.5 py-1 bg-primary/10 rounded-full border border-primary/20">
          {t('about.badge', 'Our Mission')}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          {t('about.title', 'About DigitalMix')}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          {t(
            'about.tagline',
            'A curated suite of fast, 100% free, and privacy-first digital tools engineered for professionals, creators, students, and developers. We eliminate paywalls and complexity so you can focus on getting things done.'
          )}
        </p>
      </div>

      {/* 2. Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border/70 p-6 rounded-2xl space-y-3 shadow-xs hover:border-primary/40 transition-colors">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 w-fit">
            <Zap size={22} />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {t('about.pillar1_title', 'Fast by Design')}
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            {t(
              'about.pillar1_desc',
              'Optimized for instant execution without network delays or server queues, giving you instant results directly in your browser.'
            )}
          </p>
        </div>

        <div className="bg-card border border-border/70 p-6 rounded-2xl space-y-3 shadow-xs hover:border-primary/40 transition-colors">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 w-fit">
            <Shield size={22} />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {t('about.pillar2_title', 'Privacy-First')}
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            {t(
              'about.pillar2_desc',
              'Your data stays strictly on your device. Local in-browser processing guarantees total security and confidentiality.'
            )}
          </p>
        </div>

        <div className="bg-card border border-border/70 p-6 rounded-2xl space-y-3 shadow-xs hover:border-primary/40 transition-colors">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary w-fit">
            <Sparkles size={22} />
          </div>
          <h3 className="text-base font-bold text-foreground">
            {t('about.pillar3_title', '100% Free')}
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            {t(
              'about.pillar3_desc',
              'No subscription paywalls, hidden limits, or mandatory registrations. Built freely for everyone.'
            )}
          </p>
        </div>
      </div>

      {/* 3. The Vision */}
      <div className="bg-card border border-border/70 p-8 rounded-2xl space-y-4 shadow-xs">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
          <Users size={22} className="text-primary" /> {t('about.vision_title', 'Built for Your Daily Digital Workflow')}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          {t(
            'about.vision_desc',
            'DigitalMix was created out of frustration with online tools that are cluttered with intrusive ads, paywalls, or strict limits. Whether you are converting document files, calculating financial metrics, merging PDFs, or formatting code, we strive to provide a clean, high-performance, and privacy-first solution.'
          )}
        </p>
      </div>

      {/* 4. Contact & Support */}
      <div className="border-t border-border/60 pt-12 text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <Mail size={22} className="text-primary" /> {t('about.contact_title', 'Get in Touch')}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {t(
            'about.contact_desc',
            'Have a tool suggestion or discovered an edge-case bug? We love feedback from professionals, engineers, and creators.'
          )}
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
          {t('about.explore_button', 'Explore All Tools')}
        </Link>
      </div>
    </div>
  )
}
