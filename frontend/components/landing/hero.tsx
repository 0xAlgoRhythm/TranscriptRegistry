"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Grid } from "lucide-react"

const STATS = [
  { label: "Partner Universities", value: "3" },
  { label: "Transcripts Issued", value: "1,200+" },
  { label: "Avg. Verification", value: "< 5s" },
]

const EASE = [0.16, 1, 0.3, 1] as const

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, ease: EASE, delay },
  }
}

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-background text-foreground pt-16">
      {/* Visual background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(108,91,240,0.12),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(114,28,190,0.06),transparent_40%)]" />
      
      {/* Hatch grid backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="pointer-events-none absolute inset-y-0 right-0 flex select-none items-center overflow-hidden pr-4 md:pr-12 pointer-events-none">
        <span
          className="font-bold uppercase tracking-widest text-foreground opacity-[0.02] select-none"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(5rem, 14vw, 16rem)",
            lineHeight: 1,
          }}
        >
          SECURED
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-36">
        <motion.div
          {...fadeUp(0)}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/25 backdrop-blur-md px-3 py-1.5"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-[oklch(var(--ca-accent))]" />
          <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">
            INTRODUCING CREDAXIS V2.0
          </span>
        </motion.div>

        <motion.h1
          {...fadeUp(0.1)}
          className="mb-6 text-5xl font-display font-light leading-[1.05] tracking-tight text-foreground md:text-7xl lg:text-[5.5rem]"
        >
          Academic Transcripts,
          <br />
          <em className="not-italic font-semibold text-[oklch(var(--ca-accent))]">
            Forged on Blockchain.
          </em>
        </motion.h1>

        <motion.p
          {...fadeUp(0.2)}
          className="mb-10 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base"
        >
          Immutable. Verifiable. Student-controlled. Issue, manage, and audit academic records directly on-chain. Completely immune to institutional delays and verification fee scams.
        </motion.p>

        <motion.div {...fadeUp(0.3)} className="mb-16 flex flex-wrap gap-4">
          <Button
            asChild
            size="lg"
            className="bg-[oklch(var(--ca-accent))] text-white hover:bg-[oklch(var(--ca-accent-hover))] font-mono tracking-wider text-xs px-6 py-5 rounded-lg border border-transparent shadow-lg shadow-[oklch(var(--ca-accent)/0.15)] transition-all"
          >
            <Link href="/dashboard">LAUNCH APPLICATION</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-border/60 hover:border-border text-foreground bg-card/25 backdrop-blur-md font-mono tracking-wider text-xs px-6 py-5 rounded-lg transition-all"
          >
            <Link href="/verify">VERIFY A RECORD</Link>
          </Button>
        </motion.div>

        <motion.div
          {...fadeUp(0.45)}
          className="flex flex-wrap items-center gap-8 border-t border-border/40 pt-8"
        >
          {STATS.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-8 font-mono">
              <div>
                <div className="mb-0.5 text-2xl font-bold text-foreground md:text-3xl">
                  {stat.value}
                </div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </div>
              </div>
              {i < STATS.length - 1 && (
                <div className="h-8 w-px bg-border/40" />
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
