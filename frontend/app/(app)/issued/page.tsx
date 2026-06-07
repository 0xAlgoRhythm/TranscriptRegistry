"use client"

import React, { useState, useEffect } from "react"
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

function IssuedRow({ t, registryAddress }: { t: any; registryAddress: string }) {
  const ipfsUrl = t.metadataCid ? `https://gateway.pinata.cloud/ipfs/${t.metadataCid}` : "#"
  return (
    <div className="flex items-center justify-between p-3.5 bg-card/45 border border-border/60 rounded hover:border-ca-accent transition-all font-mono text-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">Record: {t.recordId.slice(0, 10)}...{t.recordId.slice(-6)}</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
            t.status === "Active"
              ? "bg-ca-success/15 text-ca-success border border-ca-success/25"
              : t.status === "Suspended"
              ? "bg-ca-warning/15 text-ca-warning border border-ca-warning/25"
              : "bg-ca-danger/15 text-ca-danger border border-ca-danger/25"
          }`}>
            {t.status || "Active"}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Student Hash: {t.studentHash.slice(0, 12)}... · Date: {new Date(t.issuedAt || t.createdAt).toISOString().split('T')[0]}
        </p>
      </div>
      <div className="flex items-center gap-4">
        {t.metadataCid && (
          <a 
            href={ipfsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-ca-success hover:underline"
          >
            IPFS VIEWER
          </a>
        )}
        <Link
          href={`/issued/${t.recordId}?registry=${registryAddress}`}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-ca-accent hover:underline"
        >
          DETAILS <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

export default function IssuedPage() {
  const { address } = useAccount()
  const [registryAddress, setRegistryAddress] = useState("")
  const [transcripts, setTranscripts] = useState<any[]>([])
  const [transcriptsLoading, setTranscriptsLoading] = useState(false)

  const { data: stats, isLoading: statsLoading, refetch } = useRegistryStats(registryAddress as Address)
  
  const totalCount = stats ? Number(stats[0]) : 0
  const verificationCount = stats ? Number(stats[1]) : 0

  useEffect(() => {
    if (registryAddress && registryAddress.length === 42 && registryAddress.startsWith("0x")) {
      const fetchTranscripts = async () => {
        setTranscriptsLoading(true)
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/transcripts/by-registry/${registryAddress}`)
          if (res.ok) {
            const data = await res.json()
            setTranscripts(data)
          }
        } catch (e) {
          console.error("Failed to fetch transcripts:", e)
        } finally {
          setTranscriptsLoading(false)
        }
      }
      fetchTranscripts()
    } else {
      setTranscripts([])
    }
  }, [registryAddress])

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
        ) : statsLoading || transcriptsLoading ? (
          <div className="py-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ca-accent border-t-transparent" />
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

              {transcripts.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground font-mono">
                  NO TRANSCRIPTS REGISTERED YET ON THIS INSTANCE
                </div>
              ) : (
                <div className="border border-border/40 rounded-lg p-4 bg-muted/10 font-mono text-xs space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-border/30">
                    <span className="font-bold">TRANSCRIPT INDEX RECORD</span>
                    <span className="text-muted-foreground">({transcripts.length} items)</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Note: To inspect or revoke a specific transcript, enter the unique 32-byte record ID hash directly in the search verify or click the item details.
                  </p>
                  
                  <div className="space-y-2 pt-4">
                    {transcripts.map((t) => (
                      <IssuedRow key={t.recordId} t={t} registryAddress={registryAddress} />
                    ))}
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
