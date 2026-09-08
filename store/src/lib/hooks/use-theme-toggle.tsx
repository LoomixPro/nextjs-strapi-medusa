import { useTheme } from "next-themes"

export const useThemeToggle = () => {
  const { setTheme, resolvedTheme, theme } = useTheme()

  const toggleTheme = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark"
    if (
      typeof document !== "undefined" &&
      (document as any).startViewTransition
    ) {
      ;(document as any).startViewTransition(() => {
        setTheme(nextTheme)
      })
    } else {
      setTheme(nextTheme)
    }
  }

  return { toggleTheme, theme, resolvedTheme, setTheme }
}
