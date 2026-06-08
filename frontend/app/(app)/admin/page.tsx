"use client"

import React, { useState } from "react"
import { type Address } from "viem"
import { useAccount, useWriteContract } from "wagmi"
import { transcriptRegistryAbi, CHAIN } from "@/lib/contracts"
import { useRoleStore } from "@/lib/stores/role-store"
import { useWallets } from "@privy-io/react-auth"
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
import { VerifierTokenManager } from "@/components/app/verifier-token-manager"

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
          <div className="text-center py-8 font-mono text-xs text-ca-danger">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 font-mono text-xs text-muted-foreground">
            NO SYSTEM LOGS FOUND
          </div>
        ) : (
          <div className="space-y-4 font-mono text-xs max-h-[400px] overflow-y-auto pr-2">
            {logs.map((log, index) => {
              let dotColor = "bg-ca-accent"
              if (log.type === "university_registered") dotColor = "bg-ca-success"
              if (log.type === "status_changed") dotColor = "bg-ca-danger"

              return (
                <div key={index} className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-border/20 pb-3 last:border-0 last:pb-0 gap-2">
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
                  <span className="text-[10px] text-muted-foreground shrink-0 sm:pl-4">
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

interface UniversityRowProps {
  id: bigint
  onDeactivate: (id: bigint, reason: string) => void
  onReactivate: (id: bigint) => void
  isDeactivatePending: boolean
  isReactivatePending: boolean
}

const UniversityRow = React.memo(function UniversityRow({ 
  id, 
  onDeactivate, 
  onReactivate, 
  isDeactivatePending, 
  isReactivatePending 
}: UniversityRowProps) {
  const { data } = useUniversity(id)

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
            onClick={() => onDeactivate(id, "Administrative Suspension")}
            disabled={isDeactivatePending}
            className="bg-ca-danger/15 text-ca-danger hover:bg-ca-danger/25 border border-ca-danger/30 font-mono text-[10px] py-1 h-7"
          >
            <Pause className="h-3 w-3 mr-1" /> SUSPEND
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => onReactivate(id)}
            disabled={isReactivatePending}
            className="bg-ca-success/15 text-ca-success hover:bg-ca-success/25 border border-ca-success/30 font-mono text-[10px] py-1 h-7"
          >
            <Play className="h-3 w-3 mr-1" /> REACTIVATE
          </Button>
        )}
      </td>
    </tr>
  )
})

function UniversityList() {
  const { data: count } = useUniversityCount()
  const total = count ? Number(count) : 0

  const deactivateHook = useDeactivateUniversity()
  const reactivateHook = useReactivateUniversity()

  const handleDeactivate = React.useCallback((id: bigint, reason: string) => {
    deactivateHook.deactivate(id, reason)
  }, [deactivateHook.deactivate])

  const handleReactivate = React.useCallback((id: bigint) => {
    reactivateHook.reactivate(id)
  }, [reactivateHook.reactivate])

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
            <UniversityRow 
              key={i} 
              id={BigInt(i)} 
              onDeactivate={handleDeactivate}
              onReactivate={handleReactivate}
              isDeactivatePending={deactivateHook.isPending || deactivateHook.isConfirming}
              isReactivatePending={reactivateHook.isPending || reactivateHook.isConfirming}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DeployUniversityForm() {
  const { address } = useAccount()
  const { wallets } = useWallets()
  const activeWallet = wallets.find(w => w.address.toLowerCase() === address?.toLowerCase())
  const isEmbeddedWallet = activeWallet?.walletClientType === "privy"

  const [name, setName] = useState("")
  const [registrar, setRegistrar] = useState("")
  const [email, setEmail] = useState("")

  const { deploy, hash, isPending, isConfirming, isSuccess, error } = useDeployUniversity()
  const [isPendingTransition, startTransition] = React.useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !registrar || !email) return
    startTransition(() => {
      deploy(name, registrar as Address)
    })
  }

  React.useEffect(() => {
    if (hash && email) {
      const registerEmail = async () => {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
          await fetch(`${API_URL}/api/universities/register-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ txHash: hash, email }),
          })
          console.log("Registered registrar email mapping for tx:", hash)
        } catch (err) {
          console.error("Failed to register registrar email mapping:", err)
        }
      }
      registerEmail()
    }
  }, [hash, email])

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
            className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-ca-accent focus:outline-none"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Designated Registrar Email</label>
          <input
            type="email"
            placeholder="e.g. registrar@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-ca-accent focus:outline-none"
            required
          />
        </div>

        <AddressInput
          label="Designated Registrar Wallet"
          placeholder="0x..."
          value={registrar}
          onChange={setRegistrar}
        />

        {isEmbeddedWallet && (
          <div className="rounded border border-ca-warning/30 bg-ca-warning-dim p-4 font-mono text-xs text-ca-warning flex items-start gap-2">
            <AlertTriangle className="h-4.5 w-4.5 mt-0.5 text-ca-warning shrink-0" />
            <p className="leading-relaxed">
              <strong>Warning:</strong> You are currently connected with an Embedded Wallet. Admins must use a native self-custody wallet (e.g. MetaMask, Coinbase Wallet) to deploy university registry contracts.
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending || isConfirming || isEmbeddedWallet}
          className="w-full bg-ca-accent text-white hover:bg-ca-accent-hover font-mono tracking-wider text-xs py-4 flex items-center justify-center gap-1.5"
        >
          <Plus className="h-5 w-5" /> DEPLOY REGISTRY CONTRACT
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

interface GovernanceRequest {
  id: number
  type: string
  universityId: number
  contractAddr: string
  currentValue: string
  newValue: string
  status: string
  createdAt: string
}

function PendingGovernanceApprovals() {
  const [requests, setRequests] = useState<GovernanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [processingId, setProcessingId] = useState<number | null>(null)
  
  const { writeContractAsync } = useWriteContract()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/governance/requests`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.filter((r: any) => r.status === "pending"))
      } else {
        setError("Failed to fetch pending requests.")
      }
    } catch (e) {
      setError("Failed to connect to backend server.")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchRequests()
  }, [])

  const handleApprove = async (req: GovernanceRequest) => {
    try {
      setProcessingId(req.id)
      
      // If it is a wallet update, we must execute the on-chain txn
      if (req.type === "wallet") {
        console.log("Signing wallet update on-chain for registry:", req.contractAddr)
        const hash = await writeContractAsync({
          address: req.contractAddr as Address,
          abi: transcriptRegistryAbi,
          functionName: "updateRegistrar",
          args: [req.newValue as Address],
          chainId: CHAIN.id,
        })
        console.log("On-chain update registrar txn submitted:", hash)
      }

      // Now approve in our DB backend
      const res = await fetch(`${API_URL}/api/governance/requests/${req.id}/approve`, {
        method: "POST"
      })

      if (res.ok) {
        await fetchRequests()
      } else {
        alert("Failed to approve request in database.")
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Action failed.")
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (req: GovernanceRequest) => {
    try {
      setProcessingId(req.id)
      const res = await fetch(`${API_URL}/api/governance/requests/${req.id}/reject`, {
        method: "POST"
      })

      if (res.ok) {
        await fetchRequests()
      } else {
        alert("Failed to reject request.")
      }
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Action failed.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionLabel index={3} label="PENDING SECURITY & GOVERNANCE APPROVALS" />
        <Button
          size="sm"
          variant="outline"
          onClick={fetchRequests}
          className="font-mono text-[10px] tracking-wider uppercase border-border/60"
        >
          <RefreshCw className="h-3 w-3 mr-1" /> REFRESH
        </Button>
      </div>

      <GlowCard className="p-6 relative overflow-hidden" glow>
        {loading ? (
          <div className="text-center py-8 font-mono text-xs text-muted-foreground animate-pulse">
            LOADING GOVERNANCE REQUESTS...
          </div>
        ) : error ? (
          <div className="text-center py-8 font-mono text-xs text-ca-danger">
            {error}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 font-mono text-xs text-muted-foreground uppercase tracking-wide">
            No pending security approvals
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/20 pb-4 last:border-0 last:pb-0 gap-4"
              >
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] uppercase font-bold border",
                      req.type === "wallet" 
                        ? "bg-ca-accent/10 text-ca-accent border-ca-accent/20"
                        : "bg-ca-warning/10 text-ca-warning border-ca-warning/20"
                    )}>
                      {req.type === "wallet" ? "WALLET CHANGE" : "EMAIL CHANGE"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      University ID: {req.universityId}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Registry: <span className="text-foreground">{req.contractAddr}</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-1 text-[11px]">
                    <div>
                      <span className="text-muted-foreground">Current: </span>
                      <span className="text-ca-danger font-semibold">{req.currentValue}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">New Requested: </span>
                      <span className="text-ca-success font-semibold">{req.newValue}</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground/60">
                    Requested: {new Date(req.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    disabled={processingId !== null}
                    onClick={() => handleReject(req)}
                    className="bg-ca-danger/15 text-ca-danger hover:bg-ca-danger/25 border border-ca-danger/30 font-mono text-[10px] py-1 h-8 px-3"
                  >
                    REJECT
                  </Button>
                  <Button
                    size="sm"
                    disabled={processingId !== null}
                    onClick={() => handleApprove(req)}
                    className="bg-ca-success/15 text-ca-success hover:bg-ca-success/25 border border-ca-success/30 font-mono text-[10px] py-1 h-8 px-3 flex items-center gap-1.5"
                  >
                    {processingId === req.id ? (
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-ca-success border-t-transparent rounded-full" />
                    ) : null}
                    {req.type === "wallet" ? "SIGN & APPROVE" : "APPROVE"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlowCard>
    </div>
  )
}


export default function AdminPage() {
  const { address } = useAccount()
  const { role } = useRoleStore()
  const { data: stats } = usePlatformStats()
  const { data: adminAddress } = usePlatformAdmin()

  const hasAccess = role === "admin"

  if (!hasAccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center animate-fade-in">
        <GlowCard className="p-8 max-w-md text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-ca-danger/15 flex items-center justify-center text-ca-danger">
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
      {/* Wallet Address Warning Banner */}
      {address && adminAddress && address.toLowerCase() !== (adminAddress as string).toLowerCase() && (
        <div className="rounded-xl border border-ca-danger/30 bg-ca-danger/10 p-5 font-mono text-xs text-foreground flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm shadow-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-ca-danger shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="font-bold text-ca-danger uppercase tracking-wider text-[11px] mb-1">
                Platform Admin Wallet Mismatch
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                You are logged in as admin via email, but your active wallet is <span className="text-ca-danger font-semibold">{address}</span> instead of the Platform Admin deployer wallet <span className="text-ca-success font-semibold">{adminAddress as string}</span>. Switch accounts inside MetaMask before performing contract actions.
              </p>
            </div>
          </div>
          <div className="text-[10px] bg-ca-danger/15 border border-ca-danger/30 px-3 py-1.5 rounded-lg text-ca-danger shrink-0 uppercase tracking-wider font-bold">
            Switch Account in MetaMask
          </div>
        </div>
      )}

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
          icon={<Building2 className="h-5 w-5" />}
          accent="default"
        />
        <StatCard
          label="Active Networks"
          value={String(activeCount)}
          icon={<Shield className="h-5 w-5" />}
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

      {/* Governance Approvals */}
      <PendingGovernanceApprovals />

      {/* Token Management */}
      <div className="space-y-4">
        <SectionLabel index={4} label="API INTEGRATIONS" />
        <VerifierTokenManager role="admin" />
      </div>

      {/* Activity Logs */}
      <ActivityLogs />
    </div>
  )
}
