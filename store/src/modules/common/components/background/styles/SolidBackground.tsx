import React from "react"

interface SolidBackgroundProps {
  opacityLight?: number
  opacityDark?: number
}

const SolidBackground: React.FC<SolidBackgroundProps> = ({
  opacityLight = 100,
  opacityDark = 100,
}) => {
  return (
    <div
      className="fixed inset-0 z-[-1] pointer-events-none bg-ui-bg-base"
      style={{
        opacity: `var(--solid-opacity, ${opacityLight / 100})`,
      }}
    >
      <style>{`
        :root {
          --solid-opacity: ${opacityLight / 100};
        }
        .dark {
          --solid-opacity: ${opacityDark / 100};
        }
      `}</style>
    </div>
  )
}

export default SolidBackground
