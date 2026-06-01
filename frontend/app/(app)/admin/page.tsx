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
import { cn } from "@/lib/utils"
import { Shield, Sparkles, Building2, Plus, AlertTriangle, Play, Pause, RefreshCw } from "lucide-react"

interface LogItem {
  type: string
  description: string
  operator: string
  timestamp: string
  txHash: string | null
}

function ActivityLogs() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/logs`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      } else {
        setError("Failed to fetch system activity logs.")
      }
    } catch (e) {
      setError("Failed to connect to backend server.")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionLabel index={3} label="GLOBAL SYSTEM ACTIVITY LOGS" />
        <Button
          size="sm"
          variant="outline"
          onClick={fetchLogs}
          className="font-mono text-[10px] tracking-wider uppercase border-border/60"
        >
          <RefreshCw className="h-3 w-3 mr-1" /> REFRESH
        </Button>
      </div>

      <GlowCard className="p-6 relative overflow-hidden" glow>
        {loading ? (
          <div className="text-center py-8 font-mono text-xs text-muted-foreground animate-pulse">
            LOADING EVENT INDEXER LOGS...
          </div>
        ) : error ? (
          <div className="text-center py-8 font-mono text-xs text-[oklch(var(--ca-destructive))]">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 font-mono text-xs text-muted-foreground">
            NO SYSTEM LOGS FOUND
          </div>
        ) : (
          <div className="space-y-4 font-mono text-xs max-h-[400px] overflow-y-auto pr-2">
            {logs.map((log, index) => {
              let dotColor = "bg-[oklch(var(--ca-accent))]"
              if (log.type === "university_registered") dotColor = "bg-[oklch(var(--ca-success))]"
              if (log.type === "status_changed") dotColor = "bg-[oklch(var(--ca-destructive))]"

              return (
                <div key={index} className="flex items-start justify-between border-b border-border/20 pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-foreground font-semibold flex items-center gap-1.5 uppercase text-[10px]">
                      <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
                      {log.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {log.description}
                    </p>
                    <p className="text-[9px] text-muted-foreground/60">
                      Operator: {log.operator}
                      {log.txHash && ` | Tx: ${log.txHash.slice(0, 10)}...`}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 pl-4">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </GlowCard>
    </div>
  )
}

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
  const { data: stats } = usePlatformStats()

  const hasAccess = role === "admin"

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
            Administrative console restricted. Connect the platform administrator deployer wallet via Metamask.
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

      {/* Activity Logs */}
      <ActivityLogs />
    </div>
  )
}
