"use client"

import React, { useState, useEffect, useCallback } from "react"
import { type Address, keccak256, encodePacked } from "viem"
import { useAccount } from "wagmi"
import { useRegisterTranscript, useUniversityName } from "@/hooks/use-transcript-registry"
import { useFileHash } from "@/hooks/use-file-hash"
import { StepWizard } from "@/components/ui/step-wizard"
import { AddressInput } from "@/components/ui/address-input"
import { TxPanel } from "@/components/ui/tx-panel"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { Button } from "@/components/ui/button"
import { HashDisplay } from "@/components/ui/hash-display"
import { generateTranscriptPDF } from "@/lib/pdf-generator"
import { useWallets } from "@privy-io/react-auth"
import {
  ArrowLeft, ArrowRight, ShieldCheck, CloudUpload,
  Loader2, ExternalLink, CheckCircle2, AlertTriangle, FileSignature, Download
} from "lucide-react"

export default function IssuePage() {
  const { address } = useAccount()
  const { wallets } = useWallets()
  const activeWallet = wallets.find(w => w.address.toLowerCase() === address?.toLowerCase())
  const isEmbeddedWallet = activeWallet?.walletClientType === "privy"

  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: University Info
  const [registryAddress, setRegistryAddress] = useState("")
  const { data: uniName, isLoading: uniLoading } = useUniversityName(registryAddress as Address)

  // Step 2: Student Info
  const [studentAddress, setStudentAddress] = useState("")
  const [studentName, setStudentName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [studentStatus, setStudentStatus] = useState<"idle" | "checking" | "approved" | "pending" | "rejected" | "not_found">("idle")
  const [studentStatusMsg, setStudentStatusMsg] = useState("")

  // Step 3: Academic Data & PDF Generation
  const [gpa, setGpa] = useState("")
  const [major, setMajor] = useState("")
  const [gradYear, setGradYear] = useState("")
  
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const { hash: calculatedFileHash, isCalculating, calculateHash, reset: resetHash } = useFileHash()

  // Step 4: Metadata + IPFS upload
  const [metadataCID, setMetadataCID] = useState("")
  const [ipfsStatus, setIpfsStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [ipfsError, setIpfsError] = useState("")
  const [ipfsGatewayUrl, setIpfsGatewayUrl] = useState("")
  const [logoUrl, setLogoUrl] = useState("")

  const { register, hash: txHash, isPending, isConfirming, isSuccess, error } = useRegisterTranscript()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  // ─── Auto-check student profile ───────────────────────────────────────────
  useEffect(() => {
    if (studentId && studentId.length >= 3) {
      setStudentStatus("checking")
      setStudentStatusMsg("Verifying student profile status...")
      fetch(`${API_URL}/api/students/profile-by-id/${encodeURIComponent(studentId)}`)
        .then(async (res) => {
          if (res.ok) {
            const profile = await res.json()
            if (!profile.walletAddress) {
              setStudentStatus("pending")
              setStudentStatusMsg("Student found but has no bound wallet address. Please bind a wallet in the dashboard first.")
            } else if (profile.status === "approved") {
              setStudentStatus("approved")
              setStudentStatusMsg("✓ Approved student profile verified.")
              setStudentName(profile.fullName || "")
              setStudentAddress(profile.walletAddress)
              if (studentId !== profile.studentId) {
                setStudentId(profile.studentId)
              }
            } else if (profile.status === "pending") {
              setStudentStatus("pending")
              setStudentStatusMsg("⏳ Verification pending — approve this student first.")
            } else {
              setStudentStatus("rejected")
              setStudentStatusMsg("✗ Student profile is rejected.")
            }
          } else {
            setStudentStatus("not_found")
            setStudentStatusMsg("Student not registered. They must onboard or be whitelisted.")
          }
        })
        .catch(() => {
          setStudentStatus("not_found")
          setStudentStatusMsg("Error connecting to backend server.")
        })
    } else {
      setStudentStatus("idle")
      setStudentStatusMsg("")
      setStudentName("")
      setStudentAddress("")
    }
  }, [studentId, API_URL])

  // ─── PDF Generation ─────────────────────────────────────────────────────────
  const handleGeneratePDF = async () => {
    if (!address || !gpa || !major || !gradYear) return
    setIsGeneratingPdf(true)
    try {
      // 1. Fetch Registrar Settings (Logo/Stamp)
      let fetchedLogoUrl = ""
      let stampUrl = ""
      const res = await fetch(`${API_URL}/api/registrar/settings/${address.toLowerCase()}`)
      if (res.ok) {
        const uniSettings = await res.json()
        fetchedLogoUrl = uniSettings.logoUrl
        stampUrl = uniSettings.stampUrl
        setLogoUrl(fetchedLogoUrl)
      }

      // 2. Mock some courses based on major
      const courses = [
        { code: "CS101", name: "Intro to Programming", credits: 4, grade: "A" },
        { code: "CS102", name: "Data Structures", credits: 4, grade: "A-" },
        { code: "MATH201", name: "Calculus I", credits: 4, grade: "B+" },
        { code: "CS301", name: "Algorithms", credits: 4, grade: "A" },
        { code: "CS400", name: "Senior Capstone", credits: 4, grade: "A" }
      ]

      // Determine a pseudo recordId based on current data
      const studentHashVal = keccak256(encodePacked(["address"], [studentAddress as Address]))
      const tempRecordId = "0x" + studentHashVal.substring(2, 10) + Date.now().toString(16)
      const verifierUrl = `${window.location.origin}/verify?recordId=${tempRecordId}`

      // 3. Generate PDF
      const blob = await generateTranscriptPDF({
        studentName,
        studentId,
        degree: major,
        graduationDate: gradYear,
        courses,
        gpa: parseFloat(gpa),
        universityName: typeof uniName === "string" ? uniName : "University",
        logoUrl: fetchedLogoUrl,
        stampUrl,
        recordId: tempRecordId,
        verifierUrl
      })

      setPdfBlob(blob)
      
      // 4. Create File and Hash it
      const file = new File([blob], `${studentId}_transcript.pdf`, { type: "application/pdf" })
      calculateHash(file)
      
    } catch (err) {
      console.error("PDF generation failed", err)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const downloadPdf = () => {
    if (!pdfBlob) return
    const url = URL.createObjectURL(pdfBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${studentId}_transcript.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── IPFS Metadata Upload ──────────────────────────────────────────────────
  const uploadToIPFS = useCallback(async () => {
    if (!gpa || !major || !gradYear || !calculatedFileHash) return
    setIpfsStatus("uploading")
    setIpfsError("")
    setMetadataCID("")
    setIpfsGatewayUrl("")
    try {
      const res = await fetch(`${API_URL}/api/ipfs/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer credaxis-registrar",
        },
        body: JSON.stringify({
          studentAddress,
          studentName,
          studentId,
          universityName: typeof uniName === "string" ? uniName : "University",
          registryAddress,
          gpa,
          major,
          gradYear,
          fileHash: calculatedFileHash,
          logoUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setMetadataCID(data.cid)
      setIpfsGatewayUrl(data.gateway || `https://gateway.pinata.cloud/ipfs/${data.cid}`)
      setIpfsStatus("success")
    } catch (err: any) {
      setIpfsError(err.message || "Failed to upload to IPFS")
      setIpfsStatus("error")
    }
  }, [gpa, major, gradYear, calculatedFileHash, studentAddress, studentName, studentId, registryAddress, uniName, logoUrl, API_URL])

  // ─── Wizard config ─────────────────────────────────────────────────────────
  const steps = [
    { title: "Institution", description: "Set registry contract" },
    { title: "Student Profile", description: "Identity & wallet details" },
    { title: "Academic Data", description: "Generate PDF transcript" },
    { title: "Register", description: "Upload metadata & issue" },
  ]

  const isStepValid = () => {
    if (currentStep === 1) return registryAddress.startsWith("0x") && registryAddress.length === 42
    if (currentStep === 2) return studentStatus === "approved" && !!studentName && !!studentId
    if (currentStep === 3) return !!calculatedFileHash && !isCalculating && !!pdfBlob
    if (currentStep === 4) return !!gpa && !!major && !!gradYear && ipfsStatus === "success" && !!metadataCID
    return false
  }

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }
  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleIssue = () => {
    if (!registryAddress || !studentAddress || !calculatedFileHash || !metadataCID) return
    const studentHashVal = keccak256(encodePacked(["address"], [studentAddress as Address]))
    // The NFT will be minted to the student automatically!
    register(registryAddress as Address, studentHashVal, metadataCID, calculatedFileHash)
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="space-y-1">
        <SectionLabel index={1} label="WIZARD PROCESS" />
        <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
          Issue On-Chain Transcript
        </h1>
        <p className="text-xs text-muted-foreground">
          Dynamically generate and register cryptographically signed academic credentials.
        </p>
      </div>

      {/* Step Progress */}
      <GlowCard className="p-4">
        <StepWizard steps={steps} currentStep={currentStep} />
      </GlowCard>

      {/* Wizard Body */}
      <GlowCard className="p-6 md:p-8 space-y-6 relative overflow-hidden" glow>
        {/* ── Step 1: Institution ────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1.5">
              <h3 className="text-sm font-mono font-bold tracking-wide uppercase text-foreground">
                01. Institution Address
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provide the smart contract address of the university registry through which you are issuing this record.
              </p>
            </div>
            <div className="space-y-4">
              <AddressInput
                label="Registry Smart Contract"
                value={registryAddress}
                onChange={setRegistryAddress}
                placeholder="0x..."
              />
              {registryAddress && (
                <div className="rounded-lg border border-border/40 bg-muted/20 p-4 font-mono text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground uppercase">Loaded Institution:</span>
                    <span className="text-foreground font-semibold">
                      {uniLoading ? "Resolving..." : uniName || "Not Found / Unsupported ABI"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Student Profile ────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1.5">
              <h3 className="text-sm font-mono font-bold tracking-wide uppercase text-foreground">
                02. Student Profile Identity
              </h3>
              <p className="text-xs text-muted-foreground">
                The student wallet address will be obfuscated using keccak256 on-chain, ensuring complete privacy.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Student Lookup (ID, Name, Email, or Wallet)</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Search by ID, legal name, email, or wallet address..."
                  className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm font-mono focus:border-ca-accent focus:outline-none"
                />
              </div>

              {studentStatus !== "idle" && (
                <div className={`p-3 rounded font-mono text-xs border ${
                  studentStatus === "approved"
                    ? "bg-ca-success/8 text-ca-success border-ca-success/20"
                    : studentStatus === "checking"
                    ? "bg-muted/40 text-muted-foreground border-border/40 animate-pulse"
                    : "bg-ca-danger/8 text-ca-danger border-ca-danger/20"
                }`}>
                  {studentStatusMsg}
                </div>
              )}

              {studentStatus === "approved" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Verified Full Name</label>
                    <input
                      type="text"
                      value={studentName}
                      readOnly
                      className="w-full rounded-lg border border-border/60 bg-muted/20 py-2.5 px-4 text-sm text-muted-foreground opacity-75 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Bound Wallet Address</label>
                    <input
                      type="text"
                      value={studentAddress}
                      readOnly
                      className="w-full rounded-lg border border-border/60 bg-muted/20 py-2.5 px-4 text-sm font-mono text-muted-foreground opacity-75 cursor-not-allowed"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Academic Data & Generate PDF ────────────────────── */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1.5">
              <h3 className="text-sm font-mono font-bold tracking-wide uppercase text-foreground">
                03. Academic Data & Document Generation
              </h3>
              <p className="text-xs text-muted-foreground">
                Enter academic details. A dynamic PDF will be generated incorporating your university logo and stamp.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Cumulative GPA</label>
                <input
                  type="text"
                  value={gpa}
                  onChange={(e) => { setGpa(e.target.value); setIpfsStatus("idle"); setMetadataCID("") }}
                  placeholder="e.g. 3.85"
                  className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-ca-accent focus:outline-none"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Degree Major</label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => { setMajor(e.target.value); setIpfsStatus("idle"); setMetadataCID("") }}
                  placeholder="e.g. B.S. Computer Science"
                  className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-ca-accent focus:outline-none"
                />
              </div>
              <div className="space-y-1.5 md:col-span-3">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Graduation Year</label>
                <input
                  type="text"
                  value={gradYear}
                  onChange={(e) => { setGradYear(e.target.value); setIpfsStatus("idle"); setMetadataCID("") }}
                  placeholder="e.g. 2026"
                  className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-ca-accent focus:outline-none"
                />
              </div>
            </div>

            <Button 
              onClick={handleGeneratePDF} 
              disabled={!gpa || !major || !gradYear || isGeneratingPdf}
              className="w-full font-mono text-xs"
            >
              {isGeneratingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSignature className="h-4 w-4 mr-2" />}
              Generate Official PDF Transcript
            </Button>

            {isCalculating && (
              <div className="flex items-center gap-2 text-xs font-mono text-ca-accent animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                Computing SHA-256 fingerprint...
              </div>
            )}
            
            {calculatedFileHash && !isCalculating && pdfBlob && (
              <div className="rounded-lg border border-ca-success/30 bg-ca-success/5 p-4 font-mono text-xs space-y-3">
                <div className="flex items-center justify-between text-ca-success font-bold uppercase">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> PDF Generated & Hashed
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={downloadPdf}>
                    <Download className="h-3 w-3 mr-1" /> Download PDF
                  </Button>
                </div>
                <HashDisplay hash={calculatedFileHash} chars={14} />
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Metadata + IPFS + Issue ───────────────────────── */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1.5">
              <h3 className="text-sm font-mono font-bold tracking-wide uppercase text-foreground">
                04. Metadata & IPFS Upload
              </h3>
              <p className="text-xs text-muted-foreground">
                The metadata JSON will be pinned to IPFS via Pinata before the on-chain registration. The student will receive a Soulbound NFT.
              </p>
            </div>

            {/* IPFS Upload Panel */}
            <div className={`rounded-lg border p-5 space-y-4 font-mono text-xs transition-all ${
              ipfsStatus === "success"
                ? "border-ca-success/40 bg-ca-success/4"
                : ipfsStatus === "error"
                ? "border-ca-danger/40 bg-ca-danger/4"
                : "border-border/40 bg-muted/10"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-foreground">
                  <CloudUpload className="h-4 w-4" />
                  IPFS Metadata Pin
                </div>
                {ipfsStatus === "uploading" && (
                  <div className="flex items-center gap-1.5 text-ca-accent text-[10px]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading to Pinata...
                  </div>
                )}
                {ipfsStatus === "success" && (
                  <div className="flex items-center gap-1.5 text-ca-success text-[10px]">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Pinned Successfully
                  </div>
                )}
                {ipfsStatus === "error" && (
                  <div className="flex items-center gap-1.5 text-ca-danger text-[10px]">
                    <AlertTriangle className="h-3.5 w-3.5" /> Upload Failed
                  </div>
                )}
              </div>

              {ipfsStatus === "idle" && (
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Click below to pin the metadata JSON to Pinata IPFS before issuing on-chain.
                </p>
              )}

              {ipfsStatus === "success" && metadataCID && (
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">IPFS CID</span>
                    <span className="text-foreground text-[11px] break-all">{metadataCID}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">Gateway URL</span>
                    <a href={ipfsGatewayUrl} target="_blank" rel="noreferrer" className="text-ca-accent hover:underline flex items-center gap-1 text-[11px] break-all">
                      {ipfsGatewayUrl} <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {ipfsError && (
                <p className="text-ca-danger text-[11px] mt-2">{ipfsError}</p>
              )}

              {ipfsStatus !== "success" && (
                <Button
                  onClick={uploadToIPFS}
                  disabled={ipfsStatus === "uploading"}
                  className="w-full mt-2 bg-foreground text-background hover:bg-foreground/90 text-xs font-mono font-bold tracking-wider uppercase h-10"
                >
                  {ipfsStatus === "uploading" ? "Pinning Metadata..." : "Pin Metadata to IPFS"}
                </Button>
              )}
            </div>

            <div className="h-px w-full bg-border/40 my-4" />

            {isEmbeddedWallet && (
              <div className="rounded border border-ca-warning/30 bg-ca-warning-dim p-4 font-mono text-xs text-ca-warning flex items-start gap-2">
                <AlertTriangle className="h-4.5 w-4.5 mt-0.5 text-ca-warning shrink-0" />
                <p className="leading-relaxed">
                  <strong>Warning:</strong> You are currently connected with a Privy Embedded Wallet. Registrars must use a native self-custody wallet (e.g. MetaMask, Coinbase Wallet) to execute registrar smart contract functions.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="rounded border border-border/40 bg-muted/10 p-4 font-mono text-xs">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 mt-0.5 text-ca-accent shrink-0" />
                  <p className="leading-relaxed">
                    By confirming, you attest cryptographically that this transcript is official and immutable. This action will invoke the smart contract. A Soulbound NFT will be minted to the student.
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full font-mono text-sm tracking-wider uppercase h-14 bg-ca-accent hover:bg-ca-accent/90 text-white shadow-lg"
                disabled={!isStepValid() || isPending || isConfirming || isEmbeddedWallet}
                onClick={handleIssue}
              >
                {(isPending || isConfirming) ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Waiting for Confirmations...
                  </>
                ) : (
                  "Issue Official Transcript"
                )}
              </Button>
            </div>
            <TxPanel 
              hash={txHash as string} 
              status={error ? "error" : isSuccess ? "success" : isConfirming ? "pending" : isPending ? "signing" : "idle"} 
              error={error?.message || undefined} 
            />
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex justify-between pt-6 mt-6 border-t border-border/40">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1 || isPending || isConfirming || isSuccess}
            className="font-mono text-xs tracking-wider"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentStep === 4 || !isStepValid()}
            className="font-mono text-xs tracking-wider"
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </GlowCard>
    </div>
  )
}
