"use client"

import { Button } from "@modules/common/components/shadcn/button"
import React from "react"
import { useFormStatus } from "react-dom"

export function SubmitButton({
  children,
  variant = "primary",
  className,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "transparent" | "danger" | null
  className?: string
  "data-testid"?: string
}) {
  const { pending } = useFormStatus()

  // Map Medusa UI variants to Shadcn Button variants
  let shadcnVariant:
    "default" | "secondary" | "destructive" | "ghost" | "outline" | "link" =
    "default"
  if (variant === "secondary") shadcnVariant = "secondary"
  else if (variant === "danger") shadcnVariant = "destructive"
  else if (variant === "transparent") shadcnVariant = "ghost"

  return (
    <Button
      className={className}
      type="submit"
      isLoading={pending}
      variant={shadcnVariant}
      data-testid={dataTestId}
    >
      {children}
    </Button>
  )
}
