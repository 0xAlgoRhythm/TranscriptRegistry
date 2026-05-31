"use client"

import React from "react"
import { motion } from "framer-motion"
import { GlowCard } from "@/components/ui/glow-card"
import { SectionLabel } from "@/components/ui/section-label"
import { GraduationCap, Landmark, ShieldCheck } from "lucide-react"

const ROLES_DATA = [
  {
    title: "Students",
    description: "Take absolute ownership of your academic records. Keep your credentials safe in your own wallet, grant temporary verification tokens to potential employers, and easily revoke access when no longer required.",
    icon: GraduationCap,
    accent: "oklch(var(--ca-teal))",
  },
  {
    title: "Universities",
    description: "Modernize credential distribution. Lower operations overhead by deploying isolated registries on Ethereum, issuing transcripts in seconds, and completely eliminating verification email backlogs.",
    icon: Landmark,
    accent: "oklch(var(--ca-accent))",
  },
  {
    title: "Verifiers",
    description: "Instantly check qualifications with complete cryptographic certainty. Skip institutional delays and administrative waitlists, verify record hashes in real time, and query verified on-chain proof.",
    icon: ShieldCheck,
    accent: "oklch(var(--ca-success))",
  },
]

export function Roles() {
  return (
    <section className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 space-y-1.5"
        >
          <SectionLabel index={3} label="USER ROLES" />
          <h2 className="text-3xl font-mono font-bold uppercase tracking-tight text-foreground md:text-5xl">
            Designed for the entire
            <br />
            educational ecosystem.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {ROLES_DATA.map((role, idx) => {
            const Icon = role.icon
            return (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: idx * 0.1 }}
                className="h-full"
              >
                <GlowCard className="p-6 h-full flex flex-col justify-between" glow>
                  <div className="space-y-4">
                    <div 
                      className="size-12 rounded-xl flex items-center justify-center border"
                      style={{ 
                        color: role.accent, 
                        backgroundColor: `${role.accent}15`, 
                        borderColor: `${role.accent}30` 
                      }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <h3 className="text-base font-mono font-bold uppercase text-foreground">
                      {role.title}
                    </h3>
                    
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                </GlowCard>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
