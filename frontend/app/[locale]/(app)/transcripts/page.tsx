"use client";

import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { type Address } from "viem";
import { useStudentTranscripts, useTranscript } from "@/hooks/use-transcript-registry";
import { studentHash, truncateAddress, formatTimestamp, cn } from "@/lib/utils";
import { TRANSCRIPT_STATUS, type TranscriptStatus } from "@/lib/contracts";
import { StatCard } from "@/components/ui/stat-card";
import { GlowCard } from "@/components/ui/glow-card";
import { SectionLabel } from "@/components/ui/section-label";
import { AddressInput } from "@/components/ui/address-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { HashDisplay } from "@/components/ui/hash-display";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { FileText, School, ChevronRight, RefreshCcw, Send, Loader2, X, Check, CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
const TranscriptCard = React.memo(function TranscriptCard({
  recordId,
  registryAddress
}: {
  recordId: `0x${string}`;
  registryAddress: Address;
}) {
  const t = useTranslations("Common");
  const {
    data
  } = useTranscript(registryAddress, recordId);
  if (!data) return null;
  const [, metadataCID,, issuer, timestamp, status] = data;
  const statusStr = TRANSCRIPT_STATUS[status as TranscriptStatus];
  return <GlowCard className="p-5 hover:border-ca-accent transition-all relative overflow-hidden" glow>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-ca-accent/10 rounded-lg text-ca-accent">
            <FileText className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-foreground">{t("recordHash")}{recordId.slice(0, 10)}{t("text404")}{recordId.slice(-6)}
              </span>
              <StatusBadge status={statusStr} />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">{t("metadataIPFS")}{metadataCID.slice(0, 24)}{t("text406")}</p>
            <p className="text-[10px] text-muted-foreground">{t("issued")}{formatTimestamp(timestamp)}{t("by")}{truncateAddress(issuer)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-center">
          <Link href={`/transcripts/${recordId}?registry=${registryAddress}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border/60 hover:border-border text-xs font-mono font-bold tracking-wider text-muted-foreground hover:text-foreground bg-muted/20 hover:bg-muted/40 transition-all">{t("vIEWDETAILED")}<ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </GlowCard>;
});
export default function TranscriptsPage() {
  const t = useTranslations("Common");
  const {
    address
  } = useAccount();
  const [registryAddress, setRegistryAddress] = useState("");
  const [universities, setUniversities] = useState<any[]>([]);
  const [showUniSuggestions, setShowUniSuggestions] = useState(false);
  const hashValue = address ? studentHash(address) : "0x" as `0x${string}`;
  const {
    data: recordIds,
    isLoading,
    refetch
  } = useStudentTranscripts(registryAddress as Address, hashValue);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestResult, setRequestResult] = useState<{
    text: string;
    type: "success" | "info" | "error";
  } | null>(null);
  const [studentEmail, setStudentEmail] = useState("");
  const [instRequests, setInstRequests] = useState<any[]>([]);
  const [instRequestsLoading, setInstRequestsLoading] = useState(false);
  const [activeReleaseRequest, setActiveReleaseRequest] = useState<any | null>(null);
  const [studentTranscripts, setStudentTranscripts] = useState<any[]>([]);
  const [transcriptsLoading, setTranscriptsLoading] = useState(false);
  const [selectedTranscriptId, setSelectedTranscriptId] = useState("");
  const [releaseLoading, setReleaseLoading] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Load universities
  useEffect(() => {
    fetch(`${API_URL}/api/universities`).then(res => res.json()).then(data => {
      if (Array.isArray(data)) {
        setUniversities(data);
      }
    }).catch(err => console.error("Failed to load universities:", err));
  }, [API_URL]);

  // Fetch student profile and auto-populate registry address
  useEffect(() => {
    if (!address) return;
    const loadProfileAndRequests = async () => {
      try {
        const profileRes = await fetch(`${API_URL}/api/students/profile/${address.toLowerCase()}`);
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (profile) {
            if (profile.email) {
              setStudentEmail(profile.email);
              fetchInstitutionRequests(profile.email);
            }
            if (profile.universityId !== undefined && universities.length > 0 && !registryAddress) {
              const studentUni = universities.find(u => u.universityId === profile.universityId);
              if (studentUni) {
                setRegistryAddress(studentUni.contractAddr);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to load student profile for email releases", e);
      }
    };
    loadProfileAndRequests();
  }, [address, universities, registryAddress, API_URL]);
  const fetchInstitutionRequests = async (email: string) => {
    try {
      setInstRequestsLoading(true);
      const res = await fetch(`${API_URL}/api/student/institution-requests/${email.toLowerCase()}`);
      if (res.ok) {
        const data = await res.json();
        setInstRequests(data);
      }
    } catch (e) {
      console.error("Failed to load institution requests", e);
    } finally {
      setInstRequestsLoading(false);
    }
  };
  const handleOpenReleaseModal = async (req: any) => {
    setActiveReleaseRequest(req);
    setSelectedTranscriptId("");
    try {
      setTranscriptsLoading(true);
      const hashVal = studentHash(address || "0x00");
      const res = await fetch(`${API_URL}/api/transcripts/by-student/${hashVal}`);
      if (res.ok) {
        const data = await res.json();
        setStudentTranscripts(data);
        if (data && data.length > 0) {
          setSelectedTranscriptId(data[0].recordId);
        }
      }
    } catch (e) {
      console.error("Failed to fetch student transcripts", e);
    } finally {
      setTranscriptsLoading(false);
    }
  };
  const handleApproveRelease = async () => {
    if (!activeReleaseRequest || !selectedTranscriptId) return;
    try {
      setReleaseLoading(true);
      const res = await fetch(`${API_URL}/api/student/institution-requests/${activeReleaseRequest.id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recordId: selectedTranscriptId
        })
      });
      if (res.ok) {
        setActiveReleaseRequest(null);
        if (studentEmail) {
          fetchInstitutionRequests(studentEmail);
        }
      } else {
        alert("Failed to approve access release.");
      }
    } catch (err) {
      alert("Error approving release.");
    } finally {
      setReleaseLoading(false);
    }
  };
  const handleRejectRelease = async (reqId: number) => {
    if (!confirm("Are you sure you want to deny this access request?")) return;
    try {
      const res = await fetch(`${API_URL}/api/student/institution-requests/${reqId}/reject`, {
        method: "PUT"
      });
      if (res.ok) {
        if (studentEmail) {
          fetchInstitutionRequests(studentEmail);
        }
      } else {
        alert("Failed to deny request.");
      }
    } catch (err) {
      alert("Error denying request.");
    }
  };

  // Access checking effect
  useEffect(() => {
    if (address) {
      // already handled by auto-populate effect
    }
  }, [address]);
  const handleRequestTranscript = async () => {
    if (!address) return;
    try {
      setRequestLoading(true);
      setRequestResult(null);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${API_URL}/api/transcripts/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentWallet: address
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.status === "sent") {
          setRequestResult({
            text: data.message,
            type: "success"
          });
        } else {
          setRequestResult({
            text: data.message,
            type: "info"
          });
        }
      } else {
        setRequestResult({
          text: data.error || "Failed to submit request.",
          type: "error"
        });
      }
    } catch (err) {
      setRequestResult({
        text: "Error submitting transcript request.",
        type: "error"
      });
    } finally {
      setRequestLoading(false);
    }
  };
  return <div className="mx-auto max-w-4xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <SectionLabel index={1} label="STUDENT RECORDS" />
          <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">{t("myAcademicCredentials")}</h1>
          <p className="text-xs text-muted-foreground">{t("accessyoursecureonchain")}</p>
        </div>
        <div className="shrink-0">
          <Button onClick={handleRequestTranscript} disabled={requestLoading || !address} className="font-mono text-xs bg-ca-accent hover:bg-ca-accent/90 text-white flex items-center gap-1.5 px-4 h-9 uppercase">
            {requestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{t("requestTranscript")}</Button>
        </div>
      </div>

      {requestResult && <div className={`p-3 rounded font-mono text-[10px] border ${requestResult.type === "success" ? "bg-ca-success/8 text-ca-success border-ca-success/20" : requestResult.type === "info" ? "bg-ca-accent/8 text-ca-accent border-ca-accent/20" : "bg-ca-danger/8 text-ca-danger border-ca-danger/20"}`}>
          {requestResult.text}
        </div>}

      {/* University Registry Input Card Dropdown */}
      <GlowCard className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">{t("targetUniversityContract")}</h3>
          {registryAddress && <button onClick={() => refetch()} className="text-[10px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1">
              <RefreshCcw className="h-3 w-3" />{t("rEFRESH")}</button>}
        </div>
        
        <div className="relative">
          <button type="button" onClick={() => setShowUniSuggestions(!showUniSuggestions)} className="w-full rounded-lg border border-border/60 bg-card py-3 px-4 text-xs font-mono text-left flex justify-between items-center hover:border-ca-accent transition-colors focus:outline-none">
            <span className="truncate">
              {registryAddress ? universities.find(u => u.contractAddr.toLowerCase() === registryAddress.toLowerCase())?.name || registryAddress : "Select from registered universities..."}
            </span>
            <span className="text-muted-foreground text-[10px]">▼</span>
          </button>

          {showUniSuggestions && <div className="absolute z-50 w-full mt-1.5 max-h-60 overflow-y-auto rounded-lg border border-border/60 bg-card p-1 shadow-lg font-mono text-xs">
              {universities.map(u => {
            const t = useTranslations("Common");
            const isSelected = registryAddress.toLowerCase() === u.contractAddr.toLowerCase();
            return <button key={u.contractAddr} type="button" onMouseDown={() => {
              setRegistryAddress(u.contractAddr);
              setShowUniSuggestions(false);
            }} className={cn("w-full text-left rounded px-3.5 py-3 hover:bg-muted/40 transition-colors flex flex-col gap-1.5 border-b border-border/20 last:border-0", isSelected && "bg-ca-accent/10 border-ca-accent")}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">{u.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-ca-accent/15 text-ca-accent font-semibold">{t("iD")}{u.universityId}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex flex-col gap-0.5">
                      <div className="flex justify-between">
                        <span>{t("registryContract")}</span>
                        <span className="text-foreground">{u.contractAddr.slice(0, 14)}{t("text414")}{u.contractAddr.slice(-12)}</span>
                      </div>
                      {u.deployedAt && <div className="flex justify-between">
                          <span>{t("deployedDate")}</span>
                          <span className="text-foreground">
                            {new Date(u.deployedAt).toLocaleDateString()}{t("block")}{u.blockNumber ? String(u.blockNumber) : "N/A"})
                          </span>
                        </div>}
                    </div>
                  </button>;
          })}
              <div className="p-2 border-t border-border/20 mt-1 bg-card">
                <label className="text-[9px] text-muted-foreground uppercase block mb-1">{t("orentercustomcontract")}</label>
                <input type="text" value={registryAddress} onChange={e => setRegistryAddress(e.target.value)} placeholder={t("0x")} className="w-full rounded border border-border/60 bg-background py-1.5 px-3 text-xs font-mono focus:border-ca-accent focus:outline-none" onMouseDown={e => e.stopPropagation()} />
              </div>
            </div>}
        </div>
      </GlowCard>

      {/* Transcripts Grid */}
      <div className="space-y-4">
        <SectionLabel index={2} label="CREDENTIAL STATUS" />

        {isLoading && <div className="space-y-3">
            <div className="h-20 rounded-xl bg-card/45 border border-border/40 animate-pulse" />
            <div className="h-20 rounded-xl bg-card/45 border border-border/40 animate-pulse" />
          </div>}

        {!registryAddress && <EmptyState title="Registry Required" description="Enter an accredited university registry smart contract address to load your transcript data." icon={<School className="h-8 w-8 text-muted-foreground/50" />} />}

        {registryAddress && recordIds && recordIds.length === 0 && <EmptyState title="No Records Found" description="No transcript records were found registered under your hashed identity on this contract." icon={<FileText className="h-8 w-8 text-muted-foreground/50" />} />}

        {registryAddress && recordIds && recordIds.length > 0 && <div className="grid grid-cols-1 gap-4">
            {recordIds.map(id => <TranscriptCard key={id} recordId={id} registryAddress={registryAddress as Address} />)}
          </div>}
      </div>

      {/* Institution Requests release section */}
      {studentEmail && <div className="space-y-4 pt-6 border-t border-border/20">
          <SectionLabel index={3} label="THIRD-PARTY RELEASES" />
          <GlowCard className="p-6 relative overflow-hidden" glow>
            <div className="flex justify-between items-center border-b border-border/40 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">{t("institutionAccessRequests")}</h3>
                <p className="text-[10px] text-muted-foreground">{t("approvereleaseofacademic")}</p>
              </div>
              <button onClick={() => fetchInstitutionRequests(studentEmail)} className="text-[10px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1">
                <RefreshCcw className="h-3 w-3" />{t("rEFRESH")}</button>
            </div>

            {instRequestsLoading ? <div className="text-center py-6 font-mono text-xs text-muted-foreground animate-pulse">{t("lOADINGACCESSREQUESTS")}</div> : instRequests.length === 0 ? <div className="text-center py-6 font-mono text-xs text-muted-foreground">{t("nOACCESSREQUESTSFROM")}</div> : <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-[10px] uppercase text-muted-foreground tracking-wider">
                      <th className="p-3 font-bold">{t("requestingInstitution")}</th>
                      <th className="p-3 font-bold">{t("contactEmail")}</th>
                      <th className="p-3 font-bold">{t("status")}</th>
                      <th className="p-3 font-bold">{t("requestedAt")}</th>
                      <th className="p-3 font-bold text-right">{t("actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instRequests.map(r => <tr key={r.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <td className="p-3 text-foreground font-semibold">{r.institutionName}</td>
                        <td className="p-3 text-muted-foreground">{r.institutionEmail}</td>
                        <td className="p-3">
                          {r.status === "approved" ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-ca-success/10 text-ca-success">
                              <CheckCircle2 className="h-3 w-3" />{t("released")}</span> : r.status === "rejected" ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-ca-danger/10 text-ca-danger">
                              <XCircle className="h-3 w-3" />{t("denied")}</span> : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-ca-accent/10 text-ca-accent">
                              <Clock className="h-3 w-3 animate-pulse" />{t("pendingConsent")}</span>}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          {r.status === "pending" ? <div className="flex justify-end gap-2">
                              <Button size="sm" type="button" onClick={() => handleOpenReleaseModal(r)} className="font-mono text-[9px] px-2 py-1 h-7 bg-ca-success hover:bg-ca-success/90 text-white font-bold">{t("aPPROVE")}</Button>
                              <Button size="sm" type="button" variant="outline" onClick={() => handleRejectRelease(r.id)} className="font-mono text-[9px] px-2 py-1 h-7 border-ca-danger/30 hover:bg-ca-danger/10 text-ca-danger font-bold">{t("dENY")}</Button>
                            </div> : <span className="text-[10px] text-muted-foreground font-bold uppercase">{r.status}</span>}
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>}
          </GlowCard>
        </div>}

      {/* Release Selection Modal */}
      {activeReleaseRequest && <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <GlowCard className="p-6 w-full max-w-md space-y-4" glow>
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">{t("approveTranscriptRelease")}</h3>
              <button onClick={() => setActiveReleaseRequest(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">{t("selectwhichtranscriptrecord")}<strong>{activeReleaseRequest.institutionName}</strong>{t("oncereleasedtheywill")}</p>

            {transcriptsLoading ? <div className="text-center py-6 font-mono text-xs text-muted-foreground animate-pulse">{t("lOADINGREGISTEREDTRANSCRIPTS")}</div> : studentTranscripts.length === 0 ? <div className="space-y-4 text-center py-4 font-mono">
                <p className="text-xs text-ca-danger font-bold">{t("nOREGISTEREDTRANSCRIPTSDETECTED")}</p>
                <p className="text-[10px] text-muted-foreground leading-normal">{t("youdonothave")}</p>
                <Button size="sm" onClick={() => setActiveReleaseRequest(null)} className="w-full font-mono text-xs">{t("cLOSE")}</Button>
              </div> : <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase text-muted-foreground">{t("selectTranscript")}</label>
                  <select value={selectedTranscriptId} onChange={e => setSelectedTranscriptId(e.target.value)} className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-3 text-xs focus:border-ca-accent focus:outline-none">
                    {studentTranscripts.map(t => <option key={t.recordId} value={t.recordId}>{t("record")}{t.recordId.slice(0, 10)}{t("status")}{t.status})
                      </option>)}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={() => setActiveReleaseRequest(null)} variant="outline" className="w-full text-xs">{t("cANCEL")}</Button>
                  <Button onClick={handleApproveRelease} disabled={releaseLoading || !selectedTranscriptId} className="w-full bg-ca-success text-white hover:bg-ca-success/90 text-xs font-bold">
                    {releaseLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "APPROVE RELEASE"}
                  </Button>
                </div>
              </div>}
          </GlowCard>
        </div>}
    </div>;
}