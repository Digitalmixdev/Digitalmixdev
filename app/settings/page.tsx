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
          <SettingsForm user={user} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
