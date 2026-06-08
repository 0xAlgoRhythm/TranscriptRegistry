"use client"

import React, { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { Button } from "@/components/ui/button"
import { HashDisplay } from "@/components/ui/hash-display"
import { truncateAddress } from "@/lib/utils"
import { 
  Building2, Mail, User, Wallet, Send, FileText, 
  CheckCircle2, Clock, XCircle, Loader2, ShieldAlert, Edit3, Save, ExternalLink, Settings
} from "lucide-react"

export default function InstitutionPage() {
  const { address } = useAccount()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)

  // Registration Form States
  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState("")

  // Request Form States
  const [studentName, setStudentName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [studentEmail, setStudentEmail] = useState("")
  const [reqLoading, setReqLoading] = useState(false)
  const [reqResult, setReqResult] = useState<{ success: boolean; msg: string } | null>(null)

  // Requests List
  const [requests, setRequests] = useState<any[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)

  // Settings Edit States
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editWallet, setEditWallet] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const [editMsg, setEditMsg] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const fetchProfile = async () => {
    if (!address) return
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/institutions/profile/${address.toLowerCase()}`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.status !== "not_registered") {
          setProfile(data)
          setEditName(data.name || "")
          setEditEmail(data.email || "")
          setEditWallet(data.walletAddress || "")
          if (data.status === "approved") {
            fetchRequests()
          }
        } else {
          setProfile(null)
        }
      }
    } catch (e) {
      console.error("Failed to load institution profile", e)
    } finally {
      setLoading(false)
    }
  }

  const fetchRequests = async () => {
    if (!address) return
    try {
      setRequestsLoading(true)
      const res = await fetch(`${API_URL}/api/institutions/requests/${address.toLowerCase()}`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data)
      }
    } catch (e) {
      console.error("Failed to fetch requests", e)
    } finally {
      setRequestsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [address])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !regName || !regEmail) return
    try {
      setRegLoading(true)
      setRegError("")
      const res = await fetch(`${API_URL}/api/institutions/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          walletAddress: address
        })
      })
      const data = await res.json()
      if (res.ok) {
        fetchProfile()
      } else {
        setRegError(data.error || "Failed to submit request.")
      }
    } catch (err) {
      setRegError("Server error during registration.")
    } finally {
      setRegLoading(false)
    }
  }

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !studentName || !studentId || !studentEmail) return
    try {
      setReqLoading(true)
      setReqResult(null)
      const res = await fetch(`${API_URL}/api/institutions/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionId: profile.id,
          studentName,
          studentId,
          studentEmail
        })
      })
      const data = await res.json()
      if (res.ok) {
        setReqResult({ success: true, msg: "Release request sent to student. They have been emailed for consent." })
        setStudentName("")
        setStudentId("")
        setStudentEmail("")
        fetchRequests()
      } else {
        setReqResult({ success: false, msg: data.error || "Failed to submit request." })
      }
    } catch (err) {
      setReqResult({ success: false, msg: "Network error submitting request." })
    } finally {
      setReqLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !editName || !editEmail || !editWallet) return
    try {
      setEditLoading(true)
      setEditMsg(null)
      const res = await fetch(`${API_URL}/api/institutions/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldWallet: profile.walletAddress,
          name: editName,
          email: editEmail,
          walletAddress: editWallet
        })
      })
      const data = await res.json()
      if (res.ok) {
        setEditMsg({ text: "Profile updated successfully! Re-resolving credentials...", type: "success" })
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setEditMsg({ text: data.error || "Failed to update profile.", type: "error" })
      }
    } catch (err) {
      setEditMsg({ text: "Error connecting to server.", type: "error" })
    } finally {
      setEditLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-ca-accent" />
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest animate-pulse">
            LOADING PORTAL SECURE DATA...
          </p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-xl space-y-8 animate-fade-in pb-16">
        <div className="space-y-1 text-center">
          <SectionLabel index={1} label="ONBOARDING REGISTRATION" />
          <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
            Register Institution
          </h1>
          <p className="text-xs text-muted-foreground">
            Apply to register your organization as a whitelisted verifier to request student transcripts.
          </p>
        </div>

        <GlowCard className="p-6 md:p-8 space-y-6" glow>
          <div className="flex items-center gap-3 border-b border-border/40 pb-4">
            <Building2 className="h-6 w-6 text-ca-accent" />
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                Verifier Request Form
              </h3>
              <p className="text-[10px] text-muted-foreground">All applications require registrar or platform admin approval</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground uppercase">Connected Wallet</label>
              <input
                type="text"
                disabled
                value={address || ""}
                className="w-full rounded-lg border border-border/40 bg-muted/15 py-2.5 px-4 text-xs font-mono text-muted-foreground focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground uppercase">Organization Name</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Google DeepMind / MIT University"
                className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-xs font-mono focus:border-ca-accent focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground uppercase">Official Contact Email</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="verifier@organization.org"
                className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-xs font-mono focus:border-ca-accent focus:outline-none"
              />
            </div>

            {regError && (
              <div className="p-3 bg-ca-danger/8 border border-ca-danger/20 text-ca-danger font-mono text-[10px] rounded">
                {regError}
              </div>
            )}

            <Button
              type="submit"
              disabled={regLoading || !address}
              className="w-full bg-ca-accent text-white hover:bg-ca-accent-hover font-mono text-xs py-3 uppercase flex justify-center items-center gap-1.5"
            >
              {regLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Submit Whitelist Application
            </Button>
          </form>
        </GlowCard>
      </div>
    )
  }

  // Pending Review state
  if (profile.status === "pending") {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center animate-fade-in py-16">
        <GlowCard className="p-8 space-y-6" glow>
          <div className="mx-auto w-12 h-12 rounded-full bg-ca-accent/15 flex items-center justify-center text-ca-accent">
            <Clock className="h-6 w-6 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-foreground">
              APPLICATION UNDER REVIEW
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your registration request for <strong>{profile.name}</strong> is currently pending review. 
              A platform admin or university registrar must approve your profile before you can access the verifier tools.
            </p>
          </div>
          <div className="border-t border-border/40 pt-4 font-mono text-[10px] text-muted-foreground space-y-1 text-left bg-muted/10 p-3 rounded">
            <div><strong>Organization:</strong> {profile.name}</div>
            <div><strong>Email:</strong> {profile.email}</div>
            <div><strong>Status:</strong> Pending Whitelist Approval</div>
            <div><strong>Submitted:</strong> {new Date(profile.createdAt).toLocaleDateString()}</div>
          </div>
        </GlowCard>
      </div>
    )
  }

  // Rejected state
  if (profile.status === "rejected") {
    return (
      <div className="mx-auto max-w-md space-y-6 text-center animate-fade-in py-16">
        <GlowCard className="p-8 space-y-6" glow>
          <div className="mx-auto w-12 h-12 rounded-full bg-ca-danger/15 flex items-center justify-center text-ca-danger">
            <XCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-foreground text-ca-danger">
              APPLICATION REJECTED
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Unfortunately, your whitelist request for <strong>{profile.name}</strong> has been rejected. 
              Please contact the platform administrator or registrar if you believe this is an error.
            </p>
          </div>
        </GlowCard>
      </div>
    )
  }

  // Approved dashboard state
  const totalReqs = requests.length
  const pendingConsent = requests.filter(r => r.status === "pending").length
  const approvedReleases = requests.filter(r => r.status === "approved").length

  return (
    <div className="mx-auto max-w-6xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="space-y-1">
        <SectionLabel index={1} label="INSTITUTION HUB" />
        <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
          Verifier Portal Dashboard
        </h1>
        <p className="text-xs text-muted-foreground">
          Welcome back, <strong>{profile.name}</strong>. Request student release tokens, manage access consent requests, and verify credentials.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-card p-5 font-mono relative overflow-hidden">
          <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Total Requested Transcripts</span>
          <div className="text-2xl font-bold text-foreground mt-1">{totalReqs}</div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-5 font-mono relative overflow-hidden">
          <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Pending Consent Requests</span>
          <div className="text-2xl font-bold text-ca-accent mt-1">{pendingConsent}</div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card p-5 font-mono relative overflow-hidden">
          <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">Approved Released Transcripts</span>
          <div className="text-2xl font-bold text-ca-success mt-1">{approvedReleases}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Form */}
        <div className="lg:col-span-1 space-y-6">
          <GlowCard className="p-6 relative overflow-hidden" glow>
            <div className="flex items-center gap-3 border-b border-border/40 pb-3 mb-4">
              <FileText className="h-5 w-5 text-ca-accent" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                Request Record Release
              </h3>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-muted-foreground uppercase text-[10px]">Student Name</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full rounded-lg border border-border/60 bg-card py-2 px-3 text-xs focus:border-ca-accent focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground uppercase text-[10px]">Student Index Number (ID)</label>
                <input
                  type="text"
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. 230025344"
                  className="w-full rounded-lg border border-border/60 bg-card py-2 px-3 text-xs focus:border-ca-accent focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground uppercase text-[10px]">Student Email Address</label>
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full rounded-lg border border-border/60 bg-card py-2 px-3 text-xs focus:border-ca-accent focus:outline-none"
                />
              </div>

              {reqResult && (
                <div className={`p-3 rounded text-[10px] border ${
                  reqResult.success 
                    ? "bg-ca-success/8 text-ca-success border-ca-success/20" 
                    : "bg-ca-danger/8 text-ca-danger border-ca-danger/20"
                }`}>
                  {reqResult.msg}
                </div>
              )}

              <Button
                type="submit"
                disabled={reqLoading}
                className="w-full bg-ca-accent text-white hover:bg-ca-accent-hover py-2.5 uppercase text-xs flex justify-center items-center gap-1.5"
              >
                {reqLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Send Access Request
              </Button>
            </form>
          </GlowCard>

          {/* Profile & Settings Update */}
          <GlowCard className="p-6 relative overflow-hidden" glow>
            <div className="flex items-center gap-3 border-b border-border/40 pb-3 mb-4">
              <Settings className="h-5 w-5 text-ca-accent" />
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                Profile & Settings
              </h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 font-mono text-xs">
              <div className="space-y-1.5">
                <label className="text-muted-foreground uppercase text-[10px]">Institution Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-card py-2 px-3 text-xs focus:border-ca-accent focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground uppercase text-[10px]">Contact Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-card py-2 px-3 text-xs focus:border-ca-accent focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground uppercase text-[10px]">Linked Wallet Address</label>
                <input
                  type="text"
                  required
                  value={editWallet}
                  onChange={(e) => setEditWallet(e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-card py-2 px-3 text-xs focus:border-ca-accent focus:outline-none"
                />
                <p className="text-[9px] text-muted-foreground leading-snug">
                  Warning: Changing the linked wallet address will require you to reconnect using the new wallet to retain access.
                </p>
              </div>

              {editMsg && (
                <div className={`p-3 rounded text-[10px] border ${
                  editMsg.type === "success" 
                    ? "bg-ca-success/8 text-ca-success border-ca-success/20" 
                    : "bg-ca-danger/8 text-ca-danger border-ca-danger/20"
                }`}>
                  {editMsg.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={editLoading}
                className="w-full bg-muted border border-border/60 text-foreground hover:bg-muted/80 py-2.5 uppercase text-xs flex justify-center items-center gap-1.5"
              >
                {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Profile Changes
              </Button>
            </form>
          </GlowCard>
        </div>

        {/* Requests Queue */}
        <div className="lg:col-span-2">
          <GlowCard className="p-6 relative overflow-hidden min-h-[400px]" glow>
            <div className="flex justify-between items-center border-b border-border/40 pb-3 mb-4">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">
                Consent Requests History
              </h3>
            </div>

            {requestsLoading ? (
              <div className="text-center py-12 font-mono text-xs text-muted-foreground animate-pulse">
                LOADING REQUESTS HISTORY...
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 font-mono text-xs text-muted-foreground">
                NO ACCESS REQUESTS RECORDED YET. Use the form on the left to request a student transcript.
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-[10px] uppercase text-muted-foreground tracking-wider">
                      <th className="p-3 font-bold">Student Name</th>
                      <th className="p-3 font-bold">Student ID</th>
                      <th className="p-3 font-bold">Email</th>
                      <th className="p-3 font-bold">Status</th>
                      <th className="p-3 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <td className="p-3 text-foreground font-semibold">{r.studentName}</td>
                        <td className="p-3">{r.studentId}</td>
                        <td className="p-3 text-muted-foreground">{r.studentEmail}</td>
                        <td className="p-3">
                          {r.status === "approved" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-ca-success/10 text-ca-success">
                              <CheckCircle2 className="h-3 w-3" /> Approved
                            </span>
                          ) : r.status === "rejected" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-ca-danger/10 text-ca-danger">
                              <XCircle className="h-3 w-3" /> Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-ca-accent/10 text-ca-accent">
                              <Clock className="h-3 w-3 animate-pulse" /> Pending Consent
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {r.status === "approved" && r.recordId ? (
                            <a 
                              href={`/verify-onchain?recordId=${r.recordId}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Button
                                size="sm"
                                type="button"
                                className="font-mono text-[9px] px-2.5 py-1 h-7 bg-ca-accent hover:bg-ca-accent/90 text-white flex items-center gap-1"
                              >
                                View Record <ExternalLink className="h-3 w-3" />
                              </Button>
                            </a>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">Locked 🔒</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlowCard>
        </div>
      </div>
    </div>
  )
}
