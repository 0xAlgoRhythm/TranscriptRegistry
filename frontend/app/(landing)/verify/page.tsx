"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { GlowCard } from "@/components/ui/glow-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  ShieldCheck, Search, FileText, Mail, Download, Key, 
  User, Building2, HelpCircle, Lock, AlertCircle, CheckCircle, Send, Loader2
} from "lucide-react"
import { generateTranscriptPDF } from "@/lib/pdf-generator"
import { formatTimestamp } from "@/lib/utils"

interface Course {
  code: string
  name: string
  credits: number
  grade: string
}

export default function PublicVerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState("")
  const [tokenInput, setTokenInput] = useState("")
  
  // States for verification result
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<any>(null)
  const [metaDetails, setMetaDetails] = useState<any>(null)
  
  // Access Request Form
  const [reqName, setReqName] = useState("")
  const [reqOrg, setReqOrg] = useState("")
  const [reqEmail, setReqEmail] = useState("")
  const [requesting, setRequesting] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)

  // Share Email Form
  const [shareEmail, setShareEmail] = useState("")
  const [sharing, setSharing] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  // Load from URL query parameters if present
  useEffect(() => {
    const recordId = searchParams.get("recordId")
    const studentId = searchParams.get("studentId")
    const token = searchParams.get("token")
    
    if (recordId || studentId) {
      const queryVal = recordId || studentId || ""
      setSearchQuery(queryVal)
      if (token) {
        setTokenInput(token)
      }
      triggerVerify(queryVal, token || "")
    }
  }, [searchParams])

  const triggerVerify = async (query: string, token: string) => {
    if (!query) return
    setLoading(true)
    setError("")
    setResult(null)
    setMetaDetails(null)
    setRequestSuccess(false)
    setShareSuccess(false)
    setSearched(true)

    try {
      const isHash = query.startsWith("0x") && query.length > 20
      const paramName = isHash ? "recordId" : "studentId"
      
      let url = `${API_URL}/api/public/verify?${paramName}=${encodeURIComponent(query)}`
      if (token) {
        url += `&token=${encodeURIComponent(token)}`
      }

      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "No matching transcript record found.")
      } else {
        setResult(data)
        
        // If authorized, load metadata for courses & detailed grades
        if (!data.requestAccessRequired && data.transcript?.metadataCid) {
          fetchMetadata(data.transcript.metadataCid)
        }
      }
    } catch (err) {
      setError("Failed to connect to the verification node.")
    } finally {
      setLoading(false)
    }
  }

  const fetchMetadata = async (cid: string) => {
    try {
      const res = await fetch(`${API_URL}/api/ipfs/metadata/${cid}`)
      if (res.ok) {
        const data = await res.json()
        setMetaDetails(data.metadataJson)
      }
    } catch (e) {
      console.error("Failed to load metadata CID", cid, e)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery) return
    
    // Update URL parameters
    const isHash = searchQuery.startsWith("0x") && searchQuery.length > 20
    const queryParam = isHash ? `recordId=${searchQuery}` : `studentId=${searchQuery}`
    const tokenParam = tokenInput ? `&token=${tokenInput}` : ""
    router.push(`/verify?${queryParam}${tokenParam}`)
    
    triggerVerify(searchQuery, tokenInput)
  }

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!result || !reqName || !reqOrg || !reqEmail) return

    setRequesting(true)
    try {
      const res = await fetch(`${API_URL}/api/public/request-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: result.transcript.recordId,
          requesterName: reqName,
          requesterOrg: reqOrg,
          requesterEmail: reqEmail
        })
      })
      if (res.ok) {
        setRequestSuccess(true)
        setReqName("")
        setReqOrg("")
        setReqEmail("")
      } else {
        const data = await res.json()
        alert(data.error || "Failed to request access.")
      }
    } catch (err) {
      alert("Error sending request.")
    } finally {
      setRequesting(false)
    }
  }

  const handleEmailShare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!result || !metaDetails || !shareEmail) return

    setSharing(true)
    setShareSuccess(false)
    try {
      const res = await fetch(`${API_URL}/api/public/email-transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: shareEmail,
          recordId: result.transcript.recordId,
          registryAddress: result.transcript.registryAddr,
          studentName: result.student?.fullName || metaDetails.studentName,
          studentId: result.student?.studentId || metaDetails.studentId,
          gpa: metaDetails.gpa,
          major: metaDetails.major,
          gradYear: metaDetails.gradYear,
          fileHash: result.transcript.fileHash,
          universityName: result.university?.name || metaDetails.university
        })
      })
      if (res.ok) {
        setShareSuccess(true)
        setShareEmail("")
      } else {
        alert("Failed to share transcript copy via email.")
      }
    } catch (err) {
      alert("Error sharing receipt.")
    } finally {
      setSharing(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!result || !metaDetails) return
    try {
      const verifierUrl = `${window.location.origin}/verify/${result.transcript.recordId}?registry=${result.transcript.registryAddr}`
      
      const blob = await generateTranscriptPDF({
        studentName: result.student?.fullName || metaDetails.studentName,
        studentId: result.student?.studentId || metaDetails.studentId,
        degree: metaDetails.major,
        graduationDate: metaDetails.gradYear,
        courses: metaDetails.courses || [],
        gpa: parseFloat(metaDetails.gpa || "0"),
        universityName: result.university?.name || metaDetails.university,
        logoUrl: result.university?.logoUrl || metaDetails.logoUrl,
        stampUrl: result.university?.stampUrl,
        recordId: result.transcript.recordId,
        verifierUrl
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${result.student?.studentId || metaDetails.studentId}_verified_transcript.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert("Failed to generate PDF.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-background text-foreground p-6 relative overflow-hidden">
      {/* Backdrop decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(108,91,240,0.07),transparent_40%)] pointer-events-none" />
      
      <div className="w-full max-w-3xl space-y-8 relative z-10 my-10 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-ca-accent/10 flex items-center justify-center text-ca-accent mb-4 border border-ca-accent/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
            On-Chain Verification Hub
          </h1>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Audit transcript legitimacy directly against university registrar logs. Student privacy is fully protected.
          </p>
        </div>

        {/* Search Panel */}
        <GlowCard className="p-6">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-8 relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Record ID (0x...) or Student Number..."
                  className="w-full rounded-lg border border-border/60 bg-background/50 py-2.5 pl-10 pr-4 text-sm font-mono focus:border-ca-accent focus:outline-none"
                  required
                />
              </div>
              <div className="md:col-span-4 relative">
                <Key className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Bypass Token (Optional)"
                  className="w-full rounded-lg border border-border/60 bg-background/50 py-2.5 pl-10 pr-4 text-sm font-mono focus:border-ca-accent focus:outline-none"
                />
              </div>
            </div>
            
            <Button type="submit" disabled={loading} className="w-full font-mono text-xs uppercase h-10 tracking-wider">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Verify Academic Record
            </Button>
          </form>
        </GlowCard>

        {/* Loading Spinner */}
        {loading && (
          <div className="text-center py-12 font-mono text-xs text-muted-foreground animate-pulse flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-ca-accent animate-spin" />
            <span>RESOLVING CRYPTOGRAPHIC RECORDS...</span>
          </div>
        )}

        {/* Error State */}
        {searched && !loading && error && (
          <GlowCard className="p-8 text-center space-y-3 border border-ca-danger/20 bg-ca-danger/5">
            <AlertCircle className="h-8 w-8 text-ca-danger mx-auto" />
            <h2 className="text-md font-mono font-bold uppercase text-ca-danger">Record Verification Failed</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto font-mono">
              {error}
            </p>
          </GlowCard>
        )}

        {/* Result States */}
        {searched && !loading && result && (
          <div className="space-y-6">
            
            {/* Case A: Privacy Protected / Access Required */}
            {result.requestAccessRequired ? (
              <GlowCard className="p-6 md:p-8 space-y-6 border border-ca-warning/20 bg-card/40" glow>
                <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                  <div className="p-2.5 bg-ca-warning/10 rounded-lg text-ca-warning">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                      Student Profile Privacy Protected
                    </h3>
                    <p className="text-[10px] text-muted-foreground">The requested record is locked behind encryption policies.</p>
                  </div>
                </div>

                {/* Minimal Public Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs bg-muted/15 p-4 rounded-lg border border-border/20">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block">University Registry</span>
                    <span className="text-foreground font-semibold">{result.university?.name || "Accredited University"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block">Record Status</span>
                    <span className="text-ca-success font-semibold uppercase">{result.transcript?.status || "Active"}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] uppercase text-muted-foreground block">Record Hash (Sha-256)</span>
                    <span className="text-foreground truncate block font-mono">{result.transcript?.recordId}</span>
                  </div>
                </div>

                {/* Access Request Form */}
                {requestSuccess ? (
                  <div className="p-5 rounded-lg border border-ca-success/30 bg-ca-success/5 font-mono text-xs text-center space-y-3">
                    <CheckCircle className="h-7 w-7 text-ca-success mx-auto" />
                    <p className="font-bold text-ca-success uppercase text-[11px]">Request Emailed to Student</p>
                    <p className="text-muted-foreground text-[10px] leading-relaxed max-w-md mx-auto">
                      For student privacy protection, they must approve verification requests. The student has been notified and can grant approval in one click. You will receive an email containing a secure 30-day token link.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleRequestAccess} className="space-y-4 border-t border-border/20 pt-5">
                    <h4 className="text-xs font-mono font-bold uppercase text-foreground">Request Access Permission</h4>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Fill in your details. A secure confirmation email will be delivered to the student to grant or deny lookup authorization.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={reqName}
                        onChange={(e) => setReqName(e.target.value)}
                        placeholder="Your Name"
                        className="w-full rounded border border-border/60 bg-background/30 py-2 px-3 text-xs focus:outline-none focus:border-ca-accent font-mono"
                        required
                      />
                      <input
                        type="text"
                        value={reqOrg}
                        onChange={(e) => setReqOrg(e.target.value)}
                        placeholder="Institution/Org"
                        className="w-full rounded border border-border/60 bg-background/30 py-2 px-3 text-xs focus:outline-none focus:border-ca-accent font-mono"
                        required
                      />
                      <input
                        type="email"
                        value={reqEmail}
                        onChange={(e) => setReqEmail(e.target.value)}
                        placeholder="your-email@org.com"
                        className="w-full rounded border border-border/60 bg-background/30 py-2 px-3 text-xs focus:outline-none focus:border-ca-accent font-mono"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={requesting} className="w-full font-mono text-xs uppercase h-9">
                      {requesting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                      Submit Request to Student
                    </Button>
                  </form>
                )}
              </GlowCard>
            ) : (
              
              // Case B: Authorized / Granted Full View
              <div className="space-y-6">
                
                {/* Verified Header & Branding */}
                <GlowCard className="p-6 md:p-8 space-y-6" glow>
                  <div className="flex flex-col sm:flex-row items-center justify-between border-b border-border/40 pb-5 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-ca-success/15 rounded-lg text-ca-success border border-ca-success/20 animate-pulse">
                        <ShieldCheck className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-md font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                          On-Chain Authenticity Validated
                        </h3>
                        <p className="text-[10px] text-muted-foreground uppercase font-mono">
                          Authorized via {result.authorizedBy || "Public Signature Verification"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2.5">
                      <Button onClick={handleDownloadPDF} size="sm" variant="outline" className="font-mono text-[10px] tracking-wider uppercase border-border/60 h-8">
                        <Download className="h-3.5 w-3.5 mr-1" /> PDF
                      </Button>
                    </div>
                  </div>

                  {/* Student Credentials Summary */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-ca-accent">
                      Verified Academic Profile
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-muted-foreground">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">Student Name</span>
                        <span className="text-foreground font-bold text-sm">
                          {result.student?.fullName || (metaDetails ? metaDetails.studentName : "Loading...")}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">Student Number / ID</span>
                        <span className="text-foreground font-semibold">
                          {result.student?.studentId || (metaDetails ? metaDetails.studentId : "Loading...")}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">Degree / Major</span>
                        <span className="text-foreground">
                          {metaDetails ? metaDetails.major : "Loading..."}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">Cumulative GPA</span>
                        <span className="text-ca-success font-bold text-sm">
                          {metaDetails ? `${parseFloat(metaDetails.gpa).toFixed(2)} / 4.00` : "Loading..."}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">Graduation Year</span>
                        <span className="text-foreground">
                          {metaDetails ? metaDetails.gradYear : "Loading..."}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">Issuing University</span>
                        <span className="text-foreground uppercase">
                          {result.university?.name || (metaDetails ? metaDetails.university : "Accredited University")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cryptographic Proof Details */}
                  <div className="space-y-4 border-t border-border/20 pt-6">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-ca-accent">
                      Cryptographic Evidence Block
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-muted-foreground">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">Registry Smart Contract</span>
                        <span className="text-foreground select-all font-mono break-all leading-normal bg-muted/20 px-2 py-1 rounded border border-border/30 block">
                          {result.transcript?.registryAddr}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">SHA-256 PDF Checksum</span>
                        <span className="text-foreground select-all font-mono break-all leading-normal bg-muted/20 px-2 py-1 rounded border border-border/30 block">
                          {result.transcript?.fileHash}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">IPFS Metadata CID (v1)</span>
                        <span className="text-foreground select-all font-mono break-all leading-normal bg-muted/20 px-2 py-1 rounded border border-border/30 block">
                          {result.transcript?.metadataCid}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">On-Chain Issuance Date</span>
                        <span className="text-foreground bg-muted/20 px-2 py-1 rounded border border-border/30 block">
                          {formatTimestamp(result.transcript?.issuedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Course Records Details */}
                  {metaDetails?.courses && (
                    <div className="space-y-4 border-t border-border/20 pt-6 font-mono">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ca-accent">
                        Academic Transcript Courses
                      </h4>
                      <div className="overflow-x-auto rounded-lg border border-border/40">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-border/60 text-[9px] uppercase text-muted-foreground tracking-wider bg-muted/25">
                              <th className="p-3 font-bold">Course Code</th>
                              <th className="p-3 font-bold">Course Name</th>
                              <th className="p-3 font-bold">Credits</th>
                              <th className="p-3 font-bold">Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {metaDetails.courses.map((c: Course, index: number) => (
                              <tr key={index} className="border-b border-border/20 last:border-0 hover:bg-muted/10">
                                <td className="p-3 font-bold text-foreground">{c.code}</td>
                                <td className="p-3 text-muted-foreground">{c.name}</td>
                                <td className="p-3 text-muted-foreground">{c.credits}</td>
                                <td className="p-3 font-bold text-ca-success">{c.grade}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Share Verification Copy via Email */}
                  <div className="border-t border-border/20 pt-6 space-y-3 font-mono">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Mail className="h-4.5 w-4.5 text-ca-accent" /> Share Verified Transcript Receipt
                    </h4>
                    <p className="text-[10px] text-muted-foreground">
                      Email a formal HTML verification audit receipt directly to a verification agency or prospective employer.
                    </p>

                    {shareSuccess ? (
                      <div className="p-3 rounded border border-ca-success/30 bg-ca-success/5 text-ca-success text-xs font-mono">
                        ✓ Verification audit receipt successfully sent to the requested recipient!
                      </div>
                    ) : (
                      <form onSubmit={handleEmailShare} className="flex gap-2">
                        <input
                          type="email"
                          value={shareEmail}
                          onChange={(e) => setShareEmail(e.target.value)}
                          placeholder="recipient-email@agency.org"
                          className="flex-1 rounded-lg border border-border/60 bg-background/50 py-1.5 px-3 text-xs focus:outline-none focus:border-ca-accent"
                          required
                        />
                        <Button type="submit" size="sm" disabled={sharing} className="h-8 text-[11px] font-mono uppercase tracking-wider px-4">
                          {sharing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                          Share
                        </Button>
                      </form>
                    )}
                  </div>
                </GlowCard>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
