"use client"

import React, { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { GlowCard } from "@/components/ui/glow-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Key, Copy, Check, Trash2, ShieldAlert, Loader2, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface VerifierToken {
  id: number
  token: string
  institutionName: string
  issuerAddress: string
  role: string
  createdAt: string
  expiresAt: string | null
  isActive: boolean
}

interface VerifierTokenManagerProps {
  role: "admin" | "registrar"
}

export function VerifierTokenManager({ role }: VerifierTokenManagerProps) {
  const { address } = useAccount()
  const [tokens, setTokens] = useState<VerifierToken[]>([])
  const [institutionName, setInstitutionName] = useState("")
  const [expiresDays, setExpiresDays] = useState("365")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [message, setMessage] = useState({ text: "", type: "" })

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

  const fetchTokens = async () => {
    if (!address) return
    try {
      setLoading(true)
      const res = await fetch(`${API_URL}/api/tokens?issuerAddress=${address.toLowerCase()}&role=${role}`, {
        headers: {
          Authorization: "Bearer credaxis-registrar"
        }
      })
      if (res.ok) {
        const data = await res.json()
        setTokens(data)
      }
    } catch (err) {
      console.error("Failed to load tokens:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTokens()
  }, [address, role])

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !institutionName) return

    setSubmitting(true)
    setMessage({ text: "", type: "" })

    try {
      const res = await fetch(`${API_URL}/api/tokens/issue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer credaxis-registrar"
        },
        body: JSON.stringify({
          institutionName,
          expiresDays: expiresDays === "never" ? null : expiresDays,
          issuerAddress: address.toLowerCase(),
          role
        })
      })

      if (res.ok) {
        const data = await res.json()
        setMessage({ text: `Token successfully issued to ${institutionName}!`, type: "success" })
        setInstitutionName("")
        // Focus attention on copying the newly created token
        setCopiedToken(data.token)
        fetchTokens()
      } else {
        const err = await res.json()
        setMessage({ text: err.error || "Failed to issue token", type: "error" })
      }
    } catch (err) {
      setMessage({ text: "Connection error", type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async (id: number) => {
    if (!address) return
    if (!confirm("Are you sure you want to revoke this verifier token? Any automated integration using this key will immediately fail.")) return

    try {
      const res = await fetch(`${API_URL}/api/tokens/${id}?operator=${address.toLowerCase()}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer credaxis-registrar"
        }
      })
      if (res.ok) {
        setMessage({ text: "Token successfully revoked.", type: "success" })
        fetchTokens()
      } else {
        setMessage({ text: "Failed to revoke token.", type: "error" })
      }
    } catch (err) {
      console.error(err)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedToken(text)
    setTimeout(() => {
      if (copiedToken === text) {
        setCopiedToken(null)
      }
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <Key className="h-4.5 w-4.5 text-ca-accent" />
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider">
          {role === "admin" ? "Global Verifier API Access Tokens" : "Institution Verification Bypass Keys"}
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issue Form */}
        <GlowCard className="p-5 space-y-4 h-fit border border-border/40 bg-card/30">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
            Issue Access Token
          </h4>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Generate a secure API token for verification partners (e.g., WES, employers) to bypass manual student verification approvals.
          </p>

          <form onSubmit={handleIssue} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">Institution Name</label>
              <Input
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="e.g. World Education Services (WES)"
                className="font-mono text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">Token Validity</label>
              <select
                value={expiresDays}
                onChange={(e) => setExpiresDays(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-card py-2 px-3 text-xs font-mono text-foreground focus:outline-none focus:border-ca-accent"
              >
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="365">1 Year (365 Days)</option>
                <option value="never">Permanent (No Expiration)</option>
              </select>
            </div>

            {message.text && (
              <div className={cn(
                "p-2.5 rounded text-[11px] font-mono border leading-normal",
                message.type === "success" 
                  ? "bg-ca-success/8 text-ca-success border-ca-success/20" 
                  : "bg-ca-danger/8 text-ca-danger border-ca-danger/20"
              )}>
                {message.text}
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || !institutionName}
              className="w-full bg-ca-accent hover:bg-ca-accent/90 text-white font-mono text-xs h-9"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Generating Key...
                </>
              ) : (
                "Issue Verifier Token"
              )}
            </Button>
          </form>
        </GlowCard>

        {/* Tokens List */}
        <div className="lg:col-span-2 space-y-4">
          <GlowCard className="p-5 relative overflow-hidden border border-border/40 bg-card/20 min-h-[200px]">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-muted-foreground animate-pulse">
                LOADING ACTIVE TOKENS...
              </div>
            ) : tokens.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center font-mono text-xs text-muted-foreground text-center p-6 space-y-2">
                <ShieldAlert className="h-6 w-6 text-muted-foreground/50" />
                <span>NO API TOKENS ISSUED YET</span>
              </div>
            ) : (
              <div className="space-y-4 font-mono text-xs max-h-[350px] overflow-y-auto pr-1">
                <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] text-muted-foreground uppercase border-b border-border/40 pb-2">
                  <div className="col-span-4 font-bold">Institution</div>
                  <div className="col-span-4 font-bold">Token Key</div>
                  <div className="col-span-3 font-bold">Expiry Date</div>
                  <div className="col-span-1 font-bold text-right">Actions</div>
                </div>

                {tokens.map((tok) => {
                  const isExpired = tok.expiresAt ? new Date(tok.expiresAt).getTime() < Date.now() : false
                  const status = !tok.isActive ? "revoked" : isExpired ? "expired" : "active"
                  const displayToken = `${tok.token.slice(0, 5)}...${tok.token.slice(-5)}`

                  return (
                    <div
                      key={tok.id}
                      className={cn(
                        "grid grid-cols-1 sm:grid-cols-12 gap-2 items-center border-b border-border/20 pb-3 last:border-0 last:pb-0 transition-opacity",
                        status !== "active" && "opacity-60"
                      )}
                    >
                      {/* Institution Name */}
                      <div className="col-span-1 sm:col-span-4 space-y-0.5">
                        <span className="font-bold text-foreground text-xs uppercase block sm:inline">
                          {tok.institutionName}
                        </span>
                        <div className="flex gap-1.5 items-center">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-bold border leading-none uppercase",
                            status === "active" 
                              ? "bg-ca-success/10 text-ca-success border-ca-success/20"
                              : status === "expired"
                              ? "bg-ca-warning/10 text-ca-warning border-ca-warning/20"
                              : "bg-ca-danger/10 text-ca-danger border-ca-danger/20"
                          )}>
                            {status}
                          </span>
                          <span className="text-[9px] text-muted-foreground/60 sm:hidden">
                            Issuer: {tok.issuerAddress.slice(0, 10)}...
                          </span>
                        </div>
                      </div>

                      {/* Token Key with Copy Button */}
                      <div className="col-span-1 sm:col-span-4 flex items-center gap-2 bg-muted/20 px-2 py-1.5 rounded border border-border/40 w-fit sm:w-full justify-between">
                        <span className="text-[10px] text-foreground font-mono select-all">
                          {copiedToken === tok.token ? tok.token : displayToken}
                        </span>
                        <button
                          onClick={() => copyToClipboard(tok.token)}
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          title="Copy API Token"
                        >
                          {copiedToken === tok.token ? (
                            <Check className="h-3 w-3 text-ca-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>

                      {/* Expiry Date */}
                      <div className="col-span-1 sm:col-span-3 text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        <span>
                          {tok.expiresAt 
                            ? new Date(tok.expiresAt).toLocaleDateString()
                            : "Permanent"
                          }
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 sm:col-span-1 flex justify-end">
                        {tok.isActive && (
                          <button
                            onClick={() => handleRevoke(tok.id)}
                            className="p-1.5 bg-ca-danger/10 hover:bg-ca-danger/20 text-ca-danger border border-ca-danger/25 rounded transition-colors"
                            title="Revoke Token Access"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </GlowCard>
        </div>
      </div>
    </div>
  )
}
