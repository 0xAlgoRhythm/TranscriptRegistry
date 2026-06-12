"use client"

import React from "react"
import { motion } from "framer-motion"
import { GlowCard } from "@/components/ui/glow-card"
import { useTranslations } from "next-intl"

export function StatsBar() {
  const t = useTranslations("StatsBar")

  const stats = [
    { value: "$12K+", label: t("gasSaved") },
    { value: "100%", label: t("tamperProof") },
    { value: "0s", label: t("verificationDelay") },
    { value: "82%", label: t("costCut") },
  ]

  return (
    <section className="bg-background py-12 border-y border-border/40">
      <div className="mx-auto max-w-6xl px-6">
        <GlowCard className="p-6 md:p-10" glow>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 font-mono text-center">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="space-y-1"
              >
                <span className="text-3xl md:text-4xl font-bold tracking-tight text-ca-accent block">
                  {stat.value}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      </div>
    </section>
  )
}
