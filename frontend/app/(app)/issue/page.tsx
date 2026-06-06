"use client"

import React, { useState, useEffect, useCallback } from "react"
import { type Address, keccak256, encodePacked } from "viem"
import { useRegisterTranscript } from "@/hooks/use-transcript-registry"
import { useFileHash } from "@/hooks/use-file-hash"
import { useUniversityName } from "@/hooks/use-transcript-registry"
import { StepWizard } from "@/components/ui/step-wizard"
import { AddressInput } from "@/components/ui/address-input"
import { FileDropZone } from "@/components/ui/file-drop-zone"
import { TxPanel } from "@/components/ui/tx-panel"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { Button } from "@/components/ui/button"
import { HashDisplay } from "@/components/ui/hash-display"
import {
  ArrowLeft, ArrowRight, ShieldCheck, CloudUpload,
  Loader2, ExternalLink, CheckCircle2, AlertTriangle,
} from "lucide-react"

export default function IssuePage() {
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1: University Info
  const [registryAddress, setRegistryAddress] = useState("")
  const { data: uniName, isLoading: uniLoading } = useUniversityName(registryAddress as Address)

  // Step 2: Student Info
  const [studentAddress, setStudentAddress] = useState("")
  const [studentName, setStudentName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [studentStatus, setStudentStatus] = useState<
    "idle" | "checking" | "approved" | "pending" | "rejected" | "not_found"
  >("idle")
  const [studentStatusMsg, setStudentStatusMsg] = useState("")

  // Step 3: File Upload & Hash
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { hash: calculatedFileHash, isCalculating, calculateHash, reset: resetHash } = useFileHash()

  // Step 4: Metadata + IPFS upload
  const [gpa, setGpa] = useState("")
  const [major, setMajor] = useState("")
  const [gradYear, setGradYear] = useState("")
  const [metadataCID, setMetadataCID] = useState("")
  const [ipfsStatus, setIpfsStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [ipfsError, setIpfsError] = useState("")
  const [ipfsGatewayUrl, setIpfsGatewayUrl] = useState("")

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

  // ─── Auto-hash on file select ──────────────────────────────────────────────
  useEffect(() => {
    if (selectedFile) {
      calculateHash(selectedFile)
    } else {
      resetHash()
    }
  }, [selectedFile])

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
  }, [gpa, major, gradYear, calculatedFileHash, studentAddress, studentName, studentId, registryAddress, uniName, API_URL])

  // ─── Wizard config ─────────────────────────────────────────────────────────
  const steps = [
    { title: "Institution", description: "Set registry contract" },
    { title: "Student Profile", description: "Identity & wallet details" },
    { title: "Document Hash", description: "Calculate PDF signature" },
    { title: "Register", description: "Upload metadata & issue" },
  ]

  const isStepValid = () => {
    if (currentStep === 1) return registryAddress.startsWith("0x") && registryAddress.length === 42
    if (currentStep === 2) return studentStatus === "approved" && !!studentName && !!studentId
    if (currentStep === 3) return !!calculatedFileHash && !isCalculating
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
          Register cryptographically signed academic credentials on behalf of your institution.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AddressInput
                label="Student Wallet Address"
                value={studentAddress}
                onChange={setStudentAddress}
                placeholder="0x..."
                className="md:col-span-2"
              />
              {studentStatus !== "idle" && (
                <div className={`md:col-span-2 p-3 rounded font-mono text-xs border ${
                  studentStatus === "approved"
                    ? "bg-ca-success/8 text-ca-success border-ca-success/20"
                    : studentStatus === "checking"
                    ? "bg-muted/40 text-muted-foreground border-border/40 animate-pulse"
                    : "bg-ca-danger/8 text-ca-danger border-ca-danger/20"
                }`}>
                  {studentStatusMsg}
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Student Full Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. John Doe"
                  readOnly={studentStatus === "approved"}
                  className={`w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-ca-accent focus:outline-none ${
                    studentStatus === "approved" ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Student ID / Email</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. student@university.edu"
                  readOnly={studentStatus === "approved"}
                  className={`w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-ca-accent focus:outline-none ${
                    studentStatus === "approved" ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Document Hash ──────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1.5">
              <h3 className="text-sm font-mono font-bold tracking-wide uppercase text-foreground">
                03. Document Hash Signature
              </h3>
              <p className="text-xs text-muted-foreground">
                Upload the official PDF transcript. The SHA-256 fingerprint is computed client-side — your file never leaves your browser.
              </p>
            </div>
            <FileDropZone onFileSelect={setSelectedFile} selectedFile={selectedFile} />
            {isCalculating && (
              <div className="flex items-center gap-2 text-xs font-mono text-ca-accent animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                Computing SHA-256 fingerprint...
              </div>
            )}
            {calculatedFileHash && !isCalculating && (
              <div className="rounded-lg border border-ca-success/30 bg-ca-success/5 p-4 font-mono text-xs space-y-2">
                <div className="flex items-center gap-2 text-ca-success font-bold uppercase">
                  <CheckCircle2 className="h-4 w-4" /> File Hash Computed
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
                Enter academic details. The metadata JSON will be pinned to IPFS via Pinata before the on-chain registration.
              </p>
            </div>

            {/* Academic fields */}
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
              <div className="space-y-1.5">
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
                  Fill in GPA, major, and graduation year above, then click to pin the metadata JSON to Pinata IPFS before issuing on-chain.
                </p>
              )}

              {ipfsStatus === "success" && metadataCID && (
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">IPFS CID</span>
                    <span className="text-foreground text-[11px] break-all">{metadataCID}</span>
                  </div>
                  {ipfsGatewayUrl && (
                    <a
                      href={ipfsGatewayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[10px] text-ca-accent hover:underline"
                    >
                      View on Pinata Gateway <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}

              {ipfsStatus === "error" && (
                <p className="text-[10px] text-ca-danger">{ipfsError}</p>
              )}

              {ipfsStatus !== "success" && (
                <Button
                  onClick={uploadToIPFS}
                  disabled={!gpa || !major || !gradYear || !calculatedFileHash || ipfsStatus === "uploading"}
                  className="w-full bg-ca-accent/10 text-ca-accent border border-ca-accent/30 hover:bg-ca-accent/20 font-mono text-xs py-3 flex items-center justify-center gap-2"
                >
                  {ipfsStatus === "uploading" ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> PINNING TO IPFS...</>
                  ) : (
                    <><CloudUpload className="h-4 w-4" /> PIN METADATA TO IPFS</>
                  )}
                </Button>
              )}

              {ipfsStatus === "error" && (
                <Button
                  onClick={uploadToIPFS}
                  className="w-full bg-ca-danger/10 text-ca-danger border border-ca-danger/30 hover:bg-ca-danger/20 font-mono text-xs py-3"
                >
                  RETRY UPLOAD
                </Button>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-ca-accent/30 bg-ca-accent/3 p-4 font-mono text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-ca-accent font-bold uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" /> Registry Package Summary
              </div>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 text-[11px] text-muted-foreground mt-2">
                <span>Registry:</span>
                <span className="text-foreground truncate">{registryAddress.slice(0, 20)}...</span>
                <span>Student:</span>
                <span className="text-foreground truncate">{studentName || studentAddress.slice(0, 20)}</span>
                <span>GPA / Major:</span>
                <span className="text-foreground">{gpa || "—"} / {major || "—"}</span>
                <span>Grad Year:</span>
                <span className="text-foreground">{gradYear || "—"}</span>
                <span>File Hash:</span>
                <span className="text-foreground truncate">{calculatedFileHash ? `${calculatedFileHash.slice(0, 18)}...` : "—"}</span>
                <span>IPFS CID:</span>
                <span className={metadataCID ? "text-ca-success truncate" : "text-muted-foreground"}>
                  {metadataCID ? `${metadataCID.slice(0, 20)}...` : "Not uploaded yet"}
                </span>
              </div>
            </div>

            {/* Issue button — only enabled after IPFS success */}
            <Button
              onClick={handleIssue}
              disabled={isPending || isConfirming || !metadataCID || ipfsStatus !== "success"}
              className="w-full bg-ca-accent text-white hover:bg-ca-accent-hover font-mono tracking-wider text-xs py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending
                ? "CONFIRM IN WALLET..."
                : isConfirming
                ? "MINING TRANSACTION..."
                : !metadataCID
                ? "PIN TO IPFS FIRST ↑"
                : "ISSUE ON-CHAIN CREDENTIAL"}
            </Button>

            <TxPanel
              status={isPending ? "signing" : isConfirming ? "pending" : isSuccess ? "success" : error ? "error" : "idle"}
              hash={txHash}
              error={error ? error.message : undefined}
              title="Issue Transcript Registry Transaction"
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-border/40">
          <Button
            onClick={handlePrev}
            disabled={currentStep === 1 || isPending || isConfirming}
            variant="ghost"
            className="font-mono text-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> PREVIOUS STEP
          </Button>
          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              variant="outline"
              className="font-mono text-xs flex items-center gap-1.5 px-4"
            >
              NEXT STEP <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <div className="w-10 h-10" />
          )}
        </div>
      </GlowCard>
    </div>
  )
}
