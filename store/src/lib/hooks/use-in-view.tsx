import { RefObject, useEffect, useState } from "react"

/**
 * Hook to check if an element is in the viewport.
 *
 * @param element - Ref to the element to observe
 * @param rootMargin - Margin around the root (similar to CSS margin)
 * @returns boolean - Whether the element is visible
 */
export const useIntersection = (
  element: RefObject<HTMLDivElement | null>,
  rootMargin: string
) => {
  const [isVisible, setState] = useState(false)

  useEffect(() => {
    if (!element.current) {
      return
    }

    const el = element.current

    const observer = new IntersectionObserver(
      ([entry]) => {
        setState(entry.isIntersecting)
      },
      { rootMargin }
    )

    observer.observe(el)

    return () => observer.unobserve(el)
  }, [element, rootMargin])

  return isVisible
}
