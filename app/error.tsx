'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Route error intercepted:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl border border-border/80 bg-card shadow-2xl text-center space-y-6 animate-in fade-in-0 duration-300">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Something Went Wrong</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {error?.message || 'An error occurred while rendering this view. Your tool inputs remain safe in local memory.'}
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded border border-border/60 inline-block">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="flex-1 h-10 text-xs font-bold gap-2 rounded-xl shadow-md shadow-primary/20"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Try Again
          </Button>
          <Button asChild variant="outline" className="h-10 text-xs font-semibold gap-2 rounded-xl border-border">
            <Link href="/">
              <Home className="h-3.5 w-3.5" /> Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
