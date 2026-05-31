import React from "react"
import { cn } from "@/lib/utils"

export type BadgeStatusType = "info" | "success" | "warning" | "error" | "inactive" | "active"

interface StatusBadgeProps {
  status: BadgeStatusType | string
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const normStatus = status.toLowerCase()
  
  let variantClass = "bg-muted text-muted-foreground border-border/50"
  let dotClass = "bg-muted-foreground"

  if (normStatus === "success" || normStatus === "active" || normStatus === "verified") {
    variantClass = "bg-[oklch(var(--ca-success)/0.08)] text-[oklch(var(--ca-success))] border-[oklch(var(--ca-success)/0.3)]"
    dotClass = "bg-[oklch(var(--ca-success))]"
  } else if (normStatus === "error" || normStatus === "revoked" || normStatus === "deactivated") {
    variantClass = "bg-[oklch(var(--ca-destructive)/0.08)] text-[oklch(var(--ca-destructive))] border-[oklch(var(--ca-destructive)/0.3)]"
    dotClass = "bg-[oklch(var(--ca-destructive))]"
  } else if (normStatus === "warning" || normStatus === "pending") {
    variantClass = "bg-[oklch(var(--ca-warning)/0.08)] text-[oklch(var(--ca-warning))] border-[oklch(var(--ca-warning)/0.3)]"
    dotClass = "bg-[oklch(var(--ca-warning))]"
  } else if (normStatus === "info" || normStatus === "primary") {
    variantClass = "bg-[oklch(var(--ca-accent)/0.08)] text-[oklch(var(--ca-accent))] border-[oklch(var(--ca-accent)/0.3)]"
    dotClass = "bg-[oklch(var(--ca-accent))]"
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold tracking-wider uppercase border shadow-sm",
      variantClass,
      className
    )}>
      <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", dotClass)} />
      {label || status}
    </span>
  )
}
