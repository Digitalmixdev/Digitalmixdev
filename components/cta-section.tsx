'use client'

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ALL_TOOLS } from "@/constants/tools"
import { useLanguage } from "@/lib/i18n/context"

export function CTASection() {
  const totalTools = ALL_TOOLS.length
  const { t } = useLanguage()

  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-primary via-primary/95 to-indigo-600 px-6 py-12 sm:px-12 sm:py-16 text-center shadow-2xl shadow-primary/20">
          {/* Ambient Lighting */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 text-balance" suppressHydrationWarning>
            {t('cta.title', 'Ready to Supercharge Your Workflow?')}
          </h2>
          <p className="text-xs sm:text-base text-white/85 max-w-2xl mx-auto mb-7 text-pretty leading-relaxed" suppressHydrationWarning>
            {t('cta.subtitle', 'Join thousands of developers using our free, zero-latency utilities every day. No subscription paywalls or registration required.')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="gap-2 rounded-xl px-7 py-5 text-sm font-bold bg-white text-slate-900 hover:bg-white/90 hover:scale-105 transition-all shadow-xl"
            >
              <Link href="/tools" suppressHydrationWarning>
                {t('cta.explore_all', 'Explore All Tools')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 rounded-xl px-7 py-5 text-sm font-bold bg-black text-white border-white/20 hover:bg-white hover:text-black hover:border-white transition-all shadow-lg"
            >
              <Link href="/signup">
                {t('cta.create_account', 'Create Free Account')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}