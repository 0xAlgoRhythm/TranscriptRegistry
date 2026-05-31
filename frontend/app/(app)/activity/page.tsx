"use client"

import React, { useState } from "react"
import { useAccount } from "wagmi"
import { SectionLabel } from "@/components/ui/section-label"
import { GlowCard } from "@/components/ui/glow-card"
import { HashDisplay } from "@/components/ui/hash-display"
import { StatusBadge } from "@/components/ui/status-badge"
import { Activity, Clock, ShieldCheck, UserCheck, AlertTriangle } from "lucide-react"

export default function ActivityFeedPage() {
  const { address } = useAccount()
  const [filter, setFilter] = useState("all")

  // Mock indexer live events list
  const events = [
    {
      id: "1",
      type: "issue",
      title: "Transcript Issued",
      description: "Hashed identity record registered successfully on MIT TranscriptRegistry contract.",
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45m ago
      txHash: "0x4f3e5c72a819bdfef0789278912ef64d0012bc09a63fe89d71a8bc8f921888ad",
    },
    {
      id: "2",
      type: "grant",
      title: "Access Authorized",
      description: "Student granted verifier (0x4b20...02db) access to transcript record 0x4f3e...88ad.",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h ago
      txHash: "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f12ef",
    },
    {
      id: "3",
      type: "verify",
      title: "Integrity Verified",
      description: "Verifier executed on-chain verify check on record 0x4f3e...88ad. Result: Authentic.",
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1d ago
      txHash: "0xbc8f921888ad4f3e5c72a819bdfef0789278912ef64d0012bc09a63fe89d71a",
    },
  ]

  const filteredEvents = filter === "all" ? events : events.filter(e => e.type === filter)

  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="space-y-1">
        <SectionLabel index={1} label="LIVE BLOCK TELEMETRY" />
        <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
          Real-Time Activity
        </h1>
        <p className="text-xs text-muted-foreground">
          Audit the historical stream of registration, authorization, and validation events indexed from Ethereum.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border/40 pb-2">
        {["all", "issue", "grant", "verify"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded text-xs font-mono font-semibold uppercase tracking-wider transition-all border ${
              filter === t 
                ? "bg-[oklch(var(--ca-accent)/0.08)] text-[oklch(var(--ca-accent))] border-[oklch(var(--ca-accent)/0.25)]" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t} events
          </button>
        ))}
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-6">
        {filteredEvents.map((event) => (
          <GlowCard key={event.id} className="p-6 relative overflow-hidden" glow={event.type === "issue"}>
            <div className="flex gap-4">
              <div className="shrink-0 mt-0.5">
                {event.type === "issue" && (
                  <div className="p-2.5 bg-[oklch(var(--ca-accent)/0.1)] rounded-lg text-[oklch(var(--ca-accent))]">
                    <Activity className="h-5 w-5 animate-pulse" />
                  </div>
                )}
                {event.type === "grant" && (
                  <div className="p-2.5 bg-[oklch(var(--ca-teal)/0.1)] rounded-lg text-[oklch(var(--ca-teal))]">
                    <UserCheck className="h-5 w-5" />
                  </div>
                )}
                {event.type === "verify" && (
                  <div className="p-2.5 bg-[oklch(var(--ca-success)/0.1)] rounded-lg text-[oklch(var(--ca-success))]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="flex-grow space-y-2 font-mono text-xs">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-foreground uppercase tracking-wide">
                    {event.title}
                  </h4>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
                  {event.description}
                </p>

                <div className="pt-2 flex flex-wrap gap-4 items-center justify-between">
                  <HashDisplay hash={event.txHash} label="TX HASH" />
                  <StatusBadge status="success" label="Confirmed" />
                </div>
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  )
}
