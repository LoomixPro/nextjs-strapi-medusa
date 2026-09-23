"use client"

import React, { useEffect, useState } from "react"
import { useTheme } from "next-themes"

interface SilkProps {
  speed?: number
  scale?: number
  color?: string
  noiseIntensity?: number
  rotation?: number
  opacityLight?: number
  opacityDark?: number
}

const SilkBackground: React.FC<SilkProps> = ({
  opacityLight = 40,
  opacityDark = 30,
}) => {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const opacity =
    mounted && resolvedTheme === "dark" ? opacityDark : opacityLight

  return (
    <div
      className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden transition-opacity duration-1000"
      style={{ opacity: opacity / 100 }}
      aria-hidden="true"
    >
      <div className="absolute -inset-[50%] opacity-70 blur-[100px] animate-pulse pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[60vw] h-[60vh] rounded-full bg-gradient-to-tr from-neutral-200 via-neutral-300 to-neutral-100 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-950 opacity-80 mix-blend-multiply dark:mix-blend-screen animate-[spin_25s_linear_infinite]" />
        <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vh] rounded-full bg-gradient-to-bl from-neutral-300 via-neutral-100 to-neutral-200 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-950 opacity-60 mix-blend-multiply dark:mix-blend-screen animate-[spin_35s_linear_infinite_reverse]" />
      </div>
    </div>
  )
}

export default SilkBackground
