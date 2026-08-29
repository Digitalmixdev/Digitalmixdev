"use client"

import { LazyMotion, domAnimation, m } from "framer-motion"
import { Sparkles } from "lucide-react"
import { SearchBox } from "@/components/search-box"
import { useLanguage } from "@/lib/i18n/context"

const heroVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

export function HeroSection() {
  const { t, language } = useLanguage()

  return (
    <section className="relative overflow-visible">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-20 right-1/4 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-10 sm:pt-16 sm:pb-12 lg:pt-20 lg:pb-16">
        <LazyMotion features={domAnimation} strict>
          <m.div
            className="mx-auto max-w-3xl text-center"
            variants={heroVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <m.div
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground"
              variants={itemVariants}
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span>{t('hero.badge', '18+ Essential Tools Launched')}</span>
            </m.div>

            {/* Heading */}
            <m.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance leading-tight"
              variants={itemVariants}
              suppressHydrationWarning
            >
              {language === 'ar' ? (
                <>
                  أدوات رقمية مجانية <span className="text-primary">لتسهيل</span> وإنجاز مهامك اليومية
                </>
              ) : (
                <>
                  Free Digital Tools to <span className="text-primary">Simplify</span> Your Data & Dev Workflow
                </>
              )}
            </m.h1>

            {/* Subheading */}
            <m.p
              className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed"
              variants={itemVariants}
              suppressHydrationWarning
            >
              {t(
                'hero.subheading',
                'Powerful, privacy-focused utilities for developers. No sign-up required. Process files locally, convert data instantly, and boost your productivity.',
              )}
            </m.p>

            {/* Search Bar */}
            <m.div variants={itemVariants}>
              <SearchBox />
            </m.div>
          </m.div>
        </LazyMotion>
      </div>
    </section>
  )
}
