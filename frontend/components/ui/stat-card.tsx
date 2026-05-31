import { cn } from "@/lib/utils"
import React from "react"

interface StatCardProps {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  /** Secondary metric / trend text */
  trend?: string
  /** Accent colour dot */
  accent?: "default" | "teal" | "success" | "warning" | "danger"
  className?: string
}

const accentMap = {
  default: "bg-[var(--ca-accent)]",
  teal:    "bg-[var(--ca-teal)]",
  success: "bg-[var(--ca-success)]",
  warning: "bg-[var(--ca-warning)]",
  danger:  "bg-[var(--ca-danger)]",
}

const accentBg = {
  default: "bg-[var(--ca-accent-dim)]",
  teal:    "bg-[var(--ca-teal-dim)]",
  success: "bg-[var(--ca-success-dim)]",
  warning: "bg-[var(--ca-warning-dim)]",
  danger:  "bg-[var(--ca-danger-dim)]",
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  accent = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[6px] ca-card p-5 group",
        className,
      )}
    >
      {/* Corner brackets */}
      <span className="ca-bracket-tl" />
      <span className="ca-bracket-tr" />
      <span className="ca-bracket-bl" />
      <span className="ca-bracket-br" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="label-mono truncate">{label}</p>
          <p
            className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ca-text)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {value}
          </p>
          {trend && (
            <p className="mt-1 text-xs text-[var(--ca-muted)]">{trend}</p>
          )}
        </div>

        {icon && (
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-[4px]",
              accentBg[accent],
            )}
          >
            <span className={cn("flex size-4 items-center justify-center", {
              "text-[var(--ca-accent)]": accent === "default",
              "text-[var(--ca-teal)]": accent === "teal",
              "text-[var(--ca-success)]": accent === "success",
              "text-[var(--ca-warning)]": accent === "warning",
              "text-[var(--ca-danger)]": accent === "danger",
            })}>
              {icon}
            </span>
          </div>
        )}
      </div>

      {/* Bottom accent bar */}
      <div
        className={cn(
          "absolute bottom-0 left-0 h-px w-0 transition-all duration-500 group-hover:w-full",
          accentMap[accent],
        )}
      />
    </div>
  )
}
