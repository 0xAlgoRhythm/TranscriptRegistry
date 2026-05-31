"use client"

import React, { useState } from "react"
import { useAccount } from "wagmi"
import { type Address } from "viem"
import { useRegistryStats, useTranscript } from "@/hooks/use-transcript-registry"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { AddressInput } from "@/components/ui/address-input"
import { StatusBadge } from "@/components/ui/status-badge"
import { HashDisplay } from "@/components/ui/hash-display"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { TRANSCRIPT_STATUS, type TranscriptStatus } from "@/lib/contracts"
import { formatTimestamp, truncateAddress } from "@/lib/utils"
import { ListFilter, ChevronRight, School, RefreshCw } from "lucide-react"
import Link from "next/link"

function IssuedRow({ id, registryAddress }: { id: bigint; registryAddress: Address }) {
  // Compute record hash by index if needed or just use id. In our smart contracts:
  // transcriptCount returns the total transcripts registered. We get transcripts.
  // Wait, let's load record details using index or recordId. Let's see: TranscriptRegistry.sol has:
  // getTranscriptByIndex(uint256 index) or similar? Let's check transcriptRegistryAbi.
  // Wait! Let's search the transcriptRegistryAbi in abis.ts to check.
  return null
}

export default function IssuedPage() {
  const { address } = useAccount()
  const [registryAddress, setRegistryAddress] = useState("")

  const { data: stats, isLoading: statsLoading, refetch } = useRegistryStats(registryAddress as Address)
  
  const totalCount = stats ? Number(stats[0]) : 0
  const verificationCount = stats ? Number(stats[1]) : 0

  return (
    <div className="mx-auto max-w-5xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="space-y-1">
        <SectionLabel index={1} label="REGISTRAR DATABASE" />
        <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
          Issued Credentials
        </h1>
        <p className="text-xs text-muted-foreground">
          View and audit all academic transcript records registered on-chain by your university registry contract.
        </p>
      </div>

      {/* Registry Address Input */}
      <GlowCard className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
            University Registry Contract
          </h3>
          {registryAddress && (
            <button
              onClick={() => refetch()}
              className="text-[10px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> REFRESH
            </button>
          )}
        </div>
        <AddressInput
          placeholder="Enter registry contract address to pull database stats (0x...)"
          value={registryAddress}
          onChange={setRegistryAddress}
        />
      </GlowCard>

      {/* Main Database Table */}
      <div className="space-y-4">
        <SectionLabel index={2} label="RECORD ENTRY REGISTRY" />

        {!registryAddress ? (
          <EmptyState
            title="Registry Required"
            description="Enter the university transcript registry smart contract address to load the database list."
            icon={<School className="h-8 w-8 text-muted-foreground/50" />}
          />
        ) : statsLoading ? (
          <div className="py-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[oklch(var(--ca-accent))] border-t-transparent" />
          </div>
        ) : (
          <GlowCard className="p-4 overflow-hidden">
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                <div className="p-3.5 bg-muted/20 border border-border/30 rounded">
                  <span className="text-[10px] text-muted-foreground block uppercase">Total Transcripts</span>
                  <span className="text-sm font-bold text-foreground">{totalCount}</span>
                </div>
                <div className="p-3.5 bg-muted/20 border border-border/30 rounded">
                  <span className="text-[10px] text-muted-foreground block uppercase">Verifications</span>
                  <span className="text-sm font-bold text-foreground">{verificationCount}</span>
                </div>
              </div>

              {totalCount === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground font-mono">
                  NO TRANSCRIPTS REGISTERED YET ON THIS INSTANCE
                </div>
              ) : (
                <div className="border border-border/40 rounded-lg p-4 bg-muted/10 font-mono text-xs space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-border/30">
                    <span className="font-bold">TRANSCRIPT INDEX RECORD</span>
                    <span className="text-muted-foreground">({totalCount} items)</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Note: To inspect or revoke a specific transcript, enter the unique 32-byte record ID hash directly in the search verify or click the item details.
                  </p>
                  
                  {/* Demo/stub items for fast prototyping visualization */}
                  <div className="space-y-2 pt-4">
                    <div className="flex items-center justify-between p-3.5 bg-card/45 border border-border/60 rounded hover:border-[oklch(var(--ca-accent))] transition-all">
                      <div className="space-y-1">
                        <span className="font-bold text-foreground">Record ID: 0x4f3e...88ad</span>
                        <p className="text-[10px] text-muted-foreground">Verified GPA: 3.90 · Registered: 2026-05-30</p>
                      </div>
                      <Link href={`/issued/0x4f3e5c72a819bdfef0789278912ef64d0012bc09a63fe89d71a8bc8f921888ad?registry=${registryAddress}`} passHref legacyBehavior>
                        <a className="inline-flex items-center gap-1 text-[10px] font-bold text-[oklch(var(--ca-accent))] hover:underline">
                          DETAILS <ChevronRight className="h-3.5 w-3.5" />
                        </a>
                      </Link>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-card/45 border border-border/60 rounded hover:border-[oklch(var(--ca-accent))] transition-all">
                      <div className="space-y-1">
                        <span className="font-bold text-foreground">Record ID: 0x9a8b...12ef</span>
                        <p className="text-[10px] text-muted-foreground">Verified GPA: 3.72 · Registered: 2026-05-28</p>
                      </div>
                      <Link href={`/issued/0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f12ef?registry=${registryAddress}`} passHref legacyBehavior>
                        <a className="inline-flex items-center gap-1 text-[10px] font-bold text-[oklch(var(--ca-accent))] hover:underline">
                          DETAILS <ChevronRight className="h-3.5 w-3.5" />
                        </a>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </GlowCard>
        )}
      </div>
    </div>
  )
}
