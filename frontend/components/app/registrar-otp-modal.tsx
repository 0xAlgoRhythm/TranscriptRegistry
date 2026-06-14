"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Mail, CheckCircle2 } from "lucide-react";

export function OtpApprovalModal({ 
  isOpen, 
  onClose, 
  pendingWallets, 
  onSuccess 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  pendingWallets: string[], 
  onSuccess: () => void 
}) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestOtp = async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/registrar/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to request OTP");
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/registrar/otp/verify-and-approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, targetWalletAddresses: pendingWallets })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid or expired OTP");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-card border border-border/60 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-border/40 pb-3">
          <h3 className="font-mono font-bold tracking-wider text-ca-accent text-sm uppercase">OTP Bulk Approval</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        
        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground font-mono">
            You are about to fast-track approve <span className="font-bold text-foreground">{pendingWallets.length}</span> students.
            No wallet transaction required.
          </p>

          {error && <div className="p-2 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-mono rounded">{error}</div>}

          {step === 1 ? (
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="Registrar Email Address" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded border border-border/60 bg-background py-2 px-3 text-xs font-mono focus:border-ca-accent focus:outline-none"
              />
              <Button onClick={requestOtp} disabled={loading || !email} className="w-full bg-ca-accent text-white hover:bg-ca-accent-hover font-mono text-xs h-9">
                {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-2" /> : <Mail className="h-3.5 w-3.5 mr-2" />}
                Send OTP to Email
              </Button>
            </div>
          ) : (
            <div className="space-y-3 animate-in slide-in-from-right-4">
              <input 
                type="text" 
                placeholder="6-Digit OTP" 
                value={otp} 
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                className="w-full rounded border border-border/60 bg-background py-2 px-3 text-center text-xl tracking-[0.5em] font-mono focus:border-ca-accent focus:outline-none"
              />
              <Button onClick={verifyOtp} disabled={loading || otp.length < 6} className="w-full bg-green-600 text-white hover:bg-green-700 font-mono text-xs h-9">
                {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-2" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-2" />}
                Verify & Approve All
              </Button>
              <button onClick={() => setStep(1)} className="text-[10px] text-muted-foreground w-full text-center hover:text-foreground font-mono">Change Email</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
