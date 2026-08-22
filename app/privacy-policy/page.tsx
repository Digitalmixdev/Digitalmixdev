import React from 'react'
import { Metadata } from 'next'
import { Shield, EyeOff, Lock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | DigitalMix',
  description: 'Our privacy policy is simple: Your data never leaves your browser. Read how DigitalMix guarantees 100% local, secure data processing.',
  keywords: ['privacy policy', 'data security', 'secure tools', 'DigitalMix privacy', 'client-side privacy'],
  alternates: {
    canonical: 'https://www.digitalmix.dev/privacy-policy',
  },
  openGraph: {
    title: 'Privacy Policy & Data Security | DigitalMix',
    description: 'Your data never leaves your browser. Read how DigitalMix guarantees 100% local, secure data processing and absolute privacy.',
    type: 'website',
  }
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-3 border-b border-slate-800 pb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">Last Updated: May 2026</p>
        </div>

        {/* Highlight Card */}
        <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-xl flex gap-4 items-start">
          <Shield className="text-blue-500 shrink-0 mt-1" size={24} />
          <div>
            <h4 className="font-semibold text-blue-400 mb-1">Our Privacy Commitment</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              DigitalMix is built with a privacy-first philosophy. Most of our tools process data directly within your browser, meaning your files, code snippets, SQL queries, and formatted content are not uploaded to our servers.
              <strong>We believe that utility tools should be fast, secure, and respectful of user privacy</strong>.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6 text-slate-300 leading-relaxed text-sm md:text-base">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <EyeOff size={18} className="text-blue-500" /> 1. Data Collection
            </h2>
            <p>
              We do not collect personal data or input logs from our tools. Any text or code you paste into tools like the SQL Formatter is instantly processed locally and destroyed as soon as you close or refresh the page.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Lock size={18} className="text-blue-500" /> 2. Google AdSense & Cookies
            </h2>
            <p>
              DigitalMix may display advertisements provided by Google AdSense and other advertising partners. These services may use cookies and similar technologies to show relevant advertisements, measure campaign performance, and improve the overall advertising experience.
            </p>
            <p>
              Google may use the DART cookie to serve ads based on your visits to this website and other websites across the internet. You can learn more about Google's advertising practices and manage your advertising preferences through Google's advertising settings.
            </p>
            <p>
              The advertisements displayed on DigitalMix are managed by third-party providers, and we do not control the specific content of those advertisements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-100">3. Third-Party Analytics</h2>
            <p>
              DigitalMix uses analytics services such as Google Analytics to better understand how visitors interact with the website. These services help us measure traffic, identify popular tools, improve performance, and enhance the overall user experience.
            </p>
            <p>
              The information collected is anonymous and may include general usage data such as visited pages, device type, browser information, and session duration. We do not use analytics services to collect or store the content processed inside our tools.
            </p>
          </section>
        </div>

      </div>
    </main>
  )
}