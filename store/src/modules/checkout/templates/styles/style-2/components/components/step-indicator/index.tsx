"use client"

import { clx } from "@medusajs/ui"

type StepIndicatorProps = {
  label: string
  step: string
  currentStep: string
  active: boolean
  onStepChange: (step: string) => void
  index: number
}

const StepIndicator = ({
  label,
  step,
  currentStep,
  active,
  onStepChange,
  index,
  disabled = false,
}: StepIndicatorProps & { disabled?: boolean }) => {
  const isCurrent = currentStep === step
  const isCompleted = active && !isCurrent

  return (
    <button
      onClick={() => !disabled && onStepChange(step)}
      disabled={disabled}
      className={clx(
        "flex items-center gap-2 text-sm font-medium transition-all",
        {
          "text-foreground": isCurrent,
          "text-muted-foreground hover:text-foreground cursor-pointer":
            isCompleted && !disabled,
          "text-muted-foreground/60 cursor-default":
            (!active && !isCurrent) || disabled,
        }
      )}
    >
      <span
        className={clx(
          "w-6 h-6 rounded-full flex items-center justify-center border transition-colors",
          {
            "border-primary bg-primary text-primary-foreground": isCurrent,
            "border-border bg-background text-muted-foreground": isCompleted,
            "border-border text-muted-foreground/60": !active && !isCurrent,
          }
        )}
      >
        <span>{index}</span>
      </span>
      {label}
    </button>
  )
}

export default StepIndicator
