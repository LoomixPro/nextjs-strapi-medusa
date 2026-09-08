"use client"

import React, { useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

export interface ChronicleButtonProps {
  text: string
  onClick?: () => void
  hoverColor?: string
  hoverForeground?: string
  borderRadius?: string
  fontFamily?: string
  customBackground?: string
  customForeground?: string
  isRTL?: boolean
}

export const ChronicleButton: React.FC<ChronicleButtonProps> = ({
  text,
  onClick,
  hoverColor = "#005baa",
  hoverForeground = "#ffffff",
  borderRadius = "9999px",
  fontFamily = "inherit",
  customBackground = "#ffffff",
  customForeground = "#0f172a",
  isRTL = false,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const Icon = isRTL ? ArrowLeft : ArrowRight

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: isHovered ? hoverColor : customBackground,
        color: isHovered ? hoverForeground : customForeground,
        borderRadius,
        fontFamily,
        padding: "1rem 2.5rem",
        fontSize: "1.05rem",
        fontWeight: 700,
        border: "1px solid rgba(255, 255, 255, 0.2)",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.75rem",
        boxShadow: isHovered
          ? "0 10px 25px -5px rgba(0, 91, 170, 0.4)"
          : "0 4px 15px rgba(0, 0, 0, 0.1)",
        transform: isHovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <span>{text}</span>
      <Icon
        size={18}
        style={{
          transition: "transform 0.3s ease",
          transform: isHovered
            ? isRTL
              ? "translateX(-4px)"
              : "translateX(4px)"
            : "translateX(0)",
        }}
      />
    </button>
  )
}
