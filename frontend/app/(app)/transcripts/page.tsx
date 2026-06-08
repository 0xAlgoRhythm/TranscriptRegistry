"use client"

import React, { useState } from "react"
import { useAccount } from "wagmi"
import { type Address } from "viem"
import { useStudentTranscripts, useTranscript } from "@/hooks/use-transcript-registry"
import { studentHash, truncateAddress, formatTimestamp } from "@/lib/utils"
import { TRANSCRIPT_STATUS, type TranscriptStatus } from "@/lib/contracts"
import { StatCard } from "@/components/ui/stat-card"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { AddressInput } from "@/components/ui/address-input"
import { StatusBadge } from "@/components/ui/status-badge"
import { HashDisplay } from "@/components/ui/hash-display"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { FileText, School, ChevronRight, RefreshCcw, Send, Loader2 } from "lucide-react"
import Link from "next/link"

const TranscriptCard = React.memo(function TranscriptCard({
  recordId,
  registryAddress,
}: {
  recordId: `0x${string}`
  registryAddress: Address
}) {
  const { data } = useTranscript(registryAddress, recordId)

  if (!data) return null

  const [, metadataCID, , issuer, timestamp, status] = data
  const statusStr = TRANSCRIPT_STATUS[status as TranscriptStatus]

  return (
    <GlowCard className="p-5 hover:border-ca-accent transition-all relative overflow-hidden" glow>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-ca-accent/10 rounded-lg text-ca-accent">
            <FileText className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-foreground">
                Record Hash: {recordId.slice(0, 10)}...{recordId.slice(-6)}
              </span>
              <StatusBadge status={statusStr} />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              Metadata IPFS: {metadataCID.slice(0, 24)}...
            </p>
            <p className="text-[10px] text-muted-foreground">
              Issued {formatTimestamp(timestamp)} by {truncateAddress(issuer)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-center">
          <Link
            href={`/transcripts/${recordId}?registry=${registryAddress}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border/60 hover:border-border text-xs font-mono font-bold tracking-wider text-muted-foreground hover:text-foreground bg-muted/20 hover:bg-muted/40 transition-all"
          >
            VIEW DETAILED <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </GlowCard>
  )
})

export default function TranscriptsPage() {
  const { address } = useAccount()
  const [registryAddress, setRegistryAddress] = useState("")

  const hashValue = address ? studentHash(address) : ("0x" as `0x${string}`)
  
  const { data: recordIds, isLoading, refetch } = useStudentTranscripts(
    registryAddress as Address,
    hashValue,
  )

  const [requestLoading, setRequestLoading] = useState(false)
  const [requestResult, setRequestResult] = useState<{ text: string, type: "success" | "info" | "error" } | null>(null)

  const handleRequestTranscript = async () => {
    if (!address) return
    try {
      setRequestLoading(true)
      setRequestResult(null)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      const res = await fetch(`${API_URL}/api/transcripts/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentWallet: address })
      })
      const data = await res.json()
      if (res.ok) {
        if (data.status === "sent") {
          setRequestResult({ text: data.message, type: "success" })
        } else {
          setRequestResult({ text: data.message, type: "info" })
        }
      } else {
        setRequestResult({ text: data.error || "Failed to submit request.", type: "error" })
      }
    } catch (err) {
      setRequestResult({ text: "Error submitting transcript request.", type: "error" })
    } finally {
      setRequestLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <SectionLabel index={1} label="STUDENT RECORDS" />
          <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
            My Academic Credentials
          </h1>
          <p className="text-xs text-muted-foreground">
            Access your secure on-chain educational qualifications, transcript files, and manage delegate access tokens.
          </p>
        </div>
        <div className="shrink-0">
          <Button
            onClick={handleRequestTranscript}
            disabled={requestLoading || !address}
            className="font-mono text-xs bg-ca-accent hover:bg-ca-accent/90 text-white flex items-center gap-1.5 px-4 h-9 uppercase"
          >
            {requestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Request Transcript
          </Button>
        </div>
      </div>

      {requestResult && (
        <div className={`p-3 rounded font-mono text-[10px] border ${
          requestResult.type === "success" 
            ? "bg-ca-success/8 text-ca-success border-ca-success/20" 
            : requestResult.type === "info" 
            ? "bg-ca-accent/8 text-ca-accent border-ca-accent/20" 
            : "bg-ca-danger/8 text-ca-danger border-ca-danger/20"
        }`}>
          {requestResult.text}
        </div>
      )}

      {/* University Registry Input Card */}
      <GlowCard className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
            Target University Contract
          </h3>
          {registryAddress && (
            <button
              onClick={() => refetch()}
              className="text-[10px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RefreshCcw className="h-3 w-3" /> REFRESH
            </button>
          )}
        </div>
        <AddressInput
          placeholder="Enter university registry contract address (0x...)"
          value={registryAddress}
          onChange={setRegistryAddress}
        />
      </GlowCard>

      {/* Transcripts Grid */}
      <div className="space-y-4">
        <SectionLabel index={2} label="CREDENTIAL STATUS" />

        {isLoading && (
          <div className="space-y-3">
            <div className="h-20 rounded-xl bg-card/45 border border-border/40 animate-pulse" />
            <div className="h-20 rounded-xl bg-card/45 border border-border/40 animate-pulse" />
          </div>
        )}

        {!registryAddress && (
          <EmptyState
            title="Registry Required"
            description="Enter an accredited university registry smart contract address to load your transcript data."
            icon={<School className="h-8 w-8 text-muted-foreground/50" />}
          />
        )}

        {registryAddress && recordIds && recordIds.length === 0 && (
          <EmptyState
            title="No Records Found"
            description="No transcript records were found registered under your hashed identity on this contract."
            icon={<FileText className="h-8 w-8 text-muted-foreground/50" />}
          />
        )}

        {registryAddress && recordIds && recordIds.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {recordIds.map((id) => (
              <TranscriptCard
                key={id}
                recordId={id}
                registryAddress={registryAddress as Address}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
