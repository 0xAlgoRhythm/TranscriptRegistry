"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { ExternalLink, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { HashDisplay } from "./hash-display"

interface TxPanelProps {
  status: "idle" | "preparing" | "signing" | "pending" | "success" | "error"
  hash?: string
  error?: string
  explorerUrl?: string
  title?: string
  description?: string
  className?: string
  onClose?: () => void
}

export function TxPanel({
  status,
  hash,
  error,
  explorerUrl,
  title,
  description,
  className,
  onClose
}: TxPanelProps) {
  if (status === "idle") return null

  return (
    <div className={cn(
      "w-full rounded-xl border border-border/80 bg-card/60 backdrop-blur-md p-6 relative overflow-hidden transition-all duration-300",
      status === "error" && "border-ca-danger/50 bg-ca-danger/2",
      status === "success" && "border-ca-success/50 bg-ca-success/2",
      className
    )}>
      {/* Corner Bracket Decorators */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-muted-foreground/30" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-muted-foreground/30" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-muted-foreground/30" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-muted-foreground/30" />

      <div className="flex gap-4">
        <div className="flex-shrink-0 mt-0.5">
          {(status === "pending" || status === "preparing" || status === "signing") && (
            <Loader2 className="h-6 w-6 text-ca-accent animate-spin" />
          )}
          {status === "success" && (
            <CheckCircle2 className="h-6 w-6 text-ca-success" />
          )}
          {status === "error" && (
            <XCircle className="h-6 w-6 text-ca-danger" />
          )}
        </div>

        <div className="flex-grow space-y-2 min-w-0">
          {title && (
            <h4 className="text-sm font-mono font-bold tracking-wide uppercase text-foreground">
              {title}
            </h4>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}

          {hash && (
            <div className="pt-2 flex flex-col gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Transaction Hash</span>
              <HashDisplay hash={hash} explorerUrl={explorerUrl} />
            </div>
          )}

          {error && (
            <div className="pt-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ca-danger">Error Details</span>
              <p className="text-xs font-mono text-ca-danger bg-ca-danger/5 border border-ca-danger/15 rounded p-2.5 mt-1 overflow-x-auto whitespace-pre-wrap max-h-32">
                {error}
              </p>
            </div>
          )}
        </div>
      </div>

      {onClose && (status === "success" || status === "error") && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xs font-mono tracking-wider text-muted-foreground hover:text-foreground border border-border/40 hover:border-border px-2 py-0.5 rounded transition-all"
        >
          DISMISS
        </button>
      )}
    </div>
  )
}
