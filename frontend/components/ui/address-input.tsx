"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils"
import { ShieldCheck, ShieldAlert, Sparkles } from "lucide-react"
import { isAddress } from "viem"

interface AddressInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
}

export function AddressInput({
  value,
  onChange,
  label,
  error,
  className,
  placeholder = "0x...",
  ...props
}: AddressInputProps) {
  const [focused, setFocused] = useState(false)
  const isValid = value ? isAddress(value) : false

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      {label && (
        <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase flex items-center justify-between">
          <span>{label}</span>
          {value && (
            <span className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 transition-all duration-300",
              isValid 
                ? "bg-[oklch(var(--ca-success)/0.1)] text-[oklch(var(--ca-success))]" 
                : "bg-[oklch(var(--ca-destructive)/0.1)] text-[oklch(var(--ca-destructive))]"
            )}>
              {isValid ? (
                <>
                  <ShieldCheck className="h-3 w-3" /> Valid Address
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3 w-3" /> Invalid Address
                </>
              )}
            </span>
          )}
        </label>
      )}
      <div 
        className={cn(
          "relative flex items-center rounded-lg border bg-card transition-all duration-300 shadow-sm",
          focused 
            ? "border-[oklch(var(--ca-accent))] ring-1 ring-[oklch(var(--ca-accent))]" 
            : error 
              ? "border-[oklch(var(--ca-destructive))]" 
              : "border-border/60 hover:border-border"
        )}
      >
        {/* Left Indicator bar */}
        <div 
          className={cn(
            "absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r transition-all duration-300",
            focused 
              ? "bg-[oklch(var(--ca-accent))]" 
              : isValid 
                ? "bg-[oklch(var(--ca-success))]" 
                : error 
                  ? "bg-[oklch(var(--ca-destructive))]" 
                  : "bg-muted/40"
          )}
        />
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent py-2.5 pl-4 pr-10 text-sm font-mono text-foreground placeholder-muted-foreground focus:outline-none"
          placeholder={placeholder}
          {...props}
        />

        <div className="absolute right-3 flex items-center justify-center pointer-events-none">
          {isValid ? (
            <Sparkles className="h-4 w-4 text-[oklch(var(--ca-accent))] animate-pulse" />
          ) : null}
        </div>
      </div>
      {error && (
        <p className="text-xs font-mono text-[oklch(var(--ca-destructive))] mt-1 pl-1">
          {error}
        </p>
      )}
    </div>
  )
}
