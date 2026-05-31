"use client"

import React, { useState } from "react"
import { useAccount } from "wagmi"
import { type Address } from "viem"
import { useCheckAccess, useAccessControl } from "@/hooks/use-transcript-registry"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { AddressInput } from "@/components/ui/address-input"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Search, Key, HelpCircle } from "lucide-react"

export default function AccessHubPage() {
  const { address } = useAccount()
  const [registryAddress, setRegistryAddress] = useState("")
  const [recordId, setRecordId] = useState("")
  const [verifierAddress, setVerifierAddress] = useState("")

  // Check access state
  const { data: hasAccess, isLoading: checkLoading } = useCheckAccess(
    registryAddress as Address,
    recordId as `0x${string}`,
    verifierAddress as Address
  )

  // Details
  const { data: accessControlDetail, isLoading: detailLoading } = useAccessControl(
    registryAddress as Address,
    recordId as `0x${string}`,
    verifierAddress as Address
  )

  const isFormValid = !!(registryAddress && recordId && verifierAddress)

  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="space-y-1">
        <SectionLabel index={1} label="DELEGATE AUDIT" />
        <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
          Access Hub & Delegation Audit
        </h1>
        <p className="text-xs text-muted-foreground">
          Audit and check active verification delegations. Verify whether a specific address currently holds access tokens for a transcript.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Verification Form */}
        <div className="md:col-span-2 space-y-6">
          <GlowCard className="p-6 md:p-8 space-y-5" glow>
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="p-2 bg-[oklch(var(--ca-accent)/0.1)] rounded-lg text-[oklch(var(--ca-accent))]">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                  Check Active Permissions
                </h3>
                <p className="text-[10px] text-muted-foreground">Audit transcript access rights instantly on-chain</p>
              </div>
            </div>

            <div className="space-y-4">
              <AddressInput
                label="Registry Contract Address"
                value={registryAddress}
                onChange={setRegistryAddress}
                placeholder="0x..."
              />

              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Transcript Record ID</label>
                <input
                  type="text"
                  value={recordId}
                  onChange={(e) => setRecordId(e.target.value)}
                  placeholder="0x... (32-byte Record Hash)"
                  className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm font-mono text-xs focus:border-[oklch(var(--ca-accent))] focus:outline-none"
                />
              </div>

              <AddressInput
                label="Verifier Wallet Address"
                value={verifierAddress}
                onChange={setVerifierAddress}
                placeholder="0x..."
              />
            </div>
          </GlowCard>
        </div>

        {/* Results Panel */}
        <div className="md:col-span-1 space-y-6">
          <SectionLabel index={2} label="DELEGATION STATUS" />
          
          <GlowCard className="p-6 h-full relative flex flex-col justify-between" glow={isFormValid && hasAccess}>
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                Audit Result
              </h4>
              
              {!isFormValid ? (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter registry contract, record ID, and verifier address on the left to pull live status.
                </p>
              ) : checkLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[oklch(var(--ca-accent))] border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-muted-foreground tracking-wider font-mono">Status Badge</span>
                    <div>
                      <StatusBadge
                        status={hasAccess ? "success" : "error"}
                        label={hasAccess ? "Access Authorized" : "Access Denied"}
                      />
                    </div>
                  </div>

                  {accessControlDetail && (
                    <div className="space-y-2 font-mono text-xs text-muted-foreground bg-muted/20 p-3 rounded border border-border/30">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Expires At timestamp:</span>
                        <span className="text-foreground">{Number(accessControlDetail[1]) === 0 ? "No Active Delegate" : new Date(Number(accessControlDetail[1]) * 1000).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-border/40 text-[10px] text-muted-foreground flex gap-1.5 items-start mt-6">
              <HelpCircle className="h-4.5 w-4.5 shrink-0 text-muted-foreground" />
              <span>Permissions are verified dynamically. Access expires automatically on the epoch block.</span>
            </div>
          </GlowCard>
        </div>

      </div>
    </div>
  )
}
