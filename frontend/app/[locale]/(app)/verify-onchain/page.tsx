"use client";

import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { type Address, keccak256, encodePacked, isAddress } from "viem";
import { useAccount } from "wagmi";
import { useTranscript, useCheckAccess, useVerifyTranscript } from "@/hooks/use-transcript-registry";
import { useFileHash } from "@/hooks/use-file-hash";
import { formatTimestamp, truncateAddress, cn } from "@/lib/utils";
import { TRANSCRIPT_STATUS, type TranscriptStatus } from "@/lib/contracts";
import { GlowCard } from "@/components/ui/glow-card";
import { SectionLabel } from "@/components/ui/section-label";
import { AddressInput } from "@/components/ui/address-input";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { StatusBadge } from "@/components/ui/status-badge";
import { HashDisplay } from "@/components/ui/hash-display";
import { TxPanel } from "@/components/ui/tx-panel";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Search, FileText, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";
export default function VerifyPage() {
  const t = useTranslations("Common");
  const {
    address
  } = useAccount();
  const [registryAddress, setRegistryAddress] = useState("");
  const [recordId, setRecordId] = useState("");
  const [looked, setLooked] = useState(false);

  // File hash calculator
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const {
    hash: calculatedFileHash,
    isCalculating,
    calculateHash,
    reset: resetHash
  } = useFileHash();
  const [universities, setUniversities] = useState<any[]>([]);
  const [showUniSuggestions, setShowUniSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [studentSuggestions, setStudentSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [studentTranscripts, setStudentTranscripts] = useState<any[]>([]);
  const [transcriptsLoading, setTranscriptsLoading] = useState(false);
  const [verifyMode, setVerifyMode] = useState<"single" | "batch">("single");
  const [batchInput, setBatchInput] = useState("");
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [isBatchVerifying, setIsBatchVerifying] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Fetch universities for suggestions dropdown
  useEffect(() => {
    fetch(`${API_URL}/api/universities`).then(res => res.json()).then(data => {
      if (Array.isArray(data)) {
        setUniversities(data);
      }
    }).catch(err => console.error("Failed to load universities:", err));
  }, [API_URL]);

  // Debounce inputValue to searchQuery to avoid blocking UI (INP optimization)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 200);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Search students when searchQuery changes
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const match = searchQuery.match(/\(([^)]+)\)$/);
      if (match) {
        setSearchLoading(false);
        return;
      }
      setSearchLoading(true);
      fetch(`${API_URL}/api/students/search?q=${encodeURIComponent(searchQuery)}`).then(res => res.json()).then(data => {
        if (Array.isArray(data)) {
          setStudentSuggestions(data);
        }
      }).catch(err => console.error("Error searching students:", err)).finally(() => setSearchLoading(false));
    } else {
      setStudentSuggestions([]);
      setSearchLoading(false);
    }
  }, [searchQuery, API_URL]);
  const {
    data: transcript,
    isLoading: transcriptLoading
  } = useTranscript(registryAddress as Address, recordId as `0x${string}`);
  const {
    data: hasAccess
  } = useCheckAccess(registryAddress as Address, recordId as `0x${string}`, address ?? "0x0000000000000000000000000000000000000000" as Address);
  const {
    verify,
    hash: txHash,
    isPending,
    isConfirming,
    isSuccess,
    error
  } = useVerifyTranscript();
  useEffect(() => {
    if (selectedFile) {
      calculateHash(selectedFile);
    } else {
      resetHash();
    }
  }, [selectedFile]);
  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (registryAddress && recordId) {
      setLooked(true);
    }
  };
  const handleVerify = () => {
    if (!registryAddress || !recordId || !calculatedFileHash) return;
    verify(registryAddress as Address, recordId as `0x${string}`, calculatedFileHash);
  };
  const handleBatchVerify = async () => {
    if (!batchInput.trim()) return;
    setIsBatchVerifying(true);
    setBatchResults([]);
    const ids = batchInput.split("\n").map(id => id.trim()).filter(id => id.length === 66 && id.startsWith("0x"));
    
    const BATCH_SIZE = 20;
    let allResults: any[] = [];
    
    try {
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const chunk = ids.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(chunk.map(async id => {
          try {
            const res = await fetch(`${API_URL}/api/transcripts/${id}`);
            if (!res.ok) throw new Error("Not found");
            const data = await res.json();
            return {
              id,
              status: data.status,
              valid: data.status === "Active"
            };
          } catch (e) {
            return { id, status: "Unknown / Invalid", valid: false };
          }
        }));
        
        allResults = [...allResults, ...results];
        setBatchResults([...allResults]);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBatchVerifying(false);
    }
  };
  return <div className="mx-auto max-w-4xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <SectionLabel index={1} label="CREDENTIAL AUDIT" />
          <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">{t("cryptographicVerification")}</h1>
          <p className="text-xs text-muted-foreground">{t("verifytheauthenticityof")}</p>
        </div>

        <div className="flex bg-card/50 p-1 rounded-lg border border-border/40 backdrop-blur-sm self-start">
          <button onClick={() => setVerifyMode("single")} className={`px-4 py-2 text-xs font-mono rounded-md transition-colors ${verifyMode === "single" ? "bg-ca-accent text-white" : "text-muted-foreground hover:text-foreground"}`}>{t("sINGLERECORD")}</button>
          <button onClick={() => setVerifyMode("batch")} className={`px-4 py-2 text-xs font-mono rounded-md transition-colors ${verifyMode === "batch" ? "bg-ca-accent text-white" : "text-muted-foreground hover:text-foreground"}`}>{t("bATCHLOOKUP")}</button>
        </div>
      </div>

      {/* Main Form/Grid */}
      {verifyMode === "single" ? <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Lookup card */}
        <div className="md:col-span-2 space-y-6">
          <GlowCard className="p-6 md:p-8 space-y-5" glow>
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="p-2 bg-ca-accent/10 rounded-lg text-ca-accent">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">{t("lookupCredentialRecord")}</h3>
                <p className="text-[10px] text-muted-foreground">{t("fetchrecordinformationfrom")}</p>
              </div>
            </div>

            <form onSubmit={handleLookup} className="space-y-4">
              {/* Student Search Box */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase flex items-center justify-between">
                  <span>{t("searchStudentNameor")}</span>
                  {searchLoading && <span className="text-[10px] text-ca-accent animate-pulse">{t("searching")}</span>}
                </label>
                <div className="relative">
                  <input type="text" value={inputValue} onChange={e => {
                  setInputValue(e.target.value);
                  setShowSuggestions(true);
                }} onFocus={() => setShowSuggestions(true)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} placeholder={t("searchbystudentname")} className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-xs font-mono focus:border-ca-accent focus:outline-none" />
                  {showSuggestions && studentSuggestions.length > 0 && <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-border/60 bg-card p-1 shadow-lg font-mono text-xs">
                      {studentSuggestions.map(s => <button key={s.id} type="button" onMouseDown={async () => {
                    const selectedName = `${s.fullName} (${s.studentId})`;
                    setInputValue(selectedName);
                    setSearchQuery(selectedName);
                    setShowSuggestions(false);

                    // Automatically find and set registry address for this student's university
                    const uni = universities.find(u => u.universityId === s.universityId);
                    if (uni) {
                      setRegistryAddress(uni.contractAddr);
                    }

                    // Automatically lookup the transcript record ID for this student
                    if (s.walletAddress) {
                      const hashVal = keccak256(encodePacked(["address"], [s.walletAddress as Address]));
                      try {
                        const res = await fetch(`${API_URL}/api/transcripts/by-student/${hashVal}`);
                        if (res.ok) {
                          const txList = await res.json();
                          if (Array.isArray(txList)) {
                            setStudentTranscripts(txList);
                            if (txList.length > 0) {
                              setRecordId(txList[0].recordId);
                              setLooked(false);
                            } else {
                              setRecordId("");
                            }
                          }
                        }
                      } catch (e) {
                        console.error("Error looking up transcript by student hash:", e);
                      }
                    } else {
                      setRecordId("");
                      setStudentTranscripts([]);
                    }
                  }} className="w-full text-left rounded px-3 py-2 hover:bg-muted/40 transition-colors flex flex-col gap-0.5">
                          <span className="font-bold text-foreground text-left">{s.fullName}</span>
                          <span className="text-[10px] text-muted-foreground text-left">{t("iD")}{s.studentId} | {s.email}</span>
                        </button>)}
                    </div>}
                </div>
              </div>

              {/* University Registry Contract Input with Suggestions */}
              <div className="space-y-1.5 relative">
                <AddressInput label="University Registry Contract" value={registryAddress} onChange={val => {
                setRegistryAddress(val);
                setLooked(false);
              }} onFocus={() => setShowUniSuggestions(true)} onBlur={() => setTimeout(() => setShowUniSuggestions(false), 200)} placeholder={t("0x")} />
                {showUniSuggestions && universities.filter(u => u.name.toLowerCase().includes(registryAddress.toLowerCase()) || u.contractAddr && u.contractAddr.toLowerCase().includes(registryAddress.toLowerCase())).length > 0 && <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-border/60 bg-card p-1 shadow-lg font-mono text-xs">
                    {universities.filter(u => u.name.toLowerCase().includes(registryAddress.toLowerCase()) || u.contractAddr && u.contractAddr.toLowerCase().includes(registryAddress.toLowerCase())).map(u => <button key={u.contractAddr} type="button" onMouseDown={() => {
                  setRegistryAddress(u.contractAddr);
                  setShowUniSuggestions(false);
                }} className="w-full text-left rounded px-3 py-2 hover:bg-muted/40 transition-colors flex flex-col gap-0.5">
                        <span className="font-bold text-foreground text-left">{u.name}</span>
                        <span className="text-[10px] text-muted-foreground text-left">{u.contractAddr}</span>
                      </button>)}
                  </div>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">{t("transcriptRecordID")}</label>
                <input type="text" value={recordId} onChange={e => {
                setRecordId(e.target.value);
                setLooked(false);
              }} placeholder={t("0x32bytehash")} className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-xs font-mono focus:border-ca-accent focus:outline-none" required />
              </div>

              {studentTranscripts.length > 0 && <div className="space-y-2 border border-border/40 rounded-lg p-3 bg-card/30 backdrop-blur-sm">
                  <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block">{t("selectStudentTranscriptto")}{studentTranscripts.length}{t("found")}</span>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {studentTranscripts.map(tr => {
                  const isSelected = recordId.toLowerCase() === tr.recordId.toLowerCase();
                  return <button key={tr.recordId} type="button" onClick={() => {
                    setRecordId(tr.recordId);
                    setLooked(false);
                  }} className={cn("w-full text-left rounded-md p-3 border text-xs font-mono transition-all flex flex-col gap-1.5", isSelected ? "bg-ca-accent/15 border-ca-accent text-foreground shadow-sm ring-1 ring-ca-accent/20" : "bg-card/50 border-border/40 text-muted-foreground hover:border-border/80 hover:bg-muted/10 hover:text-foreground")}>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground truncate max-w-[200px]">
                              {tr.universityId ? `University Record #${tr.id}` : `Record #${tr.id}`}
                            </span>
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-semibold tracking-wide uppercase", tr.status === "Active" ? "bg-green-500/15 text-green-500 border border-green-500/30" : tr.status === "Amended" ? "bg-yellow-500/15 text-yellow-500 border border-yellow-500/30" : "bg-red-500/15 text-red-500 border border-red-500/30")}>
                              {tr.status || "Active"}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
                            <div className="flex justify-between">
                              <span>{t("recordID")}</span>
                              <span className="text-foreground">{tr.recordId.slice(0, 16)}{t("text464")}{tr.recordId.slice(-14)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>{t("issued")}</span>
                              <span className="text-foreground">{tr.issuedAt ? new Date(tr.issuedAt).toLocaleString() : "Unknown"}</span>
                            </div>
                          </div>
                        </button>;
                })}
                  </div>
                </div>}

              <Button type="submit" disabled={transcriptLoading} className="w-full bg-ca-accent text-white hover:bg-ca-accent-hover font-mono tracking-wider text-xs py-3.5 flex items-center justify-center gap-1.5">
                <Search className="h-4 w-4" />{t("lOOKUPRECORDID")}</Button>
            </form>
          </GlowCard>

          {/* Verification Actions */}
          {looked && transcript && hasAccess && <GlowCard className="p-6 md:p-8 space-y-5 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                <div className="p-2 bg-ca-teal/10 rounded-lg text-ca-teal">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">{t("performIntegrityCheck")}</h3>
                  <p className="text-[10px] text-muted-foreground">{t("uploadtranscriptdocumentto")}</p>
                </div>
              </div>

              <div className="space-y-4">
                <FileDropZone onFileSelect={setSelectedFile} selectedFile={selectedFile} />

                {isCalculating && <p className="text-xs font-mono text-ca-accent animate-pulse">{t("calculatingfilecryptographicsignature")}</p>}

                {calculatedFileHash && <div className="rounded-lg border border-border/40 bg-muted/20 p-4 font-mono text-xs space-y-1.5">
                    <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">{t("computedFileHash")}</span>
                    <HashDisplay hash={calculatedFileHash} chars={12} />
                  </div>}

                <Button onClick={handleVerify} disabled={isPending || isConfirming || !calculatedFileHash} className="w-full bg-ca-success text-white hover:opacity-90 font-mono tracking-wider text-xs py-3.5 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />{t("eXECUTEONCHAINVERIFICATION")}</Button>

                <TxPanel status={isPending ? "signing" : isConfirming ? "pending" : isSuccess ? "success" : error ? "error" : "idle"} hash={txHash} error={error ? error.message : undefined} title="Verify Transcript Transaction" />
              </div>
            </GlowCard>}
        </div>

        {/* Audit Details Panel (Right side) */}
        <div className="md:col-span-1 space-y-6">
          <SectionLabel index={2} label="RECORD META STATUS" />
          
          <GlowCard className="p-6 relative flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">{t("auditRegistryDetails")}</h4>
              
              {!looked ? <p className="text-xs text-muted-foreground leading-relaxed">{t("entertargetcontractand")}</p> : transcriptLoading ? <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-ca-accent border-t-transparent" />
                </div> : !transcript ? <div className="space-y-2 text-center text-xs">
                  <AlertTriangle className="h-8 w-8 text-ca-danger mx-auto animate-bounce" />
                  <p className="font-bold text-foreground">{t("nOTFOUND")}</p>
                  <p className="text-muted-foreground text-[10px]">{t("norecordwiththe")}</p>
                </div> : <div className="space-y-4 font-mono text-xs text-muted-foreground">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">{t("verificationStatus")}</span>
                    <StatusBadge status={TRANSCRIPT_STATUS[transcript[5] as TranscriptStatus]} />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">{t("registrationTime")}</span>
                    <span className="text-foreground">{formatTimestamp(transcript[4])}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">{t("issuerRegistrar")}</span>
                    <span className="text-foreground truncate block">{truncateAddress(transcript[3])}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">{t("hashedRegistryCID")}</span>
                    <span className="text-foreground truncate block">{transcript[1]}</span>
                  </div>

                  <div className="pt-4 border-t border-border/40">
                    {hasAccess ? <div className="p-2.5 bg-ca-success/5 border border-ca-success/30 rounded text-[11px] text-ca-success flex gap-1.5">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <span>{t("verificationpermissionisACTIVE")}</span>
                      </div> : <div className="p-2.5 bg-ca-danger/5 border border-ca-danger/30 rounded text-[11px] text-ca-danger flex gap-1.5">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{t("permissionDENIEDRequestaccess")}</span>
                      </div>}
                  </div>
                </div>}
            </div>

            <div className="pt-6 border-t border-border/40 text-[10px] text-muted-foreground flex gap-1.5 items-start mt-6 font-mono">
              <HelpCircle className="h-5 w-5 shrink-0" />
              <span>{t("checkingvalidationwritesan")}</span>
            </div>
          </GlowCard>
        </div>

      </div> : <GlowCard className="p-6 md:p-8 space-y-6 animate-fade-in" glow>
          <div className="flex items-center gap-3 border-b border-border/40 pb-4">
            <div className="p-2 bg-ca-accent/10 rounded-lg text-ca-accent">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">{t("batchRecordLookup")}</h3>
              <p className="text-[10px] text-muted-foreground">{t("pastemultiple32byteRecord")}</p>
            </div>
          </div>
          <div className="space-y-4">
            <textarea className="w-full h-48 rounded-lg border border-border/60 bg-background py-3 px-4 text-xs font-mono focus:border-ca-accent focus:outline-none resize-none" placeholder={t("0xabc123oneIDper")} value={batchInput} onChange={e => setBatchInput(e.target.value)} />
            <Button onClick={handleBatchVerify} disabled={isBatchVerifying || !batchInput.trim()} className="w-full bg-ca-accent text-white hover:bg-ca-accent-hover font-mono tracking-wider text-xs py-3.5 flex items-center justify-center gap-1.5">
              {isBatchVerifying ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <><Search className="h-4 w-4" />{t("bATCHVERIFYRECORDS")}</>}
            </Button>
          </div>

          {batchResults.length > 0 && <div className="pt-6 border-t border-border/40 space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">{t("results")}</h4>
              <div className="border border-border/40 rounded-lg overflow-x-auto w-full">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-card">
                    <tr>
                      <th className="px-4 py-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t("recordID")}</th>
                      <th className="px-4 py-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t("status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 bg-background/50">
                    {batchResults.map((r, i) => <tr key={i} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3">{r.id.slice(0, 10)}{t("text487")}{r.id.slice(-8)}</td>
                        <td className="px-4 py-3">
                          {r.valid ? <span className="inline-flex items-center gap-1 text-green-500"><CheckCircle2 className="h-3 w-3" />{t("aCTIVE")}</span> : <span className="inline-flex items-center gap-1 text-red-500"><AlertTriangle className="h-3 w-3" /> {r.status}</span>}
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </div>}
        </GlowCard>}
    </div>;
}