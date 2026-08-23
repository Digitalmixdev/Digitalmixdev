import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { getCurrentUser } from '@/lib/auth/session'
import { SettingsForm } from './settings-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?callbackUrl=/settings')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-10">
        <div className="mx-auto max-w-4xl space-y-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your account details, security, and workspace preferences.
            </p>
          </div>

          <SettingsForm user={user} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
