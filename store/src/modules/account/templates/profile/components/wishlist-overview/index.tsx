"use client"

import { Heart, Trash2, ShoppingBag } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { removeFromWishlist } from "@lib/data/wishlist"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Wishlist } from "@/types/wishlist"
import { useState, useTransition } from "react"
import { Button } from "@modules/common/components/shadcn/button"

type WishlistOverviewProps = {
  wishlist: Wishlist | null
}

export default function WishlistOverview({
  wishlist: initialWishlist,
}: WishlistOverviewProps) {
  const t = useTranslations("Account.Wishlist")
  const [wishlist, setWishlist] = useState(initialWishlist)
  const [isPending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemove = (itemId: string) => {
    setRemovingId(itemId)
    startTransition(async () => {
      const error = await removeFromWishlist(itemId)
      if (error) {
        toast.error(error)
      } else {
        toast.success(t("removed"))
        // Optimistically remove from local state
        setWishlist((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.filter((i) => i.id !== itemId),
              }
            : null
        )
      }
      setRemovingId(null)
    })
  }

  const items = wishlist?.items || []

  return (
    <div
      className="w-full flex md:contents flex-col"
      data-testid="wishlist-page"
    >
      {/* Header */}
      <div className="mb-8 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 dark:from-red-500/30 dark:to-red-500/10 border border-red-500/10 dark:border-red-500/20 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-red-400/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-500" />
            <Heart
              size={26}
              className="text-red-500 drop-shadow-sm relative z-10 transition-transform duration-300 group-hover:scale-110"
              fill="currentColor"
            />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground mb-1">
              {t("title")}
            </h1>
            <p className="text-xs text-muted-foreground font-light max-w-lg">
              {t("description")}
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="group relative flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-border rounded-3xl bg-gradient-to-b from-muted/50 to-transparent overflow-hidden transition-all duration-500 hover:border-primary/50 animate-in fade-in zoom-in-95 duration-700">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-background/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="relative z-10 p-5 rounded-full bg-background shadow-xl shadow-black/5 ring-1 ring-black/5 dark:ring-white/10 mb-6 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-500">
            <Heart
              size={40}
              className="text-red-400 opacity-60 group-hover:opacity-100 transition-opacity"
            />
          </div>
          <h3 className="relative z-10 text-base font-bold text-foreground mb-2">
            {t("empty_title")}
          </h3>
          <p className="relative z-10 text-xs text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed font-light">
            {t("empty_description")}
          </p>
          <LocalizedClientLink
            href="/store"
            className="relative z-10 block w-full sm:w-fit mx-auto"
          >
            <Button className="w-full h-14 rounded-full font-bold uppercase text-[12px] tracking-widest transition-all flex items-center justify-center gap-2">
              <ShoppingBag size={16} />
              {t("browse_store")}
            </Button>
          </LocalizedClientLink>
        </div>
      )}

      {/* Wishlist Items Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {items.map((item, index) => {
            const variant = item.product_variant
            const product = variant?.product
            const isRemoving = removingId === item.id

            // Data fields extraction
            const thumbnail = variant?.thumbnail || product?.thumbnail
            const title = product?.title || variant?.title || "Product"
            const sku = variant?.sku
            const productLink = product?.handle
              ? `/products/${product.handle}`
              : null

            return (
              <div
                key={item.id}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`group relative rounded-2xl overflow-hidden border border-border bg-background transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1 animate-in fade-in zoom-in-95 fill-mode-both ${
                  isRemoving ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Delete Button - Always Visible */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleRemove(item.id)
                  }}
                  disabled={isPending}
                  className="absolute top-3 right-3 z-30 flex items-center justify-center w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm text-red-400 hover:bg-red-500 hover:text-white hover:scale-110 shadow-lg transition-all duration-200 disabled:opacity-50"
                  title={t("remove")}
                >
                  <Trash2 size={16} />
                </button>

                {/* Card as Link */}
                {productLink ? (
                  <LocalizedClientLink href={productLink} className="block">
                    {/* Thumbnail */}
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      {thumbnail ? (
                        <Image
                          src={thumbnail}
                          alt={title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Heart
                            size={28}
                            className="text-muted-foreground opacity-25"
                          />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-xs text-foreground line-clamp-2 text-center leading-relaxed group-hover:text-primary transition-colors duration-200">
                        {title}
                      </h3>
                      {sku && (
                        <div className="flex justify-center">
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                            {sku}
                          </span>
                        </div>
                      )}
                    </div>
                  </LocalizedClientLink>
                ) : (
                  <div>
                    {/* Thumbnail */}
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      {thumbnail ? (
                        <Image
                          src={thumbnail}
                          alt={title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Heart
                            size={28}
                            className="text-muted-foreground opacity-25"
                          />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-xs text-foreground line-clamp-2 text-center leading-relaxed">
                        {title}
                      </h3>
                      {sku && (
                        <div className="flex justify-center">
                          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                            {sku}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
