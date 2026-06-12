"use client";

import { useTranslations } from "next-intl";
import React, { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { GlowCard } from "@/components/ui/glow-card";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { RefreshCw, User, Mail, Wallet, ShieldAlert, CheckCircle2 } from "lucide-react";
import { truncateAddress, getPrivyEmail } from "@/lib/utils";
export default function SettingsPage() {
  const t = useTranslations("Common");
  const {
    address
  } = useAccount();
  const {
    user,
    linkWallet,
    linkEmail
  } = usePrivy();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [migrateLoading, setMigrateLoading] = useState(false);
  const [message, setMessage] = useState({
    text: "",
    type: ""
  });
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const fetchProfile = async () => {
    if (!address) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/students/profile/${address.toLowerCase()}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        // Might be logged in with a different wallet that is not bound yet
        // Let's see if we can find them by email if we have user.email
        const userEmail = getPrivyEmail(user);
        if (userEmail) {
          const res2 = await fetch(`${API_URL}/api/students/search?q=${encodeURIComponent(userEmail)}`);
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2.length > 0) setProfile(data2[0]);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (address || user) {
      fetchProfile();
    }
  }, [address, user]);
  const handleMigrateWallet = async () => {
    if (!profile || !address) return;
    setMigrateLoading(true);
    setMessage({
      text: "",
      type: ""
    });
    try {
      const res = await fetch(`${API_URL}/api/students/migrate-wallet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentId: profile.studentId,
          newWalletAddress: address
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          text: "Wallet successfully migrated!",
          type: "success"
        });
        fetchProfile();
      } else {
        setMessage({
          text: data.error || "Migration failed",
          type: "error"
        });
      }
    } catch (err) {
      setMessage({
        text: "Network error during migration",
        type: "error"
      });
    } finally {
      setMigrateLoading(false);
    }
  };
  const isCurrentWalletBound = profile?.walletAddress?.toLowerCase() === address?.toLowerCase();
  return <div className="mx-auto max-w-4xl space-y-10 animate-fade-in pb-16">
      {/* Header */}
      <div className="space-y-1">
        <SectionLabel index={1} label="ACCOUNT SETTINGS" />
        <h1 className="text-3xl font-mono font-bold tracking-tight uppercase text-foreground">{t("identityWallets")}</h1>
        <p className="text-xs text-muted-foreground">{t("manageyourconnectedaccounts")}</p>
      </div>

      {loading ? <div className="h-40 rounded-xl bg-card/45 border border-border/40 animate-pulse flex items-center justify-center font-mono text-xs text-muted-foreground">{t("lOADINGPROFILE")}</div> : profile ? <div className="space-y-6">
          <GlowCard className="p-6 space-y-6">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider border-b border-border/40 pb-3">{t("universityProfile")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider flex items-center gap-1"><User className="h-3 w-3" />{t("fullName")}</span>
                <p className="font-semibold text-sm">{profile.fullName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider flex items-center gap-1"><ShieldAlert className="h-3 w-3" />{t("studentID")}</span>
                <p className="font-mono text-sm">{profile.studentId}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider flex items-center gap-1"><Mail className="h-3 w-3" />{t("registeredEmail")}</span>
                <p className="text-sm">{profile.email}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider flex items-center gap-1"><Wallet className="h-3 w-3" />{t("boundWallet")}</span>
                <p className="font-mono text-sm text-ca-accent">{profile.walletAddress || "None"}</p>
              </div>
            </div>
          </GlowCard>

          <GlowCard className="p-6 space-y-6">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider border-b border-border/40 pb-3">{t("walletMigration")}</h3>
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">{t("yourcurrentlyconnectedwallet")}<span className="font-mono text-foreground">{address ? truncateAddress(address) : "None"}</span>{t("ifthisisdifferent")}</p>
              
              {message.text && <div className={`p-3 rounded text-xs font-mono ${message.type === "success" ? "bg-ca-success/10 text-ca-success border border-ca-success/30" : "bg-ca-danger/10 text-ca-danger border border-ca-danger/30"}`}>
                  {message.text}
                </div>}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button variant="outline" onClick={linkWallet} className="font-mono text-xs">
                  <Wallet className="h-3.5 w-3.5 mr-2" />{t("linkNewWallet")}</Button>
                <Button variant="outline" onClick={linkEmail} className="font-mono text-xs">
                  <Mail className="h-3.5 w-3.5 mr-2" />{t("linkNewEmail")}</Button>
                
                {!isCurrentWalletBound && address && <Button onClick={handleMigrateWallet} disabled={migrateLoading} className="bg-ca-accent hover:bg-ca-accent/90 text-white font-mono text-xs ml-auto">
                    {migrateLoading ? <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-2" />}{t("setCurrentasPrimary")}</Button>}
              </div>
            </div>
          </GlowCard>
        </div> : <GlowCard className="p-10 text-center space-y-4">
          <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="font-mono font-bold text-lg">{t("profileNotFound")}</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">{t("wecouldntlocatea")}</p>
        </GlowCard>}
    </div>;
}