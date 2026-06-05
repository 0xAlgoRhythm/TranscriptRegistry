"use client"

import { usePrivy } from "@privy-io/react-auth"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"
import type { ReactNode } from "react"
import { Lock, ShieldAlert, Sparkles, Network } from "lucide-react"

interface AuthGateProps {
  children: ReactNode
}

export function AuthGate({ children }: AuthGateProps) {
  const { ready, authenticated, login } = usePrivy()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ca-accent border-t-transparent" />
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen w-full bg-background relative overflow-hidden">
        {/* Decorative Grid Backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(108,91,240,0.15),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Left — Brand Panel */}
        <div className="relative hidden w-1/2 flex-col justify-between p-16 border-r border-border/40 lg:flex">
          <div className="relative z-10">
            <Logo size="md" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-ca-accent/30 bg-ca-accent/5 px-3 py-1 text-xs font-mono text-ca-accent w-fit">
                <Network className="h-3.5 w-3.5" /> SECURED BY ETHEREUM
              </div>
              <h2 className="text-4xl font-display font-light leading-[1.15] tracking-tight text-foreground max-w-lg">
                Decentralised academic verification.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Verify, issue, and manage academic transcripts using cryptographically secure on-chain records. Free from intermediaries and institutional delays.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4 text-xs font-mono text-muted-foreground/60">
            <span>PLATFORM VERSION 2.0.0</span>
            <span>•</span>
            <span>POWERED BY WAGMI + PRIVY</span>
          </div>
        </div>

        {/* Right — Sign In Panel */}
        <div className="flex w-full flex-col items-center justify-center px-8 lg:w-1/2 relative">
          <div className="w-full max-w-sm space-y-8 bg-card/35 p-8 rounded-2xl border border-border/50 backdrop-blur-md relative">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 border-muted-foreground/30" />
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 border-muted-foreground/30" />
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 border-muted-foreground/30" />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 border-muted-foreground/30" />

            <div className="space-y-2 text-center lg:text-left">
              <div className="lg:hidden flex justify-center mb-6">
                <Logo size="md" />
              </div>
              <h1 className="text-2xl font-mono font-bold tracking-tight uppercase text-foreground">
                ACCESS SYSTEM
              </h1>
              <p className="text-xs text-muted-foreground">
                Connect your account to access dashboards, request/issue transcripts, and verify identities.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={login}
                className="w-full bg-ca-accent text-white hover:bg-ca-accent-hover font-mono tracking-wider py-5 rounded-lg border border-transparent shadow-lg shadow-ca-accent/15 flex items-center justify-center gap-2 group transition-all"
                size="lg"
              >
                <Lock className="h-4 w-4 transition-transform group-hover:scale-110" />
                CONNECT IDENTITY
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-muted-foreground/80">
                <Sparkles className="h-3 w-3 text-ca-accent" />
                Supports Email, Socials, or Passkeys
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
