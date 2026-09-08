import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import { getTranslations } from "next-intl/server"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StarRating from "@modules/common/components/star-rating"

interface ProductInfoV2Props {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  averageRating?: number
  reviewCount?: number
}

export default async function ProductInfoV2({
  product,
  variant,
  averageRating = 0,
  reviewCount = 0,
}: ProductInfoV2Props) {
  const t = await getTranslations("Product.info")
  return (
    <div className="space-y-1">
      {product.collection && (
        <LocalizedClientLink
          href={`/collections/${product.collection.handle}`}
          className="text-xs font-sans uppercase tracking-widest text-ui-fg-muted hover:text-ui-fg-base transition-colors"
        >
          {product.collection.title}
        </LocalizedClientLink>
      )}
      <Heading
        level="h2"
        className="text-2xl font-bold tracking-tight text-ui-fg-base"
      >
        {product.title}
      </Heading>

      <div className="flex justify-between items-center pt-1 text-ui-fg-muted">
        <p className="text-[10px] uppercase tracking-wide">
          {t("model")} {product.handle} {variant?.sku ? `- ${variant.sku}` : ""}
        </p>
      </div>

      {reviewCount > 0 && (
        <a
          href="#reviews"
          className="flex items-center gap-3 pt-2 hover:opacity-80 transition-opacity"
        >
          <StarRating rating={averageRating} />
          <span className="text-sm text-gray-500">
            {averageRating.toFixed(1)}{" "}
            {t("reviews_count", { count: reviewCount })}
          </span>
        </a>
      )}
    </div>
  )
}
