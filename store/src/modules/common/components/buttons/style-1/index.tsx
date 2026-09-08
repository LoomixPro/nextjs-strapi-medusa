"use client"

import React, { useState } from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@lib/utils"

export interface AnimatedButtonProps extends HTMLMotionProps<"button"> {
  children?: React.ReactNode
}

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false)

    return (
      <motion.button
        ref={ref}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn(
          "relative overflow-hidden bg-primary border-2 border-primary rounded-full px-12 py-3 font-black text-sm uppercase tracking-wider select-none cursor-pointer z-0",
          className
        )}
        {...props}
      >
        {/* Before overlay */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: isHovered ? "100%" : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="absolute w-full h-[104%] left-[-60%] top-[-104%] bg-primary-foreground pointer-events-none"
          style={{ skewX: 30 }}
        />

        {/* After overlay */}
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: isHovered ? "-102%" : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="absolute w-full h-[104%] left-[30%] top-[102%] bg-primary-foreground pointer-events-none z-[-1]"
          style={{ skewX: 30 }}
        />

        {/* Text Container */}
        <span className="block overflow-hidden relative pointer-events-none w-full">
          <motion.span
            initial={{ color: "hsl(var(--primary-foreground))" }}
            animate={{
              y: isHovered ? [0, 24, -24, 0] : 0,
              color: isHovered
                ? "hsl(var(--primary))"
                : "hsl(var(--primary-foreground))",
            }}
            transition={{
              y: isHovered
                ? { duration: 0.3, times: [0, 0.5, 0.51, 1], ease: "easeInOut" }
                : { duration: 0 },
              color: { duration: 0.2, ease: "easeInOut" },
            }}
            className="flex items-center justify-center gap-2 relative w-full"
          >
            {children}
          </motion.span>
        </span>
      </motion.button>
    )
  }
)

AnimatedButton.displayName = "AnimatedButton"

export default AnimatedButton
