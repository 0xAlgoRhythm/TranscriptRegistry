"use client"

import { motion } from "framer-motion"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { Shield, Key, Zap, Flame } from "lucide-react"

const FEATURES = [
  {
    title: "Immutable Records",
    description:
      "Every transcript is cryptographically fingerprinted. Once issued on Ethereum, it cannot be altered or forged.",
    icon: Shield,
  },
  {
    title: "Student Access Control",
    description:
      "Students decide who sees their credentials. Grant time-limited access — revoke instantly, no intermediary needed.",
    icon: Key,
  },
  {
    title: "Instant Verification",
    description:
      "Employers and institutions get on-chain confirmation in under 5 seconds. No phone calls, no paperwork.",
    icon: Zap,
  },
  {
    title: "Gas-Efficient by Design",
    description:
      "Beacon Proxy architecture reduces per-university deployment cost by 82%. Fully upgradeable without redeployment.",
    icon: Flame,
  },
]

export function Features() {
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
          <SectionLabel index={2} label="PRODUCT FEATURES" />
          <h2 className="text-3xl font-mono font-bold uppercase tracking-tight text-foreground md:text-5xl">
            Engineered for trust
            <br />
            at every layer.
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
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-[oklch(var(--ca-accent)/0.1)] text-[oklch(var(--ca-accent))] border border-[oklch(var(--ca-accent)/0.2)]">
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
