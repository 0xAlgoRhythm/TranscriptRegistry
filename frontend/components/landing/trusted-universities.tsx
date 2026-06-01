"use client"

import { motion } from "framer-motion"

const UNIVERSITIES = [
  {
    name: "Kwame Nkrumah University of Science and Technology",
    short: "KNUST",
    logo: "/knust.jpg",
  },
  {
    name: "University of Cape Coast",
    short: "UCC",
    logo: "/ucc.png",
  },
  {
    name: "University of Education, Winneba",
    short: "UEW",
    logo: "/uew.png",
  },
]

export function TrustedUniversities() {
  return (
    <section className="relative overflow-hidden border-t border-border/40 bg-background/50 py-16 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground"
          >
            Trusted by Top Institutions in Ghana
          </motion.h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-80">
          {UNIVERSITIES.map((uni, i) => (
            <motion.div
              key={uni.short}
              initial={{ opacity: 0, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.8 }}
              className="group flex flex-col items-center gap-4 transition-all duration-300 hover:opacity-100 hover:-translate-y-1"
            >
              <div className="relative h-24 w-24 overflow-hidden md:h-32 md:w-32 rounded-full border border-border/50 bg-white/5 p-4 backdrop-blur-md shadow-xl transition-all duration-500 group-hover:border-[oklch(var(--ca-accent)/0.5)] group-hover:bg-white/10 group-hover:shadow-[0_0_30px_rgba(108,91,240,0.2)]">
                {/* 
                  Using standard img instead of Next Image to avoid configuring remote patterns 
                  CSS filters applied to blend the colored logos into dark mode elegantly, returning color on hover
                */}
                <img
                  src={uni.logo}
                  alt={`${uni.name} Logo`}
                  className="h-full w-full object-contain grayscale opacity-70 transition-all duration-500 group-hover:grayscale-0 group-hover:opacity-100"
                />
              </div>
              <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
                {uni.short}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
