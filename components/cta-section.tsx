import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-primary via-primary/95 to-indigo-600 px-6 py-12 sm:px-12 sm:py-16 text-center shadow-2xl shadow-primary/20">
          {/* Ambient Lighting */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 text-balance">
            Ready to Supercharge Your Workflow?
          </h2>
          <p className="text-xs sm:text-base text-white/85 max-w-2xl mx-auto mb-7 text-pretty leading-relaxed">
            Join thousands of developers using our free, zero-latency utilities every day. No subscription paywalls or registration required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="gap-2 rounded-xl px-7 py-5 text-sm font-bold bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all shadow-xl"
            >
              <Link href="/tools">
                Explore All 14 Tools
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 rounded-xl px-7 py-5 text-sm font-bold text-white border-white/30 hover:bg-white/10 transition-all"
            >
              <Link href="/signup">
                Create Free Account
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}