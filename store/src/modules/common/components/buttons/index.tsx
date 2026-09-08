import React from "react"
import AnimatedButton1 from "./style-1"
import AnimatedButton2 from "./style-2"

export const buttonStyles: Record<string, React.ComponentType<any>> = {
  "style-1": AnimatedButton1,
  "style-2": AnimatedButton2,
}

export type ButtonStyleType = keyof typeof buttonStyles
