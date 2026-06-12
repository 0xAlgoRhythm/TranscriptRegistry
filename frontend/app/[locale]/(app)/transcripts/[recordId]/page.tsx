"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { type Address } from "viem";
import { useTranscript, useGrantAccess, useRevokeAccess } from "@/hooks/use-transcript-registry";
import { formatTimestamp, truncateAddress } from "@/lib/utils";
import { TRANSCRIPT_STATUS, DURATION_OPTIONS, type TranscriptStatus } from "@/lib/contracts";
import { GlowCard } from "@/components/ui/glow-card";
import { SectionLabel } from "@/components/ui/section-label";
import { AddressInput } from "@/components/ui/address-input";
import { StatusBadge } from "@/components/ui/status-badge";
import { HashDisplay } from "@/components/ui/hash-display";
import { TxPanel } from "@/components/ui/tx-panel";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft, ShieldCheck, Lock, UserCheck, ShieldAlert, Sparkles } from "lucide-react";
export default function TranscriptDetailPage() {
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

  // Access control forms
  const [verifierAddr, setVerifierAddr] = useState("");
  const [duration, setDuration] = useState("");
  const [revokeAddr, setRevokeAddr] = useState("");
  const grantAccess = useGrantAccess();
  const revokeAccess = useRevokeAccess();
  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ca-accent border-t-transparent" />
      </div>;
  }
  if (!transcript) {
    return <div className="mx-auto max-w-2xl text-center space-y-4 py-12 animate-fade-in">
        <ShieldAlert className="h-12 w-12 text-ca-danger mx-auto" />
        <h2 className="text-xl font-mono font-bold uppercase tracking-wider">{t("recordNotFound")}</h2>
        <p className="text-xs text-muted-foreground">{t("thespecifiedtranscriptrecord")}</p>
        <Button onClick={() => router.back()} variant="secondary" className="font-mono text-xs">{t("bACK")}</Button>
      </div>;
  }
  const [, metadataCID, fileHash, issuer, timestamp, status] = transcript;
  const statusStr = TRANSCRIPT_STATUS[status as TranscriptStatus];
  const handleGrant = () => {
    if (!verifierAddr || !duration) return;
    grantAccess.grant(registryAddress, recordId, verifierAddr as Address, BigInt(duration));
  };
  const handleRevoke = () => {
    if (!revokeAddr) return;
    revokeAccess.revoke(registryAddress, recordId, revokeAddr as Address);
  };
  return <div className="mx-auto max-w-4xl space-y-10 animate-fade-in pb-16">
      {/* Navigation & Header */}
      <div className="space-y-4">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider text-muted-foreground hover:text-foreground transition-all">
          <ArrowLeft className="h-4 w-4" />{t("bACKTOTRANSCRIPTS")}</button>

        <div className="space-y-1">
          <SectionLabel index={1} label="CREDENTIAL DETAILS" />
          <h1 className="text-2xl font-mono font-bold tracking-tight uppercase text-foreground">{t("transcriptHashDetail")}</h1>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
              {recordId}
            </span>
            <StatusBadge status={statusStr} />
          </div>
        </div>
      </div>

      {/* Main Stats and Attributes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Attributes */}
        <div className="md:col-span-2 space-y-6">
          <GlowCard className="p-6 md:p-8 space-y-6" glow>
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="p-2.5 bg-ca-accent/10 rounded-lg text-ca-accent">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">{t("cryptographicRecordProperties")}</h3>
                <p className="text-[10px] text-muted-foreground">{t("verificationdetailsfetcheddirectly")}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">{t("accreditedRegistrar")}</span>
                <HashDisplay hash={issuer} />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">{t("registrySmartContract")}</span>
                <HashDisplay hash={registryAddress} />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">{t("iPFSStorageJSONPayload")}</span>
                <span className="text-foreground bg-muted/20 px-2 py-1 rounded border border-border/30 inline-block w-full truncate">
                  {metadataCID}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">{t("documentSHA256Fingerprint")}</span>
                <HashDisplay hash={fileHash} chars={8} />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">{t("registrationBlockTimestamp")}</span>
                <span className="text-foreground bg-muted/20 px-2 py-1 rounded border border-border/30 inline-block w-full">
                  {formatTimestamp(timestamp)}
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">{t("verificationAuthorityStatus")}</span>
                <span className="text-foreground bg-muted/20 px-2 py-1 rounded border border-border/30 inline-block w-full uppercase">
                  {statusStr}
                </span>
              </div>
            </div>
          </GlowCard>
        </div>

        {/* Info Column */}
        <div className="md:col-span-1 space-y-6">
          <SectionLabel index={2} label="RECORD INSIGHT" />
          <GlowCard className="p-5 bg-card/25">
            <div className="space-y-4 text-xs">
              <div className="flex gap-2">
                <ShieldCheck className="h-5 w-5 text-ca-success shrink-0" />
                <p className="text-muted-foreground leading-relaxed">{t("thistranscripthasbeen")}</p>
              </div>

              <div className="flex gap-2">
                <Lock className="h-5 w-5 text-ca-accent shrink-0" />
                <p className="text-muted-foreground leading-relaxed">{t("onlythestudentidentity")}</p>
              </div>
            </div>
          </GlowCard>
        </div>
      </div>

      {/* Access Control Delegation */}
      <div className="space-y-4">
        <SectionLabel index={3} label="ACCESS DELEGATION HUB" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Grant Card */}
          <GlowCard className="p-6 space-y-5">
            <div className="space-y-1">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">{t("authorizeVerifierAccess")}</h4>
              <p className="text-[10px] text-muted-foreground">{t("grantpermissiontoan")}</p>
            </div>

            <div className="space-y-4">
              <AddressInput label="Verifier Address" value={verifierAddr} onChange={setVerifierAddr} placeholder={t("0x")} />
              
              <div className="space-y-1.5">
                <label className="text-xs font-mono tracking-wider text-muted-foreground uppercase">{t("accessExpiryPeriod")}</label>
                <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full rounded-lg border border-border/60 bg-card py-2.5 px-4 text-sm focus:border-ca-accent focus:outline-none">
                  <option value="">{t("selectDuration")}</option>
                  {DURATION_OPTIONS.map(opt => <option key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </option>)}
                </select>
              </div>

              <Button onClick={handleGrant} disabled={grantAccess.isPending || grantAccess.isConfirming} className="w-full bg-ca-accent text-white hover:bg-ca-accent-hover font-mono tracking-wider text-xs py-3.5 flex items-center justify-center gap-1.5">
                <UserCheck className="h-4 w-4" />{t("aUTHORIZEDELEGATE")}</Button>

              <TxPanel status={grantAccess.isPending ? "signing" : grantAccess.isConfirming ? "pending" : grantAccess.isSuccess ? "success" : grantAccess.error ? "error" : "idle"} hash={grantAccess.hash} error={grantAccess.error ? grantAccess.error.message : undefined} title="Grant Access Transaction" />
            </div>
          </GlowCard>

          {/* Revoke Card */}
          <GlowCard className="p-6 space-y-5">
            <div className="space-y-1">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">{t("revokeVerifierAccess")}</h4>
              <p className="text-[10px] text-muted-foreground">{t("immediatelyterminateverificationrights")}</p>
            </div>

            <div className="space-y-4">
              <AddressInput label="Revoke Target Address" value={revokeAddr} onChange={setRevokeAddr} placeholder={t("0x")} />

              <Button onClick={handleRevoke} disabled={revokeAccess.isPending || revokeAccess.isConfirming} className="w-full bg-ca-danger/15 text-ca-danger hover:bg-ca-danger/25 border border-ca-danger/30 font-mono text-xs py-3.5 flex items-center justify-center gap-1.5">
                <ShieldAlert className="h-4 w-4" />{t("rEVOKEACCESSIMMEDIATELY")}</Button>

              <TxPanel status={revokeAccess.isPending ? "signing" : revokeAccess.isConfirming ? "pending" : revokeAccess.isSuccess ? "success" : revokeAccess.error ? "error" : "idle"} hash={revokeAccess.hash} error={revokeAccess.error ? revokeAccess.error.message : undefined} title="Revoke Access Transaction" />
            </div>
          </GlowCard>
        </div>
      </div>
    </div>;
}