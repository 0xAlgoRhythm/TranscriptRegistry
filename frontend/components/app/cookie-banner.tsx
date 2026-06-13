"use client"

import { useState, useEffect } from "react"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Cookie, X } from "lucide-react"

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if consent has already been given
    const consent = localStorage.getItem("credaxis-cookie-consent")
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem("credaxis-cookie-consent", "accepted")
    setIsVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem("credaxis-cookie-consent", "declined")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 md:p-8 animate-in slide-in-from-bottom-full duration-500 ease-out pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto">
        <div className="bg-card/95 backdrop-blur-md border border-border/50 shadow-2xl rounded-2xl p-6 sm:p-8 relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-ca-accent/20 to-ca-accent-hover/20 blur-xl opacity-50 z-0"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-ca-accent" />
                <h3 className="font-mono font-bold text-sm tracking-wider uppercase">Cookies & Legal Compliance</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to enhance your experience, ensure security, and analyze our traffic. 
                By clicking "Accept All", you agree to our use of cookies as described in our{" "}
                <Link href="/privacy" className="text-ca-accent hover:underline focus-visible:underline focus-visible:outline-none">Privacy Policy</Link>
                {" "}and you agree to our{" "}
                <Link href="/terms" className="text-ca-accent hover:underline focus-visible:underline focus-visible:outline-none">Terms of Service</Link>.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 shrink-0">
              <Button 
                variant="outline" 
                onClick={handleDecline}
                className="font-mono text-xs w-full sm:w-auto"
              >
                Decline Essential Only
              </Button>
              <Button 
                onClick={handleAccept}
                className="font-mono text-xs bg-ca-accent hover:bg-ca-accent-hover text-white w-full sm:w-auto"
              >
                Accept All
              </Button>
            </div>
            
            <button 
              onClick={handleDecline}
              className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
