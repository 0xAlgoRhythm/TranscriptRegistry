"use client"

import { Link } from "@/i18n/routing"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { useTranslations } from "next-intl"

export function CTASection() {
  const t = useTranslations("CTA")
  const n = useTranslations("Navbar")

  return (
    <section className="bg-ca-surface-2 border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="h-full"
        >
          <GlowCard className="p-10 md:p-16 relative overflow-hidden" glow>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(108,91,240,0.12),transparent_45%)]" />
            <div className="relative max-w-xl space-y-4">
              <SectionLabel index={3} label={t("sectionLabel")} />
              <h2 className="text-3xl font-mono font-bold uppercase tracking-tight text-foreground md:text-5xl">
                {t("title")}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                {t("desc")}
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-ca-accent text-white hover:bg-ca-accent-hover font-mono tracking-wider text-xs px-6 py-5 rounded-lg border border-transparent shadow-lg shadow-ca-accent/15 transition-all"
                >
                  <Link href="/dashboard">{n("launchApp")}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-border hover:border-ca-accent/50 text-foreground bg-card font-mono tracking-wider text-xs px-6 py-5 rounded-lg transition-all shadow-sm"
                >
                  <Link href="/verify">{n("verify")}</Link>
                </Button>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      </div>
    </section>
  )
}
