"use client"

import React, {
  useState,
  useRef,
  useLayoutEffect,
  cloneElement,
  useEffect,
} from "react"
import { usePathname, useRouter } from "next/navigation"
import { Home, Store, ShoppingCart, User } from "lucide-react"
import { cn } from "@lib/utils"
import { useTranslations } from "next-intl"

import { BottomNavBarProps } from "../../index"

type NavItem = {
  id: string | number
  icon: React.ReactElement<any>
  label?: string
  onClick?: () => void
  isActive?: boolean
}

type LimelightNavProps = {
  items?: NavItem[]
  defaultActiveIndex?: number
  onTabChange?: (index: number) => void
  className?: string
  limelightClassName?: string
  iconContainerClassName?: string
  iconClassName?: string
  activeIndex?: number
}

const LimelightNav = ({
  items = [],
  defaultActiveIndex = 0,
  onTabChange,
  className,
  limelightClassName,
  iconContainerClassName,
  iconClassName,
  activeIndex: externalActiveIndex,
}: LimelightNavProps) => {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex)
  const [isReady, setIsReady] = useState(false)
  const navItemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const limelightRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (externalActiveIndex !== undefined) {
      setActiveIndex(externalActiveIndex)
    }
  }, [externalActiveIndex])

  useLayoutEffect(() => {
    if (items.length === 0) return

    const limelight = limelightRef.current
    const activeItem = navItemRefs.current[activeIndex]

    if (limelight && activeItem) {
      // Batch all DOM reads first to avoid forced reflow
      const itemLeft = activeItem.offsetLeft
      const itemWidth = activeItem.offsetWidth
      const limelightWidth = limelight.offsetWidth

      // Defer the write to next animation frame to avoid forced synchronous layout
      const raf = requestAnimationFrame(() => {
        const newLeft = itemLeft + itemWidth / 2 - limelightWidth / 2
        limelight.style.left = `${newLeft}px`

        if (!isReady) {
          setTimeout(() => setIsReady(true), 50)
        }
      })

      return () => cancelAnimationFrame(raf)
    }
  }, [activeIndex, isReady, items])

  if (items.length === 0) {
    return null
  }

  const handleItemClick = (index: number, itemOnClick?: () => void) => {
    if (externalActiveIndex === undefined) {
      setActiveIndex(index)
    }
    onTabChange?.(index)
    itemOnClick?.()
  }

  return (
    <nav
      className={`relative inline-flex items-center h-16 w-full max-w-md mx-auto rounded-t-2xl sm:rounded-lg bg-white/70 dark:bg-neutral-950/70 backdrop-blur-2xl border-t border-white/40 dark:border-neutral-800 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] px-2 ${className}`}
    >
      {items.map(({ id, icon, label, onClick }, index) => (
        <button
          key={id}
          type="button"
          ref={(el) => {
            navItemRefs.current[index] = el
          }}
          className={`relative z-20 flex flex-1 h-full cursor-pointer items-center justify-center p-2 sm:p-5 ${iconContainerClassName}`}
          onClick={() => handleItemClick(index, onClick)}
          aria-label={label}
        >
          {/* Light-mode active highlight: soft pill behind the icon */}
          {activeIndex === index && (
            <span className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-neutral-900/8 dark:bg-transparent transition-all duration-300 pointer-events-none" />
          )}
          {cloneElement(icon, {
            className: `w-6 h-6 transition-all duration-300 ease-in-out relative z-10 ${
              activeIndex === index
                ? "opacity-100 scale-110 text-neutral-900 dark:text-white"
                : "opacity-40 text-neutral-500 hover:opacity-80 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            } ${icon.props.className || ""} ${iconClassName || ""}`,
          })}
        </button>
      ))}

      {/* Limelight indicator — white glow in dark mode, dark pill with shadow in light mode */}
      <div
        ref={limelightRef}
        className={`absolute top-0 z-10 w-11 h-[4px] rounded-b-full
          bg-neutral-900 shadow-[0_2px_10px_rgba(0,0,0,0.25)]
          dark:bg-white dark:shadow-[0_4px_12px_rgba(255,255,255,0.7)] ${
            isReady ? "transition-[left] duration-300 ease-in-out" : ""
          } ${limelightClassName}`}
        style={{ left: "-999px" }}
      >
        {/* Dark mode: bright cone glow beneath indicator */}
        <div className="hidden dark:block absolute left-[-30%] top-[4px] w-[160%] h-14 [clip-path:polygon(5%_100%,25%_0,75%_0,95%_100%)] bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
        {/* Light mode: subtle downward shadow cone */}
        <div className="block dark:hidden absolute left-[-30%] top-[4px] w-[160%] h-14 [clip-path:polygon(5%_100%,25%_0,75%_0,95%_100%)] bg-gradient-to-b from-neutral-900/10 to-transparent pointer-events-none" />
      </div>
    </nav>
  )
}

export function BottomNavBar({
  className,
  stickyBottom = true,
  cart,
}: BottomNavBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations("Layout.nav")

  const totalItems =
    cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

  const navItems = [
    { id: "home", label: t("home"), icon: Home, href: "/" },
    { id: "store", label: t("store"), icon: Store, href: "/store" },
    { id: "cart", label: t("cart"), icon: ShoppingCart, href: "/cart" },
    { id: "account", label: t("account"), icon: User, href: "/account" },
  ]

  const currentActiveIndex = navItems.findIndex((item) => {
    return item.href === "/"
      ? pathname === "/" || /^\/[a-zA-Z]{2}$/.test(pathname)
      : pathname.includes(item.href.split("?")[0])
  })

  const activeIndex = currentActiveIndex !== -1 ? currentActiveIndex : 0

  const limelightItems: NavItem[] = navItems.map((item) => {
    const Icon = item.icon
    return {
      id: item.id,
      label: item.label,
      icon: (
        <div className="relative flex items-center justify-center">
          <Icon size={24} strokeWidth={2} aria-hidden />
          {item.id === "cart" && totalItems > 0 && (
            <span className="absolute -top-2 ltr:-right-2 ltr:left-auto rtl:-left-2 rtl:right-auto flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-ui-bg-interactive text-ui-fg-on-inverted text-[10px] font-bold px-1 ring-2 ring-white dark:ring-neutral-950">
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </div>
      ),
      onClick: () => {
        router.push(item.href || "/")
      },
    }
  })

  return (
    <div
      className={cn(
        "flex small:hidden w-full",
        stickyBottom && "fixed inset-x-0 bottom-0 z-50",
        className
      )}
    >
      <LimelightNav
        items={limelightItems}
        activeIndex={activeIndex}
        className="w-full"
      />
    </div>
  )
}

export default BottomNavBar
