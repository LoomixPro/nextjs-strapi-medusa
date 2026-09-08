import type { BaseHit, Hit } from "instantsearch.js"
import { useCallback, useEffect, useMemo, useState } from "react"

interface UseKeyboardNavigationReturn {
  selectedIndex: number
  moveDown: () => void
  moveUp: () => void
  activateSelection: () => boolean
  hoverIndex: (index: number) => void
  selectionOrigin: "keyboard" | "pointer" | "init"
}

// Helper function to validate safe navigation URLs (prevents DOM XSS via javascript: URLs)
function isSafeUrl(url: string): boolean {
  if (url.startsWith("/") && !url.startsWith("//")) {
    return true
  }
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Custom hook to handle keyboard navigation within a list of search hits.
 * It manages the currently selected index and provides methods to move up, move down,
 * and activate the selected item.
 *
 * @param hits - Array of search results (hits) from InstantSearch
 * @param query - The current search query string, used to reset the selection when it changes
 * @param openResultsInNewTab - Determines if the activated hit's URL should open in a new tab
 * @returns Object containing the selected index and navigation methods
 */
export function useKeyboardNavigation(
  hits: Hit<BaseHit>[],
  query: string,
  openResultsInNewTab = false
): UseKeyboardNavigationReturn {
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [selectionOrigin, setSelectionOrigin] = useState<
    "keyboard" | "pointer" | "init"
  >("init")

  const totalItems = useMemo(() => hits.length, [hits.length])

  // Handler to move selection down, wrapping around to the start if at the end
  const moveDown = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % totalItems)
    setSelectionOrigin("keyboard")
  }, [totalItems])

  // Handler to move selection up, wrapping around to the end if at the start
  const moveUp = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems)
    setSelectionOrigin("keyboard")
  }, [totalItems])

  const hoverIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalItems) return
      setSelectedIndex(index)
      setSelectionOrigin("pointer")
    },
    [totalItems]
  )

  // Handler to activate (navigate to) the currently selected hit's URL safely
  const activateSelection = useCallback((): boolean => {
    const hit = hits[selectedIndex]
    const url = typeof hit?.url === "string" ? hit.url : undefined
    if (url && isSafeUrl(url)) {
      if (openResultsInNewTab) {
        window.open(url, "_blank", "noopener,noreferrer")
      } else {
        window.location.assign(url)
      }
      return true
    }
    return false
  }, [selectedIndex, hits, openResultsInNewTab])

  // biome-ignore lint/correctness/useExhaustiveDependencies: expected
  useEffect(() => {
    setSelectedIndex(0)
    setSelectionOrigin("init")
  }, [query])

  return {
    selectedIndex,
    moveDown,
    moveUp,
    activateSelection,
    hoverIndex,
    selectionOrigin,
  }
}
