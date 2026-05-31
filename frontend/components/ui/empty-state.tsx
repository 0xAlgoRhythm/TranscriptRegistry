import React from "react"
import { cn } from "@/lib/utils"
import { Inbox } from "lucide-react"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center p-8 rounded-xl border border-dashed border-border/60 bg-card/10 backdrop-blur-sm min-h-[260px] relative overflow-hidden",
      className
    )}>
      {/* Corner Bracket Decorators */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-muted-foreground/20" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-muted-foreground/20" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-muted-foreground/20" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-muted-foreground/20" />

      <div className="p-4 bg-muted/20 rounded-full border border-border/30 mb-4 text-muted-foreground/80">
        {icon || <Inbox className="h-8 w-8 stroke-[1.5]" />}
      </div>

      <h3 className="text-sm font-mono font-bold tracking-wide uppercase text-foreground">
        {title}
      </h3>
      
      {description && (
        <p className="text-xs text-muted-foreground max-w-[280px] mt-1.5 leading-relaxed">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  )
}
