import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"

interface ProductDescriptionProps {
  product: HttpTypes.StoreProduct
}

export default function ProductDescriptionStyle2({
  product,
}: ProductDescriptionProps) {
  const t = useTranslations("Product.description")
  return (
    <div className="bg-muted/40 p-6 rounded-xl border border-border/50 mb-8">
      <h3 className="font-bold text-foreground mb-3">{t("title")}</h3>
      <div
        className="max-h-[220px] overflow-y-auto no-scrollbar text-muted-foreground text-sm leading-7 whitespace-pre-wrap pb-12"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, black 80%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
        }}
      >
        {product.description}
      </div>
    </div>
  )
}
