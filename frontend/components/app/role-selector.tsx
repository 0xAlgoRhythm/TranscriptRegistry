"use client"

import React from "react"
import { useRoleStore, UserRole } from "@/lib/stores/role-store"
import { cn } from "@/lib/utils"
import { Shield, GraduationCap, Building2, Eye, RefreshCw } from "lucide-react"

export function RoleSelector() {
  const { role, setRole, isDemoMode, toggleDemoMode } = useRoleStore()

  const rolesList: { id: UserRole; label: string; icon: React.ReactNode; color: string }[] = [
    { 
      id: "admin", 
      label: "Platform Admin", 
      icon: <Shield className="h-3.5 w-3.5" />, 
      color: "text-[oklch(var(--ca-destructive))]" 
    },
    { 
      id: "registrar", 
      label: "University Registrar", 
      icon: <Building2 className="h-3.5 w-3.5" />, 
      color: "text-[oklch(var(--ca-accent))]" 
    },
    { 
      id: "student", 
      label: "Student Hub", 
      icon: <GraduationCap className="h-3.5 w-3.5" />, 
      color: "text-[oklch(var(--ca-teal))]" 
    },
    { 
      id: "verifier", 
      label: "Public Verifier", 
      icon: <Eye className="h-3.5 w-3.5" />, 
      color: "text-[oklch(var(--ca-success))]" 
    },
  ]

  if (!isDemoMode) {
    return (
      <button 
        onClick={toggleDemoMode}
        className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border/30 hover:border-border transition-all w-full justify-center"
      >
        <RefreshCw className="h-3 w-3" /> ENABLE ROLE SIMULATOR
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/45 p-3.5 space-y-3 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-muted-foreground/30" />
      <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-muted-foreground/30" />
      <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-muted-foreground/30" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-muted-foreground/30" />

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
          SIMULATOR CONTROL
        </span>
        <button
          onClick={toggleDemoMode}
          className="text-[9px] font-mono text-[oklch(var(--ca-destructive))] hover:underline uppercase"
        >
          HIDE
        </button>
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {rolesList.map((r) => {
          const isActive = role === r.id
          return (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all text-left border",
                isActive 
                  ? "bg-muted border-border/80 text-foreground shadow-sm" 
                  : "bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <span className={cn(isActive ? r.color : "text-muted-foreground")}>
                {r.icon}
              </span>
              <span className="font-mono text-[11px] flex-grow">{r.label}</span>
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-[oklch(var(--ca-accent))] animate-pulse" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
