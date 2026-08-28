"use client"

import { Gift, ShieldCheck, Zap } from "lucide-react"
import { useLanguage } from "@/lib/i18n/context"

export function StatsSection() {
  const { t } = useLanguage()

  const features = [
    {
      title: t('stats.free_title', '100% Free'),
      description: t('stats.free_desc', 'All utility tools are completely free to use with no hidden tiers or daily limits.'),
      icon: Gift,
    },
    {
      title: t('stats.privacy_title', 'Privacy-First'),
      description: t('stats.privacy_desc', 'Your data never leaves your computer. All processing happens locally inside your browser.'),
      icon: ShieldCheck,
    },
    {
      title: t('stats.speed_title', 'Blazing Fast'),
      description: t('stats.speed_desc', 'Built on a modern architecture ensuring instant load times and lightweight execution.'),
      icon: Zap,
    },
  ]

  return (
    <section className="py-16 sm:py-24 border-t border-border/50 bg-radial from-primary/5 via-transparent to-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1 rounded-full border border-primary/20">
            {t('stats.badge', 'Core Philosophy')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mt-3">
            {t('stats.title', 'Why Modern Developers Choose DigitalMix')}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto text-pretty">
            {t('stats.subtitle', 'Built with uncompromising privacy, lightweight footprint, and zero cloud dependency.')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="relative group text-center p-7 sm:p-8 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xs hover:bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/40 hover:-translate-y-1"
            >
              <div className="flex justify-center mb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 shadow-inner transition-all duration-300">
                  <feature.icon className="h-6 w-6" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
