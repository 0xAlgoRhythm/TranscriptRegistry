import { cn } from "@/lib/utils"
import React from "react"

interface GlowCardProps {
  children: React.ReactNode
  className?: string
  /** Show an accent-coloured glow border */
  glow?: boolean
  /** Whether to show corner bracket decorators */
  brackets?: boolean
  /** Shine sweep on hover */
  shine?: boolean
  /** Hover lift + background change */
  hoverable?: boolean
  /** Render as a different element */
  as?: "div" | "article" | "section" | "li"
}

export function GlowCard({
  children,
  className,
  glow = false,
  brackets = true,
  shine = false,
  hoverable = false,
  as: Tag = "div",
}: GlowCardProps) {
  return (
    <Tag
      className={cn(
        "relative overflow-hidden rounded-[6px] group",
        glow ? "ca-card-glow" : "ca-card",
        hoverable && "transition-transform duration-200 hover:-translate-y-0.5",
        className,
      )}
    >
      {/* Corner brackets */}
      {brackets && (
        <>
          <span className="ca-bracket-tl" />
          <span className="ca-bracket-tr" />
          <span className="ca-bracket-bl" />
          <span className="ca-bracket-br" />
        </>
      )}

      {/* Shine sweep on hover */}
      {shine && <span className="ca-shine" />}

      {children}
    </Tag>
  )
}
