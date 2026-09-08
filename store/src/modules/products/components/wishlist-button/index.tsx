"use client"

import { Heart } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { addToWishlist, removeFromWishlist } from "@lib/data/wishlist"
import { getWishlistDeduped } from "@lib/util/client-dedupe"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { cn } from "@lib/utils"
import { WishlistItem } from "@/types/wishlist"

interface WishlistButtonProps {
  variantId: string | undefined
  className?: string
}

export default function WishlistButton({
  variantId,
  className,
}: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistItemId, setWishlistItemId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations("Product.wishlist")

  useEffect(() => {
    let cancelled = false

    const checkWishlist = async () => {
      setIsLoading(true)
      const wishlist = await getWishlistDeduped()

      if (cancelled) return

      if (wishlist && variantId) {
        const item = wishlist.items.find(
          (i: WishlistItem) => i.product_variant_id === variantId
        )
        setIsWishlisted(!!item)
        setWishlistItemId(item?.id ?? null)
      } else {
        setIsWishlisted(false)
        setWishlistItemId(null)
      }
      setIsLoading(false)
    }

    void checkWishlist()

    return () => {
      cancelled = true
    }
  }, [variantId])

  const handleToggle = () => {
    if (!variantId) return

    // Optimistic update
    const wasWishlisted = isWishlisted
    setIsWishlisted(!wasWishlisted)

    startTransition(async () => {
      if (wasWishlisted && wishlistItemId) {
        const error = (await removeFromWishlist(wishlistItemId)) as
          string | null
        if (error) {
          setIsWishlisted(true)
          toast.error(error)
        } else {
          setWishlistItemId(null)
          toast.success(t("removed"))
        }
      } else {
        const error = (await addToWishlist(variantId)) as string | null
        if (error) {
          setIsWishlisted(false)
          toast.error(error)
        } else {
          toast.success(t("added"))
          // Re-fetch to get the new item ID
          const wishlist = await getWishlistDeduped()
          if (wishlist) {
            const item = wishlist.items.find(
              (i: WishlistItem) => i.product_variant_id === variantId
            )
            setWishlistItemId(item?.id ?? null)
          }
        }
      }
    })
  }

  if (isLoading) {
    return (
      <button
        disabled
        className={cn(
          "flex items-center justify-center w-11 h-11 rounded-xl border border-ui-border-base bg-ui-bg-base transition-all",
          className
        )}
        aria-label={t("add")}
      >
        <Heart size={20} className="text-ui-fg-muted animate-pulse" />
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={!variantId || isPending}
      className={cn(
        "flex items-center justify-center w-11 h-11 rounded-xl border transition-all duration-300 group",
        isWishlisted
          ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50"
          : "border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle hover:border-ui-border-interactive",
        (!variantId || isPending) && "opacity-50 cursor-not-allowed",
        className
      )}
      title={isWishlisted ? t("remove") : t("add")}
      aria-label={isWishlisted ? t("remove") : t("add")}
    >
      <Heart
        size={20}
        className={cn(
          "transition-all duration-300",
          isWishlisted
            ? "fill-red-500 text-red-500 scale-110"
            : "text-ui-fg-muted group-hover:text-red-400 group-hover:scale-110"
        )}
      />
    </button>
  )
}
