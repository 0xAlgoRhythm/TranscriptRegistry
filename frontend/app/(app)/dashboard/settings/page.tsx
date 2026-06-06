"use client"

import React, { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RefreshCw, Save, ShieldAlert, History } from "lucide-react"

export default function RegistrarSettingsPage() {
  const { address } = useAccount()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uni, setUni] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  
  const [logoUrl, setLogoUrl] = useState("")
  const [stampUrl, setStampUrl] = useState("")
  const [message, setMessage] = useState({ text: "", type: "" })

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  const fetchData = async () => {
    if (!address) return
    try {
      setLoading(true)
      // Fetch Uni Settings
      const res = await fetch(`${API_URL}/api/registrar/settings/${address.toLowerCase()}`)
      if (res.ok) {
        const data = await res.json()
        setUni(data)
        setLogoUrl(data.logoUrl || "")
        setStampUrl(data.stampUrl || "")
      }
      
      // Fetch Audit Logs
      const logRes = await fetch(`${API_URL}/api/audit-logs?actorAddress=${address.toLowerCase()}`)
      if (logRes.ok) {
        setLogs(await logRes.json())
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
                <div className={`p-3 rounded text-xs font-mono ${message.type === "success" ? "bg-ca-success/10 text-ca-success border border-ca-success/30" : "bg-ca-danger/10 text-ca-danger border border-ca-danger/30"}`}>
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
