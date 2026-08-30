import React from 'react'
import { Metadata } from 'next'
import { ShieldCheck, EyeOff, Lock, ServerOff, FileText, Database, UserCheck, Trash2, History } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Privacy Policy | DigitalMix',
  description:
    'Our privacy policy: 100% Client-Side processing guarantee, zero server file uploads, and full user control over activity history and account data.',
  keywords: ['privacy policy', 'data security', 'secure tools', 'DigitalMix privacy', 'client-side privacy', 'zero logging'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/privacy-policy',
  },
  openGraph: {
    title: 'Privacy Policy & Data Security | DigitalMix',
    description:
      'Your files and data never leave your browser. Read how DigitalMix guarantees 100% local processing, zero server storage, and complete user privacy.',
    type: 'website',
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header */}
          <div className="text-center space-y-3 border-b border-border/60 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck size={14} /> Comprehensive Data Privacy
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Privacy Policy & Data Security
            </h1>
            <p className="text-muted-foreground text-sm">Last Updated & Reviewed: August 2026</p>
          </div>

          {/* Core Privacy Highlight */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row gap-5 items-start shadow-xs">
            <div className="p-3 bg-emerald-500/20 rounded-xl shrink-0 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-lg">
                Our Absolute Client-Side & Zero-Upload Guarantee
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                DigitalMix is engineered with a strict <strong>zero-cloud-dependency & client-side</strong> architecture. All file conversions (Word, Excel, PowerPoint, PDF, Images), code beautification (SQL, JSON), barcode/QR scanning, cryptographic hashing, and calculations occur <strong>100% inside your local web browser</strong>. Your raw files and sensitive payloads are <strong>never transmitted to, stored on, or inspected by our servers</strong>.
              </p>
            </div>
          </div>

          {/* Policy Sections */}
          <div className="space-y-6 text-muted-foreground leading-relaxed text-sm sm:text-base">
            {/* 1. Client-Side Processing */}
            <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
                <ServerOff size={22} className="text-primary" /> 1. Zero Server-Side File Processing
              </h2>
              <p>
                When you upload a document (such as <code>.docx</code>, <code>.pptx</code>, <code>.xlsx</code>, <code>.pdf</code>, <code>.png</code>, <code>.jpg</code>, <code>.svg</code>), the entire conversion and rendering pipeline runs purely through browser technologies (WebAssembly, HTML5 Canvas, and client-side JavaScript). We do not operate backend servers that receive, copy, or retain your files.
              </p>
            </section>

            {/* 2. Activity History & Local Storage */}
            <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
                <History size={22} className="text-blue-500" /> 2. Activity History & User Control
              </h2>
              <p>
                To enhance your productivity, DigitalMix records your recent tool activities (such as formatted SQL/JSON queries, generated QR codes, and conversion summaries) in your browser’s <strong>Local Storage (localStorage)</strong>.
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-foreground/90">
                <li><strong>Individual Deletion:</strong> You can delete any single item from the tool history or dashboard at any moment.</li>
                <li><strong>Clear All History:</strong> You can purge your entire activity history with a single click in the Dashboard or within individual tools.</li>
                <li><strong>Data Export:</strong> You have full rights to export your activity logs as clean JSON or CSV files for your personal backup.</li>
              </ul>
            </section>

            {/* 3. Account Data & Authentication */}
            <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
                <UserCheck size={22} className="text-emerald-500" /> 3. User Accounts & Credentials
              </h2>
              <p>
                Creating an account on DigitalMix is entirely optional. If you choose to register an account:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-foreground/90">
                <li>We securely store your basic profile information (Name, Email) and encrypted password hashes using industry-standard hashing algorithms (bcrypt/argon2).</li>
                <li>Your credentials are used solely to authenticate your sessions and synchronize your tool preferences/favorites across devices.</li>
                <li>We do <strong>not</strong> sell, rent, or trade user account information with any third parties or advertisers.</li>
              </ul>
            </section>

            {/* 4. Cookies & Anonymous Telemetry */}
            <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
                <EyeOff size={22} className="text-amber-500" /> 4. Cookies & Anonymous Analytics
              </h2>
              <p>
                We use secure HTTP-only cookies strictly for session authentication and user preferences (such as light/dark mode and language selection). We may use privacy-respecting aggregate analytics to measure overall website speed, uptime, and page visits. No personal data, file contents, or query payloads are ever collected through analytics.
              </p>
            </section>

            {/* 5. User Rights & Data Erasure */}
            <section className="space-y-3 p-6 sm:p-7 rounded-2xl bg-card border border-border/70 shadow-xs">
              <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2.5">
                <Trash2 size={22} className="text-destructive" /> 5. Right to Erasure (GDPR & CCPA Compliance)
              </h2>
              <p>
                Under global privacy laws (including GDPR and CCPA), you hold full ownership of your data. You may at any time delete your account and all associated records directly from your <strong>Settings</strong> page, or purge your browser storage to remove all traces immediately.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
