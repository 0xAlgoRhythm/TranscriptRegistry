"use client"

import React, { useState } from "react"
import { cn, truncateAddress } from "@/lib/utils"
import { Check, Copy, ExternalLink } from "lucide-react"

interface HashDisplayProps {
  hash: string
  label?: string
  explorerUrl?: string
  className?: string
  chars?: number
}

export function HashDisplay({ hash, label, explorerUrl, className, chars = 6 }: HashDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {label && (
        <span className="text-xs font-mono text-muted-foreground mr-1">
          {label}:
        </span>
      )}
      <span className="font-mono text-sm font-medium tracking-tight text-foreground/90 bg-muted/40 px-2 py-0.5 rounded border border-border/30">
        {truncateAddress(hash, chars)}
      </span>
      
      <div className="flex items-center gap-1">
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-150"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-ca-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-150"
            title="View on Explorer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}
