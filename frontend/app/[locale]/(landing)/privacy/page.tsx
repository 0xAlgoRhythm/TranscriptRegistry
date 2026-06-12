import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-background text-foreground min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-24 md:py-32">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center rounded-full border border-ca-accent/30 bg-ca-accent/10 px-2.5 py-0.5 text-xs font-semibold font-mono text-ca-accent transition-colors">
            Legal Compliance
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">
            Last Updated: June 2026
          </p>
        </div>

        <div className="prose prose-invert prose-ca max-w-none space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to CredAxis ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform 
              and use our blockchain-based academic credentialing services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you use CredAxis, we may collect the following types of information:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong>Wallet Addresses:</strong> Your public blockchain address used to authenticate and receive Soulbound Tokens (SBTs).</li>
              <li><strong>Academic Data:</strong> Hashes of your academic records, GPAs, graduation years, and university affiliations. This data is cryptographically hashed or encrypted before being pinned to IPFS.</li>
              <li><strong>Contact Information:</strong> Email addresses provided during registration or support requests.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the collected information to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Issue and verify your academic transcripts securely on the blockchain.</li>
              <li>Provide, maintain, and improve the CredAxis platform.</li>
              <li>Notify you regarding account access, verification requests, and administrative matters.</li>
              <li>Comply with legal and regulatory obligations.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">4. Blockchain and Immutability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Please note that CredAxis leverages blockchain technology. Data recorded on the blockchain (such as your public wallet address and the cryptographic hashes of your transcripts) is immutable and public. While we encrypt sensitive metadata on IPFS, the existence of the hash on the blockchain cannot be deleted or altered.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">5. Cookies and Tracking Technologies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies to ensure the basic functionality of our platform, manage user sessions, and track application performance. You can choose to accept or decline non-essential cookies via our Cookie Consent banner.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">6. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at privacy@credaxis.johnokyere.xyz.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}
