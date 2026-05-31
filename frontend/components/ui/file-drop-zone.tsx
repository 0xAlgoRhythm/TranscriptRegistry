"use client"

import React, { useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import { UploadCloud, FileText, X } from "lucide-react"

interface FileDropZoneProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  accept?: string
  maxSizeMB?: number
  className?: string
}

export function FileDropZone({
  onFileSelect,
  selectedFile,
  accept = "application/pdf",
  maxSizeMB = 10,
  className
}: FileDropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFile = (file: File) => {
    setError(null)
    
    // Check type
    if (accept && !file.type.match(accept.replace("*", ".*"))) {
      setError(`Invalid file type. Please upload a ${accept.split("/")[1]?.toUpperCase() || "valid"} file.`)
      return
    }

    // Check size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`)
      return
    }

    onFileSelect(file)
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFileSelect(null)
    setError(null)
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[200px] bg-card/25 backdrop-blur-sm",
          isDragActive 
            ? "border-[oklch(var(--ca-accent))] bg-[oklch(var(--ca-accent)/0.02)] scale-[1.01]" 
            : selectedFile 
              ? "border-[oklch(var(--ca-success)/0.4)] bg-[oklch(var(--ca-success)/0.01)]" 
              : "border-border/60 hover:border-border/100 hover:bg-card/45"
        )}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileInput}
          accept={accept}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center space-y-3 animate-fade-in">
            <div className="p-3 bg-[oklch(var(--ca-success)/0.15)] rounded-xl border border-[oklch(var(--ca-success)/0.3)]">
              <FileText className="h-8 w-8 text-[oklch(var(--ca-success))]" />
            </div>
            <div>
              <p className="text-sm font-mono font-semibold max-w-[280px] truncate text-foreground">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="mt-2 inline-flex items-center gap-1 text-xs font-mono tracking-wider text-muted-foreground hover:text-[oklch(var(--ca-destructive))] border border-border/40 hover:border-[oklch(var(--ca-destructive)/0.4)] px-2.5 py-1 rounded transition-all"
            >
              <X className="h-3 w-3" /> REMOVE FILE
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3 bg-muted/40 rounded-xl border border-border/30">
              <UploadCloud className="h-8 w-8 text-muted-foreground/80" />
            </div>
            <div>
              <p className="text-sm font-mono font-semibold text-foreground">
                DRAG & DROP FILE HERE
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse from device ({accept.split("/")[1]?.toUpperCase() || "PDF"} up to {maxSizeMB}MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-mono text-[oklch(var(--ca-destructive))] mt-2 pl-1 text-center">
          {error}
        </p>
      )}
    </div>
  )
}
