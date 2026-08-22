'use client'

import React, { useEffect } from 'react'
import { AlertOctagon, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global application crash intercepted:', error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0c10] text-[#f0f3f6] font-sans antialiased flex items-center justify-center p-4 selection:bg-blue-500/30 selection:text-blue-200">
        <div className="max-w-md w-full p-8 rounded-3xl border border-red-500/20 bg-[#12161f]/80 backdrop-blur-xl shadow-2xl text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertOctagon className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Critical System Error</h1>
            <p className="text-xs text-gray-400 leading-relaxed">
              An unexpected critical exception occurred. The runtime was isolated safely to prevent data corruption.
            </p>
            {error?.digest && (
              <p className="text-[10px] font-mono text-gray-500 bg-[#0a0c10] px-2.5 py-1 rounded-lg border border-gray-800 inline-block">
                Digest: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="flex-1 h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reload Application
            </button>
            <a
              href="/"
              className="h-11 px-5 rounded-xl border border-gray-700 hover:bg-gray-800/60 text-gray-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Home className="h-3.5 w-3.5" /> Home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
