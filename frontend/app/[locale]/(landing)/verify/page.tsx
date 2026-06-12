"use client";

import { useTranslations } from "next-intl";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GlowCard } from "@/components/ui/glow-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HashDisplay } from "@/components/ui/hash-display";
import { ShieldCheck, Search, FileText, Mail, Download, Key, User, Building2, HelpCircle, Lock, AlertCircle, CheckCircle, Send, Loader2, Clock } from "lucide-react";
import { generateTranscriptPDF } from "@/lib/pdf-generator";
import { formatTimestamp } from "@/lib/utils";
interface Course {
  code: string;
  name: string;
  credits: number;
  grade: string;
}
function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenInput, setTokenInput] = useState("");

  // States for verification result
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [metaDetails, setMetaDetails] = useState<any>(null);

  // Access Request Form
  const [reqName, setReqName] = useState("");
  const [reqOrg, setReqOrg] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Share Email Form
  const [shareEmail, setShareEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // Load from URL query parameters if present
  useEffect(() => {
    const recordId = searchParams.get("recordId");
    const studentId = searchParams.get("studentId");
    const token = searchParams.get("token");
    if (recordId || studentId) {
      const queryVal = recordId || studentId || "";
      setSearchQuery(queryVal);
      if (token) {
        setTokenInput(token);
      }
      triggerVerify(queryVal, token || "");
    }
  }, [searchParams]);
  const triggerVerify = async (query: string, token: string) => {
    if (!query) return;
    setLoading(true);
    setError("");
    setErrorCode("");
    setResult(null);
    setMetaDetails(null);
    setRequestSuccess(false);
    setShareSuccess(false);
    setSearched(true);
    try {
      const isHash = query.startsWith("0x") && query.length > 20;
      const paramName = isHash ? "recordId" : "studentId";
      let url = `${API_URL}/api/public/verify?${paramName}=${encodeURIComponent(query)}`;
      if (token) {
        url += `&token=${encodeURIComponent(token)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No matching transcript record found.");
        setErrorCode(data.code || "UNKNOWN_ERROR");
      } else {
        setResult(data);

        // If authorized, load metadata for courses & detailed grades
        if (!data.requestAccessRequired && data.transcript?.metadataCid) {
          fetchMetadata(data.transcript.metadataCid);
        }
      }
    } catch (err) {
      setError("Failed to connect to the verification node.");
      setErrorCode("NETWORK_ERROR");
    } finally {
      setLoading(false);
    }
  };
  const fetchMetadata = async (cid: string) => {
    try {
      const res = await fetch(`${API_URL}/api/ipfs/metadata/${cid}`);
      if (res.ok) {
        const data = await res.json();
        setMetaDetails(data.metadataJson);
      }
    } catch (e) {
      console.error("Failed to load metadata CID", cid, e);
    }
  };
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    // Update URL parameters
    const isHash = searchQuery.startsWith("0x") && searchQuery.length > 20;
    const queryParam = isHash ? `recordId=${searchQuery}` : `studentId=${searchQuery}`;
    const tokenParam = tokenInput ? `&token=${tokenInput}` : "";
    router.push(`/verify?${queryParam}${tokenParam}`);
    triggerVerify(searchQuery, tokenInput);
  };
  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !reqName || !reqOrg || !reqEmail) return;
    setRequesting(true);
    try {
      const res = await fetch(`${API_URL}/api/public/request-access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recordId: result.transcript.recordId,
          requesterName: reqName,
          requesterOrg: reqOrg,
          requesterEmail: reqEmail
        })
      });
      if (res.ok) {
        setRequestSuccess(true);
        setReqName("");
        setReqOrg("");
        setReqEmail("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to request access.");
      }
    } catch (err) {
      alert("Error sending request.");
    } finally {
      setRequesting(false);
    }
  };
  const handleEmailShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !metaDetails || !shareEmail) return;
    setSharing(true);
    setShareSuccess(false);
    try {
      const res = await fetch(`${API_URL}/api/public/email-transcript`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: shareEmail,
          recordId: result.transcript.recordId,
          registryAddress: result.transcript.registryAddr,
          studentName: result.student?.fullName || metaDetails.studentName,
          studentId: result.student?.studentId || metaDetails.studentId,
          gpa: metaDetails.gpa,
          major: metaDetails.major,
          gradYear: metaDetails.gradYear,
          fileHash: result.transcript.fileHash,
          universityName: result.university?.name || metaDetails.university
        })
      });
      if (res.ok) {
        setShareSuccess(true);
        setShareEmail("");
      } else {
        alert("Failed to share transcript copy via email.");
      }
    } catch (err) {
      alert("Error sharing receipt.");
    } finally {
      setSharing(false);
    }
  };
  const handleDownloadPDF = async () => {
    if (!result || !metaDetails) return;
    try {
      const verifierUrl = `${window.location.origin}/verify/${result.transcript.recordId}?registry=${result.transcript.registryAddr}`;
      const blob = await generateTranscriptPDF({
        studentName: result.student?.fullName || metaDetails.studentName,
        studentId: result.student?.studentId || metaDetails.studentId,
        degree: metaDetails.major,
        graduationDate: metaDetails.gradYear,
        courses: metaDetails.courses || [],
        gpa: parseFloat(metaDetails.gpa || "0"),
        universityName: result.university?.name || metaDetails.university,
        logoUrl: result.university?.logoUrl || metaDetails.logoUrl,
        stampUrl: result.university?.stampUrl,
        recordId: result.transcript.recordId,
        verifierUrl
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result.student?.studentId || metaDetails.studentId}_verified_transcript.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF.");
    }
  };
  return <div className="flex min-h-screen flex-col items-center bg-background text-foreground p-6 relative overflow-hidden">
      {/* Backdrop decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(108,91,240,0.07),transparent_40%)] pointer-events-none" />
      
      <div className="w-full max-w-3xl space-y-8 relative z-10 my-10 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-ca-accent/10 flex items-center justify-center text-ca-accent mb-4 border border-ca-accent/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">{t("onChainVerificationHub")}</h1>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">{t("audittranscriptlegitimacydirectly")}</p>
        </div>

        {/* Search Panel */}
        <GlowCard className="p-6">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-8 relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t("recordID0xor")} className="w-full rounded-lg border border-border/60 bg-background/50 py-2.5 pl-10 pr-4 text-sm font-mono focus:border-ca-accent focus:outline-none" required />
              </div>
              <div className="md:col-span-4 relative">
                <Key className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input type="text" value={tokenInput} onChange={e => setTokenInput(e.target.value)} placeholder={t("bypassTokenOptional")} className="w-full rounded-lg border border-border/60 bg-background/50 py-2.5 pl-10 pr-4 text-sm font-mono focus:border-ca-accent focus:outline-none" />
              </div>
            </div>
            
            <Button type="submit" disabled={loading} className="w-full font-mono text-xs uppercase h-10 tracking-wider">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}{t("verifyAcademicRecord")}</Button>
          </form>
        </GlowCard>

        {/* Loading Spinner */}
        {loading && <div className="text-center py-12 font-mono text-xs text-muted-foreground animate-pulse flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-ca-accent animate-spin" />
            <span>{t("rESOLVINGCRYPTOGRAPHICRECORDS")}</span>
          </div>}

        {/* Error State */}
        {searched && !loading && error && <GlowCard className={`p-8 text-center space-y-3 border ${errorCode === "EXPIRED_TOKEN" ? "border-ca-warning/20 bg-ca-warning/5" : errorCode === "NOT_FOUND" ? "border-muted/20 bg-muted/5" : "border-ca-danger/20 bg-ca-danger/5"}`}>
            {errorCode === "EXPIRED_TOKEN" ? <Clock className="h-8 w-8 text-ca-warning mx-auto animate-pulse" /> : errorCode === "NOT_FOUND" ? <Search className="h-8 w-8 text-muted-foreground mx-auto" /> : <AlertCircle className="h-8 w-8 text-ca-danger mx-auto" />}
            
            <h2 className={`text-md font-mono font-bold uppercase ${errorCode === "EXPIRED_TOKEN" ? "text-ca-warning" : errorCode === "NOT_FOUND" ? "text-foreground" : "text-ca-danger"}`}>
              {errorCode === "EXPIRED_TOKEN" ? "Access Token Expired" : errorCode === "NOT_FOUND" ? "Record Not Found" : errorCode === "MISSING_PARAMS" ? "Invalid Search Query" : errorCode === "NETWORK_ERROR" ? "Network Connection Failed" : "Record Verification Failed"}
            </h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto font-mono leading-relaxed">
              {error}
            </p>
            {errorCode === "EXPIRED_TOKEN" && <p className="text-[10px] text-muted-foreground mt-2">{t("pleaseaskthestudent")}</p>}
            {errorCode === "NETWORK_ERROR" && <Button onClick={() => triggerVerify(searchQuery, tokenInput)} variant="outline" size="sm" className="mt-4 font-mono text-xs">{t("retryConnection")}</Button>}
          </GlowCard>}

        {/* Result States */}
        {searched && !loading && result && <div className="space-y-6">
            
            {/* Case A: Privacy Protected / Access Required */}
            {result.requestAccessRequired ? <GlowCard className="p-6 md:p-8 space-y-6 border border-ca-warning/20 bg-card/40" glow>
                <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                  <div className="p-2.5 bg-ca-warning/10 rounded-lg text-ca-warning">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">{t("studentProfilePrivacyProtected")}</h3>
                    <p className="text-[10px] text-muted-foreground">{t("therequestedrecordis")}</p>
                  </div>
                </div>

                {/* Minimal Public Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs bg-muted/15 p-4 rounded-lg border border-border/20">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block">{t("universityRegistry")}</span>
                    <span className="text-foreground font-semibold">{result.university?.name || "Accredited University"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground block">{t("recordStatus")}</span>
                    <span className="text-ca-success font-semibold uppercase">{result.transcript?.status || "Active"}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] uppercase text-muted-foreground block">{t("recordHashSha256")}</span>
                    <span className="text-foreground truncate block font-mono">{result.transcript?.recordId}</span>
                  </div>
                </div>

                {/* Access Request Form */}
                {requestSuccess ? <div className="p-5 rounded-lg border border-ca-success/30 bg-ca-success/5 font-mono text-xs text-center space-y-3">
                    <CheckCircle className="h-7 w-7 text-ca-success mx-auto" />
                    <p className="font-bold text-ca-success uppercase text-[11px]">{t("requestEmailedtoStudent")}</p>
                    <p className="text-muted-foreground text-[10px] leading-relaxed max-w-md mx-auto">{t("forstudentprivacyprotection")}</p>
                  </div> : <form onSubmit={handleRequestAccess} className="space-y-4 border-t border-border/20 pt-5">
                    <h4 className="text-xs font-mono font-bold uppercase text-foreground">{t("requestAccessPermission")}</h4>
                    <p className="text-[10px] text-muted-foreground leading-normal">{t("fillinyourdetails")}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input type="text" value={reqName} onChange={e => setReqName(e.target.value)} placeholder={t("yourName")} className="w-full rounded border border-border/60 bg-background/30 py-2 px-3 text-xs focus:outline-none focus:border-ca-accent font-mono" required />
                      <input type="text" value={reqOrg} onChange={e => setReqOrg(e.target.value)} placeholder={t("institutionOrg")} className="w-full rounded border border-border/60 bg-background/30 py-2 px-3 text-xs focus:outline-none focus:border-ca-accent font-mono" required />
                      <input type="email" value={reqEmail} onChange={e => setReqEmail(e.target.value)} placeholder={t("youremailorgcom")} className="w-full rounded border border-border/60 bg-background/30 py-2 px-3 text-xs focus:outline-none focus:border-ca-accent font-mono" required />
                    </div>
                    <Button type="submit" disabled={requesting} className="w-full font-mono text-xs uppercase h-9">
                      {requesting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}{t("submitRequesttoStudent")}</Button>
                  </form>}
              </GlowCard> :
        // Case B: Authorized / Granted Full View
        <div className="space-y-6">
                
                {/* Verified Header & Branding */}
                <GlowCard className="p-6 md:p-8 space-y-6" glow>
                  <div className="flex flex-col sm:flex-row items-center justify-between border-b border-border/40 pb-5 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-ca-success/15 rounded-lg text-ca-success border border-ca-success/20 animate-pulse">
                        <ShieldCheck className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-md font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">{t("onChainAuthenticityValidated")}</h3>
                        <p className="text-[10px] text-muted-foreground uppercase font-mono">{t("authorizedvia")}{result.authorizedBy || "Public Signature Verification"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2.5">
                      <Button onClick={handleDownloadPDF} size="sm" variant="outline" className="font-mono text-[10px] tracking-wider uppercase border-border/60 h-8">
                        <Download className="h-3.5 w-3.5 mr-1" />{t("pDF")}</Button>
                    </div>
                  </div>

                  {/* Student Credentials Summary */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-ca-accent">{t("verifiedAcademicProfile")}</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-muted-foreground">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">{t("studentName")}</span>
                        <span className="text-foreground font-bold text-sm">
                          {result.student?.fullName || (metaDetails ? metaDetails.studentName : "Loading...")}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">{t("studentNumberID")}</span>
                        <span className="text-foreground font-semibold">
                          {result.student?.studentId || (metaDetails ? metaDetails.studentId : "Loading...")}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">{t("degreeMajor")}</span>
                        <span className="text-foreground">
                          {metaDetails ? metaDetails.major : "Loading..."}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">{t("cumulativeGPA")}</span>
                        <span className="text-ca-success font-bold text-sm">
                          {metaDetails ? `${parseFloat(metaDetails.gpa).toFixed(2)} / 4.00` : "Loading..."}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">{t("graduationYear")}</span>
                        <span className="text-foreground">
                          {metaDetails ? metaDetails.gradYear : "Loading..."}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">{t("issuingUniversity")}</span>
                        <span className="text-foreground uppercase">
                          {result.university?.name || (metaDetails ? metaDetails.university : "Accredited University")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cryptographic Proof Details */}
                  <div className="space-y-4 border-t border-border/20 pt-6">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-ca-accent">{t("cryptographicEvidenceBlock")}</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-muted-foreground">
                      <div className="space-y-1.5 overflow-hidden">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">{t("registrySmartContract")}</span>
                        <HashDisplay hash={result.transcript?.registryAddr} chars={8} className="w-full" />
                      </div>
                      <div className="space-y-1.5 overflow-hidden">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">{t("sHA256PDFChecksum")}</span>
                        <HashDisplay hash={result.transcript?.fileHash} chars={8} className="w-full" />
                      </div>
                      <div className="space-y-1.5 overflow-hidden">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">{t("iPFSMetadataCIDv1")}</span>
                        <HashDisplay hash={result.transcript?.metadataCid} explorerUrl={`https://gateway.pinata.cloud/ipfs/${result.transcript?.metadataCid}`} chars={8} className="w-full" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-muted-foreground/60 block">{t("onChainIssuanceDate")}</span>
                        <span className="text-foreground bg-muted/20 px-2 py-1 rounded border border-border/30 block">
                          {result.transcript?.issuedAt ? isNaN(Number(result.transcript.issuedAt)) ? new Date(result.transcript.issuedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    }) : formatTimestamp(result.transcript.issuedAt) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Course Records Details */}
                  {metaDetails?.courses && <div className="space-y-4 border-t border-border/20 pt-6 font-mono">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-ca-accent">{t("academicTranscriptCourses")}</h4>
                      <div className="overflow-x-auto rounded-lg border border-border/40">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-border/60 text-[9px] uppercase text-muted-foreground tracking-wider bg-muted/25">
                              <th className="p-3 font-bold">{t("courseCode")}</th>
                              <th className="p-3 font-bold">{t("courseName")}</th>
                              <th className="p-3 font-bold">{t("credits")}</th>
                              <th className="p-3 font-bold">{t("grade")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {metaDetails.courses.map((c: Course, index: number) => <tr key={index} className="border-b border-border/20 last:border-0 hover:bg-muted/10">
                                <td className="p-3 font-bold text-foreground">{c.code}</td>
                                <td className="p-3 text-muted-foreground">{c.name}</td>
                                <td className="p-3 text-muted-foreground">{c.credits}</td>
                                <td className="p-3 font-bold text-ca-success">{c.grade}</td>
                              </tr>)}
                          </tbody>
                        </table>
                      </div>
                    </div>}

                  {/* Share Verification Copy via Email */}
                  <div className="border-t border-border/20 pt-6 space-y-3 font-mono">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Mail className="h-4.5 w-4.5 text-ca-accent" />{t("shareVerifiedTranscriptReceipt")}</h4>
                    <p className="text-[10px] text-muted-foreground">{t("emailaformalHTML")}</p>

                    {shareSuccess ? <div className="p-3 rounded border border-ca-success/30 bg-ca-success/5 text-ca-success text-xs font-mono">{t("verificationauditreceiptsuccessfully")}</div> : <form onSubmit={handleEmailShare} className="flex gap-2">
                        <input type="email" value={shareEmail} onChange={e => setShareEmail(e.target.value)} placeholder={t("recipientemailagencyorg")} className="flex-1 rounded-lg border border-border/60 bg-background/50 py-1.5 px-3 text-xs focus:outline-none focus:border-ca-accent" required />
                        <Button type="submit" size="sm" disabled={sharing} className="h-8 text-[11px] font-mono uppercase tracking-wider px-4">
                          {sharing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}{t("share")}</Button>
                      </form>}
                  </div>
                </GlowCard>
              </div>}
          </div>}
      </div>
    </div>;
}
export default function PublicVerifyPage() {
  const t = useTranslations("Common");
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ca-accent border-t-transparent" />
      </div>}>
      <VerifyPageContent />
    </Suspense>;
}