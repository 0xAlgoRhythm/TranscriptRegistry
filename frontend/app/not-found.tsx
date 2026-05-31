import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Compass, Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-6 relative overflow-hidden">
      {/* Decorative backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(108,91,240,0.08),transparent_35%)]" />
      
      <div className="w-full max-w-md text-center space-y-6 bg-card/25 backdrop-blur-md p-8 rounded-2xl border border-border/50 relative">
        {/* Corner Decorators */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-muted-foreground/30" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-muted-foreground/30" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-muted-foreground/30" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-muted-foreground/30" />

        <div className="mx-auto w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
          <Compass className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-mono font-bold tracking-wider uppercase text-foreground">
            RESOURCE NOT FOUND (404)
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The resource you requested does not exist or has been relocated to another cryptographic path.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/" passHref legacyBehavior>
            <Button
              className="w-full bg-[oklch(var(--ca-accent))] text-white hover:bg-[oklch(var(--ca-accent-hover))] font-mono tracking-wider text-xs flex items-center justify-center gap-2 py-4"
            >
              <Home className="h-3.5 w-3.5" /> RETURN TO INTERFACE
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
