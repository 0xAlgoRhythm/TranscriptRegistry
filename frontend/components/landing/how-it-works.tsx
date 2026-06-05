"use client"

import { motion } from "framer-motion"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"

const HOW_IT_WORKS = [
  {
    role: "Universities",
    accent: "var(--ca-accent)",
    steps: [
      "Deploy your institution's isolated registry",
      "Upload transcript files to IPFS",
      "Issue records on-chain with student privacy hash",
    ],
  },
  {
    role: "Students",
    accent: "var(--ca-teal)",
    steps: [
      "Receive your on-chain transcript",
      "Grant time-limited access to verifiers",
      "Revoke access at any time",
    ],
  },
  {
    role: "Verifiers",
    accent: "var(--ca-success)",
    steps: [
      "Request access from the student",
      "Query the smart contract on-chain",
      "Get instant cryptographic confirmation",
    ],
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-ca-surface-2 border-y border-border py-24 md:py-32">
      <div className="mx-auto flex flex-col max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 space-y-1.5"
        >
          <SectionLabel index={1} label="DECENTRALIZED ARCHITECTURE" />
          <h2 className="text-3xl font-mono font-bold uppercase tracking-tight text-foreground md:text-5xl">
            Three roles. One trust layer.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map((item, idx) => (
            <motion.div
              key={item.role}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.55,
                ease: [0.16, 1, 0.3, 1],
                delay: idx * 0.1,
              }}
              className="h-full"
            >
              <GlowCard className="p-6 h-full flex flex-col justify-between" glow>
                <div>
                  <p
                    className="mb-5 text-xs font-mono font-bold uppercase tracking-wider"
                    style={{ color: item.accent }}
                  >
                    {item.role}
                  </p>
                  <ol className="space-y-4 font-mono text-xs">
                    {item.steps.map((step, i) => (
                      <li key={step} className="flex items-start gap-3">
                        <span
                          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white shadow-sm"
                          style={{ backgroundColor: item.accent }}
                        >
                          0{i + 1}
                        </span>
                        <span className="text-muted-foreground leading-relaxed group-hover:text-foreground">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
