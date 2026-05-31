"use client"

import React from "react"
import { motion } from "framer-motion"

const TECHS = [
  "ETHEREUM",
  "IPFS / PINATA",
  "PRIVY ID",
  "VIEM / WAGMI",
  "HONO / DRIZZLE",
  "NEXT.JS",
  "OPENZEPPELIN",
]

export function TechRail() {
  return (
    <section className="bg-background py-8 overflow-hidden border-b border-border/40 select-none">
      <div className="flex gap-12 whitespace-nowrap overflow-x-hidden">
        {/* Track */}
        <motion.div 
          className="flex gap-12 min-w-full justify-around items-center"
          animate={{ x: [0, -1000] }}
          transition={{
            repeat: Infinity,
            repeatType: "loop",
            duration: 25,
            ease: "linear",
          }}
        >
          {TECHS.concat(TECHS).map((tech, idx) => (
            <span 
              key={idx} 
              className="text-[11px] font-mono font-bold tracking-widest text-muted-foreground/40 hover:text-[oklch(var(--ca-accent)/0.6)] transition-colors cursor-default"
            >
              {tech}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
