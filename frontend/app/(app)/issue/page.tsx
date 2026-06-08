"use client"

import React, { useState, useEffect, useCallback } from "react"
import { type Address, keccak256, encodePacked } from "viem"
import { useAccount } from "wagmi"
import { useRegisterTranscript, useUniversityName, useUpdateTranscriptStatus } from "@/hooks/use-transcript-registry"
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
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft, ArrowRight, ShieldCheck, CloudUpload,
  Loader2, ExternalLink, CheckCircle2, AlertTriangle, FileSignature, Download, Eye
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
  interface Course {
    code: string
    name: string
    credits: number
    grade: string
  }

  const [courses, setCourses] = useState<Course[]>([
    { code: "CS101", name: "Intro to Programming", credits: 4, grade: "A" },
    { code: "CS102", name: "Data Structures", credits: 4, grade: "A-" },
    { code: "MATH201", name: "Calculus I", credits: 4, grade: "B+" },
    { code: "CS301", name: "Algorithms", credits: 4, grade: "A" },
    { code: "CS400", name: "Senior Capstone", credits: 4, grade: "A" }
  ])

  const [gpa, setGpa] = useState("")
  const [major, setMajor] = useState("")
  const [gradYear, setGradYear] = useState("")
  const [tempRecordId, setTempRecordId] = useState("")
  
  const [hasOldTranscript, setHasOldTranscript] = useState(false)
  const [oldTranscriptRecordId, setOldTranscriptRecordId] = useState("")
  const [shouldAmendOld, setShouldAmendOld] = useState(true)
  const [editLocked, setEditLocked] = useState(false)

  // Track if this issuance completes a pending request
  const searchParams = useSearchParams()
  const [requestIdToComplete, setRequestIdToComplete] = useState<string | null>(null)

  useEffect(() => {
    const paramStudentId = searchParams.get("studentId")
    const paramRequestId = searchParams.get("requestId")
    if (paramStudentId) {
      setStudentId(paramStudentId)
    }
    if (paramRequestId) {
      setRequestIdToComplete(paramRequestId)
    }
  }, [searchParams])

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const { hash: calculatedFileHash, isCalculating, calculateHash, reset: resetHash } = useFileHash()

  // Step 4: Metadata + IPFS upload
  const [metadataCID, setMetadataCID] = useState("")
  const [ipfsStatus, setIpfsStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [ipfsError, setIpfsError] = useState("")
  const [ipfsGatewayUrl, setIpfsGatewayUrl] = useState("")
  const [logoUrl, setLogoUrl] = useState("")

  const calculateGPA = (coursesList: Course[]) => {
    const gradePoints: Record<string, number> = {
      "A": 4.0, "A-": 3.7, "B+": 3.3, "B": 3.0, "B-": 2.7,
      "C+": 2.3, "C": 2.0, "C-": 1.7, "D+": 1.3, "D": 1.0, "F": 0.0
    }
    let totalCredits = 0
    let weightedPoints = 0
    coursesList.forEach(c => {
      const gp = gradePoints[c.grade] ?? 0
      weightedPoints += Number(c.credits || 0) * gp
      totalCredits += Number(c.credits || 0)
    })
    return totalCredits > 0 ? (weightedPoints / totalCredits) : 0
  }

  useEffect(() => {
    const computed = calculateGPA(courses)
    setGpa(computed.toFixed(2))
  }, [courses])

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  const { register, hash: txHash, isPending, isConfirming, isSuccess, error } = useRegisterTranscript()
  const { updateStatus, hash: updateTxHash, isPending: updateIsPending, isConfirming: updateIsConfirming, isSuccess: updateIsSuccess, error: updateError } = useUpdateTranscriptStatus()

  useEffect(() => {
    if (isSuccess && requestIdToComplete) {
      fetch(`${API_URL}/api/registrar/requests/${requestIdToComplete}/complete`, {
        method: "PUT"
      })
      .then(res => {
        if (res.ok) {
          console.log("Transcript request marked completed in database.")
        }
      })
      .catch(err => console.error("Failed to complete request in DB:", err))
    }
  }, [isSuccess, requestIdToComplete, API_URL])

  const checkExistingTranscript = useCallback(async (walletAddr: string) => {
    try {
      const hashVal = keccak256(encodePacked(["address"], [walletAddr as Address]))
      const tRes = await fetch(`${API_URL}/api/transcripts/by-student/${hashVal}`)
      if (tRes.ok) {
        const txList = await tRes.json()
        if (Array.isArray(txList) && txList.length > 0) {
          const latestTx = txList[0]
          const metaRes = await fetch(`${API_URL}/api/ipfs/metadata/${latestTx.metadataCid}`)
          if (metaRes.ok) {
            const metaData = await metaRes.json()
            const oldRecord = metaData.metadataJson
             if (oldRecord) {
              setMajor(oldRecord.major || oldRecord.degree || "")
              setGradYear(oldRecord.gradYear || oldRecord.graduationDate || "")
              if (Array.isArray(oldRecord.courses)) {
                setCourses(oldRecord.courses)
              }
              setHasOldTranscript(true)
              setOldTranscriptRecordId(latestTx.recordId)
              setEditLocked(true)
              setStudentStatusMsg(`✓ Approved student profile verified. Existing transcript detected (${latestTx.recordId.slice(0, 10)}...). Previous academic data has been pre-populated.`)
            }
          }
        } else {
          setHasOldTranscript(false)
          setOldTranscriptRecordId("")
          setEditLocked(false)
        }
      }
    } catch (e) {
      console.error("Failed to check existing transcripts:", e)
    }
  }, [API_URL])

  // Auto-suggestion / Auto-complete states
  const [universities, setUniversities] = useState<any[]>([])
  const [showUniSuggestions, setShowUniSuggestions] = useState(false)
  const [studentSuggestions, setStudentSuggestions] = useState<any[]>([])
  const [showStudentSuggestions, setShowStudentSuggestions] = useState(false)

  // Fetch universities for registry address suggestions
  useEffect(() => {
    fetch(`${API_URL}/api/universities`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUniversities(data)
        }
      })
      .catch((err) => console.error("Failed to load universities:", err))
  }, [API_URL])

  // ─── Auto-check student profile & suggestions ──────────────────────────────
  useEffect(() => {
    if (studentId && studentId.length >= 2) {
      // 1. Fetch matching search suggestions
      fetch(`${API_URL}/api/students/search?q=${encodeURIComponent(studentId)}`)
        .then(async (res) => {
          if (res.ok) {
            const list = await res.json()
            // Filter list to keep only students that match this registrar's university registry contract if loaded
            setStudentSuggestions(list)
          }
        })
        .catch(() => {})

      // 2. Perform direct verify lookup
      if (studentId.length >= 3) {
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
                checkExistingTranscript(profile.walletAddress)
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
      }
    } else {
      setStudentStatus("idle")
      setStudentStatusMsg("")
      setStudentName("")
      setStudentAddress("")
      setStudentSuggestions([])
    }
  }, [studentId, API_URL, checkExistingTranscript])

  const handleSelectStudent = (s: any) => {
    if (!s.walletAddress) {
      setStudentStatus("pending")
      setStudentStatusMsg("Student found but has no bound wallet address. Please bind a wallet in the dashboard first.")
      setStudentId(s.studentId)
      setStudentName(s.fullName || "")
      setStudentAddress("")
    } else if (s.status === "approved") {
      setStudentStatus("approved")
      setStudentStatusMsg("✓ Approved student profile verified.")
      setStudentName(s.fullName || "")
      setStudentAddress(s.walletAddress)
      setStudentId(s.studentId)
      checkExistingTranscript(s.walletAddress)
    } else if (s.status === "pending") {
      setStudentStatus("pending")
      setStudentStatusMsg("⏳ Verification pending — approve this student first.")
      setStudentId(s.studentId)
      setStudentName(s.fullName || "")
      setStudentAddress(s.walletAddress || "")
    } else {
      setStudentStatus("rejected")
      setStudentStatusMsg("✗ Student profile is rejected.")
      setStudentId(s.studentId)
      setStudentName(s.fullName || "")
      setStudentAddress(s.walletAddress || "")
    }
    setStudentSuggestions([])
    setShowStudentSuggestions(false)
  }

  const handleCourseChange = (index: number, field: keyof Course, value: any) => {
    const newCourses = [...courses]
    newCourses[index] = {
      ...newCourses[index],
      [field]: field === "credits" ? Number(value || 0) : value
    }
    setCourses(newCourses)
    setIpfsStatus("idle")
    setMetadataCID("")
  }

  const addCourseRow = () => {
    setCourses([...courses, { code: "", name: "", credits: 3, grade: "A" }])
    setIpfsStatus("idle")
    setMetadataCID("")
  }

  const removeCourseRow = (index: number) => {
    if (courses.length <= 1) return
    const newCourses = courses.filter((_, i) => i !== index)
    setCourses(newCourses)
    setIpfsStatus("idle")
    setMetadataCID("")
  }

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
      }

      // Apply Fallback for KNUST / UEW / UCC default logos if missing
      if (!fetchedLogoUrl) {
        const nameLower = (typeof uniName === "string" ? uniName : "").toLowerCase()
        if (nameLower.includes("knust") || nameLower.includes("kwame")) {
          fetchedLogoUrl = `${window.location.origin}/knust.jpg`
        } else if (nameLower.includes("uew") || nameLower.includes("winneba")) {
          fetchedLogoUrl = `${window.location.origin}/uew.png`
        } else if (nameLower.includes("ucc") || nameLower.includes("cape coast")) {
          fetchedLogoUrl = `${window.location.origin}/ucc.png`
        }
      }
      setLogoUrl(fetchedLogoUrl)

      // Determine a pseudo recordId based on current data
      const studentHashVal = keccak256(encodePacked(["address"], [studentAddress as Address]))
      const tempId = "0x" + studentHashVal.substring(2, 10) + Date.now().toString(16)
      setTempRecordId(tempId)
      const verifierUrl = `${window.location.origin}/verify/${tempId}?registry=${registryAddress}`

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
        recordId: tempId,
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

  const previewPdf = () => {
    if (!pdfBlob) return
    const url = URL.createObjectURL(pdfBlob)
    window.open(url, "_blank")
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
          tempRecordId,
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
  }, [gpa, major, gradYear, calculatedFileHash, studentAddress, studentName, studentId, registryAddress, uniName, logoUrl, API_URL, tempRecordId])

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
            <div className="space-y-4 relative">
              <AddressInput
                label="Registry Smart Contract"
                value={registryAddress}
                onChange={setRegistryAddress}
                placeholder="0x..."
                onFocus={() => setShowUniSuggestions(true)}
                onBlur={() => setTimeout(() => setShowUniSuggestions(false), 200)}
              />
              {showUniSuggestions && universities.filter(u => 
                u.name.toLowerCase().includes(registryAddress.toLowerCase()) ||
                (u.contractAddr && u.contractAddr.toLowerCase().includes(registryAddress.toLowerCase()))
              ).length > 0 && (
                <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-border/60 bg-card p-1 shadow-lg font-mono text-xs">
                  {universities.filter(u => 
                    u.name.toLowerCase().includes(registryAddress.toLowerCase()) ||
                    (u.contractAddr && u.contractAddr.toLowerCase().includes(registryAddress.toLowerCase()))
                  ).map(u => (
                    <button
                      key={u.contractAddr}
                      type="button"
                      onMouseDown={() => {
                        setRegistryAddress(u.contractAddr)
                        setShowUniSuggestions(false)
                      }}
                      className="w-full text-left rounded px-3 py-2 hover:bg-muted/40 transition-colors flex flex-col gap-0.5"
                    >
                      <span className="font-bold text-foreground">{u.name}</span>
                      <span className="text-[10px] text-muted-foreground">{u.contractAddr}</span>
                    </button>
                  ))}
                </div>
              )}
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
            <div className="grid grid-cols-1 gap-4 relative">
              <div className="space-y-1.5 relative">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Student Lookup (ID, Name, Email, or Wallet)</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value)
                    setShowStudentSuggestions(true)
                  }}
                  onFocus={() => setShowStudentSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowStudentSuggestions(false), 200)}
                  placeholder="Search by ID, legal name, email, or wallet address..."
                  className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm font-mono focus:border-ca-accent focus:outline-none"
                />
                {showStudentSuggestions && studentSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-border/60 bg-card p-1 shadow-lg font-mono text-xs">
                    {studentSuggestions.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={() => handleSelectStudent(s)}
                        className="w-full text-left rounded px-3 py-2 hover:bg-muted/40 transition-colors flex flex-col gap-0.5"
                      >
                        <span className="font-bold text-foreground">{s.fullName}</span>
                        <span className="text-[10px] text-muted-foreground">ID: {s.studentId} | {s.email}</span>
                      </button>
                    ))}
                  </div>
                )}
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
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-1.5">
              <h3 className="text-sm font-mono font-bold tracking-wide uppercase text-foreground">
                03. Academic Data & Document Generation
              </h3>
              <p className="text-xs text-muted-foreground">
                Enter academic details, courses, and grades. The cumulative GPA will be automatically computed on a 4.0 scale.
              </p>
            </div>

            {hasOldTranscript && (
              <div className="rounded-lg border border-ca-accent/30 bg-ca-accent/5 p-4 font-mono text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-ca-accent font-bold uppercase">
                    <AlertTriangle className="h-4 w-4" /> Existing Transcript Detected
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Program and course records have been pre-populated from previous transcript (ID: {oldTranscriptRecordId.slice(0, 10)}...) to ensure consistency.
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Status: {editLocked ? "🔒 Academic data locked" : "🔓 Academic data unlocked for editing"}
                  </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditLocked(!editLocked)}
                    className="font-mono text-[10px] px-3 h-8 border-border/60 hover:bg-muted/40 text-foreground w-full md:w-auto"
                  >
                    {editLocked ? "Edit Data" : "Lock Data"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setShouldAmendOld(true)
                      handleNext()
                    }}
                    className="font-mono text-[10px] px-3 h-8 bg-ca-accent text-white hover:bg-ca-accent/90 w-full md:w-auto animate-pulse"
                  >
                    Update & Proceed
                  </Button>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Degree Major</label>
                <input
                  type="text"
                  value={major}
                  disabled={editLocked}
                  onChange={(e) => { setMajor(e.target.value); setIpfsStatus("idle"); setMetadataCID("") }}
                  placeholder="e.g. B.S. Computer Science"
                  className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-ca-accent focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-muted/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Graduation Year</label>
                <input
                  type="text"
                  value={gradYear}
                  disabled={editLocked}
                  onChange={(e) => { setGradYear(e.target.value); setIpfsStatus("idle"); setMetadataCID("") }}
                  placeholder="e.g. 2026"
                  className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-ca-accent focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed disabled:bg-muted/10"
                />
              </div>
            </div>

            {/* Courses Table Form */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Academic Courses & Grades</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={editLocked}
                  onClick={addCourseRow}
                  className="h-8 font-mono text-[11px] px-3.5 border border-border/60 bg-card hover:bg-muted/40 text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Course Row
                </Button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {courses.map((course, idx) => (
                  <div key={idx} className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-muted/10 p-2.5 rounded-lg border border-border/40">
                    <div className="w-full md:w-1/4">
                      <input
                        type="text"
                        value={course.code}
                        disabled={editLocked}
                        placeholder="Code (e.g. CS101)"
                        onChange={(e) => handleCourseChange(idx, "code", e.target.value)}
                        className="w-full rounded border border-border/60 bg-card py-1.5 px-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-ca-accent disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="w-full md:w-2/5">
                      <input
                        type="text"
                        value={course.name}
                        disabled={editLocked}
                        placeholder="Course Name"
                        onChange={(e) => handleCourseChange(idx, "name", e.target.value)}
                        className="w-full rounded border border-border/60 bg-card py-1.5 px-2.5 text-xs text-foreground focus:outline-none focus:border-ca-accent disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="w-1/2 md:w-1/6">
                      <input
                        type="number"
                        min="1"
                        max="6"
                        value={course.credits || ""}
                        disabled={editLocked}
                        placeholder="Credits"
                        onChange={(e) => handleCourseChange(idx, "credits", e.target.value)}
                        className="w-full rounded border border-border/60 bg-card py-1.5 px-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-ca-accent disabled:opacity-75 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="w-1/2 md:w-1/6">
                      <select
                        value={course.grade}
                        disabled={editLocked}
                        onChange={(e) => handleCourseChange(idx, "grade", e.target.value)}
                        className="w-full rounded border border-border/60 bg-card py-1.5 px-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-ca-accent disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F"].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCourseRow(idx)}
                      disabled={courses.length <= 1 || editLocked}
                      className="p-1.5 text-muted-foreground hover:text-ca-danger transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove course"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Read-only GPA summary */}
            <div className="rounded-lg border border-border/40 bg-muted/20 p-4 font-mono text-xs flex justify-between items-center">
              <span className="text-muted-foreground uppercase font-bold">Calculated GPA (4.0 Scale):</span>
              <span className="text-ca-accent text-lg font-bold">{gpa || "0.00"}</span>
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
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={previewPdf}>
                      <Eye className="h-3 w-3 mr-1" /> Preview PDF
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={downloadPdf}>
                      <Download className="h-3 w-3 mr-1" /> Download PDF
                    </Button>
                  </div>
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

            {hasOldTranscript && (
              <div className="flex items-center gap-3 bg-muted/10 p-4 rounded-lg border border-border/40 font-mono text-xs">
                <input
                  type="checkbox"
                  id="amendOld"
                  checked={shouldAmendOld}
                  onChange={(e) => setShouldAmendOld(e.target.checked)}
                  className="h-4 w-4 rounded border-border/60 bg-card text-ca-accent focus:ring-ca-accent cursor-pointer"
                />
                <div className="space-y-0.5">
                  <label htmlFor="amendOld" className="font-bold text-foreground cursor-pointer uppercase">
                    Mark previous transcript as Amended on-chain (Record ID: {oldTranscriptRecordId.slice(0, 10)}...)
                  </label>
                  <p className="text-[10px] text-muted-foreground">
                    Recommended to maintain a single active source of truth.
                  </p>
                </div>
              </div>
            )}

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

              {hasOldTranscript && shouldAmendOld ? (
                <div className="space-y-6">
                  {/* Step A: Deactivate previous record */}
                  <div className="flex flex-col gap-2">
                    <div className="text-[10px] font-mono uppercase text-muted-foreground flex justify-between">
                      <span>Step 1: Deactivate Previous Record</span>
                      {updateIsSuccess && <span className="text-ca-success font-bold">✓ COMPLETED</span>}
                    </div>
                    <Button
                      type="button"
                      size="lg"
                      className="w-full font-mono text-sm tracking-wider uppercase h-12"
                      variant={updateIsSuccess ? "outline" : "default"}
                      disabled={!isStepValid() || updateIsPending || updateIsConfirming || updateIsSuccess || isEmbeddedWallet}
                      onClick={() => updateStatus(registryAddress as Address, oldTranscriptRecordId as `0x${string}`, 2, `Amended by new transcript: ${tempRecordId}`)}
                    >
                      {updateIsPending || updateIsConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Confirming Deactivation...
                        </>
                      ) : updateIsSuccess ? (
                        "Previous Record Deactivated ✓"
                      ) : (
                        "Deactivate Previous Record"
                      )}
                    </Button>
                    {updateTxHash && (
                      <TxPanel 
                        hash={updateTxHash as string} 
                        status={updateError ? "error" : updateIsSuccess ? "success" : updateIsConfirming ? "pending" : updateIsPending ? "signing" : "idle"} 
                        error={updateError?.message || undefined}
                        title="Deactivate Previous Transcript Transaction"
                      />
                    )}
                  </div>

                  {/* Step B: Issue new record */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/20">
                    <div className="text-[10px] font-mono uppercase text-muted-foreground flex justify-between">
                      <span>Step 2: Issue New Transcript</span>
                      {isSuccess && <span className="text-ca-success font-bold">✓ COMPLETED</span>}
                    </div>
                    <Button
                      type="button"
                      size="lg"
                      className="w-full font-mono text-sm tracking-wider uppercase h-14 bg-ca-accent hover:bg-ca-accent/90 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!isStepValid() || !updateIsSuccess || isPending || isConfirming || isEmbeddedWallet}
                      onClick={handleIssue}
                    >
                      {isPending || isConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Waiting for Confirmations...
                        </>
                      ) : isSuccess ? (
                        "Transcript Successfully Issued ✓"
                      ) : (
                        "Issue Official Transcript"
                      )}
                    </Button>
                    <TxPanel 
                      hash={txHash as string} 
                      status={error ? "error" : isSuccess ? "success" : isConfirming ? "pending" : isPending ? "signing" : "idle"} 
                      error={error?.message || undefined} 
                    />
                  </div>
                </div>
              ) : (
                /* Single button setup */
                <div className="space-y-4">
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
                  <TxPanel 
                    hash={txHash as string} 
                    status={error ? "error" : isSuccess ? "success" : isConfirming ? "pending" : isPending ? "signing" : "idle"} 
                    error={error?.message || undefined} 
                  />
                </div>
              )}
            </div>
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
