import { redirect } from "next/navigation"
import Link from "next/link"
import { History, Star, Settings, Zap } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { UserMenu } from "@/components/user-menu"
import { getSession } from "@/lib/auth/session"
import { getUserStats } from "@/lib/dal/stats"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard")
  }

  const { user } = session
  const stats = await getUserStats(user.id)

  const displayName = user.name || user.email.split("@")[0] || "Developer"

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Welcome Card */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {displayName}!
              </h1>
              <p className="text-muted-foreground text-sm mt-1 font-mono">
                {user.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <UserMenu />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border p-5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.toolsUsedCount}</p>
                  <p className="text-xs text-muted-foreground">Tools Used</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border p-5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <History className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.historyCount}</p>
                  <p className="text-xs text-muted-foreground">History Items</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border p-5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.favoritesCount}</p>
                  <p className="text-xs text-muted-foreground">Favorites</p>
                </div>
              </div>
            </div>
            <div className="bg-card border border-border p-5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">Free</p>
                  <p className="text-xs text-muted-foreground">Plan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border p-6 rounded-xl">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <History className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Saved History</h3>
              <p className="text-muted-foreground text-sm">
                Your formatted queries and tool histories will appear here.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-3 italic">Coming Soon</p>
            </div>
            <Link
              href="/favorites"
              className="bg-card border border-border p-6 rounded-xl hover:border-primary/50 transition-colors group"
            >
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Star className="h-5 w-5 text-amber-500" />
              </div>

              <h3 className="font-semibold text-foreground mb-2">Favorites</h3>

              <p className="text-muted-foreground text-sm">
                Save your most-used tools for quick access.
              </p>

              <p className="text-xs text-muted-foreground/60 mt-3 italic">
                View Favorites
              </p>
            </Link>
            <div className="bg-card border border-border p-6 rounded-xl">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                <Settings className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Settings</h3>
              <p className="text-muted-foreground text-sm">
                Customize your experience and preferences.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-3 italic">Coming Soon</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}