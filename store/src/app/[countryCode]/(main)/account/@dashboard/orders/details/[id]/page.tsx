import { retrieveOrder } from "@lib/data/orders"
import { getTranslations } from "next-intl/server"
import { getProfileComponent } from "@modules/account/templates/profile"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStorefrontSettings } from "@lib/data/strapi-settings"
import { Suspense } from "react"
import SkeletonOrderDetails from "@/modules/common/skeletons/templates/skeleton-order-details"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const t = await getTranslations("Account.Orders")
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    notFound()
  }

  return {
    title: t("details_description", { id: order.display_id ?? "" }),
    description: t("description"),
  }
}

export default function OrderDetailPage(props: Props) {
  return (
    <Suspense fallback={<SkeletonOrderDetails />}>
      <OrderDetailContent params={props.params} />
    </Suspense>
  )
}

async function OrderDetailContent(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    notFound()
  }

  const settings = await getStorefrontSettings()
  const returnDeadlineDays = settings.returnDeadlineDays ?? 7

  const OrderDetailsTemplate = await getProfileComponent("order-details")

  if (!OrderDetailsTemplate) {
    return null
  }

  return (
    <OrderDetailsTemplate
      order={order}
      returnDeadlineDays={returnDeadlineDays}
    />
  )
}
