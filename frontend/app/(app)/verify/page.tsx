"use client"

import React, { useState, useEffect } from "react"
import { type Address } from "viem"
import { useAccount } from "wagmi"
import { useTranscript, useCheckAccess, useVerifyTranscript } from "@/hooks/use-transcript-registry"
import { useFileHash } from "@/hooks/use-file-hash"
import { formatTimestamp, truncateAddress } from "@/lib/utils"
import { TRANSCRIPT_STATUS, type TranscriptStatus } from "@/lib/contracts"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { AddressInput } from "@/components/ui/address-input"
import { FileDropZone } from "@/components/ui/file-drop-zone"
import { StatusBadge } from "@/components/ui/status-badge"
import { HashDisplay } from "@/components/ui/hash-display"
import { TxPanel } from "@/components/ui/tx-panel"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Search, FileText, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react"

export default function VerifyPage() {
  const { address } = useAccount()
  const [registryAddress, setRegistryAddress] = useState("")
  const [recordId, setRecordId] = useState("")
  const [looked, setLooked] = useState(false)

  // File hash calculator
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { hash: calculatedFileHash, isCalculating, calculateHash, reset: resetHash } = useFileHash()

  const { data: transcript, isLoading: transcriptLoading } = useTranscript(
    registryAddress as Address,
    recordId as `0x${string}`
  )

  const { data: hasAccess } = useCheckAccess(
    registryAddress as Address,
    recordId as `0x${string}`,
    address ?? ("0x0000000000000000000000000000000000000000" as Address)
  )

  const { verify, hash: txHash, isPending, isConfirming, isSuccess, error } = useVerifyTranscript()

  useEffect(() => {
    if (selectedFile) {
      calculateHash(selectedFile)
    } else {
      resetHash()
    }
  }, [selectedFile])

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault()
    if (registryAddress && recordId) {
      setLooked(true)
    }
  }

  const handleVerify = () => {
    if (!registryAddress || !recordId || !calculatedFileHash) return
    verify(registryAddress as Address, recordId as `0x${string}`, calculatedFileHash)
  }

  const [verifyMode, setVerifyMode] = useState<"single" | "batch">("single")
  const [batchInput, setBatchInput] = useState("")
  const [batchResults, setBatchResults] = useState<any[]>([])
  const [isBatchVerifying, setIsBatchVerifying] = useState(false)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  const handleBatchVerify = async () => {
    if (!batchInput.trim()) return
    setIsBatchVerifying(true)
    const ids = batchInput.split("\n").map(id => id.trim()).filter(id => id.length === 66 && id.startsWith("0x"))
    
    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`${API_URL}/api/transcripts/${id}`)
            if (!res.ok) throw new Error("Not found")
            const data = await res.json()
            return { id, status: data.status, valid: data.status === "Active" }
          } catch (e) {
            return { id, status: "Unknown / Invalid", valid: false }
          }
        })
      )
      setBatchResults(results)
    } catch (e) {
      console.error(e)
    } finally {
      setIsBatchVerifying(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <SectionLabel index={1} label="CREDENTIAL AUDIT" />
          <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
            Cryptographic Verification
          </h1>
          <p className="text-xs text-muted-foreground">
            Verify the authenticity of student credentials and transcript files against the blockchain registry.
          </p>
        </div>

        <div className="flex bg-card/50 p-1 rounded-lg border border-border/40 backdrop-blur-sm self-start">
          <button
            onClick={() => setVerifyMode("single")}
            className={`px-4 py-2 text-xs font-mono rounded-md transition-colors ${verifyMode === "single" ? "bg-[oklch(var(--ca-accent))] text-white" : "text-muted-foreground hover:text-foreground"}`}
          >
            SINGLE RECORD
          </button>
          <button
            onClick={() => setVerifyMode("batch")}
            className={`px-4 py-2 text-xs font-mono rounded-md transition-colors ${verifyMode === "batch" ? "bg-[oklch(var(--ca-accent))] text-white" : "text-muted-foreground hover:text-foreground"}`}
          >
            BATCH LOOKUP
          </button>
        </div>
      </div>

      {/* Main Form/Grid */}
      {verifyMode === "single" ? (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Lookup card */}
        <div className="md:col-span-2 space-y-6">
          <GlowCard className="p-6 md:p-8 space-y-5" glow>
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="p-2 bg-[oklch(var(--ca-accent)/0.1)] rounded-lg text-[oklch(var(--ca-accent))]">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                  Lookup Credential Record
                </h3>
                <p className="text-[10px] text-muted-foreground">Fetch record information from targeted registry contract</p>
              </div>
            </div>

            <form onSubmit={handleLookup} className="space-y-4">
              <AddressInput
                label="University Registry Contract"
                value={registryAddress}
                onChange={(val) => {
                  setRegistryAddress(val)
                  setLooked(false)
                }}
                placeholder="0x..."
              />

              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Transcript Record ID</label>
                <input
                  type="text"
                  value={recordId}
                  onChange={(e) => {
                    setRecordId(e.target.value)
                    setLooked(false)
                  }}
                  placeholder="0x... (32-byte hash)"
                  className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm font-mono text-xs focus:border-[oklch(var(--ca-accent))] focus:outline-none"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={transcriptLoading}
                className="w-full bg-[oklch(var(--ca-accent))] text-white hover:bg-[oklch(var(--ca-accent-hover))] font-mono tracking-wider text-xs py-3.5 flex items-center justify-center gap-1.5"
              >
                <Search className="h-4 w-4" /> LOOKUP RECORD ID
              </Button>
            </form>
          </GlowCard>

          {/* Verification Actions */}
          {looked && transcript && hasAccess && (
            <GlowCard className="p-6 md:p-8 space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                <div className="p-2 bg-[oklch(var(--ca-teal)/0.1)] rounded-lg text-[oklch(var(--ca-teal))]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                    Perform Integrity Check
                  </h3>
                  <p className="text-[10px] text-muted-foreground">Upload transcript document to match hash on-chain</p>
                </div>
              </div>

              <div className="space-y-4">
                <FileDropZone
                  onFileSelect={setSelectedFile}
                  selectedFile={selectedFile}
                />

                {isCalculating && (
                  <p className="text-xs font-mono text-[oklch(var(--ca-accent))] animate-pulse">
                    Calculating file cryptographic signature...
                  </p>
                )}

                {calculatedFileHash && (
                  <div className="rounded-lg border border-border/40 bg-muted/20 p-4 font-mono text-xs space-y-1.5">
                    <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Computed File Hash</span>
                    <HashDisplay hash={calculatedFileHash} chars={12} />
                  </div>
                )}

                <Button
                  onClick={handleVerify}
                  disabled={isPending || isConfirming || !calculatedFileHash}
                  className="w-full bg-[oklch(var(--ca-success))] text-white hover:opacity-90 font-mono tracking-wider text-xs py-3.5 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" /> EXECUTE ON-CHAIN VERIFICATION
                </Button>

                <TxPanel
                  status={isPending ? "signing" : isConfirming ? "pending" : isSuccess ? "success" : error ? "error" : "idle"}
                  hash={txHash}
                  error={error ? error.message : undefined}
                  title="Verify Transcript Transaction"
                />
              </div>
            </GlowCard>
          )}
        </div>

        {/* Audit Details Panel (Right side) */}
        <div className="md:col-span-1 space-y-6">
          <SectionLabel index={2} label="RECORD META STATUS" />
          
          <GlowCard className="p-6 relative flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                Audit Registry Details
              </h4>
              
              {!looked ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter target contract and record ID hash on the left, then click Lookup to resolve details.
                </p>
              ) : transcriptLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[oklch(var(--ca-accent))] border-t-transparent" />
                </div>
              ) : !transcript ? (
                <div className="space-y-2 text-center text-xs">
                  <AlertTriangle className="h-8 w-8 text-[oklch(var(--ca-destructive))] mx-auto animate-bounce" />
                  <p className="font-bold text-foreground">NOT FOUND</p>
                  <p className="text-muted-foreground text-[10px]">No record with the specified ID exists in this registry.</p>
                </div>
              ) : (
                <div className="space-y-4 font-mono text-xs text-muted-foreground">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Verification Status</span>
                    <StatusBadge status={TRANSCRIPT_STATUS[transcript[5] as TranscriptStatus]} />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Registration Time</span>
                    <span className="text-foreground">{formatTimestamp(transcript[4])}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Issuer Registrar</span>
                    <span className="text-foreground truncate block">{truncateAddress(transcript[3])}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Hashed Registry CID</span>
                    <span className="text-foreground truncate block">{transcript[1]}</span>
                  </div>

                  <div className="pt-4 border-t border-border/40">
                    {hasAccess ? (
                      <div className="p-2.5 bg-[oklch(var(--ca-success)/0.05)] border border-[oklch(var(--ca-success)/0.3)] rounded text-[11px] text-[oklch(var(--ca-success))] flex gap-1.5">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <span>Verification permission is ACTIVE for your wallet.</span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-[oklch(var(--ca-destructive)/0.05)] border border-[oklch(var(--ca-destructive)/0.3)] rounded text-[11px] text-[oklch(var(--ca-destructive))] flex gap-1.5">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>Permission DENIED. Request access from the student.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-border/40 text-[10px] text-muted-foreground flex gap-1.5 items-start mt-6 font-mono">
              <HelpCircle className="h-4.5 w-4.5 shrink-0" />
              <span>Checking validation writes an immutable verification receipt log on-chain.</span>
            </div>
          </GlowCard>
        </div>

      </div>
      ) : (
        <GlowCard className="p-6 md:p-8 space-y-6 animate-fade-in" glow>
          <div className="flex items-center gap-3 border-b border-border/40 pb-4">
            <div className="p-2 bg-[oklch(var(--ca-accent)/0.1)] rounded-lg text-[oklch(var(--ca-accent))]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                Batch Record Lookup
              </h3>
              <p className="text-[10px] text-muted-foreground">Paste multiple 32-byte Record IDs to instantly check their validation status</p>
            </div>
          </div>
          <div className="space-y-4">
            <textarea
              className="w-full h-48 rounded-lg border border-border/60 bg-background py-3 px-4 text-xs font-mono focus:border-[oklch(var(--ca-accent))] focus:outline-none resize-none"
              placeholder="0xabc123... (one ID per line)"
              value={batchInput}
              onChange={e => setBatchInput(e.target.value)}
            />
            <Button
              onClick={handleBatchVerify}
              disabled={isBatchVerifying || !batchInput.trim()}
              className="w-full bg-[oklch(var(--ca-accent))] text-white hover:bg-[oklch(var(--ca-accent-hover))] font-mono tracking-wider text-xs py-3.5 flex items-center justify-center gap-1.5"
            >
              {isBatchVerifying ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <><Search className="h-4 w-4" /> BATCH VERIFY RECORDS</>
              )}
            </Button>
          </div>

          {batchResults.length > 0 && (
            <div className="pt-6 border-t border-border/40 space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">Results</h4>
              <div className="border border-border/40 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-card">
                    <tr>
                      <th className="px-4 py-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Record ID</th>
                      <th className="px-4 py-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 bg-background/50">
                    {batchResults.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">{r.id.slice(0,10)}...{r.id.slice(-8)}</td>
                        <td className="px-4 py-3">
                          {r.valid ? (
                            <span className="inline-flex items-center gap-1 text-green-500"><CheckCircle2 className="h-3 w-3" /> ACTIVE</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500"><AlertTriangle className="h-3 w-3" /> {r.status}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </GlowCard>
      )}
    </div>
  )
}
