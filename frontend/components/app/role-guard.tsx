"use client"

import React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useRoleStore } from "@/lib/stores/role-store"
import { useRBAC } from "@/components/providers/rbac-provider"
import { GlowCard } from "@/components/ui/glow-card"
import { Button } from "@/components/ui/button"
import { ShieldAlert, ArrowLeft, Home } from "lucide-react"

interface RoleGuardProps {
  children: React.ReactNode
}

export function RoleGuard({ children }: RoleGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { role } = useRoleStore()
  const { isLoading } = useRBAC()
  const [isPending, startTransition] = React.useTransition()

  // Guard routing configuration
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/")
  const isRegistrarRoute = pathname === "/issue" || pathname === "/issued" || pathname.startsWith("/issued/")
  const isStudentRoute = pathname === "/transcripts" || pathname.startsWith("/transcripts/") || pathname === "/access"

  const hasAdminAccess = role === "admin"
  const hasRegistrarAccess = role === "registrar" || role === "admin"
  const hasStudentAccess = role === "student" || role === "admin"

  const isAuthorized = 
    (!isAdminRoute || hasAdminAccess) &&
    (!isRegistrarRoute || hasRegistrarAccess) &&
    (!isStudentRoute || hasStudentAccess)

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ca-accent border-t-transparent" />
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest animate-pulse">
            Verifying Access...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6 animate-fade-in">
        <GlowCard className="p-8 max-w-md text-center space-y-6" glow>
          <div className="mx-auto w-12 h-12 rounded-full bg-ca-danger/15 flex items-center justify-center text-ca-danger">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-foreground">
              ACCESS CONTROL DENIED
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your connected wallet address does not hold the permissions required to view this administrative endpoint.
            </p>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <Button
              onClick={() => startTransition(() => router.back())}
              variant="outline"
              className="font-mono text-xs border-border/60 flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> BACK
            </Button>
            <Button
              onClick={() => startTransition(() => router.push("/dashboard"))}
              className="bg-ca-accent text-white hover:bg-ca-accent-hover font-mono text-xs flex items-center gap-1.5"
            >
              <Home className="h-3.5 w-3.5" /> DASHBOARD
            </Button>
          </div>
        </GlowCard>
      </div>
    )
  }

  return <>{children}</>
}
