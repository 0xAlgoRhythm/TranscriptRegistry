import { cn } from "@/lib/utils"

interface SectionLabelProps {
  index: string | number
  label: string
  className?: string
}

/**
 * ZenithPay-style section label: "[01] SECTION NAME"
 */
export function SectionLabel({ index, label, className }: SectionLabelProps) {
  const idx = typeof index === "number" ? String(index).padStart(2, "0") : index

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="section-number">[{idx}]</span>
      <span className="label-mono">{label}</span>
    </div>
  )
}
