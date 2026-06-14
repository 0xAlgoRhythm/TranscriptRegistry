"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, Copy, Check } from "lucide-react";

export function CohortCodeModal({ 
  isOpen, 
  onClose, 
  registrarAddress 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  registrarAddress: string 
}) {
  const [cohortName, setCohortName] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);

  const generateCode = async () => {
    if (!cohortName || !registrarAddress) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/cohort-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          registrarAddress, 
          cohortName, 
          maxUses: maxUses ? parseInt(maxUses) : null 
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate code");
      }
      const data = await res.json();
      setGeneratedCode(data.code.code);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setCohortName("");
    setMaxUses("");
    setGeneratedCode("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-card border border-border/60 rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-border/40 pb-3">
          <h3 className="font-mono font-bold tracking-wider text-ca-accent text-sm uppercase">Generate Invite Code</h3>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        
        <div className="space-y-4 pt-2">
          {!generatedCode ? (
            <>
              <p className="text-xs text-muted-foreground font-mono">
                Generate a unique signup code for a cohort of students. Students using this code will be auto-whitelisted.
              </p>

              {error && <div className="p-2 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-mono rounded">{error}</div>}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase">Cohort / Level Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Class of 2026 - Computer Science" 
                    value={cohortName} 
                    onChange={e => setCohortName(e.target.value)}
                    className="w-full rounded border border-border/60 bg-background py-2 px-3 text-xs font-mono focus:border-ca-accent focus:outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase">Max Uses (Optional)</label>
                  <input 
                    type="number" 
                    placeholder="Unlimited" 
                    value={maxUses} 
                    onChange={e => setMaxUses(e.target.value)}
                    min="1"
                    className="w-full rounded border border-border/60 bg-background py-2 px-3 text-xs font-mono focus:border-ca-accent focus:outline-none"
                  />
                </div>

                <Button onClick={generateCode} disabled={loading || !cohortName} className="w-full bg-ca-accent text-white hover:bg-ca-accent-hover font-mono text-xs h-9 mt-2">
                  {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-2" /> : <Users className="h-3.5 w-3.5 mr-2" />}
                  Generate Code
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <div className="p-4 bg-ca-accent/10 border border-ca-accent/20 rounded-lg text-center space-y-2">
                <p className="text-[10px] font-mono text-ca-accent uppercase tracking-wider">Cohort Code Generated Successfully</p>
                <div className="text-3xl font-mono font-bold tracking-widest text-foreground py-2">
                  {generatedCode}
                </div>
              </div>
              
              <Button onClick={copyToClipboard} variant="outline" className="w-full font-mono text-xs h-9 border-ca-accent/50 text-foreground hover:bg-ca-accent/10">
                {copied ? <Check className="h-3.5 w-3.5 mr-2 text-green-500" /> : <Copy className="h-3.5 w-3.5 mr-2" />}
                {copied ? "Copied to Clipboard" : "Copy Code"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
