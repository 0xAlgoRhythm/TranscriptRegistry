"use client"

import React from "react"
import { SectionLabel } from "@/components/ui/section-label"
import { GlowCard } from "@/components/ui/glow-card"
import { StatCard } from "@/components/ui/stat-card"
import { BarChart, Landmark, ShieldCheck, TrendingUp, Users } from "lucide-react"

export default function AdminAnalyticsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="space-y-1">
        <SectionLabel index={1} label="METRICS EXPLORER" />
        <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
          Platform Analytics
        </h1>
        <p className="text-xs text-muted-foreground">
          Aggregate platform statistics, daily deployment growth metrics, and audit volumes.
        </p>
      </div>

      {/* Metrics overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 font-mono">
        <StatCard
          label="Total Issued Records"
          value="1,492"
          icon={<BarChart className="h-4.5 w-4.5" />}
          accent="default"
          trend="+14% MoM"
        />
        <StatCard
          label="Verification Requests"
          value="4,821"
          icon={<ShieldCheck className="h-4.5 w-4.5" />}
          accent="success"
          trend="99.9% Success"
        />
        <StatCard
          label="Active Universities"
          value="3"
          icon={<Landmark className="h-4.5 w-4.5" />}
          accent="teal"
          trend="No suspensions"
        />
        <StatCard
          label="Verification Volume"
          value="14.2K"
          icon={<TrendingUp className="h-4.5 w-4.5" />}
          accent="success"
          trend="Peak 45req/m"
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
          <SectionLabel index={3} label="REGISTRY METRICS" />
          <GlowCard className="p-6 h-64 font-mono text-xs space-y-4">
            <span className="font-bold block border-b border-border/40 pb-3">ACCUMULATION SHARE</span>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span>KNUST REGISTRY</span>
                  <span>62%</span>
                </div>
                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                  <div className="h-full bg-[oklch(var(--ca-accent))] w-[62%]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span>UCC REGISTRY</span>
                  <span>28%</span>
                </div>
                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                  <div className="h-full bg-[oklch(var(--ca-teal))] w-[28%]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span>UEW REGISTRY</span>
                  <span>10%</span>
                </div>
                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                  <div className="h-full bg-[oklch(var(--ca-success))] w-[10%]" />
                </div>
              </div>
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  )
}
