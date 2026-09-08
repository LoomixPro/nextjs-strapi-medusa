import { HttpTypes } from "@medusajs/types"
import { getTranslations } from "next-intl/server"
import ProductPrice from "@modules/products/components/product-price"
import StarRating from "@modules/common/components/star-rating"

interface ProductInfoProps {
  product: HttpTypes.StoreProduct
  averageRating?: number
  reviewCount?: number
}

/**
 * ProductInfoStyle2 Component
 *
 * Displays the core information of a product including title, stock status, SKU,
 * average rating, review count, and price in a specific layout style (Style 2).
 *
 * @param product - The store product data
 * @param averageRating - The computed average rating score for the product
 * @param reviewCount - The total number of reviews for the product
 * @returns React Component displaying product information
 */
export default async function ProductInfoStyle2({
  product,
  averageRating = 0,
  reviewCount = 0,
}: ProductInfoProps) {
  const t = await getTranslations("Product.info")
  return (
    <div className="pb-6 border-b border-border/50">
      <h1 className="text-3xl font-extrabold text-foreground leading-snug">
        {product.title}
      </h1>
      <div className="flex items-center mt-3 gap-3">
        {/* Themed In Stock badge */}
        <div className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-xs font-bold">
          {t("in_stock")}
        </div>
        <div className="text-muted-foreground text-xs">
          {t("sku")} {product.variants?.[0]?.sku ?? "-"}
        </div>
      </div>
      <div className="flex items-center justify-between py-4 gap-4">
        {reviewCount > 0 ? (
          <a
            href="#reviews"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
          >
            <span className="text-primary font-bold text-xl">
              {averageRating.toFixed(1)}
            </span>
            <StarRating rating={averageRating} />
            <span className="text-muted-foreground text-sm">
              {t("reviews_count", { count: reviewCount })}
            </span>
          </a>
        ) : (
          <a
            href="#reviews"
            className="text-muted-foreground/80 hover:text-foreground text-xs leading-relaxed transition-colors max-w-[200px]"
          >
            {t("no_reviews_minimal")}
          </a>
        )}
        <div className="text-right shrink-0">
          <ProductPrice product={product} variant={undefined} />
        </div>
      </div>
    </div>
  )
}
