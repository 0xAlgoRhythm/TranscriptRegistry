"use client"

import "./docs.css"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { DocsNav } from "@/components/docs/docs-nav"
import { DocsSection } from "@/components/docs/docs-section"
import { DocsIntro } from "@/components/docs/sections/intro"
import { DocsQuickstart } from "@/components/docs/sections/quickstart"
import { DocsVerifyAPI } from "@/components/docs/sections/verify-api"
import { DocsInstitutionAPI } from "@/components/docs/sections/institution-api"
import { DocsStudentAPI } from "@/components/docs/sections/student-api"
import { DocsTranscriptAPI } from "@/components/docs/sections/transcript-api"
import { DocsTokenAPI } from "@/components/docs/sections/token-api"
import { DocsWebhooks } from "@/components/docs/sections/webhooks"
import { DocsOnChain } from "@/components/docs/sections/on-chain"
import { DocsErrorCodes } from "@/components/docs/sections/error-codes"
import { DocsSDK } from "@/components/docs/sections/sdk"
import { DocsPlayground } from "@/components/docs/sections/playground"

export const sections = [
  { id: "introduction",     label: "Introduction",           icon: "📖" },
  { id: "quickstart",       label: "Quickstart",             icon: "⚡" },
  { id: "verify-api",       label: "Verify API",             icon: "✅" },
  { id: "transcript-api",   label: "Transcript API",         icon: "📜" },
  { id: "institution-api",  label: "Institution API",        icon: "🏛️" },
  { id: "student-api",      label: "Student API",            icon: "🎓" },
  { id: "token-api",        label: "API Keys & Tokens",      icon: "🔑" },
  { id: "on-chain",         label: "On-Chain Contracts",     icon: "⛓️" },
  { id: "sdk",              label: "SDK & Integration",      icon: "🛠️" },
  { id: "webhooks",         label: "Webhooks & Emails",      icon: "📡" },
  { id: "error-codes",      label: "Error Codes",            icon: "🚨" },
  { id: "playground",       label: "API Playground",         icon: "⚡" },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("introduction")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  // Scroll spy — track which section is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    )
    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    setMobileNavOpen(false)
  }

  return (
    <div className="docs-root">
      {/* Top Bar */}
      <header className="docs-topbar">
        <div className="docs-topbar-inner">
          <Link href="/" className="docs-logo">
            <span className="docs-logo-mark">⬡</span>
            <span className="docs-logo-name">CredAxis</span>
            <span className="docs-logo-badge">Docs</span>
          </Link>

          <nav className="docs-top-links">
            <a href="https://credaxis.app" target="_blank" rel="noopener noreferrer">Platform</a>
            <a href="/verify" target="_blank" rel="noopener noreferrer">Verifier</a>
            <a href="mailto:support@credaxis.app">support@credaxis.app</a>
          </nav>

          <button
            id="docs-mobile-menu-btn"
            className="docs-mobile-toggle"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Toggle navigation"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className="docs-layout">
        {/* Sidebar */}
        <aside className={`docs-sidebar ${mobileNavOpen ? "open" : ""}`}>
          <DocsNav
            sections={sections}
            activeSection={activeSection}
            onSelect={scrollTo}
          />
        </aside>

        {/* Main content */}
        <main className="docs-main" ref={mainRef}>
          <DocsSection id="introduction">
            <DocsIntro />
          </DocsSection>
          <DocsSection id="quickstart">
            <DocsQuickstart />
          </DocsSection>
          <DocsSection id="verify-api">
            <DocsVerifyAPI />
          </DocsSection>
          <DocsSection id="transcript-api">
            <DocsTranscriptAPI />
          </DocsSection>
          <DocsSection id="institution-api">
            <DocsInstitutionAPI />
          </DocsSection>
          <DocsSection id="student-api">
            <DocsStudentAPI />
          </DocsSection>
          <DocsSection id="token-api">
            <DocsTokenAPI />
          </DocsSection>
          <DocsSection id="on-chain">
            <DocsOnChain />
          </DocsSection>
          <DocsSection id="sdk">
            <DocsSDK />
          </DocsSection>
          <DocsSection id="webhooks">
            <DocsWebhooks />
          </DocsSection>
          <DocsSection id="error-codes">
            <DocsErrorCodes />
          </DocsSection>
          <DocsSection id="playground">
            <DocsPlayground />
          </DocsSection>

          {/* Footer */}
          <footer className="docs-footer">
            <div className="docs-footer-inner">
              <p>© 2025 CredAxis · Built on Base · Powered by Hono + Next.js</p>
              <div className="docs-footer-links">
                <a href="/">Home</a>
                <a href="/verify">Verify</a>
                <a href="mailto:support@credaxis.app">Support</a>
                <a href="mailto:info@credaxis.app">Contact</a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
