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
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "relative group overflow-hidden rounded-xl px-8 py-3 font-bold text-sm tracking-wide select-none cursor-pointer inline-flex items-center justify-center gap-2",
          "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
          "border border-white/15",
          className
        )}
        {...props}
      >
        {/* Animated ambient glow behind button */}
        <motion.div
          className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary via-indigo-500 to-purple-500 opacity-0 blur-md transition duration-500 group-hover:opacity-75 -z-10 pointer-events-none"
          animate={isHovered ? { opacity: 0.7 } : { opacity: 0 }}
        />

        {/* Shimmer light beam sweep on hover */}
        <motion.div
          initial={{ x: "-150%", skewX: -25 }}
          animate={{ x: isHovered ? "200%" : "-150%", skewX: -25 }}
          transition={{ duration: 0.75, ease: "easeInOut" }}
          className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none z-10"
        />

        {/* Subtle radial center highlight on hover */}
        <motion.div className="absolute inset-0 bg-radial-gradient from-white/15 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Button Content */}
        <span className="relative z-10 flex items-center justify-center gap-2 transition-transform duration-200 group-hover:tracking-wider">
          {children}
        </span>
      </motion.button>
    )
  }
)

AnimatedButton.displayName = "AnimatedButtonStyle2"

export default AnimatedButton
