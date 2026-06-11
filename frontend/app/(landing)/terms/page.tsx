import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function TermsAndConditionsPage() {
  return (
    <main className="bg-background text-foreground min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-24 md:py-32">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center rounded-full border border-ca-accent/30 bg-ca-accent/10 px-2.5 py-0.5 text-xs font-semibold font-mono text-ca-accent transition-colors">
            Legal Compliance
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Terms & Conditions</h1>
          <p className="text-muted-foreground font-mono text-sm uppercase tracking-wider">
            Last Updated: June 2026
          </p>
        </div>

        <div className="prose prose-invert prose-ca max-w-none space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using the CredAxis platform ("Platform"), you agree to comply with and be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the Platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">2. Service Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              CredAxis provides a blockchain-based infrastructure for issuing, managing, and verifying academic transcripts via Soulbound Tokens (SBTs) and IPFS metadata. We are an infrastructure provider and are not responsible for the accuracy or validity of the academic data issued by registered universities.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">3. User Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong>Security:</strong> You are entirely responsible for the security of your cryptographic wallets and private keys. CredAxis cannot recover lost access to your wallet or your transcripts.</li>
              <li><strong>Accuracy:</strong> University registrars are responsible for ensuring the accuracy of the data they issue to the blockchain.</li>
              <li><strong>Compliance:</strong> You agree not to use the Platform for fraudulent, malicious, or illegal activities.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">4. Immutability and Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              By using our service, you acknowledge that data written to the blockchain (including public wallet addresses and cryptographic hashes) is immutable and cannot be deleted. You agree that CredAxis is not liable for data permanently stored on-chain.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">5. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              CredAxis provides the Platform on an "AS-IS" and "AS-AVAILABLE" basis. We disclaim all warranties of any kind. In no event shall CredAxis be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services or the blockchain networks we rely upon.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display border-b border-border/40 pb-2">6. Modifications to the Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by updating the "Last Updated" date at the top of this page. Your continued use of the Platform constitutes your acceptance of the revised Terms.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  )
}
