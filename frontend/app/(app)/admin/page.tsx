"use client"

import React, { useState } from "react"
import { type Address } from "viem"
import { useAccount } from "wagmi"
import { useRoleStore } from "@/lib/stores/role-store"
import {
  usePlatformStats,
  usePlatformAdmin,
  useUniversityCount,
  useUniversity,
  useDeployUniversity,
  useDeactivateUniversity,
  useReactivateUniversity,
} from "@/hooks/use-university-factory"
import { StatCard } from "@/components/ui/stat-card"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { AddressInput } from "@/components/ui/address-input"
import { StatusBadge } from "@/components/ui/status-badge"
import { HashDisplay } from "@/components/ui/hash-display"
import { TxPanel } from "@/components/ui/tx-panel"
import { Button } from "@/components/ui/button"
import { Shield, Sparkles, Building2, Plus, AlertTriangle, Play, Pause } from "lucide-react"

function UniversityRow({ id }: { id: bigint }) {
  const { data } = useUniversity(id)
  const deactivate = useDeactivateUniversity()
  const reactivate = useReactivateUniversity()

  if (!data) return null

  const { name, contractAddress, registrar, isActive } = data

  return (
    <tr className="border-b border-border/40 hover:bg-muted/10 transition-colors">
      <td className="p-4 font-mono font-bold text-foreground text-xs uppercase">{name}</td>
      <td className="p-4 font-mono text-xs">
        <HashDisplay hash={contractAddress} />
      </td>
      <td className="p-4 font-mono text-xs">
        <HashDisplay hash={registrar} />
      </td>
      <td className="p-4 text-xs">
        <StatusBadge status={isActive ? "success" : "error"} label={isActive ? "Active" : "Suspended"} />
      </td>
      <td className="p-4 text-right">
        {isActive ? (
          <Button
            size="sm"
            onClick={() => deactivate.deactivate(id, "Administrative Suspension")}
            disabled={deactivate.isPending || deactivate.isConfirming}
            className="bg-[oklch(var(--ca-destructive)/0.15)] text-[oklch(var(--ca-destructive))] hover:bg-[oklch(var(--ca-destructive)/0.25)] border border-[oklch(var(--ca-destructive)/0.3)] font-mono text-[10px] py-1 h-7"
          >
            <Pause className="h-3 w-3 mr-1" /> SUSPEND
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => reactivate.reactivate(id)}
            disabled={reactivate.isPending || reactivate.isConfirming}
            className="bg-[oklch(var(--ca-success)/0.15)] text-[oklch(var(--ca-success))] hover:bg-[oklch(var(--ca-success)/0.25)] border border-[oklch(var(--ca-success)/0.3)] font-mono text-[10px] py-1 h-7"
          >
            <Play className="h-3 w-3 mr-1" /> REACTIVATE
          </Button>
        )}
      </td>
    </tr>
  )
}

function UniversityList() {
  const { data: count } = useUniversityCount()
  const total = count ? Number(count) : 0

  if (total === 0) {
    return (
      <div className="text-center py-8 font-mono text-xs text-muted-foreground">
        NO REGISTERED INSTITUTIONS DETECTED
      </div>
    )
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse font-mono">
        <thead>
          <tr className="border-b border-border/60 text-[10px] uppercase text-muted-foreground tracking-wider">
            <th className="p-4 font-bold">University Name</th>
            <th className="p-4 font-bold">Registry Address</th>
            <th className="p-4 font-bold">Registrar Wallet</th>
            <th className="p-4 font-bold">Status</th>
            <th className="p-4 font-bold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: total }, (_, i) => (
            <UniversityRow key={i} id={BigInt(i)} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DeployUniversityForm() {
  const [name, setName] = useState("")
  const [registrar, setRegistrar] = useState("")

  const { deploy, hash, isPending, isConfirming, isSuccess, error } = useDeployUniversity()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !registrar) return
    deploy(name, registrar as Address)
  }

  return (
    <GlowCard className="p-6 md:p-8 space-y-6 relative overflow-hidden" glow>
      <div className="space-y-1">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
          Deploy On-Chain University
        </h3>
        <p className="text-xs text-muted-foreground">
          Spawn a new instance of the TranscriptRegistry smart contract for an accredited institution.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Institution Name</label>
          <input
            type="text"
            placeholder="e.g. Massachusetts Institute of Technology"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-[oklch(var(--ca-accent))] focus:outline-none"
            required
          />
        </div>

        <AddressInput
          label="Designated Registrar Wallet"
          placeholder="0x..."
          value={registrar}
          onChange={setRegistrar}
        />

        <Button
          type="submit"
          disabled={isPending || isConfirming}
          className="w-full bg-[oklch(var(--ca-accent))] text-white hover:bg-[oklch(var(--ca-accent-hover))] font-mono tracking-wider text-xs py-4 flex items-center justify-center gap-1.5"
        >
          <Plus className="h-4.5 w-4.5" /> DEPLOY REGISTRY CONTRACT
        </Button>

        <TxPanel
          status={isPending ? "signing" : isConfirming ? "pending" : isSuccess ? "success" : error ? "error" : "idle"}
          hash={hash}
          error={error ? error.message : undefined}
          title="Deploy University Contract Transaction"
        />
      </form>
    </GlowCard>
  )
}

export default function AdminPage() {
  const { address } = useAccount()
  const { role } = useRoleStore()
  const { data: adminAddress } = usePlatformAdmin()
  const { data: stats } = usePlatformStats()

  // In demo mode or if selected simulation is admin, we bypass raw wallet restriction
  const isRealAdmin = address && adminAddress && address.toLowerCase() === adminAddress.toLowerCase()
  const isSimulatedAdmin = role === "admin"
  const hasAccess = isRealAdmin || isSimulatedAdmin

  if (!hasAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center animate-fade-in">
        <GlowCard className="p-8 max-w-md text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-[oklch(var(--ca-destructive)/0.15)] flex items-center justify-center text-[oklch(var(--ca-destructive))]">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-foreground">
            UNAUTHORIZED ACCESS
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Administrative console restricted. Connect the platform administrator deployer wallet or switch the simulator role to Platform Admin.
          </p>
        </GlowCard>
      </div>
    )
  }

  const totalUniversities = stats ? Number(stats[0]) : 0
  const activeCount = stats ? Number(stats[1]) : 0

  return (
    <div className="mx-auto max-w-5xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="space-y-1">
        <SectionLabel index={1} label="ADMINISTRATIVE ACTION" />
        <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
          Platform Governance
        </h1>
        <p className="text-xs text-muted-foreground">
          Manage system instances, register accredited universities, and perform administrative suspensions.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <StatCard
          label="Total Universities"
          value={String(totalUniversities)}
          icon={<Building2 className="h-4.5 w-4.5" />}
          accent="default"
        />
        <StatCard
          label="Active Networks"
          value={String(activeCount)}
          icon={<Shield className="h-4.5 w-4.5" />}
          accent="success"
        />
      </div>

      <DeployUniversityForm />

      {/* Registry Table */}
      <div className="space-y-4">
        <SectionLabel index={2} label="CONTRACT REGISTRIES" />
        <GlowCard className="p-4 overflow-hidden">
          <UniversityList />
        </GlowCard>
      </div>
    </div>
  )
}
