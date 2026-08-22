import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 sm:px-12 sm:py-20 text-center">
          {/* Background Pattern */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary-foreground mb-4">
            Ready to boost your productivity?
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Start using our free tools today and streamline your development workflow.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="gap-2 rounded-xl px-8 py-6 text-base font-medium"
          >
            <Link href="/signup">
              Get Started for Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}