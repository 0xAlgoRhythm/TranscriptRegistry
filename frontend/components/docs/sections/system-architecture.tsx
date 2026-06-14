import React from "react";
import { useTranslations } from "next-intl";

export function DocsSystemArchitecture() {
  const t = useTranslations("Common");

  return (
    <div className="docs-section-content">
      <h2>System Architecture</h2>
      <p className="docs-lead">
        CredAxis is a full-stack, Web3-enabled software platform designed to solve the critical issues of academic transcript fraud, slow verification times, and data siloing in international education.
      </p>

      <div className="docs-block">
        <h3>1. The Decentralized Ledger (Smart Contracts)</h3>
        <p>The system operates on a Monorepo architecture. The decentralized ledger is written in Foundry (Solidity).</p>
        <ul className="docs-list">
          <li><strong>TranscriptRegistry.sol:</strong> The immutable ledger mapping cryptographic hashes of student transcripts to university issuer addresses.</li>
          <li><strong>UniversityFactory.sol:</strong> A factory pattern implementation allowing autonomous deployment of dedicated registry instances for participating universities.</li>
          <li><strong>Security Paradigm:</strong> Implements strict Access Control Lists (ACL) ensuring only authorized Registrar wallets can mint and amend transcript records.</li>
        </ul>
      </div>

      <div className="docs-block">
        <h3>2. The Indexing & Caching Layer (Backend)</h3>
        <p>Due to the slow querying times of remote RPC blockchain nodes, the backend implements an Event Indexer built on Node.js, Express, Drizzle ORM, and PostgreSQL.</p>
        <ul className="docs-list">
          <li><strong>Functionality:</strong> Listens to emitted events from TranscriptRegistry.sol (e.g., TranscriptIssued) and caches the metadata into a relational PostgreSQL database.</li>
          <li><strong>API Services:</strong> Exposes REST endpoints to the frontend for lightning-fast querying, and handles side-effects such as automated email notifications.</li>
        </ul>
      </div>

      <div className="docs-block">
        <h3>3. The Client Interface (Frontend)</h3>
        <p>The frontend is a modern web app built with Next.js 16 App Router, React, and Tailwind CSS.</p>
        <ul className="docs-list">
          <li><strong>Authentication:</strong> Role-Based Access Control (RBAC) securely differentiating UI views and permissions for Students, Registrars, Verifiers, and the Public.</li>
          <li><strong>Registrar UX Abstraction (Hybrid State Architecture):</strong> Enables features like <strong>Cohort Invite Codes</strong> for mass student self-onboarding and <strong>OTP Fast-Track Approvals</strong> to bypass mandatory Web3 wallet transaction signing.</li>
          <li><strong>Performance Engineering:</strong> Implements chunked asynchronous processing (`setTimeout` yielding) during intensive operations like CSV parsing to prevent Interaction to Next Paint (INP) browser freezing.</li>
        </ul>
      </div>

      <div className="docs-block">
        <h3>4. AI & Systems Integration (MCP)</h3>
        <p>CredAxis natively integrates with emerging AI research tools.</p>
        <ul className="docs-list">
          <li><strong>Framework:</strong> Model Context Protocol (MCP) Server.</li>
          <li><strong>Functionality:</strong> Exposes a Server-Sent Events (SSE) stream allowing authorized AI Agents to read real-time database metrics (e.g., Active Universities, Issued Transcripts).</li>
        </ul>
      </div>

      <div className="docs-block docs-card-warning">
        <div className="docs-card-header">
          <span className="docs-card-icon">💡</span>
          <h4>SEO & Market Viability</h4>
        </div>
        <div className="docs-card-body">
          <p>
            To compete with established entities like WES, the platform injects JSON-LD <code>EducationalApplication</code> schemas directly into the HTML <code>&lt;head&gt;</code> and utilizes auto-generated sitemaps with rigorous <code>hreflang</code> alternates to prevent localized duplicate content penalties by Google crawlers.
          </p>
        </div>
      </div>
    </div>
  );
}
