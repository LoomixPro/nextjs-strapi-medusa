"use client"

import dynamic from "next/dynamic"
import React from "react"

import GridBackground from "./styles/GridBackground"
import SolidBackground from "./styles/SolidBackground"

const SilkBackground = dynamic(() => import("./styles/SilkBackground"), {
  ssr: false,
  loading: () => null,
})

interface BackgroundRendererProps {
  backgroundSettings?: {
    style: "silk" | "grid" | "solid" | "none"
    opacityLight?: number
    opacityDark?: number
  }
}

const BackgroundRenderer: React.FC<BackgroundRendererProps> = ({
  backgroundSettings,
}) => {
  if (!backgroundSettings || backgroundSettings.style === "none") {
    return null
  }

  const { style, opacityLight, opacityDark } = backgroundSettings

  switch (style) {
    case "silk":
      return (
        <SilkBackground opacityLight={opacityLight} opacityDark={opacityDark} />
      )
    case "grid":
      return (
        <GridBackground opacityLight={opacityLight} opacityDark={opacityDark} />
      )
    case "solid":
      return (
        <SolidBackground
          opacityLight={opacityLight}
          opacityDark={opacityDark}
        />
      )
    default:
      return null
  }
}

export default BackgroundRenderer
