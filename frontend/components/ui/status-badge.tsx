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
    variantClass = "bg-ca-success/8 text-ca-success border-ca-success/30"
    dotClass = "bg-ca-success"
  } else if (normStatus === "error" || normStatus === "revoked" || normStatus === "deactivated") {
    variantClass = "bg-ca-danger/8 text-ca-danger border-ca-danger/30"
    dotClass = "bg-ca-danger"
  } else if (normStatus === "warning" || normStatus === "pending") {
    variantClass = "bg-ca-warning/8 text-ca-warning border-ca-warning/30"
    dotClass = "bg-ca-warning"
  } else if (normStatus === "info" || normStatus === "primary") {
    variantClass = "bg-ca-accent/8 text-ca-accent border-ca-accent/30"
    dotClass = "bg-ca-accent"
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
