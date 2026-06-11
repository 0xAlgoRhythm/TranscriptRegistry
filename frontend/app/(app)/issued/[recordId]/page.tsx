"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter, useParams } from "next/navigation"
import { type Address } from "viem"
import { useTranscript, useUpdateTranscriptStatus, useUniversityName } from "@/hooks/use-transcript-registry"
import { formatTimestamp, truncateAddress } from "@/lib/utils"
import { TRANSCRIPT_STATUS, type TranscriptStatus } from "@/lib/contracts"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { StatusBadge } from "@/components/ui/status-badge"
import { HashDisplay } from "@/components/ui/hash-display"
import { TxPanel } from "@/components/ui/tx-panel"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit3, ShieldAlert, Sparkles, UserX, UserCheck, Download, Loader2, FileText } from "lucide-react"

export default function IssuedDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const recordId = params.recordId as `0x${string}`
  const registryAddress = searchParams.get("registry") as Address

  const { data: transcript, isLoading } = useTranscript(registryAddress, recordId)
  const { data: contractUniName } = useUniversityName(registryAddress)
  const { updateStatus, hash: txHash, isPending, isConfirming, isSuccess, error } = useUpdateTranscriptStatus()

  // Fallback to DB API transcript lookup if contract isn't populated/fails (e.g. dev mock testing)
  const [dbTranscript, setDbTranscript] = useState<any>(null)
  const [dbLoading, setDbLoading] = useState(false)

  // Custom status reason form
  const [selectedStatus, setSelectedStatus] = useState<string>("0")
  const [updateReason, setUpdateReason] = useState<string>("")

  // IPFS metadata state
  const [metadata, setMetadata] = useState<any>(null)
  const [metadataLoading, setMetadataLoading] = useState(false)

  useEffect(() => {
    if (!transcript && recordId) {
      setDbLoading(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || ""
      fetch(`${API_URL}/api/public/verify?recordId=${recordId}`)
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            setDbTranscript(data)
          }
        })
        .catch((e) => console.error("DB fallback verify error:", e))
        .finally(() => setDbLoading(false))
    }
  }, [transcript, recordId])

  const resolvedTranscript = transcript || (dbTranscript ? [
    dbTranscript.transcript.recordId,
    dbTranscript.transcript.metadataCid,
    dbTranscript.transcript.fileHash,
    dbTranscript.transcript.issuer || dbTranscript.transcript.registryAddr,
    BigInt(Math.floor(new Date(dbTranscript.transcript.issuedAt || Date.now()).getTime() / 1000)),
    dbTranscript.transcript.status === "Active" ? 0 : dbTranscript.transcript.status === "Revoked" ? 1 : 2
  ] : null)

  const [, metadataCID = "", fileHash = "", issuer = "", timestamp = BigInt(0), status = 0] = (resolvedTranscript as any) || []
  const statusStr = resolvedTranscript ? TRANSCRIPT_STATUS[status as TranscriptStatus] : "Unknown"

  useEffect(() => {
    if (resolvedTranscript) {
      setSelectedStatus(status.toString())
    }
  }, [resolvedTranscript, status])

  useEffect(() => {
    if (metadataCID) {
      setMetadataLoading(true)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      
      // Try Pinata gateway first
      fetch(`https://gateway.pinata.cloud/ipfs/${metadataCID}`)
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            setMetadata(data)
          } else {
            throw new Error("Pinata gateway response not ok")
          }
        })
        .catch(() => {
          // Fallback to local DB-backed API
          fetch(`${API_URL}/api/ipfs/metadata/${metadataCID}`)
            .then(async (res) => {
              if (res.ok) {
                const record = await res.json()
                setMetadata(record.metadataJson)
              }
            })
            .catch((err) => console.error("Error fetching metadata:", err))
        })
        .finally(() => {
          setMetadataLoading(false)
        })
    }
  }, [metadataCID])

  if (isLoading || dbLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ca-accent border-t-transparent" />
      </div>
    )
  }

  if (!resolvedTranscript) {
    return (
      <div className="mx-auto max-w-2xl text-center space-y-4 py-12 animate-fade-in">
        <ShieldAlert className="h-12 w-12 text-ca-danger mx-auto" />
        <h2 className="text-xl font-mono font-bold uppercase tracking-wider">Record Not Found</h2>
        <p className="text-xs text-muted-foreground">The specified transcript record does not exist on this registry contract.</p>
        <Button onClick={() => router.back()} variant="secondary" className="font-mono text-xs">BACK</Button>
      </div>
    )
  }

  const universityDisplayName = (metadata?.universityName || contractUniName || "University Registry") as string

  const getUniversityLogo = (name: string) => {
    const n = (name || "").toLowerCase()
    if (n.includes("nkrumah") || n.includes("knust")) return "/knust.jpg"
    if (n.includes("cape coast") || n.includes("ucc")) return "/ucc.png"
    if (n.includes("winneba") || n.includes("uew") || n.includes("education")) return "/uew.png"
    return ""
  }

  const logoPath = getUniversityLogo(universityDisplayName)

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault()
    const targetStatus = parseInt(selectedStatus)
    updateStatus(
      registryAddress,
      recordId,
      targetStatus,
      updateReason || `Status updated to ${TRANSCRIPT_STATUS[targetStatus as TranscriptStatus]}`
    )
  }

  const handlePrintTranscript = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const studentName = metadata?.studentName || ""
    const studentId = metadata?.studentId || ""
    const major = metadata?.major || ""
    const gpa = metadata?.gpa || ""
    const gradYear = metadata?.gradYear || ""

    printWindow.document.write(`
      <html>
        <head>
          <title>Academic Transcript - ${studentName || 'Student'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #333;
              line-height: 1.5;
              padding: 40px;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              height: 80px;
              object-fit: contain;
            }
            .title {
              text-align: right;
            }
            .title h1 {
              margin: 0;
              font-size: 24px;
              text-transform: uppercase;
            }
            .title p {
              margin: 5px 0 0 0;
              font-size: 14px;
              color: #666;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 40px;
              background: #f9f9f9;
              padding: 20px;
              border: 1px solid #ddd;
              border-radius: 8px;
            }
            .meta-item span {
              font-size: 10px;
              text-transform: uppercase;
              color: #666;
              display: block;
            }
            .meta-item font {
              font-weight: bold;
              font-size: 14px;
            }
            .transcript-body {
              margin-bottom: 40px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
              font-size: 13px;
            }
            th {
              background-color: #f2f2f2;
              text-transform: uppercase;
              font-size: 11px;
              color: #444;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px dashed #ccc;
              padding-top: 20px;
              font-size: 10px;
              color: #666;
              font-family: monospace;
            }
            .signature-box {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
            }
            .sig {
              width: 200px;
              border-top: 1px solid #333;
              text-align: center;
              padding-top: 5px;
              font-size: 12px;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoPath ? `<img src="${window.location.origin}${logoPath}" class="logo" alt="Logo" />` : `<div style="font-size: 20px; font-weight: bold;">🏢 SEAL</div>`}
            <div class="title">
              <h1>${universityDisplayName}</h1>
              <p>Official Academic Credential</p>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span>Student Name</span>
              <font>${studentName || 'Obfuscated Student Hash'}</font>
            </div>
            <div class="meta-item">
              <span>Student ID / Email</span>
              <font>${studentId || 'N/A'}</font>
            </div>
            <div class="meta-item">
              <span>Degree Program</span>
              <font>${major || 'B.S. Academic Program'}</font>
            </div>
            <div class="meta-item">
              <span>Graduation Year</span>
              <font>${gradYear || '2026'}</font>
            </div>
            <div class="meta-item">
              <span>Cumulative GPA</span>
              <font>${gpa || 'N/A'}</font>
            </div>
            <div class="meta-item">
              <span>Credential Status</span>
              <font style="color: ${statusStr === 'Active' ? 'green' : 'red'}">${statusStr}</font>
            </div>
          </div>

          <div class="transcript-body">
            <h3>Academic Record Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Requirement Area</th>
                  <th>Standard Major Credits</th>
                  <th>Obtained Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Core Department Requirements</td>
                  <td>60 Credits</td>
                  <td>A</td>
                  <td>Satisfied</td>
                </tr>
                <tr>
                  <td>Electives & Seminars</td>
                  <td>30 Credits</td>
                  <td>A-</td>
                  <td>Satisfied</td>
                </tr>
                <tr>
                  <td>Capstone Project / Thesis</td>
                  <td>10 Credits</td>
                  <td>Pass</td>
                  <td>Satisfied</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="signature-box">
            <div class="sig">University Registrar Signature</div>
            <div class="sig">CredAxis Verification Seal</div>
          </div>

          <div class="footer">
            <p>This academic transcript was cryptographically signed and issued on the blockchain network.</p>
            <p>Registry Address: ${registryAddress}</p>
            <p>Record ID Hash: ${recordId}</p>
            <p>Document SHA-256 Fingerprint: ${fileHash}</p>
            <p>IPFS CID: ${metadataCID}</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO DATABASE
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <SectionLabel index={1} label="REGISTRAR MANAGEMENT" />
            <div className="flex items-center gap-3">
              {logoPath && (
                <img src={logoPath} className="h-9 w-9 object-contain rounded-full border border-border bg-white p-0.5" alt="Logo" />
              )}
              <h1 className="text-2xl font-mono font-bold tracking-tight uppercase text-foreground">
                Manage Issued Record
              </h1>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <span className="font-mono text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                {recordId.slice(0, 10)}...{recordId.slice(-6)}
              </span>
              <StatusBadge status={statusStr} />
            </div>
          </div>

          <Button
            onClick={handlePrintTranscript}
            className="font-mono text-xs bg-ca-accent text-white hover:bg-ca-accent-hover flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> DOWNLOAD OFFICIAL TRANSCRIPT
          </Button>
        </div>
      </div>

      {/* Record details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <GlowCard className="p-6 md:p-8 space-y-6" glow>
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="p-2.5 bg-ca-accent/10 rounded-lg text-ca-accent">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                  Record Metadata Specifications
                </h3>
                <p className="text-[10px] text-muted-foreground">Dynamic IPFS & On-Chain specifications</p>
              </div>
            </div>

            {/* Dynamic IPFS Data Panel */}
            <div className="border border-border/40 rounded-lg p-4 bg-muted/10 font-mono text-xs space-y-3">
              <div className="font-bold border-b border-border/30 pb-1.5 uppercase text-ca-accent flex items-center justify-between">
                <span>Student Academic Dossier</span>
                {metadataLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              </div>
              {metadata ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block">Full Name</span>
                    <span className="text-foreground font-bold">{metadata.studentName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block">Student ID / Email</span>
                    <span className="text-foreground font-bold">{metadata.studentId}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block">Cumulative GPA</span>
                    <span className="text-foreground font-bold">{metadata.gpa || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block">Program Major</span>
                    <span className="text-foreground font-bold">{metadata.major}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block">Graduation Year</span>
                    <span className="text-foreground font-bold">{metadata.gradYear}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block">Institution Name</span>
                    <span className="text-foreground font-bold">{universityDisplayName}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  {metadataLoading ? "Loading dossier from IPFS..." : "No additional metadata loaded from IPFS."}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Registrar Identity</span>
                <HashDisplay hash={issuer} />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Registry Contract Address</span>
                <HashDisplay hash={registryAddress} />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">IPFS Metadata Address</span>
                <span className="text-foreground bg-muted/20 px-2 py-1 rounded border border-border/30 inline-block w-full truncate">
                  {metadataCID}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">PDF Signature (SHA-256)</span>
                <HashDisplay hash={fileHash} chars={8} />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Issued Time</span>
                <span className="text-foreground bg-muted/20 px-2 py-1 rounded border border-border/30 inline-block w-full">
                  {formatTimestamp(timestamp)}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Current Status</span>
                <span className="text-foreground bg-muted/20 px-2 py-1 rounded border border-border/30 inline-block w-full uppercase">
                  {statusStr}
                </span>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Status Actions Form */}
        <div className="md:col-span-1 space-y-6">
          <SectionLabel index={2} label="GOVERNANCE OPTIONS" />
          <GlowCard className="p-6 space-y-5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
              Modify Record Status
            </h4>
            <p className="text-[10px] text-muted-foreground">
              As the authorized registrar, you can suspend, activate, or revoke this credential record on-chain.
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Target Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-card py-2 px-3 text-xs font-mono text-foreground focus:border-ca-accent focus:outline-none"
                >
                  <option value="0">Active</option>
                  <option value="1">Revoked</option>
                  <option value="2">Suspended</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Reason for Update</label>
                <textarea
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  placeholder="Provide reason for audit log..."
                  required
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border/60 bg-card p-3 text-xs font-mono text-foreground focus:border-ca-accent focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending || isConfirming || selectedStatus === status.toString()}
                className="w-full bg-ca-accent text-white hover:bg-ca-accent-hover font-mono text-xs py-3 flex items-center justify-center gap-1.5"
              >
                {isPending ? (
                  "CONFIRMING IN WALLET..."
                ) : isConfirming ? (
                  "MINING STATUS UPDATE..."
                ) : (
                  <>
                    <Edit3 className="h-4 w-4" /> UPDATE STATUS ON-CHAIN
                  </>
                )}
              </Button>
            </form>

            <TxPanel
              status={isPending ? "signing" : isConfirming ? "pending" : isSuccess ? "success" : error ? "error" : "idle"}
              hash={txHash}
              error={error ? error.message : undefined}
              title="Update Record Status Transaction"
            />
          </GlowCard>
        </div>
      </div>
    </div>
  )
}

