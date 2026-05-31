"use client"

import React, { useState } from "react"
import { useSearchParams, useRouter, useParams } from "next/navigation"
import { type Address } from "viem"
import { useTranscript, useUpdateTranscriptStatus } from "@/hooks/use-transcript-registry"
import { formatTimestamp, truncateAddress } from "@/lib/utils"
import { TRANSCRIPT_STATUS, type TranscriptStatus } from "@/lib/contracts"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { StatusBadge } from "@/components/ui/status-badge"
import { HashDisplay } from "@/components/ui/hash-display"
import { TxPanel } from "@/components/ui/tx-panel"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit3, ShieldAlert, Sparkles, UserX, UserCheck } from "lucide-react"

export default function IssuedDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const recordId = params.recordId as `0x${string}`
  const registryAddress = searchParams.get("registry") as Address

  const { data: transcript, isLoading } = useTranscript(registryAddress, recordId)
  const { updateStatus, hash: txHash, isPending, isConfirming, isSuccess, error } = useUpdateTranscriptStatus()

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[oklch(var(--ca-accent))] border-t-transparent" />
      </div>
    )
  }

  if (!transcript) {
    return (
      <div className="mx-auto max-w-2xl text-center space-y-4 py-12 animate-fade-in">
        <ShieldAlert className="h-12 w-12 text-[oklch(var(--ca-destructive))] mx-auto" />
        <h2 className="text-xl font-mono font-bold uppercase tracking-wider">Record Not Found</h2>
        <p className="text-xs text-muted-foreground">The specified transcript record does not exist on this registry contract.</p>
        <Button onClick={() => router.back()} className="font-mono text-xs bg-muted">BACK</Button>
      </div>
    )
  }

  const [, metadataCID, fileHash, issuer, timestamp, status] = transcript
  const statusStr = TRANSCRIPT_STATUS[status as TranscriptStatus]

  const handleUpdateStatus = (newStatus: number) => {
    updateStatus(registryAddress, recordId, newStatus, "Status updated by registrar")
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO DATABASE
        </button>

        <div className="space-y-1">
          <SectionLabel index={1} label="REGISTRAR MANAGEMENT" />
          <h1 className="text-2xl font-mono font-bold tracking-tight uppercase text-foreground">
            Manage Issued Record
          </h1>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
              {recordId}
            </span>
            <StatusBadge status={statusStr} />
          </div>
        </div>
      </div>

      {/* Record details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <GlowCard className="p-6 md:p-8 space-y-6" glow>
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="p-2.5 bg-[oklch(var(--ca-accent)/0.1)] rounded-lg text-[oklch(var(--ca-accent))]">
                <Edit3 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                  Record Metadata Specifications
                </h3>
                <p className="text-[10px] text-muted-foreground">Modify record active state below</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Registrar Identity</span>
                <HashDisplay hash={issuer} />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Registry Contract Address</span>
                <HashDisplay hash={registryAddress} />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">IPFS Metadata Address</span>
                <span className="text-foreground bg-muted/20 px-2 py-1 rounded border border-border/30 inline-block w-full truncate">
                  {metadataCID}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">PDF Signature (SHA-256)</span>
                <HashDisplay hash={fileHash} chars={8} />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Issued Time</span>
                <span className="text-foreground bg-muted/20 px-2 py-1 rounded border border-border/30 inline-block w-full">
                  {formatTimestamp(timestamp)}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Current Status</span>
                <span className="text-foreground bg-muted/20 px-2 py-1 rounded border border-border/30 inline-block w-full uppercase">
                  {statusStr}
                </span>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Status Actions */}
        <div className="md:col-span-1 space-y-6">
          <SectionLabel index={2} label="GOVERNANCE OPTIONS" />
          <GlowCard className="p-6 space-y-5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
              Modify Record Status
            </h4>
            <p className="text-[10px] text-muted-foreground">
              As the authorized registrar of this contract, you can suspend, activate, or revoke this credential record on-chain.
            </p>

            <div className="space-y-3 pt-2">
              <Button
                onClick={() => handleUpdateStatus(0)}
                disabled={isPending || isConfirming || status === 0}
                className="w-full bg-[oklch(var(--ca-success)/0.15)] text-[oklch(var(--ca-success))] hover:bg-[oklch(var(--ca-success)/0.25)] border border-[oklch(var(--ca-success)/0.3)] font-mono text-xs py-3.5 flex items-center justify-center gap-1.5"
              >
                <UserCheck className="h-4 w-4" /> SET ACTIVE
              </Button>

              <Button
                onClick={() => handleUpdateStatus(1)}
                disabled={isPending || isConfirming || status === 1}
                className="w-full bg-[oklch(var(--ca-destructive)/0.15)] text-[oklch(var(--ca-destructive))] hover:bg-[oklch(var(--ca-destructive)/0.25)] border border-[oklch(var(--ca-destructive)/0.3)] font-mono text-xs py-3.5 flex items-center justify-center gap-1.5"
              >
                <UserX className="h-4 w-4" /> REVOKE RECORD
              </Button>

              <Button
                onClick={() => handleUpdateStatus(2)}
                disabled={isPending || isConfirming || status === 2}
                className="w-full bg-[oklch(var(--ca-warning)/0.15)] text-[oklch(var(--ca-warning))] hover:bg-[oklch(var(--ca-warning)/0.25)] border border-[oklch(var(--ca-warning)/0.3)] font-mono text-xs py-3.5 flex items-center justify-center gap-1.5"
              >
                <ShieldAlert className="h-4 w-4" /> SUSPEND RECORD
              </Button>
            </div>

            <TxPanel
              status={isPending ? "signing" : isConfirming ? "pending" : isSuccess ? "success" : error ? "error" : "idle"}
              hash={txHash}
              error={error ? error.message : undefined}
              title="Update Record Status Transaction"
            />
          </GlowCard>
        </div>
      </div>
    </div>
  )
}
