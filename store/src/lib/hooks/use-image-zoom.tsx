import { useEffect, useRef, useState } from "react"

/**
 * Custom hook for handling image zoom and pan functionality.
 * Supports pinch-to-zoom and tap-to-zoom on touch devices,
 * and click-to-zoom/double-tap-to-reset on desktop.
 *
 * @param isActive - Whether the zoom feature should be active
 * @returns Object containing scale, position, drag state, ref, and event handlers
 */
export function useImageZoom(isActive: boolean) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const lastTapRef = useRef(0)

  const handleZoomIn = (centerX?: number, centerY?: number) => {
    const newScale = Math.min(scale + 0.5, 4)

    if (
      centerX !== undefined &&
      centerY !== undefined &&
      containerRef.current
    ) {
      const rect = containerRef.current.getBoundingClientRect()
      const x = centerX - rect.left - rect.width / 2
      const y = centerY - rect.top - rect.height / 2

      setPosition({
        x: position.x - (x * 0.5) / scale,
        y: position.y - (y * 0.5) / scale,
      })
    }

    setScale(newScale)
  }

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.5, 1)
    setScale(newScale)
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 })
    }
  }

  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1 && scale > 1) {
      e.preventDefault()
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      })
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false)

    // Double tap detection
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      const touch = e.changedTouches[0]
      if (scale === 1) {
        handleZoomIn(touch.clientX, touch.clientY)
      } else {
        handleReset()
      }
    }
    lastTapRef.current = now
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleMouseLeave = () => setIsDragging(false)

  const handleClick = (e: React.MouseEvent) => {
    if (scale === 1) {
      handleZoomIn(e.clientX, e.clientY)
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (scale > 1) {
      handleReset()
    }
  }

  useEffect(() => {
    if (scale === 1) {
      setPosition({ x: 0, y: 0 })
    }
  }, [scale])

  useEffect(() => {
    if (!isActive) {
      handleReset()
    }
  }, [isActive])

  return {
    scale,
    position,
    isDragging,
    containerRef,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onClick: handleClick,
      onDoubleClick: handleDoubleClick,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
    },
    controls: {
      zoomIn: () => handleZoomIn(),
      zoomOut: handleZoomOut,
      reset: handleReset,
    },
  }
}
