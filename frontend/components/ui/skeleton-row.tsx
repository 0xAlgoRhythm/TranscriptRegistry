import React from "react"
import { cn } from "@/lib/utils"

interface SkeletonRowProps {
  cols?: number
  className?: string
}

export function SkeletonRow({ cols = 4, className }: SkeletonRowProps) {
  return (
    <tr className={cn("border-b border-border/40 hover:bg-transparent", className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-4 align-middle">
          <div 
            className={cn(
              "h-4 rounded bg-muted/60 relative overflow-hidden animate-pulse",
              i === 0 ? "w-1/3" : i === 1 ? "w-2/3" : i === 2 ? "w-1/2" : "w-1/4"
            )}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-background/10 to-transparent animate-[shimmer_1.5s_infinite]" />
          </div>
        </td>
      ))}
    </tr>
  )
}
