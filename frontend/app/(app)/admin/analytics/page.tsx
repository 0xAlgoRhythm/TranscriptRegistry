"use client"

import React, { useState, useEffect } from "react"
import { SectionLabel } from "@/components/ui/section-label"
import { GlowCard } from "@/components/ui/glow-card"
import { StatCard } from "@/components/ui/stat-card"
import { cn } from "@/lib/utils"
import { BarChart, Landmark, ShieldCheck, TrendingUp, Users, Loader2 } from "lucide-react"

export default function AdminAnalyticsPage() {
  const [dbStats, setDbStats] = useState<any>(null)
  const [uniShares, setUniShares] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        
        // Fetch stats
        const resStats = await fetch(`${API_URL}/api/stats/platform`)
        if (resStats.ok) {
          const statsData = await resStats.json()
          setDbStats(statsData)
        }

        // Fetch universities
        const resUnis = await fetch(`${API_URL}/api/universities`)
        if (resUnis.ok) {
          const unisData = await resUnis.json()

          // Fetch count of transcripts for each registry to get shares
          const shares = []
          for (const uni of unisData) {
            const resTx = await fetch(`${API_URL}/api/transcripts/by-registry/${uni.contractAddr}`)
            if (resTx.ok) {
              const txList = await resTx.json()
              shares.push({
                name: uni.name,
                count: txList.length,
              })
            }
          }
          setUniShares(shares)
        }
      } catch (err) {
        console.error("Failed to load analytics:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="space-y-1">
        <SectionLabel index={1} label="METRICS EXPLORER" />
        <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
          Platform Analytics
        </h1>
        <p className="text-xs text-muted-foreground">
          Aggregate platform statistics, deployment growth metrics, and verification audit volumes.
        </p>
      </div>

      {/* Metrics overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 font-mono">
        <StatCard
          label="Total Issued Records"
          value={dbStats ? String(dbStats.totalTranscripts) : "..."}
          icon={<BarChart className="h-4.5 w-4.5" />}
          accent="default"
          trend="Live database count"
        />
        <StatCard
          label="Verification Requests"
          value={dbStats ? String(dbStats.totalVerifications) : "..."}
          icon={<ShieldCheck className="h-4.5 w-4.5" />}
          accent="success"
          trend="Successful audits"
        />
        <StatCard
          label="Active Universities"
          value={dbStats ? String(dbStats.activeUniversities) : "..."}
          icon={<Landmark className="h-4.5 w-4.5" />}
          accent="teal"
          trend={`${(dbStats?.totalUniversities || 0) - (dbStats?.activeUniversities || 0)} suspended`}
        />
        <StatCard
          label="Verification Volume"
          value={dbStats ? `${((dbStats.totalVerifications || 0) * 1.0).toFixed(1)}` : "..."}
          icon={<TrendingUp className="h-4.5 w-4.5" />}
          accent="success"
          trend="Dynamic load"
        />
      </div>

      {/* Mock Chart Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <SectionLabel index={2} label="DAILY TRANSACTION FREQUENCY" />
          <GlowCard className="p-6 h-64 flex flex-col justify-between" glow>
            <div className="flex justify-between items-center border-b border-border/40 pb-3 font-mono text-xs">
              <span className="font-bold">VERIFICATION VELOCITY HISTORY</span>
              <span className="text-muted-foreground">30-DAY TIMELINE</span>
            </div>
            
            {/* Visual mock chart bars */}
            <div className="flex items-end gap-2 h-40 pt-4 px-2">
              {[20, 35, 45, 30, 25, 40, 55, 65, 50, 45, 60, 75, 80, 65, 55, 70, 85, 90, 80, 75, 95, 110, 100, 90, 105, 120, 130, 115, 105, 125].map((val, idx) => (
                <div 
                  key={idx} 
                  className="flex-grow bg-[oklch(var(--ca-accent)/0.65)] hover:bg-[oklch(var(--ca-accent))] transition-colors rounded-t"
                  style={{ height: `${(val / 130) * 100}%` }}
                  title={`Day ${idx + 1}: ${val} checks`}
                />
              ))}
            </div>
          </GlowCard>
        </div>

        <div className="md:col-span-1 space-y-4">
          <SectionLabel index={3} label="REGISTRY SHARE" />
          <GlowCard className="p-6 h-64 font-mono text-xs space-y-4 overflow-y-auto">
            <span className="font-bold block border-b border-border/40 pb-3">ACCUMULATION SHARE</span>
            
            <div className="space-y-4">
              {loading && uniShares.length === 0 ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground text-xs animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculating shares...
                </div>
              ) : uniShares.length === 0 ? (
                <p className="text-xs text-muted-foreground">No transcripts registered on any active university.</p>
              ) : (
                (() => {
                  const total = uniShares.reduce((acc, curr) => acc + curr.count, 0)
                  return uniShares.map((share, idx) => {
                    const pct = total > 0 ? Math.round((share.count / total) * 100) : 0
                    const colors = [
                      "bg-[oklch(var(--ca-accent))]",
                      "bg-[oklch(var(--ca-teal))]",
                      "bg-[oklch(var(--ca-success))]",
                      "bg-[oklch(var(--ca-warning))]"
                    ]
                    const colorClass = colors[idx % colors.length]
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-[9px] gap-2">
                          <span className="truncate max-w-[70%] uppercase">{share.name}</span>
                          <span className="shrink-0 text-foreground font-bold">{pct}% ({share.count})</span>
                        </div>
                        <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", colorClass)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })
                })()
              )}
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  )
}

