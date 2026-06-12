"use client"

import React, { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { History, ShieldAlert } from "lucide-react"

export default function AdminSettingsPage() {
  const { address } = useAccount()
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/audit-logs`)
      if (res.ok) {
        setLogs(await res.json())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-10 animate-fade-in pb-16">
      <div className="space-y-1">
        <SectionLabel index={1} label="PLATFORM ADMIN" />
        <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
          System Audit Logs
        </h1>
        <p className="text-xs text-muted-foreground">
          Global view of all system actions, platform modifications, and critical events.
        </p>
      </div>

      {loading ? (
        <div className="h-40 rounded-xl bg-card/45 border border-border/40 animate-pulse flex items-center justify-center font-mono text-xs text-muted-foreground">
          LOADING AUDIT LOGS...
        </div>
      ) : (
        <GlowCard className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2">
              <History className="h-4 w-4" /> Global Audit Trail
            </h3>
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {logs.length === 0 ? (
              <p className="text-xs font-mono text-muted-foreground text-center py-10">No audit logs found across the system.</p>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded bg-muted/20 border border-border/40 gap-4 transition-all hover:bg-muted/40">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        log.actorType === 'admin' ? 'bg-ca-danger/10 text-ca-danger' :
                        log.actorType === 'registrar' ? 'bg-ca-accent/10 text-ca-accent' :
                        'bg-ca-teal/10 text-ca-teal'
                      }`}>
                        {log.actorType}
                      </span>
                      <span className="text-xs font-mono font-bold text-foreground">{log.action}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{log.details || "No additional details provided"}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/60 break-all">Actor: {log.actorAddress}</p>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground whitespace-nowrap bg-card px-2.5 py-1.5 rounded border border-border/40 shadow-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </GlowCard>
      )}
    </div>
  )
}
