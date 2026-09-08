"use client"

import { motion } from "framer-motion"

export default function BlockAnimateWrapper({
  children,
  index,
  isLast,
}: {
  children: React.ReactNode
  index?: number
  isLast?: boolean
}) {
  return (
    <motion.section
      className={`w-full ${index === 0 ? "pt-0" : "pt-20 md:pt-18"} ${
        isLast ? "pb-16 md:pb-24" : ""
      }`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  )
}
