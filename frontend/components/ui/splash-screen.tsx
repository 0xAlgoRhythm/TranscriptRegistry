"use client"

import { useState, useEffect } from "react"

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"loading" | "reveal" | "done">("loading")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        // Accelerating curve
        const increment = prev < 60 ? 3 : prev < 85 ? 2 : 1
        return Math.min(prev + increment, 100)
      })
    }, 30)

    // Transition to reveal phase
    const revealTimer = setTimeout(() => setPhase("reveal"), 1600)
    // Remove splash
    const doneTimer = setTimeout(() => setPhase("done"), 2200)

    return () => {
      clearInterval(interval)
      clearTimeout(revealTimer)
      clearTimeout(doneTimer)
    }
  }, [])

  if (phase === "done") return <>{children}</>

  return (
    <>
      {/* Splash overlay */}
      <div
        className={`splash-overlay ${phase === "reveal" ? "splash-exit" : ""}`}
        aria-hidden="true"
      >
        {/* Animated grid background */}
        <div className="splash-grid" />

        {/* Scan lines */}
        <div className="splash-scanlines" />

        {/* Glowing orbs */}
        <div className="splash-orb splash-orb-1" />
        <div className="splash-orb splash-orb-2" />
        <div className="splash-orb splash-orb-3" />

        {/* Center content */}
        <div className="splash-center">
          {/* Logo hex */}
          <div className="splash-hex-wrapper">
            <div className="splash-hex">
              <span className="splash-hex-icon">⬡</span>
            </div>
            <div className="splash-hex-ring" />
            <div className="splash-hex-ring splash-hex-ring-2" />
          </div>

          {/* Brand text */}
          <div className="splash-brand">
            <h1 className="splash-title">
              <span className="splash-title-cred">CRED</span>
              <span className="splash-title-axis">AXIS</span>
            </h1>
            <p className="splash-subtitle">
              <span className="splash-type-char">O</span>
              <span className="splash-type-char" style={{ animationDelay: "0.05s" }}>N</span>
              <span className="splash-type-char" style={{ animationDelay: "0.1s" }}>-</span>
              <span className="splash-type-char" style={{ animationDelay: "0.15s" }}>C</span>
              <span className="splash-type-char" style={{ animationDelay: "0.2s" }}>H</span>
              <span className="splash-type-char" style={{ animationDelay: "0.25s" }}>A</span>
              <span className="splash-type-char" style={{ animationDelay: "0.3s" }}>I</span>
              <span className="splash-type-char" style={{ animationDelay: "0.35s" }}>N</span>
              <span className="splash-type-char" style={{ animationDelay: "0.4s" }}>&nbsp;</span>
              <span className="splash-type-char" style={{ animationDelay: "0.45s" }}>C</span>
              <span className="splash-type-char" style={{ animationDelay: "0.5s" }}>R</span>
              <span className="splash-type-char" style={{ animationDelay: "0.55s" }}>E</span>
              <span className="splash-type-char" style={{ animationDelay: "0.6s" }}>D</span>
              <span className="splash-type-char" style={{ animationDelay: "0.65s" }}>E</span>
              <span className="splash-type-char" style={{ animationDelay: "0.7s" }}>N</span>
              <span className="splash-type-char" style={{ animationDelay: "0.75s" }}>T</span>
              <span className="splash-type-char" style={{ animationDelay: "0.8s" }}>I</span>
              <span className="splash-type-char" style={{ animationDelay: "0.85s" }}>A</span>
              <span className="splash-type-char" style={{ animationDelay: "0.9s" }}>L</span>
              <span className="splash-type-char" style={{ animationDelay: "0.95s" }}>S</span>
            </p>
          </div>

          {/* Progress bar */}
          <div className="splash-progress-track">
            <div
              className="splash-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Status line */}
          <div className="splash-status">
            <span className="splash-status-dot" />
            <span>
              {progress < 30
                ? "Initializing secure protocol..."
                : progress < 60
                ? "Connecting to Base L2..."
                : progress < 85
                ? "Verifying smart contracts..."
                : progress < 100
                ? "Loading credential engine..."
                : "System ready"}
            </span>
          </div>
        </div>

        {/* Bottom data stream */}
        <div className="splash-data-stream">
          <span>SYS::CREDAXIS_v2.0</span>
          <span>NET::BASE_SEPOLIA</span>
          <span>AUTH::PRIVY_JWT</span>
          <span>IPFS::PINATA_GATEWAY</span>
        </div>
      </div>

      {/* Page content behind splash */}
      <div style={{ opacity: phase === "reveal" ? 1 : 0, transition: "opacity 0.3s" }}>
        {children}
      </div>
    </>
  )
}
