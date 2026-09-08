import React from "react"

interface GridBackgroundProps {
  opacityLight?: number
  opacityDark?: number
}

const GridBackground: React.FC<GridBackgroundProps> = ({
  opacityLight = 15,
  opacityDark = 60,
}) => {
  return (
    <div
      className="fixed inset-0 z-[-1] pointer-events-none text-primary"
      style={{
        WebkitMaskComposite: "source-over",
        WebkitMaskImage:
          "radial-gradient(ellipse 50% 50% at 100% 0%, black 40%, transparent 70%), radial-gradient(ellipse 50% 50% at 0% 100%, black 40%, transparent 70%)",
        backgroundImage:
          "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
        backgroundSize: "18px 18px",
        maskComposite: "add",
        maskImage:
          "radial-gradient(ellipse 50% 50% at 100% 0%, black 40%, transparent 70%), radial-gradient(ellipse 50% 50% at 0% 100%, black 40%, transparent 70%)",
        // CSS variable based dynamic opacity depending on theme
        opacity: `var(--grid-opacity, ${opacityLight / 100})`,
      }}
    >
      <style>{`
        :root {
          --grid-opacity: ${opacityLight / 100};
        }
        .dark {
          --grid-opacity: ${opacityDark / 100};
        }
      `}</style>
    </div>
  )
}

export default GridBackground
