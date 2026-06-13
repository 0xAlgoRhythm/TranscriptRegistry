import { Link } from "@/i18n/routing"
import { Logo } from "@/components/ui/logo"
import { useTranslations } from "next-intl"

export function Footer() {
  const n = useTranslations("Navbar")
  const t = useTranslations("Footer")

  return (
    <footer className="border-t border-border/40 bg-background py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <Logo size="sm" />

        <div className="flex items-center gap-6 text-[11px] font-mono text-muted-foreground uppercase">
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            {n("launchApp")}
          </Link>
          <Link href="/verify" className="transition-colors hover:text-foreground">
            {n("verify")}
          </Link>
          <Link href="/docs" className="transition-colors hover:text-foreground">
            {n("docs")}
          </Link>
          <Link href="#features" className="transition-colors hover:text-foreground">
            {n("features")}
          </Link>
        </div>

        <p className="text-[11px] font-mono text-muted-foreground uppercase">
          {t("builtOn")}
        </p>
      </div>
    </footer>
  )
}
