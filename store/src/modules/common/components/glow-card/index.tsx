"use client"

import React, { useEffect, useRef, ReactNode } from "react"

interface GlowCardProps {
  children: ReactNode
  className?: string
  glowColor?: "blue" | "purple" | "green" | "red" | "orange"
  size?: "sm" | "md" | "lg"
  width?: string | number
  height?: string | number
  customSize?: boolean
  as?: React.ElementType
  [key: string]: any
}

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
}

const sizeMap = {
  sm: "w-48 h-64",
  md: "w-64 h-80",
  lg: "w-80 h-96",
}

const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = "",
  glowColor = "blue",
  size = "md",
  width,
  height,
  customSize = false,
  as = "div",
  ...props
}) => {
  const Component = as as any
  const cardRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handlePointerMove = (e: PointerEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      card.style.setProperty("--x", x.toFixed(2))
      card.style.setProperty("--xp", (x / rect.width).toFixed(2))
      card.style.setProperty("--y", y.toFixed(2))
      card.style.setProperty("--yp", (y / rect.height).toFixed(2))
      card.style.setProperty("--glow-opacity", "1")
    }

    const handlePointerLeave = () => {
      card.style.setProperty("--glow-opacity", "0")
    }

    card.addEventListener("pointermove", handlePointerMove)
    card.addEventListener("pointerleave", handlePointerLeave)

    return () => {
      card.removeEventListener("pointermove", handlePointerMove)
      card.removeEventListener("pointerleave", handlePointerLeave)
    }
  }, [])

  const { base, spread } = glowColorMap[glowColor]

  const getSizeClasses = () => {
    if (customSize) return ""
    return sizeMap[size]
  }

  const getInlineStyles = () => {
    const baseStyles: any = {
      "--base": base,
      "--spread": spread,
      "--radius": "16",
      "--border": "2",
      "--backdrop": "hsl(0 0% 10% / 0.3)",
      "--backup-border": "var(--backdrop)",
      "--size": "250",
      "--outer": "1",
      "--border-size": "calc(var(--border, 2) * 1px)",
      "--spotlight-size": "calc(var(--size, 150) * 1px)",
      "--hue": "calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))",
      backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, -9999) * 1px)
        calc(var(--y, -9999) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.15)), transparent
      )`,
      backgroundColor: "var(--backdrop, transparent)",
      backgroundSize:
        "calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))",
      backgroundPosition: "50% 50%",
      border: "var(--border-size) solid var(--backup-border)",
      position: "relative",
      touchAction: "auto",
    }
    if (width !== undefined) {
      baseStyles.width = typeof width === "number" ? `${width}px` : width
    }
    if (height !== undefined) {
      baseStyles.height = typeof height === "number" ? `${height}px` : height
    }
    return { ...baseStyles, ...props.style }
  }

  const beforeAfterStyles = `
    [data-glow]::before,
    [data-glow]::after {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: calc(var(--border-size) * -1);
      border: var(--border-size) solid transparent;
      border-radius: calc(var(--radius) * 1px);
      background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
      background-repeat: no-repeat;
      background-position: 50% 50%;
      opacity: var(--glow-opacity, 0);
      transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
      -webkit-mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      -webkit-mask-clip: padding-box, border-box;
      -webkit-mask-composite: source-in, xor;
    }
    [data-glow]::before {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
        calc(var(--x, -9999) * 1px)
        calc(var(--y, -9999) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 1)), transparent 100%
      );
      filter: brightness(2);
    }
    [data-glow]::after {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
        calc(var(--x, -9999) * 1px)
        calc(var(--y, -9999) * 1px),
        hsl(0 100% 100% / var(--border-light-opacity, 1)), transparent 100%
      );
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: beforeAfterStyles }} />
      <Component
        ref={cardRef as any}
        data-glow
        style={getInlineStyles()}
        className={`
          ${getSizeClasses()}
          ${
            !customSize
              ? "aspect-[3/4] grid grid-rows-[1fr_auto] p-4 gap-4"
              : ""
          }
          rounded-2xl
          relative
          shadow-[0_1rem_2rem_-1rem_black]
          ${className}
        `}
        {...props}
      >
        {children}
      </Component>
    </>
  )
}

export { GlowCard }
