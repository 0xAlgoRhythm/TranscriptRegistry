"use client"

import React, { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { usePrivy } from "@privy-io/react-auth"
import { useRoleStore } from "@/lib/stores/role-store"
import { GlowCard } from "@/components/ui/glow-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldAlert, Clock, CheckCircle2, RefreshCw, Send, AlertTriangle, LogOut } from "lucide-react"
import { getPrivyEmail } from "@/lib/utils"

interface StudentProfile {
  id: number
  walletAddress: string | null
  fullName: string
  studentId: string
  universityId: number
  status: "pending" | "approved" | "rejected"
  email: string
}

interface University {
  universityId: number
  name: string
  contractAddr: string
  isActive: boolean
}

export function StudentGate({ children }: { children: React.ReactNode }) {
  const { address } = useAccount()
  const { user, logout } = usePrivy()
  const { role } = useRoleStore()
  
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [universities, setUniversities] = useState<University[]>([])
  const [checking, setChecking] = useState(false)
  const [isPending, startTransition] = React.useTransition()

  // Form State
  const [fullName, setFullName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [selectedUni, setSelectedUni] = useState("")
  const [customEmail, setCustomEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  const fetchProfile = async (walletAddr: string) => {
    try {
      const res = await fetch(`${API_URL}/api/students/profile/${walletAddr.toLowerCase()}`)
      if (res.ok) {
        const data = await res.json()
        startTransition(() => {
          setProfile(data)
        })
      } else {
        startTransition(() => {
          setProfile(null)
        })
      }
    } catch (e) {
      console.error("Error fetching student profile:", e)
      startTransition(() => {
        setProfile(null)
      })
    } finally {
      startTransition(() => {
        setLoading(false)
      })
    }
  }

  const fetchUniversities = async () => {
    try {
      const res = await fetch(`${API_URL}/api/universities`)
      if (res.ok) {
        const data = await res.json()
        const unique = Array.from(new Map(data.map((item: University) => [item.name, item])).values()) as University[]
        setUniversities(unique.filter((u: University) => u.isActive))
      }
    } catch (e) {
      console.error("Error fetching universities:", e)
    }
  }

  useEffect(() => {
    if (address && role === "student") {
      fetchProfile(address)
      fetchUniversities()
    } else {
      setLoading(false)
    }
  }, [address, role])

  const handleRefresh = async () => {
    if (!address) return
    startTransition(() => {
      setChecking(true)
    })
    await fetchProfile(address)
    startTransition(() => {
      setChecking(false)
    })
  }

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !user) return

    const defaultEmail = getPrivyEmail(user) || ""

    if (!fullName || !studentId || !selectedUni || (!defaultEmail && !customEmail)) {
      startTransition(() => {
        setError("Please fill in all fields.")
      })
      return
    }

    startTransition(() => {
      setSubmitting(true)
      setError("")
    })

    const privyEmail = getPrivyEmail(user) || ""
    
    const uni = universities.find(u => u.universityId === parseInt(selectedUni))
    const uniName = uni ? uni.name.toLowerCase() : ""
    let domain = "edu.gh"
    if (uniName.includes("kwame") || uniName.includes("knust")) domain = "st.knust.edu.gh"
    else if (uniName.includes("ghana")) domain = "st.ug.edu.gh"
    else if (uniName.includes("cape coast") || uniName.includes("ucc")) domain = "st.ucc.edu.gh"
    else if (uniName.includes("education") || uniName.includes("uew")) domain = "st.uew.edu.gh"
    else if (uniName) {
      const acronym = uniName.split(' ').map(w => w[0]).join('')
      domain = `st.${acronym}.edu.gh`
    }

    const calculatedEmail = privyEmail || customEmail || `${studentId}@${domain}`

    try {
      const res = await fetch(`${API_URL}/api/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address,
          fullName,
          studentId,
          universityId: parseInt(selectedUni),
          email: calculatedEmail,
        }),
      })

      if (res.ok) {
        await fetchProfile(address)
      } else {
        const errData = await res.json()
        startTransition(() => {
          setError(errData.error || "Failed to submit onboarding profile.")
        })
      }
    } catch (err: any) {
      startTransition(() => {
        setError("Network error. Please try again.")
      })
    } finally {
      startTransition(() => {
        setSubmitting(false)
      })
    }
  }

  const handleResetApplication = async () => {
    // Allows student to apply again by going back to form state
    startTransition(() => {
      setProfile(null)
      setFullName("")
      setStudentId("")
      setSelectedUni("")
      setCustomEmail("")
    })
  }

  if (role !== "student" || !address) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ca-accent border-t-transparent" />
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest animate-pulse">Resolving Profile...</p>
        </div>
      </div>
    )
  }

  // 1. Unregistered -> Render Onboarding Form
  if (!profile) {
    const defaultEmail = getPrivyEmail(user) || ""
    return (
      <div className="flex min-h-[75vh] items-center justify-center p-6 animate-fade-in">
        <GlowCard className="p-8 w-full max-w-lg space-y-6" glow>
          <div className="space-y-2 border-b border-border/40 pb-4">
            <h2 className="text-xl font-mono font-bold uppercase tracking-wider text-foreground">
              Student Registration
            </h2>
            <p className="text-xs text-muted-foreground">
              Please link your identity details to onboard into your university's blockchain credential registry.
            </p>
          </div>

          <form onSubmit={handleOnboardingSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullname" className="text-xs font-mono font-bold uppercase tracking-wider">Full Name</Label>
              <Input
                id="fullname"
                placeholder="Enter your legal full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-background border-border/60"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="studentId" className="text-xs font-mono font-bold uppercase tracking-wider">Student ID Number</Label>
              <Input
                id="studentId"
                placeholder="Enter university student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="bg-background border-border/60"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="uni" className="text-xs font-mono font-bold uppercase tracking-wider">Select University</Label>
              <Select value={selectedUni} onValueChange={setSelectedUni} required>
                <SelectTrigger id="uni" className="bg-background border-border/60 font-mono text-xs text-left">
                  <SelectValue placeholder="Select your institution" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border/60">
                  {universities.map((uni) => (
                    <SelectItem key={uni.universityId} value={String(uni.universityId)} className="font-mono text-xs">
                      {uni.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {defaultEmail ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Verified Email Address</Label>
                <div className="font-mono text-xs bg-muted/40 px-3 py-2 border border-border/40 rounded text-muted-foreground">
                  {defaultEmail}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-mono font-bold uppercase tracking-wider">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="bg-background border-border/60"
                  required
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-ca-danger/8 border border-ca-danger/20 rounded text-[11px] font-mono text-ca-danger flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => logout()}
                className="w-1/3 font-mono text-xs border-border/60 flex items-center justify-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" /> LOGOUT
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="w-2/3 bg-ca-accent text-white hover:bg-ca-accent-hover font-mono text-xs flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> SUBMITTING...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" /> SUBMIT PROFILE
                  </>
                )}
              </Button>
            </div>
          </form>
        </GlowCard>
      </div>
    )
  }

  // 2. Pending -> Render Waiting Screen
  if (profile.status === "pending") {
    return (
      <div className="flex min-h-[75vh] items-center justify-center p-6 animate-fade-in">
        <GlowCard className="p-8 max-w-md text-center space-y-6" glow>
          <div className="mx-auto w-12 h-12 rounded-full bg-ca-accent/15 flex items-center justify-center text-ca-accent animate-pulse">
            <Clock className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-foreground">
              Onboarding Under Review
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your profile verification request is currently pending. The University Registrar must approve your student record before you can view your on-chain credentials or manage access delegations.
            </p>
          </div>

          <div className="border border-border/40 rounded p-4 bg-card/20 space-y-2 font-mono text-[10px] text-left">
            <div className="flex justify-between border-b border-border/20 pb-1.5">
              <span className="text-muted-foreground uppercase">Student Name:</span>
              <span className="text-foreground font-semibold">{profile.fullName}</span>
            </div>
            <div className="flex justify-between border-b border-border/20 pb-1.5">
              <span className="text-muted-foreground uppercase">Student ID:</span>
              <span className="text-foreground font-semibold">{profile.studentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground uppercase">Email:</span>
              <span className="text-foreground font-semibold">{profile.email}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <Button
              onClick={() => logout()}
              variant="outline"
              className="font-mono text-xs border-border/60 flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" /> LOGOUT
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={checking}
              className="bg-ca-accent text-white hover:bg-ca-accent-hover font-mono text-xs flex items-center gap-1.5"
            >
              {checking ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> CHECKING...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" /> REFRESH STATUS
                </>
              )}
            </Button>
          </div>
        </GlowCard>
      </div>
    )
  }

  // 3. Rejected -> Render Re-submission Screen
  if (profile.status === "rejected") {
    return (
      <div className="flex min-h-[75vh] items-center justify-center p-6 animate-fade-in">
        <GlowCard className="p-8 max-w-md text-center space-y-6" glow>
          <div className="mx-auto w-12 h-12 rounded-full bg-ca-danger/15 flex items-center justify-center text-ca-danger">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-ca-danger">
              Application Rejected
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your onboarding request has been rejected by the University Registrar. This usually happens if the student ID, name, or email does not match institutional records.
            </p>
          </div>

          <div className="flex gap-3 justify-center pt-2">
            <Button
              onClick={() => logout()}
              variant="outline"
              className="font-mono text-xs border-border/60 flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" /> LOGOUT
            </Button>
            <Button
              onClick={handleResetApplication}
              className="bg-ca-danger text-white hover:bg-[var(--ca-destructive)/0.8] font-mono text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> RE-SUBMIT REQUEST
            </Button>
          </div>
        </GlowCard>
      </div>
    )
  }

  // 4. Approved -> Render Dashboard/Transcripts
  return <>{children}</>
}
