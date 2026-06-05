"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useAccount } from "wagmi"
import { SectionLabel } from "@/components/ui/section-label"
import { GlowCard } from "@/components/ui/glow-card"
import { HashDisplay } from "@/components/ui/hash-display"
import { EmptyState } from "@/components/ui/empty-state"
import { Activity, Clock, ShieldCheck, UserCheck, AlertTriangle, School, RefreshCw, Loader2 } from "lucide-react"

type LogType = "university_registered" | "transcript_issued" | "status_changed" | "access_granted" | "access_revoked"

interface ActivityEvent {
  type: LogType
  description: string
  operator: string | null
  timestamp: string | Date | null
  txHash: string | null
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; filterKey: string }> = {
  university_registered: {
    label: "University Registered",
    icon: <School className="h-5 w-5" />,
    color: "var(--ca-teal)",
    filterKey: "university",
  },
  transcript_issued: {
    label: "Transcript Issued",
    icon: <Activity className="h-5 w-5 animate-pulse" />,
    color: "var(--ca-accent)",
    filterKey: "issue",
  },
  status_changed: {
    label: "Status Updated",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "var(--ca-warning)",
    filterKey: "status",
  },
  access_granted: {
    label: "Access Authorized",
    icon: <UserCheck className="h-5 w-5" />,
    color: "var(--ca-success)",
    filterKey: "grant",
  },
  access_revoked: {
    label: "Access Revoked",
    icon: <ShieldCheck className="h-5 w-5" />,
    color: "var(--ca-destructive)",
    filterKey: "revoke",
  },
}

const FILTERS = [
  { key: "all", label: "ALL EVENTS" },
  { key: "issue", label: "ISSUED" },
  { key: "university", label: "UNIVERSITIES" },
  { key: "status", label: "STATUS CHANGES" },
]

function timeAgo(ts: string | Date | null): string {
  if (!ts) return "—"
  const now = Date.now()
  const diff = now - new Date(ts).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function ActivityFeedPage() {
  const { address } = useAccount()
  const [filter, setFilter] = useState("all")
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/logs`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setEvents(data)
      }
    } catch (err: any) {
      setError(err.message || "Failed to load activity feed")
    } finally {
      setLoading(false)
      setLastRefresh(new Date())
    }
  }, [API_URL])

  // Initial load
  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs()
    }, 30_000)
    return () => clearInterval(interval)
  }, [fetchLogs])

  const filteredEvents = filter === "all"
    ? events
    : events.filter(e => {
        const cfg = TYPE_CONFIG[e.type]
        return cfg?.filterKey === filter
      })

  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <SectionLabel index={1} label="LIVE BLOCK TELEMETRY" />
          <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
            Real-Time Activity
          </h1>
          <p className="text-xs text-muted-foreground">
            Live stream of registration, authorization, and status events indexed from the blockchain.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground border border-border/40 px-3 py-1.5 rounded transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          REFRESH
        </button>
      </div>

      {/* Stats row */}
      {!loading && events.length > 0 && (
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <span>{events.length} events loaded</span>
          <span className="text-border">·</span>
          <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
          <span className="text-border">·</span>
          <span className="text-ca-success">● Auto-refresh every 30s</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border/40 pb-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded text-xs font-mono font-semibold uppercase tracking-wider transition-all border ${
              filter === f.key
                ? "bg-ca-accent/8 text-ca-accent border-ca-accent/25"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-border/40 bg-card/20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ca-accent border-t-transparent" />
            <p className="font-mono text-xs text-muted-foreground">Fetching blockchain activity...</p>
          </div>
        </div>
      ) : error ? (
        <GlowCard className="p-8 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-ca-danger mx-auto" />
          <p className="font-mono text-xs text-ca-danger">{error}</p>
          <button
            onClick={fetchLogs}
            className="text-xs font-mono text-muted-foreground hover:text-foreground underline"
          >
            Retry
          </button>
        </GlowCard>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-8 w-8 stroke-[1.5]" />}
          title="No events found"
          description={
            filter === "all"
              ? "No blockchain activity has been indexed yet."
              : `No "${filter}" events found in the activity log.`
          }
        />
      ) : (
        /* Activity Timeline List */
        <div className="space-y-4">
          {filteredEvents.map((event, idx) => {
            const cfg = TYPE_CONFIG[event.type] || {
              label: event.type,
              icon: <Activity className="h-5 w-5" />,
              color: "var(--ca-accent)",
              filterKey: "all",
            }

            return (
              <GlowCard
                key={idx}
                className="p-5 relative overflow-hidden hover:border-border/60 transition-all"
                glow={event.type === "transcript_issued"}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="shrink-0 mt-0.5">
                    <div
                      className="p-2.5 rounded-lg"
                      style={{
                        background: `${cfg.color}18`,
                        color: cfg.color,
                      }}
                    >
                      {cfg.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow space-y-2 font-mono text-xs min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-foreground uppercase tracking-wide">
                        {cfg.label}
                      </h4>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                        {timeAgo(event.timestamp)}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground font-sans leading-relaxed truncate">
                      {event.description}
                    </p>

                    <div className="pt-2 flex flex-wrap gap-4 items-center">
                      {event.txHash && (
                        <HashDisplay hash={event.txHash} label="TX HASH" />
                      )}
                      {event.operator && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Operator:</span>
                          <span className="text-[10px] text-foreground font-mono">
                            {event.operator.length > 10
                              ? `${event.operator.slice(0, 6)}...${event.operator.slice(-4)}`
                              : event.operator}
                          </span>
                        </div>
                      )}
                      {event.txHash && (
                        <a
                          href={`https://base-sepolia.blockscout.com/tx/${event.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-ca-accent hover:underline"
                        >
                          VIEW ON EXPLORER →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </GlowCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
