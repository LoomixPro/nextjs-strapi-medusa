"use client"

import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@modules/common/components/shadcn/accordion"
import { Separator } from "@modules/common/components/shadcn/separator"

interface ProductDescriptionV2Props {
  product: HttpTypes.StoreProduct
}

export default function ProductDescriptionV2({
  product,
}: ProductDescriptionV2Props) {
  const t = useTranslations("Product.description")
  if (!product.description && !product.metadata?.details) {
    return null
  }

  return (
    <div className="w-full">
      <Separator className="bg-ui-border-base" />
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="description" className="border-none">
          <AccordionTrigger className="text-sm font-bold uppercase tracking-wide py-5 hover:no-underline">
            {t("details_care", { title: product.title })}
          </AccordionTrigger>
          <AccordionContent className="text-xs leading-relaxed text-ui-fg-subtle pb-6 whitespace-pre-line">
            {product.description ?? t("no_description")}
            {!!product.metadata?.details && (
              <div className="mt-4 pt-4 border-t border-ui-border-base">
                <p className="font-bold mb-2">{t("specifications")}</p>
                <div className="space-y-1">
                  {JSON.stringify(product.metadata.details)}
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      <Separator className="bg-ui-border-base" />
    </div>
  )
}
