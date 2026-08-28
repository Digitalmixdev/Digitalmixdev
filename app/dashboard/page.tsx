import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { getCurrentUser } from "@/lib/auth/session"
import { getUserStats } from "@/lib/dal/stats"
import { DashboardContent } from "./dashboard-content"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login?callbackUrl=/dashboard")
  }

  const stats = await getUserStats(user.id)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <DashboardContent user={user} stats={stats} />
      </main>
      <Footer />
    </div>
  )
}
