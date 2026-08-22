import React from 'react'
import { Loader2, Wrench } from 'lucide-react'

export default function GlobalLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-6">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
          <Wrench className="h-7 w-7" />
        </div>
        <div className="absolute -inset-2 rounded-3xl border-2 border-primary/30 border-t-primary animate-spin" />
      </div>

      <div className="text-center space-y-1.5 max-w-xs">
        <p className="text-sm font-bold text-foreground tracking-tight flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Loading DigitalMix Engine...
        </p>
        <p className="text-xs text-muted-foreground font-mono">
          Mounting client-side WebAssembly & Web Crypto...
        </p>
      </div>

      {/* Skeleton placeholders */}
      <div className="w-full max-w-md space-y-2.5 pt-4">
        <div className="h-4 bg-muted/60 rounded-lg animate-pulse w-3/4 mx-auto" />
        <div className="h-3 bg-muted/40 rounded-lg animate-pulse w-1/2 mx-auto" />
      </div>
    </div>
  )
}
