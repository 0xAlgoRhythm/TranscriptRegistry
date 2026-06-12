"use client"

import React, { useState } from "react"
import { useAccount } from "wagmi"
import { type Address } from "viem"
import {
  useCheckAccess,
  useAccessControl,
  useGrantAccess,
  useRevokeAccess
} from "@/hooks/use-transcript-registry"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { AddressInput } from "@/components/ui/address-input"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { TxPanel } from "@/components/ui/tx-panel"
import { ShieldCheck, Search, Key, HelpCircle, ShieldAlert, CheckCircle2, UserCheck, UserX } from "lucide-react"

export default function AccessHubPage() {
  const { address } = useAccount()
  const [activeTab, setActiveTab] = useState<"check" | "grant" | "revoke">("check")

  // Check state
  const [registryAddress, setRegistryAddress] = useState("")
  const [recordId, setRecordId] = useState("")
  const [verifierAddress, setVerifierAddress] = useState("")

  // Grant state
  const [grantRegistry, setGrantRegistry] = useState("")
  const [grantRecordId, setGrantRecordId] = useState("")
  const [grantVerifier, setGrantVerifier] = useState("")
  const [grantDuration, setGrantDuration] = useState("2592000") // 30 days default

  // Revoke state
  const [revokeRegistry, setRevokeRegistry] = useState("")
  const [revokeRecordId, setRevokeRecordId] = useState("")
  const [revokeVerifier, setRevokeVerifier] = useState("")

  // Contract hooks
  const { data: hasAccess, isLoading: checkLoading } = useCheckAccess(
    registryAddress as Address,
    recordId as `0x${string}`,
    verifierAddress as Address
  )

  const { data: accessControlDetail } = useAccessControl(
    registryAddress as Address,
    recordId as `0x${string}`,
    verifierAddress as Address
  )

  const {
    grant,
    hash: grantHash,
    isPending: grantPending,
    isConfirming: grantConfirming,
    isSuccess: grantSuccess,
    error: grantError
  } = useGrantAccess()

  const {
    revoke,
    hash: revokeHash,
    isPending: revokePending,
    isConfirming: revokeConfirming,
    isSuccess: revokeSuccess,
    error: revokeError
  } = useRevokeAccess()

  const isCheckFormValid = !!(registryAddress && recordId && verifierAddress)
  const isGrantFormValid = !!(grantRegistry && grantRecordId && grantVerifier && grantDuration)
  const isRevokeFormValid = !!(revokeRegistry && revokeRecordId && revokeVerifier)

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isGrantFormValid) return
    grant(
      grantRegistry as Address,
      grantRecordId as `0x${string}`,
      grantVerifier as Address,
      BigInt(grantDuration)
    )
  }

  const handleRevoke = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isRevokeFormValid) return
    revoke(
      revokeRegistry as Address,
      revokeRecordId as `0x${string}`,
      revokeVerifier as Address
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="space-y-1">
        <SectionLabel index={1} label="DELEGATE AUDIT" />
        <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
          Access Hub & Delegation
        </h1>
        <p className="text-xs text-muted-foreground">
          Audit permissions, grant or revoke verifier credentials directly on the blockchain.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/40 font-mono text-xs">
        <button
          onClick={() => setActiveTab("check")}
          className={`px-6 py-3 border-b-2 font-bold uppercase transition-all ${
            activeTab === "check"
              ? "border-ca-accent text-ca-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Check Permissions
        </button>
        <button
          onClick={() => setActiveTab("grant")}
          className={`px-6 py-3 border-b-2 font-bold uppercase transition-all ${
            activeTab === "grant"
              ? "border-ca-accent text-ca-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Grant Access
        </button>
        <button
          onClick={() => setActiveTab("revoke")}
          className={`px-6 py-3 border-b-2 font-bold uppercase transition-all ${
            activeTab === "revoke"
              ? "border-ca-accent text-ca-accent"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Revoke Access
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "check" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* Verification Form */}
          <div className="md:col-span-2 space-y-6">
            <GlowCard className="p-6 md:p-8 space-y-5" glow>
              <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                <div className="p-2 bg-ca-accent/10 rounded-lg text-ca-accent">
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
                    className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm font-mono text-xs focus:border-ca-accent focus:outline-none"
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
            
            <GlowCard className="p-6 h-full relative flex flex-col justify-between" glow={isCheckFormValid && hasAccess}>
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                  Audit Result
                </h4>
                
                {!isCheckFormValid ? (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enter registry contract, record ID, and verifier address on the left to pull live status.
                  </p>
                ) : checkLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-ca-accent border-t-transparent" />
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
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Expires At:</span>
                          <span className="text-foreground">
                            {Number(accessControlDetail[1]) === 0
                              ? "No Active Delegate"
                              : new Date(Number(accessControlDetail[1]) * 1000).toLocaleString()}
                          </span>
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
      )}

      {activeTab === "grant" && (
        <GlowCard className="p-6 md:p-8 space-y-6 max-w-2xl mx-auto animate-fade-in" glow>
          <div className="flex items-center gap-3 border-b border-border/40 pb-4">
            <div className="p-2 bg-ca-success/10 rounded-lg text-ca-success">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                Grant Access Permissions
              </h3>
              <p className="text-[10px] text-muted-foreground">Authorize a verifier to inspect your transcript hash on-chain</p>
            </div>
          </div>

          <form onSubmit={handleGrant} className="space-y-5">
            <AddressInput
              label="Registry Contract Address"
              value={grantRegistry}
              onChange={setGrantRegistry}
              placeholder="0x..."
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Transcript Record ID</label>
              <input
                type="text"
                value={grantRecordId}
                onChange={(e) => setGrantRecordId(e.target.value)}
                placeholder="0x... (32-byte Record Hash)"
                required
                className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm font-mono text-xs focus:border-ca-accent focus:outline-none"
              />
            </div>

            <AddressInput
              label="Verifier Wallet Address"
              value={grantVerifier}
              onChange={setGrantVerifier}
              placeholder="0x..."
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Access Duration</label>
              <select
                value={grantDuration}
                onChange={(e) => setGrantDuration(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm font-mono text-xs focus:border-ca-accent focus:outline-none text-foreground"
              >
                <option value="604800">7 Days</option>
                <option value="2592000">30 Days</option>
                <option value="7776000">90 Days</option>
                <option value="31536000">1 Year</option>
              </select>
            </div>

            <Button
              type="submit"
              disabled={grantPending || grantConfirming || !isGrantFormValid}
              className="w-full bg-ca-accent text-white hover:bg-ca-accent-hover font-mono tracking-wider text-xs py-4 flex items-center justify-center gap-2"
            >
              {grantPending
                ? "CONFIRM IN WALLET..."
                : grantConfirming
                ? "MINING TRANSACTION..."
                : "GRANT ACCESS AUTHORIZATION"}
            </Button>
          </form>

          <TxPanel
            status={grantPending ? "signing" : grantConfirming ? "pending" : grantSuccess ? "success" : grantError ? "error" : "idle"}
            hash={grantHash}
            error={grantError ? grantError.message : undefined}
            title="Grant Access Transaction"
          />
        </GlowCard>
      )}

      {activeTab === "revoke" && (
        <GlowCard className="p-6 md:p-8 space-y-6 max-w-2xl mx-auto animate-fade-in" glow>
          <div className="flex items-center gap-3 border-b border-border/40 pb-4">
            <div className="p-2 bg-ca-danger/10 rounded-lg text-ca-danger">
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                Revoke Access Permissions
              </h3>
              <p className="text-[10px] text-muted-foreground">Instantly invalidate a verifier's permission to inspect your record</p>
            </div>
          </div>

          <form onSubmit={handleRevoke} className="space-y-5">
            <AddressInput
              label="Registry Contract Address"
              value={revokeRegistry}
              onChange={setRevokeRegistry}
              placeholder="0x..."
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Transcript Record ID</label>
              <input
                type="text"
                value={revokeRecordId}
                onChange={(e) => setRevokeRecordId(e.target.value)}
                placeholder="0x... (32-byte Record Hash)"
                required
                className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm font-mono text-xs focus:border-ca-accent focus:outline-none"
              />
            </div>

            <AddressInput
              label="Verifier Wallet Address"
              value={revokeVerifier}
              onChange={setRevokeVerifier}
              placeholder="0x..."
              required
            />

            <Button
              type="submit"
              disabled={revokePending || revokeConfirming || !isRevokeFormValid}
              className="w-full bg-ca-danger hover:bg-red-600 text-white font-mono tracking-wider text-xs py-4 flex items-center justify-center gap-2"
            >
              {revokePending
                ? "CONFIRM IN WALLET..."
                : revokeConfirming
                ? "MINING TRANSACTION..."
                : "REVOKE ACCESS AUTHORIZATION"}
            </Button>
          </form>

          <TxPanel
            status={revokePending ? "signing" : revokeConfirming ? "pending" : revokeSuccess ? "success" : revokeError ? "error" : "idle"}
            hash={revokeHash}
            error={revokeError ? revokeError.message : undefined}
            title="Revoke Access Transaction"
          />
        </GlowCard>
      )}
    </div>
  )
}

