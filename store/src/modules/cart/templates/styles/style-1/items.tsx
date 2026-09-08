import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Heading } from "@medusajs/ui"
import { getTranslations } from "next-intl/server"

import Item from "@modules/cart/components/item"
import SkeletonLineItem from "@/modules/common/skeletons/components/skeleton-line-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = async ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  const t = await getTranslations("Cart")

  return (
    <div>
      <div className="pb-3 flex items-center">
        <Heading className="text-2xl small:text-[2rem] leading-8 small:leading-[2.75rem]">
          {t("title")}
        </Heading>
      </div>
      <table className="w-full bg-transparent border-collapse">
        <thead>
          <tr className="text-muted-foreground text-xs font-semibold border-b border-border/80">
            <th className="!pl-0 ltr:text-left rtl:text-right pb-4 font-bold uppercase tracking-wider">
              {t("item")}
            </th>
            <th className="pb-4"></th>
            <th className="text-center pb-4 font-bold uppercase tracking-wider">
              {t("quantity")}
            </th>
            <th className="hidden small:table-cell text-center pb-4 font-bold uppercase tracking-wider">
              {t("price")}
            </th>
            <th className="!pr-0 text-center pb-4 font-bold uppercase tracking-wider">
              {t("total")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {items
            ? items
                .sort((a, b) => {
                  return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                })
                .map((item) => {
                  return (
                    <Item
                      key={item.id}
                      item={item}
                      currencyCode={cart?.currency_code}
                    />
                  )
                })
            : repeat(5).map((i) => {
                return <SkeletonLineItem key={i} />
              })}
        </tbody>
      </table>
    </div>
  )
}

export default ItemsTemplate
