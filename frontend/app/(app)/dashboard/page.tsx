"use client"

import { useAccount } from "wagmi"
import { useRoleStore } from "@/lib/stores/role-store"
import { usePlatformStats, usePlatformAdmin } from "@/hooks/use-university-factory"
import { StatCard } from "@/components/ui/stat-card"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { truncateAddress } from "@/lib/utils"
import { 
  Building2, 
  FileText, 
  CheckCircle2, 
  UserCheck, 
  Lock, 
  ShieldCheck, 
  Send,
  PlusCircle
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { address } = useAccount()
  const { role } = useRoleStore()
  const { data: stats } = usePlatformStats()
  const { data: adminAddress } = usePlatformAdmin()

  const isAdmin = address && adminAddress && address.toLowerCase() === adminAddress.toLowerCase()
  const totalUniversities = stats ? Number(stats[0]) : 0
  const activeCount = stats ? Number(stats[1]) : 0

  const getDashboardTitle = () => {
    switch (role) {
      case "admin": return "Platform Admin Console"
      case "registrar": return "University Registrar Dashboard"
      case "student": return "Student Credential Hub"
      case "verifier": return "Verifier Portal"
      default: return "CredAxis Terminal"
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <SectionLabel index={1} label="OVERVIEW" />
          <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
            {getDashboardTitle()}
          </h1>
          <p className="text-xs text-muted-foreground">
            Connected Wallet: <span className="font-mono text-[11px] text-foreground bg-muted/40 px-1.5 py-0.5 rounded">{address ? truncateAddress(address, 6) : "Not Connected"}</span>
          </p>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Registered Universities"
          value={String(totalUniversities)}
          icon={<Building2 className="h-4.5 w-4.5" />}
          accent="default"
          trend="All instances"
        />
        <StatCard
          label="Active Networks"
          value={String(activeCount)}
          icon={<ShieldCheck className="h-4.5 w-4.5" />}
          accent="success"
          trend={`${totalUniversities - activeCount} suspended`}
        />
        <StatCard
          label="Transcripts Issued"
          value="1,492"
          icon={<FileText className="h-4.5 w-4.5" />}
          accent="teal"
          trend="+12% this month"
        />
        <StatCard
          label="Verifications Done"
          value="4,821"
          icon={<CheckCircle2 className="h-4.5 w-4.5" />}
          accent="success"
          trend="99.9% uptime"
        />
      </div>

      {/* Dynamic Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions Column */}
        <div className="md:col-span-1 space-y-6">
          <SectionLabel index={2} label="QUICK ACTIONS" />
          
          <div className="space-y-3">
            {role === "admin" && (
              <Link href="/admin" className="block group">
                <GlowCard className="p-4 hover:border-[oklch(var(--ca-accent))] hover:bg-card/45 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[oklch(var(--ca-destructive)/0.1)] rounded-lg text-[oklch(var(--ca-destructive))]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground group-hover:text-[oklch(var(--ca-accent))] transition-colors">
                        Deploy University
                      </h4>
                      <p className="text-[10px] text-muted-foreground">Register new institutions on-chain</p>
                    </div>
                  </div>
                </GlowCard>
              </Link>
            )}

            {(role === "registrar" || !role) && (
              <Link href="/issue" className="block group">
                <GlowCard className="p-4 hover:border-[oklch(var(--ca-accent))] hover:bg-card/45 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[oklch(var(--ca-accent)/0.1)] rounded-lg text-[oklch(var(--ca-accent))]">
                      <PlusCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground group-hover:text-[oklch(var(--ca-accent))] transition-colors">
                        Issue Credentials
                      </h4>
                      <p className="text-[10px] text-muted-foreground">Register transcript record for a student</p>
                    </div>
                  </div>
                </GlowCard>
              </Link>
            )}

            {(role === "student" || !role) && (
              <>
                <Link href="/transcripts" className="block group">
                  <GlowCard className="p-4 hover:border-[oklch(var(--ca-accent))] hover:bg-card/45 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[oklch(var(--ca-teal)/0.1)] rounded-lg text-[oklch(var(--ca-teal))]">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground group-hover:text-[oklch(var(--ca-accent))] transition-colors">
                          My Transcripts
                        </h4>
                        <p className="text-[10px] text-muted-foreground">View your academic records on-chain</p>
                      </div>
                    </div>
                  </GlowCard>
                </Link>

                <Link href="/access" className="block group">
                  <GlowCard className="p-4 hover:border-[oklch(var(--ca-accent))] hover:bg-card/45 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[oklch(var(--ca-success)/0.1)] rounded-lg text-[oklch(var(--ca-success))]">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground group-hover:text-[oklch(var(--ca-accent))] transition-colors">
                          Access Delegation
                        </h4>
                        <p className="text-[10px] text-muted-foreground">Grant & revoke verifier permissions</p>
                      </div>
                    </div>
                  </GlowCard>
                </Link>
              </>
            )}

            <Link href="/verify" className="block group">
              <GlowCard className="p-4 hover:border-[oklch(var(--ca-accent))] hover:bg-card/45 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[oklch(var(--ca-success)/0.1)] rounded-lg text-[oklch(var(--ca-success))]">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground group-hover:text-[oklch(var(--ca-accent))] transition-colors">
                      On-Chain Verification
                    </h4>
                    <p className="text-[10px] text-muted-foreground">Verify transcript cryptographic hashes</p>
                  </div>
                </div>
              </GlowCard>
            </Link>
          </div>
        </div>

        {/* Dynamic Activity/News Section */}
        <div className="md:col-span-2 space-y-6">
          <SectionLabel index={3} label="REALTIME NETWORK METRICS" />
          
          <GlowCard className="p-6 relative overflow-hidden" glow>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                  Recent Activities
                </h3>
                <span className="text-[10px] font-mono text-muted-foreground">LIVE STREAMING</span>
              </div>

              <div className="space-y-4 font-mono">
                <div className="flex items-start justify-between text-xs border-b border-border/20 pb-3">
                  <div className="space-y-1">
                    <p className="text-foreground font-semibold flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[oklch(var(--ca-success))]" />
                      TRANSCRIPT_REGISTERED
                    </p>
                    <p className="text-[10px] text-muted-foreground">MIT Registry Address: 0x82c...12A</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">2m ago</span>
                </div>

                <div className="flex items-start justify-between text-xs border-b border-border/20 pb-3">
                  <div className="space-y-1">
                    <p className="text-foreground font-semibold flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[oklch(var(--ca-accent))]" />
                      ACCESS_GRANTED
                    </p>
                    <p className="text-[10px] text-muted-foreground">Student 0x43b...98d to Verifier: 0x931...bde</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">15m ago</span>
                </div>

                <div className="flex items-start justify-between text-xs border-b border-border/20 pb-3">
                  <div className="space-y-1">
                    <p className="text-foreground font-semibold flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[oklch(var(--ca-accent))]" />
                      UNIVERSITY_DEPLOYED
                    </p>
                    <p className="text-[10px] text-muted-foreground">Stanford Registry Contract Created</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">1h ago</span>
                </div>
              </div>
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  )
}
