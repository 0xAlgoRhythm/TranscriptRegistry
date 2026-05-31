import React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Step {
  title: string
  description?: string
}

interface StepWizardProps {
  steps: Step[]
  currentStep: number // 1-indexed
  className?: string
}

export function StepWizard({ steps, currentStep, className }: StepWizardProps) {
  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const stepNum = idx + 1
          const isCompleted = stepNum < currentStep
          const isActive = stepNum === currentStep
          const isPending = stepNum > currentStep

          return (
            <React.Fragment key={idx}>
              {/* Step circle & details */}
              <div className="flex items-center gap-3 flex-1 last:flex-initial">
                <div 
                  className={cn(
                    "h-8 w-8 rounded-full border flex items-center justify-center font-mono text-xs transition-all duration-300 relative",
                    isCompleted && "bg-[oklch(var(--ca-success)/0.15)] border-[oklch(var(--ca-success))] text-[oklch(var(--ca-success))]",
                    isActive && "bg-[oklch(var(--ca-accent)/0.15)] border-[oklch(var(--ca-accent))] text-[oklch(var(--ca-accent))] ring-2 ring-[oklch(var(--ca-accent)/0.2)]",
                    isPending && "bg-muted/30 border-border/60 text-muted-foreground/60"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : (
                    <span>0{stepNum}</span>
                  )}
                </div>
                
                <div className="hidden md:block text-left">
                  <p className={cn(
                    "text-xs font-mono font-semibold uppercase tracking-wider",
                    isActive ? "text-[oklch(var(--ca-accent))]" : isCompleted ? "text-foreground/80" : "text-muted-foreground/50"
                  )}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-[10px] text-muted-foreground/60 max-w-[120px] truncate">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress Line connecting steps */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block flex-grow mx-4 h-[1px] bg-border/40 relative">
                  <div 
                    className="absolute top-0 left-0 bottom-0 bg-[oklch(var(--ca-accent))] transition-all duration-500"
                    style={{ width: isCompleted ? "100%" : isActive ? "50%" : "0%" }}
                  />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
