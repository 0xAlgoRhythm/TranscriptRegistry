"use client";

import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { type Address } from "viem";
import { useRegistryStats, useTranscript } from "@/hooks/use-transcript-registry";
import { GlowCard } from "@/components/ui/glow-card";
import { SectionLabel } from "@/components/ui/section-label";
import { AddressInput } from "@/components/ui/address-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { HashDisplay } from "@/components/ui/hash-display";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { TRANSCRIPT_STATUS, type TranscriptStatus } from "@/lib/contracts";
import { formatTimestamp, truncateAddress, cn } from "@/lib/utils";
import { ListFilter, ChevronRight, School, RefreshCw } from "lucide-react";
import Link from "next/link";
function IssuedRow({
  t,
  registryAddress
}: {
  t: any;
  registryAddress: string;
}) {
  const t = useTranslations("Common");
  const ipfsUrl = t.metadataCid ? `https://gateway.pinata.cloud/ipfs/${t.metadataCid}` : "#";
  return <div className="flex items-center justify-between p-3.5 bg-card/45 border border-border/60 rounded hover:border-ca-accent transition-all font-mono text-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">{t("record")}{t.recordId.slice(0, 10)}{t("text345")}{t.recordId.slice(-6)}</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${t.status === "Active" ? "bg-ca-success/15 text-ca-success border border-ca-success/25" : t.status === "Suspended" ? "bg-ca-warning/15 text-ca-warning border border-ca-warning/25" : "bg-ca-danger/15 text-ca-danger border border-ca-danger/25"}`}>
            {t.status || "Active"}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">{t("studentHash")}{t.studentHash.slice(0, 12)}{t("date")}{new Date(t.issuedAt || t.createdAt).toISOString().split('T')[0]}
        </p>
      </div>
      <div className="flex items-center gap-4">
        {t.metadataCid && <a href={ipfsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-ca-success hover:underline">{t("iPFSVIEWER")}</a>}
        <Link href={`/issued/${t.recordId}?registry=${registryAddress}`} className="inline-flex items-center gap-1 text-[10px] font-bold text-ca-accent hover:underline bg-ca-accent/10 px-2 py-1 rounded">{t("pREVIEWDETAILS")}<ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>;
}
export default function IssuedPage() {
  const t = useTranslations("Common");
  const {
    address
  } = useAccount();
  const [registryAddress, setRegistryAddress] = useState("");
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [transcriptsLoading, setTranscriptsLoading] = useState(false);
  const [universities, setUniversities] = useState<any[]>([]);
  const [showUniSuggestions, setShowUniSuggestions] = useState(false);

  // Fetch universities
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    fetch(`${API_URL}/api/universities`).then(res => res.json()).then(data => {
      if (Array.isArray(data)) {
        setUniversities(data);
      }
    }).catch(err => console.error("Failed to load universities:", err));
  }, []);

  // Auto-populate registry address for logged-in registrar
  useEffect(() => {
    if (address && universities.length > 0 && !registryAddress) {
      const myUni = universities.find(u => u.registrar.toLowerCase() === address.toLowerCase());
      if (myUni) {
        setRegistryAddress(myUni.contractAddr);
      }
    }
  }, [address, universities, registryAddress]);
  const {
    data: stats,
    isLoading: statsLoading,
    refetch
  } = useRegistryStats(registryAddress as Address);
  const totalCount = stats ? Number(stats[0]) : 0;
  const verificationCount = stats ? Number(stats[1]) : 0;
  useEffect(() => {
    if (registryAddress && registryAddress.length === 42 && registryAddress.startsWith("0x")) {
      const fetchTranscripts = async () => {
        setTranscriptsLoading(true);
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/transcripts/by-registry/${registryAddress}`);
          if (res.ok) {
            const data = await res.json();
            setTranscripts(data);
          }
        } catch (e) {
          console.error("Failed to fetch transcripts:", e);
        } finally {
          setTranscriptsLoading(false);
        }
      };
      fetchTranscripts();
    } else {
      setTranscripts([]);
    }
  }, [registryAddress]);
  return <div className="mx-auto max-w-5xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="space-y-1">
        <SectionLabel index={1} label="REGISTRAR DATABASE" />
        <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">{t("issuedCredentials")}</h1>
        <p className="text-xs text-muted-foreground">{t("viewandauditall")}</p>
      </div>

      {/* Registry Address Input Dropdown */}
      <GlowCard className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">{t("universityRegistryContract")}</h3>
          {registryAddress && <button onClick={() => refetch()} className="text-[10px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />{t("rEFRESH")}</button>}
        </div>
        
        <div className="relative">
          <button type="button" onClick={() => setShowUniSuggestions(!showUniSuggestions)} className="w-full rounded-lg border border-border/60 bg-card py-3 px-4 text-xs font-mono text-left flex justify-between items-center hover:border-ca-accent transition-colors focus:outline-none">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 truncate">
              {registryAddress ? <>
                  <span className="font-bold text-foreground">
                    {universities.find(u => u.contractAddr.toLowerCase() === registryAddress.toLowerCase())?.name || "Custom Registry"}
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-muted/40 px-2 py-0.5 rounded sm:ml-2">
                    {registryAddress.slice(0, 10)}{t("text352")}{registryAddress.slice(-8)}
                  </span>
                </> : <span className="text-muted-foreground">{t("selectfromregistereduniversities")}</span>}
            </div>
            <span className="text-muted-foreground text-[10px] ml-2">▼</span>
          </button>

          {showUniSuggestions && <div className="absolute z-50 w-full mt-1.5 max-h-60 overflow-y-auto rounded-lg border border-border/60 bg-card p-1 shadow-lg font-mono text-xs">
              {universities.filter(u => address && u.registrar.toLowerCase() === address.toLowerCase()).map(u => {
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
                        <span className="text-foreground">{u.contractAddr.slice(0, 14)}{t("text353")}{u.contractAddr.slice(-12)}</span>
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
              {(!address || universities.filter(u => address && u.registrar.toLowerCase() === address.toLowerCase()).length === 0) && <div className="p-2 border-t border-border/20 mt-1 bg-card">
                  <label className="text-[9px] text-muted-foreground uppercase block mb-1">{t("orentercustomcontract")}</label>
                  <input type="text" value={registryAddress} onChange={e => setRegistryAddress(e.target.value)} placeholder={t("0x")} className="w-full rounded border border-border/60 bg-background py-1.5 px-3 text-xs font-mono focus:border-ca-accent focus:outline-none" onMouseDown={e => e.stopPropagation()} />
                </div>}
            </div>}
        </div>
      </GlowCard>

      {/* Main Database Table */}
      <div className="space-y-4">
        <SectionLabel index={2} label="RECORD ENTRY REGISTRY" />

        {!registryAddress ? <EmptyState title="Registry Required" description="Enter the university transcript registry smart contract address to load the database list." icon={<School className="h-8 w-8 text-muted-foreground/50" />} /> : statsLoading || transcriptsLoading ? <div className="py-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ca-accent border-t-transparent" />
          </div> : <GlowCard className="p-4 overflow-hidden">
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
                <div className="p-3.5 bg-muted/20 border border-border/30 rounded">
                  <span className="text-[10px] text-muted-foreground block uppercase">{t("totalTranscripts")}</span>
                  <span className="text-sm font-bold text-foreground">{totalCount}</span>
                </div>
                <div className="p-3.5 bg-muted/20 border border-border/30 rounded">
                  <span className="text-[10px] text-muted-foreground block uppercase">{t("verifications")}</span>
                  <span className="text-sm font-bold text-foreground">{verificationCount}</span>
                </div>
              </div>

              {transcripts.length === 0 ? <div className="text-center py-8 text-xs text-muted-foreground font-mono">{t("nOTRANSCRIPTSREGISTEREDYET")}</div> : <div className="border border-border/40 rounded-lg p-4 bg-muted/10 font-mono text-xs space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-border/30">
                    <span className="font-bold">{t("tRANSCRIPTINDEXRECORD")}</span>
                    <span className="text-muted-foreground">({transcripts.length}{t("items")}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{t("noteToinspector")}</p>
                  
                  <div className="space-y-2 pt-4">
                    {transcripts.map(t => <IssuedRow key={t.recordId} t={t} registryAddress={registryAddress} />)}
                  </div>
                </div>}
            </div>
          </GlowCard>}
      </div>
    </div>;
}