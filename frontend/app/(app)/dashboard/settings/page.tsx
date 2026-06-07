"use client"

import React, { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RefreshCw, Save, ShieldAlert, History, Key, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

export default function RegistrarSettingsPage() {
  const { address } = useAccount()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uni, setUni] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  
  const [logoUrl, setLogoUrl] = useState("")
  const [stampUrl, setStampUrl] = useState("")
  const [message, setMessage] = useState({ text: "", type: "" })

  const [govRequests, setGovRequests] = useState<any[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [newWallet, setNewWallet] = useState("")
  const [submittingEmail, setSubmittingEmail] = useState(false)
  const [submittingWallet, setSubmittingWallet] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  const fetchData = async () => {
    if (!address) return
    try {
      setLoading(true)
      // Fetch Uni Settings
      const res = await fetch(`${API_URL}/api/registrar/settings/${address.toLowerCase()}`)
      let fetchedUni = null
      if (res.ok) {
        const data = await res.json()
        setUni(data)
        setLogoUrl(data.logoUrl || "")
        setStampUrl(data.stampUrl || "")
        fetchedUni = data
      }
      
      // Fetch Audit Logs
      const logRes = await fetch(`${API_URL}/api/audit-logs?actorAddress=${address.toLowerCase()}`)
      if (logRes.ok) {
        setLogs(await logRes.json())
      }

      // Fetch Governance Requests
      if (fetchedUni) {
        const govRes = await fetch(`${API_URL}/api/governance/requests`)
        if (govRes.ok) {
          const govData = await govRes.json()
          setGovRequests(govData.filter((r: any) => r.universityId === fetchedUni.universityId))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [address])

  const handleSave = async () => {
    if (!address) return
    setSaving(true)
    setMessage({ text: "", type: "" })
    try {
      const res = await fetch(`${API_URL}/api/registrar/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrarAddr: address.toLowerCase(),
          logoUrl,
          stampUrl
        })
      })
      if (res.ok) {
        setMessage({ text: "Settings saved successfully!", type: "success" })
        fetchData()
      } else {
        setMessage({ text: "Failed to save settings", type: "error" })
      }
    } catch (err) {
      setMessage({ text: "Network error", type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uni || !newEmail) return
    setSubmittingEmail(true)
    setMessage({ text: "", type: "" })
    try {
      const res = await fetch(`${API_URL}/api/governance/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "email",
          universityId: uni.universityId,
          contractAddr: uni.contractAddr,
          currentValue: uni.registrarEmail || "None",
          newValue: newEmail.toLowerCase()
        })
      })
      if (res.ok) {
        setNewEmail("")
        setMessage({ text: "Email change request submitted for admin review.", type: "success" })
        fetchData()
      } else {
        const data = await res.json()
        setMessage({ text: data.error || "Failed to submit request.", type: "error" })
      }
    } catch (err) {
      setMessage({ text: "Network error.", type: "error" })
    } finally {
      setSubmittingEmail(false)
    }
  }

  const handleRequestWalletChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uni || !newWallet) return
    setSubmittingWallet(true)
    setMessage({ text: "", type: "" })
    try {
      const res = await fetch(`${API_URL}/api/governance/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "wallet",
          universityId: uni.universityId,
          contractAddr: uni.contractAddr,
          currentValue: uni.registrar,
          newValue: newWallet.toLowerCase()
        })
      })
      if (res.ok) {
        setNewWallet("")
        setMessage({ text: "Wallet change request submitted for admin review.", type: "success" })
        fetchData()
      } else {
        const data = await res.json()
        setMessage({ text: data.error || "Failed to submit request.", type: "error" })
      }
    } catch (err) {
      setMessage({ text: "Network error.", type: "error" })
    } finally {
      setSubmittingWallet(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-fade-in pb-16">
      <div className="space-y-1">
        <SectionLabel index={1} label="REGISTRAR PORTAL" />
        <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">
          System Settings & Audit
        </h1>
        <p className="text-xs text-muted-foreground">
          Manage your university's official branding for dynamic PDF transcript generation and review recent system actions.
        </p>
      </div>

      {loading ? (
        <div className="h-40 rounded-xl bg-card/45 border border-border/40 animate-pulse flex items-center justify-center font-mono text-xs text-muted-foreground">
          LOADING SETTINGS...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Branding Card */}
          <GlowCard className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider">
                Branding & Document Assets
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Official University Logo URL</label>
                <Input 
                  value={logoUrl} 
                  onChange={(e) => setLogoUrl(e.target.value)} 
                  placeholder="https://example.com/logo.png" 
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground">This logo will be placed at the top-center of dynamically generated PDF transcripts.</p>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Official Registrar Stamp URL</label>
                <Input 
                  value={stampUrl} 
                  onChange={(e) => setStampUrl(e.target.value)} 
                  placeholder="https://example.com/stamp.png" 
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground">This stamp will be placed at the bottom-right over the signature line.</p>
              </div>

              {message.text && (
                <div className={cn(
                  "p-3 rounded text-xs font-mono border",
                  message.type === "success" ? "bg-ca-success/10 text-ca-success border-ca-success/30" : "bg-ca-danger/10 text-ca-danger border-ca-danger/30"
                )}>
                  {message.text}
                </div>
              )}

              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full bg-ca-accent hover:bg-ca-accent/90 text-white font-mono text-xs"
              >
                {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Branding Assets
              </Button>
            </div>
          </GlowCard>

          {/* Security & Recovery Settings */}
          <GlowCard className="p-6 space-y-6">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider border-b border-border/40 pb-3 flex items-center gap-2">
              Security & Recovery Settings
            </h3>
            
            <div className="space-y-6">
              {/* Current Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/15 p-4 rounded-xl border border-border/20 font-mono text-xs">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Recovery Email</p>
                  <p className="font-semibold text-foreground">{uni?.registrarEmail || "No recovery email registered"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Registrar Wallet Address</p>
                  <p className="font-semibold text-foreground truncate">{uni?.registrar}</p>
                </div>
              </div>

              {/* Pending Requests Banner */}
              {govRequests.some(r => r.status === "pending") && (
                <div className="space-y-2">
                  {govRequests.filter(r => r.status === "pending").map((r: any) => (
                    <div key={r.id} className="p-3 bg-ca-warning/10 border border-ca-warning/30 rounded text-xs font-mono text-ca-warning flex items-center justify-between">
                      <div>
                        <span className="font-bold uppercase mr-1">[{r.type === "wallet" ? "Wallet" : "Email"} Request Pending]</span>
                        <span>Change from <span className="underline">{r.currentValue.slice(0, 10)}...</span> to <span className="underline font-semibold">{r.newValue}</span></span>
                      </div>
                      <span className="text-[10px] bg-ca-warning/15 px-2 py-0.5 rounded border border-ca-warning/30 animate-pulse">Awaiting Platform Admin Approval</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Change Forms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Email Change */}
                <form onSubmit={handleRequestEmailChange} className="space-y-4 border-r border-border/20 pr-0 md:pr-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Request Recovery Email Update</label>
                    <Input 
                      type="email"
                      value={newEmail} 
                      onChange={(e) => setNewEmail(e.target.value)} 
                      placeholder="new-registrar@university.edu" 
                      className="font-mono text-xs"
                      required
                    />
                    <p className="text-[9px] text-muted-foreground">Submit a request to update the recovery email. A platform admin must review and approve it.</p>
                  </div>
                  <Button 
                    type="submit"
                    disabled={submittingEmail || govRequests.some(r => r.type === "email" && r.status === "pending")}
                    className="w-full bg-ca-accent/25 hover:bg-ca-accent/35 text-foreground font-mono text-xs border border-ca-accent/40"
                  >
                    {submittingEmail ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Request Email Change
                  </Button>
                </form>

                {/* Wallet Change */}
                <form onSubmit={handleRequestWalletChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Request Registrar Wallet Update</label>
                    <Input 
                      value={newWallet} 
                      onChange={(e) => setNewWallet(e.target.value)} 
                      placeholder="0x..." 
                      className="font-mono text-xs"
                      required
                    />
                    <p className="text-[9px] text-muted-foreground">Submit a request to update the registrar wallet. Requires admin approval + on-chain signature.</p>
                  </div>
                  <Button 
                    type="submit"
                    disabled={submittingWallet || govRequests.some(r => r.type === "wallet" && r.status === "pending")}
                    className="w-full bg-ca-accent/25 hover:bg-ca-accent/35 text-foreground font-mono text-xs border border-ca-accent/40"
                  >
                    {submittingWallet ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Request Wallet Change
                  </Button>
                </form>
              </div>
            </div>
          </GlowCard>

          {/* Audit Logs */}
          <GlowCard className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                <History className="h-4 w-4" /> Registrar Audit Logs
              </h3>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {logs.length === 0 ? (
                <p className="text-xs font-mono text-muted-foreground text-center py-4">No audit logs found.</p>
              ) : (
                logs.map((log: any) => (
                  <div key={log.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded bg-muted/20 border border-border/40 gap-2">
                    <div className="space-y-1">
                      <span className="text-xs font-mono font-bold text-ca-accent">{log.action}</span>
                      <p className="text-[10px] text-muted-foreground">{log.details || "No additional details"}</p>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </GlowCard>
        </div>
      )}
    </div>
  )
}
