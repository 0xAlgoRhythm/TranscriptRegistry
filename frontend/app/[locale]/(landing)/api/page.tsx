import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Server, Activity, Database, Shield } from "lucide-react"

export default function ApiStatusPage() {
  return (
    <main className="bg-background text-foreground min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-24 md:py-32">
        <div className="space-y-4 mb-12 text-center">
          <div className="inline-flex items-center rounded-full border border-ca-accent/30 bg-ca-accent/10 px-2.5 py-0.5 text-xs font-semibold font-mono text-ca-accent transition-colors">
            System Status
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">API & Infrastructure</h1>
          <p className="text-muted-foreground font-mono text-sm max-w-2xl mx-auto">
            The CredAxis backend API is fully operational and healthy. Below are the details of our core infrastructure services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Main API Status */}
          <div className="rounded-xl border border-border/50 bg-card p-6 flex items-start gap-4 shadow-sm hover:border-ca-accent/50 transition-all">
            <div className="p-3 bg-green-500/10 rounded-lg text-green-500 shrink-0">
              <Server className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Core API Server</h3>
                <span className="flex items-center gap-1.5 text-xs font-mono text-green-500">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Operational
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Main backend node processing indexing and IPFS pinning queues.</p>
            </div>
          </div>

          {/* Database */}
          <div className="rounded-xl border border-border/50 bg-card p-6 flex items-start gap-4 shadow-sm hover:border-ca-accent/50 transition-all">
            <div className="p-3 bg-green-500/10 rounded-lg text-green-500 shrink-0">
              <Database className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">PostgreSQL Database</h3>
                <span className="flex items-center gap-1.5 text-xs font-mono text-green-500">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  Operational
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Relational database storing metadata schemas and RBAC policies.</p>
            </div>
          </div>

          {/* Blockchain Node */}
          <div className="rounded-xl border border-border/50 bg-card p-6 flex items-start gap-4 shadow-sm hover:border-ca-accent/50 transition-all">
            <div className="p-3 bg-green-500/10 rounded-lg text-green-500 shrink-0">
              <Activity className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">RPC Node Connection</h3>
                <span className="flex items-center gap-1.5 text-xs font-mono text-green-500">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  Operational
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Viem WebSocket and HTTP connection to the Sepolia testnet.</p>
            </div>
          </div>

          {/* Smart Contract */}
          <div className="rounded-xl border border-border/50 bg-card p-6 flex items-start gap-4 shadow-sm hover:border-ca-accent/50 transition-all">
            <div className="p-3 bg-green-500/10 rounded-lg text-green-500 shrink-0">
              <Shield className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Registry Smart Contract</h3>
                <span className="flex items-center gap-1.5 text-xs font-mono text-green-500">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  Operational
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Transcript Registry EVM contract validating SBT issuance.</p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-xl font-bold font-display">API Documentation</h2>
          <p className="text-muted-foreground text-sm">
            For integration partners and developers, our REST API documentation is currently available upon request. 
            The API uses standard JSON payloads and requires JWT Bearer authentication.
          </p>
          <div className="pt-4">
            <a href="mailto:api@credaxis.johnokyere.xyz" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 font-mono">
              Request API Keys
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
