"use client"

import React from "react"
import { useSearchParams, useRouter, useParams } from "next/navigation"
import { type Address } from "viem"
import { useTranscript } from "@/hooks/use-transcript-registry"
import { formatTimestamp, truncateAddress } from "@/lib/utils"
import { TRANSCRIPT_STATUS, type TranscriptStatus } from "@/lib/contracts"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { StatusBadge } from "@/components/ui/status-badge"
import { HashDisplay } from "@/components/ui/hash-display"
import { Button } from "@/components/ui/button"
import { ShieldCheck, ArrowLeft, Building2, HelpCircle } from "lucide-react"

export default function PublicVerifyDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const recordId = params.recordId as `0x${string}`
  const registryAddress = searchParams.get("registry") as Address

  const { data: transcript, isLoading } = useTranscript(registryAddress, recordId)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ca-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col justify-center items-center bg-background text-foreground p-6 relative overflow-hidden">
      {/* Backdrop decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(108,91,240,0.08),transparent_35%)]" />
      
      <div className="w-full max-w-2xl space-y-6 relative z-10">
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> GO TO LANDING
          </button>
          
          <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground uppercase">
            <span>PUBLIC ACCESS DELEGATE VIEW</span>
          </div>
        </div>

        {!transcript ? (
          <GlowCard className="p-8 text-center space-y-4">
            <Building2 className="h-10 w-10 text-ca-danger mx-auto animate-pulse" />
            <h2 className="text-lg font-mono font-bold uppercase tracking-wider">RECORD NOT ACCESSIBLE</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              This record hash does not exist on this registry, or you do not have permission parameters to view the verification status.
            </p>
          </GlowCard>
        ) : (
          <GlowCard className="p-6 md:p-8 space-y-6" glow>
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="p-2.5 bg-ca-accent/10 rounded-lg text-ca-accent">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                  Public Authenticity Audit
                </h3>
                <p className="text-[10px] text-muted-foreground">This transcript validation is permanently recorded on-chain</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-xs text-muted-foreground">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Transcript Hash (Record ID)</span>
                <span className="text-foreground select-all bg-muted/20 px-2 py-1 rounded border border-border/30 block truncate">
                  {recordId}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Credential status</span>
                <div>
                  <StatusBadge status={TRANSCRIPT_STATUS[transcript[5] as TranscriptStatus]} />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Registered Institution (Registrar)</span>
                <HashDisplay hash={transcript[3]} />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Registry Contract</span>
                <HashDisplay hash={registryAddress} />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Registration Time</span>
                <span className="text-foreground bg-muted/20 px-2 py-1 rounded border border-border/30 block">
                  {formatTimestamp(transcript[4])}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Hashed Metadata CID</span>
                <span className="text-foreground select-all bg-muted/20 px-2 py-1 rounded border border-border/30 block truncate">
                  {transcript[1]}
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-border/40 text-[10px] text-muted-foreground flex gap-1.5 items-start font-mono">
              <HelpCircle className="h-5 w-5 shrink-0 text-ca-accent" />
              <span>Public verification is readable only. Modifying permissions requires authentication on the primary DApp interface.</span>
            </div>
          </GlowCard>
        )}
      </div>
    </div>
  )
}
