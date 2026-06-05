"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { GlowCard } from "@/components/ui/glow-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { HashDisplay } from "@/components/ui/hash-display"
import { EmptyState } from "@/components/ui/empty-state"
import { GraduationCap, FileText, CheckCircle2, Lock, ExternalLink } from "lucide-react"
import { formatTimestamp } from "@/lib/utils"

export default function PublicProfilePage() {
  const params = useParams()
  const studentAddress = params.studentAddress as string
  const [transcripts, setTranscripts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  useEffect(() => {
    if (studentAddress) {
      fetch(`${API_URL}/api/transcripts/by-student/${studentAddress}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTranscripts(data)
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [studentAddress, API_URL])

  return (
    <main className="bg-background text-foreground min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-24 md:py-32">
        <div className="mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <Lock className="h-3.5 w-3.5 text-ca-accent" />
            Public Blockchain Portfolio
          </div>
          <h1 className="text-4xl font-display font-light md:text-5xl">
            Verified Academic Records
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Student Hash:</span>
            <HashDisplay hash={studentAddress} />
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-border/50 bg-card/20 backdrop-blur-md">
            <div className="flex flex-col items-center gap-3">
              <div className="size-6 animate-spin rounded-full border-2 border-ca-accent border-t-transparent" />
              <p className="font-mono text-xs text-muted-foreground">Fetching records from blockchain index...</p>
            </div>
          </div>
        ) : transcripts.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="h-8 w-8 stroke-[1.5]" />}
            title="No records found"
            description="There are no verified transcripts associated with this public address."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {transcripts.map((t, index) => (
              <GlowCard key={index} className="flex flex-col gap-6 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-ca-accent/15 text-ca-accent">
                    <FileText className="h-6 w-6" />
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Record ID</p>
                    <HashDisplay hash={t.recordId} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Registry</p>
                      <HashDisplay hash={t.registryAddr} />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Issuer</p>
                      <HashDisplay hash={t.issuer} />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 pt-2 border-t border-border/40">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Issued At</p>
                    <p className="font-mono text-sm">{formatTimestamp(BigInt(Math.floor(new Date(t.issuedAt).getTime() / 1000)))}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/40">
                  <div className="flex items-center gap-2 text-xs text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Blockchain Verified</span>
                  </div>
                  {t.metadataCid && (
                    <a 
                      href={`https://ipfs.io/ipfs/${t.metadataCid}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-ca-accent hover:underline"
                    >
                      View Document <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </GlowCard>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
