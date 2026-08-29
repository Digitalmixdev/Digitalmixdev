import Link from "next/link"
import {
  Star,
  Code,
  FileCode,
  FileText,
  Layers,
  Binary,
  Shield,
  Key,
  Fingerprint,
  BarChart3,
  Calculator,
  Maximize2,
  QrCode,
  ScanLine,
  RefreshCw,
  Flame,
  FileArchive,
  Image as ImageIcon,
  ArrowLeft,
  Sparkles,
} from "lucide-react"
import { getFavoriteTools } from "@/actions/favorites"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

const iconMap: Record<string, any> = {
  Code,
  FileCode,
  FileText,
  Layers,
  Binary,
  Shield,
  Key,
  Fingerprint,
  BarChart3,
  Calculator,
  Maximize2,
  QrCode,
  ScanLine,
  RefreshCw,
  Flame,
  FileArchive,
  Image: ImageIcon,
}

export default async function FavoritesPage() {
  const favoriteTools = await getFavoriteTools()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/tools"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tools Directory
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Star className="h-7 w-7 fill-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Favorite Tools</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Quick access to your pinned utilities and calculators.
            </p>
          </div>
        </div>

        {favoriteTools.length === 0 ? (
          <div className="text-center py-20 px-4 border-2 border-dashed border-border/60 rounded-2xl bg-card/40 max-w-2xl mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 opacity-60" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No favorites yet</h3>
            <p className="text-muted-foreground mt-2 mb-6 max-w-md mx-auto text-sm">
              Explore our developer tools and star your most-used utilities for instant 1-click access.
            </p>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm"
            >
              <Sparkles className="h-4 w-4" />
              Browse Tools Directory
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteTools.map((tool) => {
              const Icon = iconMap[tool.icon] || Code

              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group p-6 border border-border/60 rounded-2xl bg-card hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors truncate">
                          {tool.name}
                        </h2>
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                        {tool.description}
                      </p>
                      <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-primary font-medium">
                        <span>Open Tool</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
