"use client"

import React, { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { useRoleStore } from "@/lib/stores/role-store"
import { usePlatformStats, usePlatformAdmin } from "@/hooks/use-university-factory"
import { StatCard } from "@/components/ui/stat-card"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FileDropZone } from "@/components/ui/file-drop-zone"
import { truncateAddress, cn } from "@/lib/utils"
import { 
  Building2, 
  FileText, 
  CheckCircle2, 
  UserCheck, 
  Lock, 
  ShieldCheck, 
  Send,
  PlusCircle,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Upload,
  Eye,
  Loader2
} from "lucide-react"
import Link from "next/link"

interface StudentRequest {
  id: number
  walletAddress: string | null
  fullName: string
  studentId: string
  universityId: number
  status: "pending" | "approved" | "rejected"
  email: string
  createdAt: string
}

function RegistrarDashboardView({ registrarAddress }: { registrarAddress: string }) {
  const [students, setStudents] = useState<StudentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  // Bulk upload states
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvText, setCsvText] = useState("")
  const [bulkStatus, setBulkStatus] = useState("")
  const [bulkError, setBulkError] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"requests" | "bulk" | "trequests">("requests")

  // Transcript request states
  const [tRequests, setTRequests] = useState<any[]>([])
  const [tRequestsLoading, setTRequestsLoading] = useState(true)

  // Wallet Binding states
  const [selectedStudentForWallet, setSelectedStudentForWallet] = useState<StudentRequest | null>(null)
  const [newWalletAddress, setNewWalletAddress] = useState("")
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [bindLoading, setBindLoading] = useState(false)

  // Edit Student states
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<StudentRequest | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editWallet, setEditWallet] = useState("")
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/registrar/students/${registrarAddress.toLowerCase()}`)
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
      } else {
        setError("Failed to load student profiles.")
      }
    } catch (e) {
      setError("Failed to connect to database server.")
    } finally {
      setLoading(false)
    }
  }

  const fetchTranscriptRequests = async () => {
    try {
      setTRequestsLoading(true)
      const res = await fetch(`${API_URL}/api/registrar/requests/${registrarAddress.toLowerCase()}`)
      if (res.ok) {
        const data = await res.json()
        setTRequests(data)
      }
    } catch (e) {
      console.error("Failed to fetch transcript requests:", e)
    } finally {
      setTRequestsLoading(false)
    }
  }

  useEffect(() => {
    if (registrarAddress) {
      fetchStudents()
      fetchTranscriptRequests()
    }
  }, [registrarAddress])

  // Global Search state
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase()
    return (
      (s.fullName && s.fullName.toLowerCase().includes(q)) ||
      (s.studentId && s.studentId.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.walletAddress && s.walletAddress.toLowerCase().includes(q))
    )
  })

  const handleUpdateStatus = async (walletAddr: string | null, newStatus: "approved" | "rejected") => {
    if (!walletAddr) return
    try {
      const res = await fetch(`${API_URL}/api/students/${walletAddr.toLowerCase()}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          registrarAddress,
        }),
      })

      if (res.ok) {
        fetchStudents()
      } else {
        alert("Failed to update student status.")
      }
    } catch (e) {
      alert("Network error updating status.")
    }
  }

  const handleBindWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentForWallet || !newWalletAddress) return

    try {
      setBindLoading(true)
      const res = await fetch(`${API_URL}/api/students/${selectedStudentForWallet.id}/bind-wallet`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: newWalletAddress,
          registrarAddress,
        }),
      })

      if (res.ok) {
        setIsWalletModalOpen(false)
        setNewWalletAddress("")
        setSelectedStudentForWallet(null)
        fetchStudents()
      } else {
        const errData = await res.json()
        alert(errData.error || "Failed to bind wallet.")
      }
    } catch (e) {
      alert("Network error binding wallet.")
    } finally {
      setBindLoading(false)
    }
  }

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentForEdit) return

    try {
      setEditLoading(true)
      const res = await fetch(`${API_URL}/api/students/${selectedStudentForEdit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: editName,
          email: editEmail,
          walletAddress: editWallet || null,
        }),
      })

      if (res.ok) {
        setIsEditModalOpen(false)
        setSelectedStudentForEdit(null)
        fetchStudents()
      } else {
        const errData = await res.json()
        alert(errData.error || "Failed to update student details.")
      }
    } catch (e) {
      alert("Network error updating student details.")
    } finally {
      setEditLoading(false)
    }
  }

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setBulkLoading(true)
    setBulkError("")
    setBulkStatus("")

    let payload: Array<{ fullName: string; studentId: string; email: string }> = []

    if (csvFile) {
      try {
        const text = await csvFile.text()
        payload = parseCSV(text)
      } catch (err) {
        setBulkError("Failed to read CSV file.")
        setBulkLoading(false)
        return
      }
    } else if (csvText.trim()) {
      payload = parseCSV(csvText)
    } else {
      setBulkError("Please upload a CSV file or paste student records.")
      setBulkLoading(false)
      return
    }

    if (payload.length === 0) {
      setBulkError("No valid student records found. Formats must be: Name,ID,Email")
      setBulkLoading(false)
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/students/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrarAddress,
          studentsList: payload,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        setBulkStatus(`Successfully whitelisted ${result.processed} students!`)
        setCsvFile(null)
        setCsvText("")
        fetchStudents()
      } else {
        const errData = await res.json()
        setBulkError(errData.error || "Failed to submit bulk onboarding request.")
      }
    } catch (e) {
      setBulkError("Network error uploading whitelist.")
    } finally {
      setBulkLoading(false)
    }
  }

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/)
    const parsed: Array<{ fullName: string; studentId: string; email: string }> = []
    let startIndex = 0
    if (lines[0] && (lines[0].toLowerCase().includes("name") || lines[0].toLowerCase().includes("id") || lines[0].toLowerCase().includes("email"))) {
      startIndex = 1
    }
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      const parts = line.split(",")
      if (parts.length >= 3) {
        parsed.push({
          fullName: parts[0].trim(),
          studentId: parts[1].trim(),
          email: parts[2].trim()
        })
      }
    }
    return parsed
  }

  const pendingRequests = students.filter(s => s.status === "pending")
  const approvedRequests = students.filter(s => s.status === "approved")
  const rejectedRequests = students.filter(s => s.status === "rejected")

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="p-4 bg-card border border-border/60 rounded-xl space-y-2">
          <span className="text-[10px] font-mono text-muted-foreground block uppercase">Pending Enrollments</span>
          <span className="text-2xl font-mono font-bold text-yellow-500">{pendingRequests.length}</span>
        </div>
        <div className="p-4 bg-card border border-border/60 rounded-xl space-y-2">
          <span className="text-[10px] font-mono text-muted-foreground block uppercase">Whitelisted/Approved Students</span>
          <span className="text-2xl font-mono font-bold text-green-500">{approvedRequests.length}</span>
        </div>
        <div className="p-4 bg-card border border-border/60 rounded-xl space-y-2">
          <span className="text-[10px] font-mono text-muted-foreground block uppercase">Rejected Requests</span>
          <span className="text-2xl font-mono font-bold text-red-500">{rejectedRequests.length}</span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border/40 gap-4">
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-2.5 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
            activeTab === "requests"
              ? "border-ca-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Student Requests ({students.length})
        </button>
        <button
          onClick={() => setActiveTab("trequests")}
          className={`pb-2.5 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
            activeTab === "trequests"
              ? "border-ca-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Transcript Requests ({tRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className={`pb-2.5 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
            activeTab === "bulk"
              ? "border-ca-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          CSV Bulk Whitelist
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "requests" ? (
        <GlowCard className="p-6 relative overflow-hidden" glow>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/40 pb-3 mb-4 gap-3">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
              Verification Enrollment Requests
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search ID, Name, Wallet, Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 rounded border border-border/60 bg-background py-1.5 px-3 text-xs font-mono focus:border-ca-accent focus:outline-none"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={fetchStudents}
                className="font-mono text-[10px] tracking-wider uppercase border-border/60"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 font-mono text-xs text-muted-foreground animate-pulse">
              LOADING STUDENT PROFILES...
            </div>
          ) : error ? (
            <div className="text-center py-8 font-mono text-xs text-ca-danger">
              {error}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 font-mono text-xs text-muted-foreground">
              NO REGISTERED OR WHITELISTED STUDENTS FOUND
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-[10px] uppercase text-muted-foreground tracking-wider">
                    <th className="p-3 font-bold">Student Name</th>
                    <th className="p-3 font-bold">Student ID</th>
                    <th className="p-3 font-bold">Email</th>
                    <th className="p-3 font-bold">Wallet Address</th>
                    <th className="p-3 font-bold">Status</th>
                    <th className="p-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                      <td className="p-3 text-foreground font-semibold">{s.fullName}</td>
                      <td className="p-3">{s.studentId}</td>
                      <td className="p-3 text-muted-foreground">{s.email}</td>
                      <td className="p-3 text-muted-foreground">
                        {s.walletAddress ? truncateAddress(s.walletAddress, 4) : "No Wallet Linked (Whitelisted)"}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          s.status === "approved"
                            ? "bg-green-500/10 text-green-400 border border-green-500/30"
                            : s.status === "pending"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 animate-pulse"
                            : "bg-red-500/10 text-red-400 border border-red-500/30"
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex gap-2 justify-end items-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedStudentForEdit(s)
                              setEditName(s.fullName)
                              setEditEmail(s.email)
                              setEditWallet(s.walletAddress || "")
                              setIsEditModalOpen(true)
                            }}
                            className="font-mono text-[9px] px-2 py-1 h-6 border-muted-foreground/30 text-muted-foreground hover:bg-muted/30"
                          >
                            EDIT
                          </Button>

                          {!s.walletAddress && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedStudentForWallet(s)
                                setIsWalletModalOpen(true)
                              }}
                              className="font-mono text-[9px] px-2 py-1 h-6 border-ca-accent text-ca-accent hover:bg-ca-accent hover:text-white"
                            >
                              BIND WALLET
                            </Button>
                          )}
                          {s.status === "pending" && s.walletAddress && (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(s.walletAddress, "approved")}
                                className="bg-green-600 hover:bg-green-700 text-white font-mono text-[9px] px-2 py-1 h-6"
                              >
                                APPROVE
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(s.walletAddress, "rejected")}
                                className="bg-red-600 hover:bg-red-700 text-white font-mono text-[9px] px-2 py-1 h-6"
                              >
                                REJECT
                              </Button>
                            </div>
                          )}
                          {s.status === "approved" && s.walletAddress && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(s.walletAddress, "rejected")}
                              className="bg-red-950/20 hover:bg-red-950/45 text-red-400 border border-red-900/50 font-mono text-[9px] px-2 py-1 h-6"
                            >
                              REVOKE
                            </Button>
                          )}
                          {s.status === "rejected" && s.walletAddress && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(s.walletAddress, "approved")}
                              className="bg-green-950/20 hover:bg-green-950/45 text-green-400 border border-green-900/50 font-mono text-[9px] px-2 py-1 h-6"
                            >
                              APPROVE
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlowCard>
      ) : (
        <GlowCard className="p-6 relative overflow-hidden" glow>
          <div className="space-y-1 mb-6 border-b border-border/40 pb-3">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
              CSV Bulk Whitelist Onboarding
            </h3>
            <p className="text-xs text-muted-foreground">
              Batch-import students to pre-approve them. Format must be one student per line: <span className="font-mono text-[10px] text-foreground bg-muted/40 px-1 py-0.5 rounded">FullName,StudentID,Email</span>
            </p>
          </div>

          <form onSubmit={handleBulkUpload} className="space-y-6">
            <FileDropZone
              onFileSelect={setCsvFile}
              selectedFile={csvFile}
              accept=".csv"
              maxSizeMB={5}
            />

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border/40"></div>
              <span className="flex-shrink mx-4 text-muted-foreground font-mono text-[10px] uppercase">OR PASTE RECORDS</span>
              <div className="flex-grow border-t border-border/40"></div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="csvText" className="text-xs font-mono font-bold uppercase tracking-wider">Comma Separated Text</Label>
              <textarea
                id="csvText"
                rows={5}
                placeholder="John Doe,10931293,john.doe@university.edu&#10;Alice Smith,29304822,alice.smith@university.edu"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                disabled={!!csvFile}
                className="w-full rounded-lg border border-border/60 bg-background py-2.5 px-4 text-xs font-mono focus:border-ca-accent focus:outline-none disabled:opacity-50"
              />
            </div>

            {bulkError && (
              <div className="p-3 bg-ca-danger/8 border border-ca-danger/20 rounded text-[11px] font-mono text-ca-danger flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{bulkError}</span>
              </div>
            )}

            {bulkStatus && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded text-[11px] font-mono text-green-400 flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-400" />
                <span>{bulkStatus}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={bulkLoading}
              className="w-full bg-ca-accent text-white hover:bg-ca-accent-hover font-mono text-xs py-4 flex items-center justify-center gap-1.5"
            >
              {bulkLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> WHITELISTING STUDENTS...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> UPLOAD & WHITELIST
                </>
              )}
            </Button>
          </form>
        </GlowCard>
      )}

      {/* Wallet Bind Modal */}
      {isWalletModalOpen && selectedStudentForWallet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <GlowCard className="p-6 w-full max-w-md space-y-4" glow>
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                Bind Wallet Address
              </h3>
              <button onClick={() => setIsWalletModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground font-mono">
              Link a wallet address to <strong>{selectedStudentForWallet.fullName}</strong> ({selectedStudentForWallet.studentId}).
            </p>

            <form onSubmit={handleBindWallet} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="walletAddr" className="text-[10px] font-mono font-bold uppercase tracking-wider">Wallet Address (0x...)</Label>
                <input
                  id="walletAddr"
                  type="text"
                  placeholder="0x..."
                  value={newWalletAddress}
                  onChange={(e) => setNewWalletAddress(e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-background py-2 px-3 text-xs font-mono focus:border-ca-accent focus:outline-none"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={bindLoading}
                className="w-full bg-ca-accent text-white hover:bg-ca-accent-hover font-mono text-xs py-2 flex items-center justify-center gap-1.5"
              >
                {bindLoading ? (
                  <><RefreshCw className="h-3 w-3 animate-spin" /> BINDING...</>
                ) : (
                  <><Check className="h-3 w-3" /> CONFIRM BIND</>
                )}
              </Button>
            </form>
          </GlowCard>
        </div>
      )}

      {/* Edit Student Details Modal */}
      {isEditModalOpen && selectedStudentForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <GlowCard className="p-6 w-full max-w-md space-y-4" glow>
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                Edit Student Details
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground font-mono">
              Update institutional profile fields for student ID: <strong>{selectedStudentForEdit.studentId}</strong>.
            </p>

            <form onSubmit={handleEditStudent} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="editNameInput" className="text-[10px] font-mono font-bold uppercase tracking-wider">Full Name</Label>
                <input
                  id="editNameInput"
                  type="text"
                  placeholder="Enter full name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-background py-2 px-3 text-xs font-mono focus:border-ca-accent focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editEmailInput" className="text-[10px] font-mono font-bold uppercase tracking-wider">Email Address</Label>
                <input
                  id="editEmailInput"
                  type="email"
                  placeholder="Enter email address"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-background py-2 px-3 text-xs font-mono focus:border-ca-accent focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editWalletInput" className="text-[10px] font-mono font-bold uppercase tracking-wider">Wallet Address (0x...)</Label>
                <input
                  id="editWalletInput"
                  type="text"
                  placeholder="0x... (or leave blank if none)"
                  value={editWallet}
                  onChange={(e) => setEditWallet(e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-background py-2 px-3 text-xs font-mono focus:border-ca-accent focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                disabled={editLoading}
                className="w-full bg-ca-accent text-white hover:bg-ca-accent-hover font-mono text-xs py-2 flex items-center justify-center gap-1.5"
              >
                {editLoading ? (
                  <><RefreshCw className="h-3 w-3 animate-spin" /> SAVING...</>
                ) : (
                  <><Check className="h-3 w-3" /> SAVE CHANGES</>
                )}
              </Button>
            </form>
          </GlowCard>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { address } = useAccount()
  const { role } = useRoleStore()
  const { data: stats } = usePlatformStats()
  const { data: adminAddress } = usePlatformAdmin()

  // State for live DB stats
  const [dbStats, setDbStats] = useState<any>(null)

  // State for live logs
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  // Student request states
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestResult, setRequestResult] = useState<{ text: string, type: "success" | "info" | "error" } | null>(null)

  const handleRequestTranscript = async () => {
    if (!address) return
    try {
      setRequestLoading(true)
      setRequestResult(null)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      const res = await fetch(`${API_URL}/api/transcripts/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentWallet: address })
      })
      const data = await res.json()
      if (res.ok) {
        if (data.status === "sent") {
          setRequestResult({ text: data.message, type: "success" })
        } else {
          setRequestResult({ text: data.message, type: "info" })
        }
      } else {
        setRequestResult({ text: data.error || "Failed to submit request.", type: "error" })
      }
    } catch (err) {
      setRequestResult({ text: "Error submitting transcript request.", type: "error" })
    } finally {
      setRequestLoading(false)
    }
  }

  const isAdmin = address && adminAddress && address.toLowerCase() === adminAddress.toLowerCase()
  const totalUniversities = stats ? Number(stats[0]) : 0
  const activeCount = stats ? Number(stats[1]) : 0

  useEffect(() => {
    const fetchDbStats = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        const res = await fetch(`${API_URL}/api/stats/platform`)
        if (res.ok) {
          const data = await res.json()
          setDbStats(data)
        }
      } catch (err) {
        console.error("Failed to load db stats:", err)
      }
    }

    const fetchLogs = async () => {
      try {
        setLogsLoading(true)
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        const res = await fetch(`${API_URL}/api/logs`)
        if (res.ok) {
          const data = await res.json()
          setLogs(data)
        }
      } catch (e) {
        console.error("Failed to load logs:", e)
      } finally {
        setLogsLoading(false)
      }
    }

    fetchDbStats()
    fetchLogs()
    
    // Poll every 10 seconds for real-time vibe
    const interval = setInterval(() => {
      fetchDbStats()
      fetchLogs()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const getDashboardTitle = () => {
    switch (role) {
      case "admin": return "Platform Admin Console"
      case "registrar": return "University Registrar Dashboard"
      case "student": return "Student Credential Hub"
      case "verifier": return "Verifier Portal"
      default: return "CredAxis Terminal"
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <SectionLabel index={1} label="OVERVIEW" />
          <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
            {getDashboardTitle()}
          </h1>
          <p className="text-xs text-muted-foreground">
            Connected Wallet: <span className="font-mono text-[11px] text-foreground bg-muted/40 px-1.5 py-0.5 rounded">{address ? truncateAddress(address, 6) : "Not Connected"}</span>
          </p>
        </div>
      </div>

      {role === "registrar" ? (
        <RegistrarDashboardView registrarAddress={address || ""} />
      ) : (
        <>
          {/* Main Metric Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Registered Universities"
              value={String(totalUniversities)}
              icon={<Building2 className="h-5 w-5" />}
              accent="default"
              trend="All instances"
            />
            <StatCard
              label="Active Networks"
              value={String(activeCount)}
              icon={<ShieldCheck className="h-5 w-5" />}
              accent="success"
              trend={`${totalUniversities - activeCount} suspended`}
            />
            <StatCard
              label="Transcripts Issued"
              value={dbStats ? String(dbStats.totalTranscripts) : "..."}
              icon={<FileText className="h-5 w-5" />}
              accent="teal"
              trend="From live database"
            />
            <StatCard
              label="Verifications Done"
              value={dbStats ? String(dbStats.totalVerifications) : "..."}
              icon={<CheckCircle2 className="h-5 w-5" />}
              accent="success"
              trend="Verified on-chain"
            />
          </div>

          {/* Dynamic Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Actions Column */}
            <div className="md:col-span-1 space-y-6">
              <SectionLabel index={2} label="QUICK ACTIONS" />
              
              <div className="space-y-3">
                {role === "admin" && (
                  <Link href="/admin" className="block group">
                    <GlowCard className="p-4 hover:border-ca-accent hover:bg-card/45 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-ca-danger/10 rounded-lg text-ca-danger">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground group-hover:text-ca-accent transition-colors">
                            Deploy University
                          </h4>
                          <p className="text-[10px] text-muted-foreground">Register new institutions on-chain</p>
                        </div>
                      </div>
                    </GlowCard>
                  </Link>
                )}

                {((role as string) === "registrar" || !role) && (
                  <Link href="/issue" className="block group">
                    <GlowCard className="p-4 hover:border-ca-accent hover:bg-card/45 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-ca-accent/10 rounded-lg text-ca-accent">
                          <PlusCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground group-hover:text-ca-accent transition-colors">
                            Issue Credentials
                          </h4>
                          <p className="text-[10px] text-muted-foreground">Register transcript record for a student</p>
                        </div>
                      </div>
                    </GlowCard>
                  </Link>
                )}

                {(role === "student" || !role) && (
                  <>
                    <Link href="/transcripts" className="block group">
                      <GlowCard className="p-4 hover:border-ca-teal/10 hover:bg-card/45 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-ca-teal/10 rounded-lg text-ca-teal">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground group-hover:text-ca-accent transition-colors">
                              My Transcripts
                            </h4>
                            <p className="text-[10px] text-muted-foreground">View your academic records on-chain</p>
                          </div>
                        </div>
                      </GlowCard>
                    </Link>

                    <Link href="/access" className="block group">
                      <GlowCard className="p-4 hover:border-ca-accent hover:bg-card/45 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-ca-success/10 rounded-lg text-ca-success">
                            <Lock className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground group-hover:text-ca-accent transition-colors">
                              Access Delegation
                            </h4>
                            <p className="text-[10px] text-muted-foreground">Grant & revoke verifier permissions</p>
                          </div>
                        </div>
                      </GlowCard>
                    </Link>

                    <button 
                      onClick={handleRequestTranscript} 
                      disabled={requestLoading}
                      className="block group text-left w-full focus:outline-none"
                    >
                      <GlowCard className="p-4 hover:border-ca-accent hover:bg-card/45 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-ca-accent/10 rounded-lg text-ca-accent">
                            {requestLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                          </div>
                          <div>
                            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground group-hover:text-ca-accent transition-colors">
                              {requestLoading ? "Requesting..." : "Request Transcript"}
                            </h4>
                            <p className="text-[10px] text-muted-foreground">Auto-mail to inbox, or queue with registrar</p>
                          </div>
                        </div>
                      </GlowCard>
                    </button>

                    {requestResult && (
                      <div className={`p-3 rounded font-mono text-[10px] border ${
                        requestResult.type === "success" 
                          ? "bg-ca-success/8 text-ca-success border-ca-success/20" 
                          : requestResult.type === "info" 
                          ? "bg-ca-accent/8 text-ca-accent border-ca-accent/20" 
                          : "bg-ca-danger/8 text-ca-danger border-ca-danger/20"
                      }`}>
                        {requestResult.text}
                      </div>
                    )}
                  </>
                )}

                <Link href="/verify-onchain" className="block group">
                  <GlowCard className="p-4 hover:border-ca-accent hover:bg-card/45 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-ca-success/10 rounded-lg text-ca-success">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground group-hover:text-ca-accent transition-colors">
                          On-Chain Verification
                        </h4>
                        <p className="text-[10px] text-muted-foreground">Verify transcript cryptographic hashes</p>
                      </div>
                    </div>
                  </GlowCard>
                </Link>
              </div>
            </div>

            {/* Dynamic Activity/News Section */}
            <div className="md:col-span-2 space-y-6">
              <SectionLabel index={3} label="REALTIME NETWORK METRICS" />
              
              <GlowCard className="p-6 relative overflow-hidden" glow>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                      Recent Activities
                    </h3>
                    <span className="text-[10px] font-mono text-muted-foreground">LIVE STREAMING</span>
                  </div>

                  <div className="space-y-4 font-mono">
                    {logsLoading && logs.length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted-foreground animate-pulse">
                        LOADING NETWORK STREAM...
                      </div>
                    ) : logs.length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        NO RECENT ACTIVITIES DETECTED
                      </div>
                    ) : (
                      logs.slice(0, 5).map((log, index) => {
                        const timeAgo = (dateStr: string) => {
                          const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000)
                          if (seconds < 60) return `${seconds}s ago`
                          const minutes = Math.floor(seconds / 60)
                          if (minutes < 60) return `${minutes}m ago`
                          const hours = Math.floor(minutes / 60)
                          if (hours < 24) return `${hours}h ago`
                          return new Date(dateStr).toLocaleDateString()
                        }

                        const getBulletColor = () => {
                          switch (log.type) {
                            case "university_registered": return "bg-ca-accent"
                            case "transcript_issued": return "bg-ca-success"
                            case "status_changed": return "bg-ca-danger"
                            default: return "bg-muted"
                          }
                        }

                        return (
                          <div key={index} className="flex items-start justify-between text-xs border-b border-border/20 pb-3">
                            <div className="space-y-1">
                              <p className="text-foreground font-semibold flex items-center gap-1.5 uppercase text-[9px] tracking-wider">
                                <span className={cn("h-1.5 w-1.5 rounded-full", getBulletColor())} />
                                {log.type.replace(/_/g, " ")}
                              </p>
                              <p className="text-[10px] text-muted-foreground leading-normal">{log.description}</p>
                              {log.txHash && (
                                <a
                                  href={`https://sepolia.etherscan.io/tx/${log.txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] text-ca-accent hover:underline block pt-0.5"
                                >
                                  TX: {log.txHash.slice(0, 10)}...{log.txHash.slice(-6)}
                                </a>
                              )}
                            </div>
                            <span className="text-[9px] text-muted-foreground shrink-0 pl-4">{timeAgo(log.timestamp)}</span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </GlowCard>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
