"use client"

import { Gift, ShieldCheck, Zap } from "lucide-react"

const features = [
  {
    title: "100% Free",
    description: "All utility tools are completely free to use with no hidden tiers or daily limits.",
    icon: Gift,
  },
  {
    title: "Privacy-First",
    description: "Your data never leaves your computer. All processing happens locally inside your browser.",
    icon: ShieldCheck,
  },
  {
    title: "Blazing Fast",
    description: "Built on a modern architecture ensuring instant load times and lightweight execution.",
    icon: Zap,
  },
]

export function StatsSection() {
  return (
    <section className="py-20 sm:py-28 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Why Choose Digital Mix?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with developers in mind, our tools are designed to be fast, secure, and easy to use.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="relative group text-center p-8 rounded-2xl border border-border/50 bg-card hover:bg-secondary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex justify-center mb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <feature.icon className="h-7 w-7" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
