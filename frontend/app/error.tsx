"use client"

import React, { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertOctagon, RotateCcw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application Error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-6 relative overflow-hidden">
      {/* Decorative backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(239,68,68,0.1),transparent_35%)]" />
      
      <div className="w-full max-w-md text-center space-y-6 bg-card/25 backdrop-blur-md p-8 rounded-2xl border border-[oklch(var(--ca-destructive)/0.25)] relative">
        {/* Corner Decorators */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[oklch(var(--ca-destructive)/0.4)]" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[oklch(var(--ca-destructive)/0.4)]" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[oklch(var(--ca-destructive)/0.4)]" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[oklch(var(--ca-destructive)/0.4)]" />

        <div className="mx-auto w-12 h-12 rounded-full bg-[oklch(var(--ca-destructive)/0.15)] flex items-center justify-center text-[oklch(var(--ca-destructive))]">
          <AlertOctagon className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-mono font-bold tracking-wider uppercase text-foreground">
            SYSTEM EXCEPTION
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            An unexpected runtime error has occurred. Details have been logged to the telemetry console.
          </p>
        </div>

        {error.digest && (
          <div className="p-2 border border-border/40 rounded bg-muted/20 text-[10px] font-mono text-muted-foreground uppercase">
            Digest ID: {error.digest}
          </div>
        )}

        <div className="pt-2">
          <Button
            onClick={() => reset()}
            className="w-full bg-[oklch(var(--ca-accent))] text-white hover:bg-[oklch(var(--ca-accent-hover))] font-mono tracking-wider text-xs flex items-center justify-center gap-2 py-4"
          >
            <RotateCcw className="h-3.5 w-3.5" /> RESTART INSTANCE
          </Button>
        </div>
      </div>
    </div>
  )
}
