"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { Check, Copy } from "lucide-react"

interface CopyButtonProps {
  value: string
  label?: string
  className?: string
}

export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-border/40 hover:border-border text-xs font-mono tracking-wider text-muted-foreground hover:text-foreground transition-all duration-150 bg-muted/20 hover:bg-muted/40",
        className
      )}
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-[oklch(var(--ca-success))]" />
          <span className="text-[oklch(var(--ca-success))]">{label ? `${label} COPIED` : "COPIED"}</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>{label || "COPY"}</span>
        </>
      )}
    </button>
  )
}
