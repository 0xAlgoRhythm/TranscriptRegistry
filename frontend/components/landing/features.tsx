"use client"

import { motion } from "framer-motion"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { Shield, Key, Zap, Flame } from "lucide-react"
import { useTranslations } from "next-intl"

export function Features() {
  const t = useTranslations("Features")

  const FEATURES = [
    {
      title: t("feature1Title"),
      description: t("feature1Desc"),
      icon: Shield,
    },
    {
      title: t("feature2Title"),
      description: t("feature2Desc"),
      icon: Key,
    },
    {
      title: t("feature3Title"),
      description: t("feature3Desc"),
      icon: Zap,
    },
    {
      title: t("feature4Title"),
      description: t("feature4Desc"),
      icon: Flame,
    },
  ]
  return (
    <section id="features" className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 space-y-1.5"
        >
          <SectionLabel index={2} label={t("sectionLabel")} />
          <h2 className="text-3xl font-mono font-bold uppercase tracking-tight text-foreground md:text-5xl">
            {t("titleLine1")}
            <br />
            {t("titleLine2")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {FEATURES.map(({ title, description, icon: Icon }, idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
                delay: idx * 0.08,
              }}
              className="h-full"
            >
              <GlowCard className="p-6 h-full flex flex-col justify-between" glow>
                <div>
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-ca-accent/10 text-ca-accent border border-ca-accent/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 font-mono font-bold uppercase text-foreground">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
