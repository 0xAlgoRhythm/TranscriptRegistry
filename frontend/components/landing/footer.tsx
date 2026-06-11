import Link from "next/link"
import { Logo } from "@/components/ui/logo"

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <Logo size="sm" />

        <div className="flex items-center gap-6 text-[11px] font-mono text-muted-foreground uppercase">
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Launch App
          </Link>
          <Link href="/verify" className="transition-colors hover:text-foreground">
            Verify
          </Link>
          <Link href="/docs" className="transition-colors hover:text-foreground">
            Docs
          </Link>
          <Link href="#features" className="transition-colors hover:text-foreground">
            Features
          </Link>
        </div>

        <p className="text-[11px] font-mono text-muted-foreground uppercase">
          © 2026 CredAxis. Built on Ethereum.
        </p>
      </div>
    </footer>
  )
}
