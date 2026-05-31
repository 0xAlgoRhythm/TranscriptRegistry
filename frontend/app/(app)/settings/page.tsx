"use client"

import React, { useState } from "react"
import { useAccount } from "wagmi"
import { usePrivy } from "@privy-io/react-auth"
import { useRoleStore } from "@/lib/stores/role-store"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { StatusBadge } from "@/components/ui/status-badge"
import { HashDisplay } from "@/components/ui/hash-display"
import { Button } from "@/components/ui/button"
import { Settings, Shield, User, Bell, Network, Mail } from "lucide-react"

export default function SettingsPage() {
  const { address } = useAccount()
  const { user } = usePrivy()
  const { role, isDemoMode, toggleDemoMode } = useRoleStore()
  
  // Notification states
  const [notifyIssue, setNotifyIssue] = useState(true)
  const [notifyAccess, setNotifyAccess] = useState(true)
  const [notifyVerify, setNotifyVerify] = useState(false)

  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="space-y-1">
        <SectionLabel index={1} label="PREFERENCES" />
        <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
          System Settings
        </h1>
        <p className="text-xs text-muted-foreground">
          Manage your connected Privy account profile, notification alerts, and active simulator role states.
        </p>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Settings options */}
        <div className="md:col-span-2 space-y-6">
          {/* Identity settings */}
          <GlowCard className="p-6 md:p-8 space-y-5" glow>
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="p-2 bg-[oklch(var(--ca-accent)/0.1)] rounded-lg text-[oklch(var(--ca-accent))]">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                  Connected Identity
                </h3>
                <p className="text-[10px] text-muted-foreground">Privy auth connection stats</p>
              </div>
            </div>

            <div className="space-y-4 font-mono text-xs text-muted-foreground">
              {user?.email && (
                <div className="flex justify-between items-center py-2 border-b border-border/20">
                  <span>Authorized Email</span>
                  <span className="text-foreground">{user.email.address}</span>
                </div>
              )}
              {address && (
                <div className="flex justify-between items-center py-2 border-b border-border/20">
                  <span>Ethereum Wallet</span>
                  <HashDisplay hash={address} />
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span>Login Method</span>
                <span className="text-foreground capitalize">{user?.linkedAccounts[0]?.type || "Wallet"}</span>
              </div>
            </div>
          </GlowCard>

          {/* Alert settings */}
          <GlowCard className="p-6 md:p-8 space-y-5">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="p-2 bg-[oklch(var(--ca-teal)/0.1)] rounded-lg text-[oklch(var(--ca-teal))]">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                  Notification Subscriptions
                </h3>
                <p className="text-[10px] text-muted-foreground">Receive real-time alerts on platform actions</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-mono font-bold text-foreground">CREDENTIAL ISSUANCE ALERTS</span>
                  <p className="text-[10px] text-muted-foreground">Notify when a new transcript is issued to my wallet</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyIssue}
                  onChange={(e) => setNotifyIssue(e.target.checked)}
                  className="rounded border-border/60 text-[oklch(var(--ca-accent))] focus:ring-0 w-4 h-4 bg-transparent"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-mono font-bold text-foreground">ACCESS GRANTED / REVOKED</span>
                  <p className="text-[10px] text-muted-foreground">Alert when verifier delegations are created or expired</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyAccess}
                  onChange={(e) => setNotifyAccess(e.target.checked)}
                  className="rounded border-border/60 text-[oklch(var(--ca-accent))] focus:ring-0 w-4 h-4 bg-transparent"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-mono font-bold text-foreground">AUDIT LOG NOTIFICATIONS</span>
                  <p className="text-[10px] text-muted-foreground">Notify on any validation checks written on-chain</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyVerify}
                  onChange={(e) => setNotifyVerify(e.target.checked)}
                  className="rounded border-border/60 text-[oklch(var(--ca-accent))] focus:ring-0 w-4 h-4 bg-transparent"
                />
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Demo simulator panel */}
        <div className="md:col-span-1 space-y-6">
          <SectionLabel index={2} label="SIMULATOR OPTIONS" />
          <GlowCard className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-[oklch(var(--ca-accent))]">
              <Shield className="h-5 w-5" />
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                Developer Prototyping
              </h4>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Toggle role emulation to test specific page accesses (Admin, Registrar, Student, Verifier) without needing contract redeployments.
            </p>

            <div className="pt-4 border-t border-border/40">
              <Button
                onClick={toggleDemoMode}
                className="w-full bg-card hover:bg-muted border border-border/60 font-mono text-xs py-3.5"
              >
                {isDemoMode ? "DISABLE SIMULATION" : "ENABLE SIMULATION"}
              </Button>
            </div>
          </GlowCard>
        </div>

      </div>
    </div>
  )
}
