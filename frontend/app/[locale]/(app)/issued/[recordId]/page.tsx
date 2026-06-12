"use client";

import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { type Address } from "viem";
import { useTranscript, useUpdateTranscriptStatus, useUniversityName } from "@/hooks/use-transcript-registry";
import { formatTimestamp, truncateAddress } from "@/lib/utils";
import { TRANSCRIPT_STATUS, type TranscriptStatus } from "@/lib/contracts";
import { GlowCard } from "@/components/ui/glow-card";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusBadge } from "@/components/ui/status-badge";
import { HashDisplay } from "@/components/ui/hash-display";
import { TxPanel } from "@/components/ui/tx-panel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit3, ShieldAlert, Sparkles, UserX, UserCheck, Download, Loader2, FileText, Search, Printer, Eye, X } from "lucide-react";
export default function IssuedDetailPage() {
  const t = useTranslations("Common");
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const recordId = params.recordId as `0x${string}`;
  const registryAddress = searchParams.get("registry") as Address;
  const {
    data: transcript,
    isLoading
  } = useTranscript(registryAddress, recordId);
  const {
    data: contractUniName
  } = useUniversityName(registryAddress);
  const {
    updateStatus,
    hash: txHash,
    isPending,
    isConfirming,
    isSuccess,
    error
  } = useUpdateTranscriptStatus();

  // Fallback to DB API transcript lookup if contract isn't populated/fails (e.g. dev mock testing)
  const [dbTranscript, setDbTranscript] = useState<any>(null);
  const [dbLoading, setDbLoading] = useState(false);

  // Custom status reason form
  const [selectedStatus, setSelectedStatus] = useState<string>("0");
  const [updateReason, setUpdateReason] = useState<string>("");

  // IPFS metadata state
  const [metadata, setMetadata] = useState<any>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!transcript && recordId) {
      setDbLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      fetch(`${API_URL}/api/transcripts/${recordId}`).then(async res => {
        if (res.ok) {
          const data = await res.json();
          setDbTranscript({
            transcript: data
          });
        }
      }).catch(e => console.error("DB fallback verify error:", e)).finally(() => setDbLoading(false));
    }
  }, [transcript, recordId]);
  const resolvedTranscript = transcript || (dbTranscript ? [dbTranscript.transcript.recordId, dbTranscript.transcript.metadataCid, dbTranscript.transcript.fileHash, dbTranscript.transcript.issuer || dbTranscript.transcript.registryAddr, BigInt(Math.floor(new Date(dbTranscript.transcript.issuedAt || Date.now()).getTime() / 1000)), dbTranscript.transcript.status === "Active" ? 0 : dbTranscript.transcript.status === "Revoked" ? 1 : 2] : null);
  const [, metadataCID = "", fileHash = "", issuer = "", timestamp = BigInt(0), status = 0] = resolvedTranscript as any || [];
  const statusStr = resolvedTranscript ? TRANSCRIPT_STATUS[status as TranscriptStatus] : "Unknown";
  useEffect(() => {
    if (resolvedTranscript) {
      setSelectedStatus(status.toString());
    }
  }, [status]);
  useEffect(() => {
    if (metadataCID) {
      setMetadataLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      // Try Pinata gateway first
      fetch(`https://gateway.pinata.cloud/ipfs/${metadataCID}`).then(async res => {
        if (res.ok) {
          const data = await res.json();
          setMetadata(data);
        } else {
          throw new Error("Pinata gateway response not ok");
        }
      }).catch(() => {
        // Fallback to local DB-backed API
        fetch(`${API_URL}/api/ipfs/metadata/${metadataCID}`).then(async res => {
          if (res.ok) {
            const record = await res.json();
            setMetadata(record.metadataJson);
          }
        }).catch(err => console.error("Error fetching metadata:", err));
      }).finally(() => {
        setMetadataLoading(false);
      });
    }
  }, [metadataCID]);
  if (isLoading || dbLoading) {
    return <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ca-accent border-t-transparent" />
      </div>;
  }
  if (!resolvedTranscript) {
    return <div className="mx-auto max-w-2xl text-center space-y-4 py-12 animate-fade-in">
        <ShieldAlert className="h-12 w-12 text-ca-danger mx-auto" />
        <h2 className="text-xl font-mono font-bold uppercase tracking-wider">{t("recordNotFound")}</h2>
        <p className="text-xs text-muted-foreground">{t("thespecifiedtranscriptrecord")}</p>
        <Button onClick={() => router.back()} variant="secondary" className="font-mono text-xs">{t("bACK")}</Button>
      </div>;
  }
  const universityDisplayName = (metadata?.universityName || contractUniName || "University Registry") as string;
  const getUniversityLogo = (name: string) => {
    const n = (name || "").toLowerCase();
    if (n.includes("nkrumah") || n.includes("knust")) return "/knust.jpg";
    if (n.includes("cape coast") || n.includes("ucc")) return "/ucc.png";
    if (n.includes("winneba") || n.includes("uew") || n.includes("education")) return "/uew.png";
    return "";
  };
  const logoPath = getUniversityLogo(universityDisplayName);
  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStatus = parseInt(selectedStatus);
    updateStatus(registryAddress, recordId, targetStatus, updateReason || `Status updated to ${TRANSCRIPT_STATUS[targetStatus as TranscriptStatus]}`);
  };
  const handleGeneratePreview = async () => {
    if (!metadata) return;
    setIsGeneratingPdf(true);
    try {
      const {
        generateTranscriptPDF
      } = await import("@/lib/pdf-generator");
      const blob = await generateTranscriptPDF({
        studentName: metadata.studentName || "Unknown",
        studentId: metadata.studentId || "Unknown",
        degree: metadata.major || "Unknown Degree",
        graduationDate: metadata.gradYear || "Unknown Year",
        courses: metadata.courses || [],
        gpa: parseFloat(metadata.gpa || "0"),
        universityName: universityDisplayName,
        logoUrl: logoPath ? `${window.location.origin}${logoPath}` : "",
        stampUrl: "",
        recordId: recordId,
        verifierUrl: `${window.location.origin}/verify/${recordId}?registry=${registryAddress}`,
        level: metadata.level || "Undergraduate"
      });
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  const handlePrintTranscript = () => {
    if (!pdfPreviewUrl) return;
    const a = document.createElement("a");
    a.href = pdfPreviewUrl;
    a.download = `${metadata?.studentId || 'transcript'}_verified.pdf`;
    a.click();
  };
  return <div className="mx-auto max-w-4xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="space-y-4">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider text-muted-foreground hover:text-foreground transition-all">
          <ArrowLeft className="h-4 w-4" />{t("bACKTODATABASE")}</button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <SectionLabel index={1} label="REGISTRAR MANAGEMENT" />
            <div className="flex items-center gap-3">
              {logoPath && <img src={logoPath} className="h-9 w-9 object-contain rounded-full border border-border bg-white p-0.5" alt="Logo" />}
              <h1 className="text-2xl font-mono font-bold tracking-tight uppercase text-foreground">{t("manageIssuedRecord")}</h1>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <span className="font-mono text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                {recordId.slice(0, 10)}{t("text365")}{recordId.slice(-6)}
              </span>
              <StatusBadge status={statusStr} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => router.push("/verify")} variant="outline" className="font-mono text-[10px] tracking-wider uppercase h-8 border-border/60">
              <Search className="h-3.5 w-3.5 mr-1.5" />{t("vERIFIERPORTAL")}</Button>
            
            <Button className="font-mono text-[10px] h-8 bg-ca-accent text-white hover:bg-ca-accent-hover flex items-center gap-2 transition-all" onClick={handleGeneratePreview} disabled={isGeneratingPdf || !metadata}>
              {isGeneratingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}{t("pREVIEWPDF")}</Button>
          </div>
        </div>
      </div>

      {/* Record details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <GlowCard className="p-6 md:p-8 space-y-6" glow>
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="p-2.5 bg-ca-accent/10 rounded-lg text-ca-accent">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">{t("recordMetadataSpecifications")}</h3>
                <p className="text-[10px] text-muted-foreground">{t("dynamicIPFSOnChainspecifications")}</p>
              </div>
            </div>

            {/* Dynamic IPFS Data Panel */}
            <div className="border border-border/40 rounded-lg p-4 bg-muted/10 font-mono text-xs space-y-3">
              <div className="font-bold border-b border-border/30 pb-1.5 uppercase text-ca-accent flex items-center justify-between">
                <span>{t("studentAcademicDossier")}</span>
                {metadataLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              </div>
              {metadata ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block">{t("fullName")}</span>
                    <span className="text-foreground font-bold">{metadata.studentName}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block">{t("studentIDEmail")}</span>
                    <span className="text-foreground font-bold">{metadata.studentId}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block">{t("cumulativeGPA")}</span>
                    <span className="text-foreground font-bold">{metadata.gpa || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block">{t("programMajor")}</span>
                    <span className="text-foreground font-bold">{metadata.major}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block">{t("graduationYear")}</span>
                    <span className="text-foreground font-bold">{metadata.gradYear}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground uppercase block">{t("institutionName")}</span>
                    <span className="text-foreground font-bold">{universityDisplayName}</span>
                  </div>
                </div> : <p className="text-[10px] text-muted-foreground">
                  {metadataLoading ? "Loading dossier from IPFS..." : "No additional metadata loaded from IPFS."}
                </p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">{t("registrarIdentity")}</span>
                <HashDisplay hash={issuer} />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">{t("registryContractAddress")}</span>
                <HashDisplay hash={registryAddress} />
              </div>

              <div className="space-y-1.5 overflow-hidden">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">{t("iPFSMetadataAddress")}</span>
                <HashDisplay hash={metadataCID} explorerUrl={`https://gateway.pinata.cloud/ipfs/${metadataCID}`} chars={8} className="w-full" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">{t("pDFSignatureSHA256")}</span>
                <HashDisplay hash={fileHash} chars={8} />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">{t("issuedTime")}</span>
                <span className="text-foreground bg-muted/20 px-2 py-1 rounded border border-border/30 inline-block w-full">
                  {formatTimestamp(timestamp)}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">{t("currentStatus")}</span>
                <span className="text-foreground bg-muted/20 px-2 py-1 rounded border border-border/30 inline-block w-full uppercase">
                  {statusStr}
                </span>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Status Actions Form */}
        <div className="md:col-span-1 space-y-6">
          <SectionLabel index={2} label="GOVERNANCE OPTIONS" />
          <GlowCard className="p-6 space-y-5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">{t("modifyRecordStatus")}</h4>
            <p className="text-[10px] text-muted-foreground">{t("astheauthorizedregistrar")}</p>

            <form onSubmit={handleUpdateStatus} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">{t("targetStatus")}</label>
                <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="w-full rounded-lg border border-border/60 bg-card py-2 px-3 text-xs font-mono text-foreground focus:border-ca-accent focus:outline-none">
                  <option value="0">{t("active")}</option>
                  <option value="1">{t("revoked")}</option>
                  <option value="2">{t("suspended")}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">{t("reasonforUpdate")}</label>
                <textarea value={updateReason} onChange={e => setUpdateReason(e.target.value)} placeholder={t("providereasonforaudit")} required rows={3} className="w-full resize-none rounded-lg border border-border/60 bg-card p-3 text-xs font-mono text-foreground focus:border-ca-accent focus:outline-none" />
              </div>

              <Button type="submit" disabled={isPending || isConfirming || selectedStatus === status.toString()} className="w-full bg-ca-accent text-white hover:bg-ca-accent-hover font-mono text-xs py-3 flex items-center justify-center gap-1.5">
                {isPending ? "CONFIRMING IN WALLET..." : isConfirming ? "MINING STATUS UPDATE..." : <>
                    <Edit3 className="h-4 w-4" />{t("uPDATESTATUSONCHAIN")}</>}
              </Button>
            </form>

            <TxPanel status={isPending ? "signing" : isConfirming ? "pending" : isSuccess ? "success" : error ? "error" : "idle"} hash={txHash} error={error ? error.message : undefined} title="Update Record Status Transaction" />
          </GlowCard>
        </div>
      </div>

      {/* PDF Preview Modal Overlay */}
      {pdfPreviewUrl && <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-8 animate-fade-in">
          <div className="w-full max-w-4xl h-full flex flex-col bg-card border border-border/40 rounded-xl overflow-hidden shadow-2xl relative animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/20">
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">{t("finalTranscriptPreview")}</h2>
              <div className="flex items-center gap-3">
                <Button onClick={handlePrintTranscript} size="sm" className="font-mono text-[10px] tracking-wider uppercase h-8 bg-ca-accent text-white hover:bg-ca-accent-hover">
                  <Download className="h-3.5 w-3.5 mr-1.5" />{t("dOWNLOADPDF")}</Button>
                <button onClick={() => setPdfPreviewUrl(null)} className="p-1 hover:bg-muted/50 rounded transition-colors text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-muted/10 relative p-4 overflow-hidden">
              <iframe src={`${pdfPreviewUrl}#toolbar=0&navpanes=0`} className="w-full h-full rounded border border-border/30 bg-white" />
            </div>
          </div>
        </div>}
    </div>;
}