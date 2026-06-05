import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
  showWordmark?: boolean
}

const sizes = {
  sm: { mark: 24, text: "text-sm" },
  md: { mark: 32, text: "text-base" },
  lg: { mark: 40, text: "text-lg" },
}

export function Logo({ className, size = "md", showWordmark = true }: LogoProps) {
  const { mark, text } = sizes[size]

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={mark}
        height={mark}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="CredAxis"
      >
        {/* Hexagonal shield base */}
        <path
          d="M16 2L28 8V16C28 22.627 22.627 28 16 28C9.373 28 4 22.627 4 16V8L16 2Z"
          fill="var(--ca-accent)"
          opacity="0.15"
        />
        <path
          d="M16 3.8L26.4 9.2V16C26.4 21.74 21.74 26.4 16 26.4C10.26 26.4 5.6 21.74 5.6 16V9.2L16 3.8Z"
          stroke="var(--ca-accent)"
          strokeWidth="1.5"
          fill="none"
        />
        {/* CA lettermark */}
        <text
          x="16"
          y="19.5"
          textAnchor="middle"
          fill="var(--ca-accent)"
          fontSize="9"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          letterSpacing="-0.5"
        >
          CA
        </text>
      </svg>

      {showWordmark && (
        <span
          className={cn("font-semibold tracking-tight text-foreground", text)}
        >
          CredAxis
        </span>
      )}

    </div>
  )
}
