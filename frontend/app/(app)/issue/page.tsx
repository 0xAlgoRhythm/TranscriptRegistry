"use client"

import React, { useState, useEffect } from "react"
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
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, HelpCircle } from "lucide-react"

export default function IssuePage() {
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

  // Step 3: File Upload & Hash
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { hash: calculatedFileHash, isCalculating, calculateHash, reset: resetHash } = useFileHash()

  // Step 4: Metadata Details
  const [gpa, setGpa] = useState("")
  const [major, setMajor] = useState("")
  const [gradYear, setGradYear] = useState("")
  const [metadataCID, setMetadataCID] = useState("QmXyZ...") // Stub default

  const { register, hash: txHash, isPending, isConfirming, isSuccess, error } = useRegisterTranscript()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  useEffect(() => {
    if (studentAddress && studentAddress.length === 42 && studentAddress.startsWith("0x")) {
      const checkStudent = async () => {
        setStudentStatus("checking")
        setStudentStatusMsg("Verifying student profile status...")
        try {
          const res = await fetch(`${API_URL}/api/students/profile/${studentAddress.toLowerCase()}`)
          if (res.ok) {
            const profile = await res.json()
            if (profile.status === "approved") {
              setStudentStatus("approved")
              setStudentStatusMsg("Approved student profile verified.")
              setStudentName(profile.fullName)
              setStudentId(profile.studentId)
            } else if (profile.status === "pending") {
              setStudentStatus("pending")
              setStudentStatusMsg("Verification pending. Please approve this student first on your dashboard.")
            } else {
              setStudentStatus("rejected")
              setStudentStatusMsg("Student profile is rejected.")
            }
          } else {
            setStudentStatus("not_found")
            setStudentStatusMsg("Student wallet address not registered. The student must onboard or be whitelisted.")
          }
        } catch (e) {
          setStudentStatus("not_found")
          setStudentStatusMsg("Error connecting to database server.")
        }
      }
      checkStudent()
    } else {
      setStudentStatus("idle")
      setStudentStatusMsg("")
    }
  }, [studentAddress])

  useEffect(() => {
    if (selectedFile) {
      calculateHash(selectedFile)
    } else {
      resetHash()
    }
  }, [selectedFile])

  const steps = [
    { title: "Institution", description: "Set registry contract" },
    { title: "Student Profile", description: "Identity & wallet details" },
    { title: "Document Hash", description: "Calculate PDF signature" },
    { title: "Register", description: "Write to blockchain" }
  ]

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const isStepValid = () => {
    if (currentStep === 1) return registryAddress && registryAddress.startsWith("0x") && registryAddress.length === 42
    if (currentStep === 2) return studentAddress.startsWith("0x") && studentAddress.length === 42 && studentName && studentId
    if (currentStep === 3) return !!calculatedFileHash
    if (currentStep === 4) return !!gpa && !!major && !!gradYear
    return false
  }

  const handleIssue = () => {
    if (!registryAddress || !studentAddress || !calculatedFileHash) return

    // Calculate student hash
    const studentHashVal = keccak256(
      encodePacked(["address"], [studentAddress as Address]),
    )

    // In a real application, metadata CID would be uploaded to IPFS. We simulate or pass state.
    register(
      registryAddress as Address,
      studentHashVal,
      metadataCID || "QmXyZ...",
      calculatedFileHash
    )
  }

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

      {/* Step Progress indicators */}
      <GlowCard className="p-4">
        <StepWizard steps={steps} currentStep={currentStep} />
      </GlowCard>

      {/* Wizard Steps Form */}
      <GlowCard className="p-6 md:p-8 space-y-6 relative overflow-hidden" glow>
        {/* Step 1: University Contract */}
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
                      {uniLoading ? "Resolving registry contract..." : uniName || "Not Found / Unsupported ABI"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Student Profile */}
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
              
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Student Full Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-[oklch(var(--ca-accent))] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Student ID / Email</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. student@university.edu"
                  className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-[oklch(var(--ca-accent))] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Document Upload */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1.5">
              <h3 className="text-sm font-mono font-bold tracking-wide uppercase text-foreground">
                03. Document Hash Signature
              </h3>
              <p className="text-xs text-muted-foreground">
                Upload the student's official PDF transcript. The client will calculate the SHA-256 fingerprint automatically.
              </p>
            </div>

            <FileDropZone
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
            />

            {isCalculating && (
              <p className="text-xs font-mono text-[oklch(var(--ca-accent))] animate-pulse">
                Calculating cryptographic signature of file...
              </p>
            )}

            {calculatedFileHash && (
              <div className="rounded-lg border border-border/40 bg-muted/20 p-4 font-mono text-xs space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Computed File Signature</span>
                <HashDisplay hash={calculatedFileHash} chars={12} />
              </div>
            )}
          </div>
        )}

        {/* Step 4: Metadata Details & Final Sign */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div className="space-y-1.5">
              <h3 className="text-sm font-mono font-bold tracking-wide uppercase text-foreground">
                04. Record Registry Details
              </h3>
              <p className="text-xs text-muted-foreground">
                Verify institutional metadata metrics. A JSON payload with this information will be created.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Cumulative GPA</label>
                <input
                  type="text"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  placeholder="e.g. 3.85"
                  className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-[oklch(var(--ca-accent))] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Degree Major</label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="e.g. B.S. Computer Science"
                  className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-[oklch(var(--ca-accent))] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Graduation Year</label>
                <input
                  type="text"
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  placeholder="e.g. 2026"
                  className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-[oklch(var(--ca-accent))] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">IPFS Metadata CID (Predefined)</label>
                <input
                  type="text"
                  value={metadataCID}
                  onChange={(e) => setMetadataCID(e.target.value)}
                  placeholder="QmXy..."
                  className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-[oklch(var(--ca-accent))] focus:outline-none font-mono text-xs"
                />
              </div>
            </div>

            <div className="rounded-lg border border-[oklch(var(--ca-accent)/0.3)] bg-[oklch(var(--ca-accent)/0.03)] p-4 font-mono text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-[oklch(var(--ca-accent))] font-bold uppercase tracking-wider">
                <ShieldCheck className="h-4.5 w-4.5" /> Registry Package Summary
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground mt-2">
                <span>Registrar Target:</span>
                <span className="text-foreground truncate">{registryAddress}</span>
                
                <span>Student Address:</span>
                <span className="text-foreground truncate">{studentAddress}</span>

                <span>GPA / Major:</span>
                <span className="text-foreground truncate">{gpa} / {major}</span>

                <span>Document Hash:</span>
                <span className="text-foreground truncate">{calculatedFileHash}</span>
              </div>
            </div>

            <Button
              onClick={handleIssue}
              disabled={isPending || isConfirming}
              className="w-full bg-[oklch(var(--ca-accent))] text-white hover:bg-[oklch(var(--ca-accent-hover))] font-mono tracking-wider text-xs py-4 flex items-center justify-center gap-2"
            >
              {isPending ? "CONFIRM IN WALLET..." : isConfirming ? "MINING TRANSACTION..." : "ISSUE ON-CHAIN CREDENTIAL"}
            </Button>

            {/* Smart Contract Interaction Panel */}
            <TxPanel
              status={isPending ? "signing" : isConfirming ? "pending" : isSuccess ? "success" : error ? "error" : "idle"}
              hash={txHash}
              error={error ? error.message : undefined}
              title="Issue Transcript Registry Transaction"
            />
          </div>
        )}

        {/* Wizard Navigation Controls */}
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
              className="bg-card hover:bg-muted border border-border/60 font-mono text-xs flex items-center gap-1.5 px-4"
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
