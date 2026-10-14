import { retrieveOrder } from "@lib/data/orders"
import { listReturnShippingOptions, listReturnReasons } from "@lib/data/returns"
import ReturnRequestTemplate from "@modules/account/templates/return-request"
import InstantPageBoundary from "@modules/common/components/instant-page-boundary"
import SkeletonReturnRequest from "@/modules/common/skeletons/templates/skeleton-return-request"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { hasReturnableItems } from "@lib/util/returns"
import { getStorefrontSettings } from "@lib/data/strapi-settings"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)
  const settings = await getStorefrontSettings()
  const returnDeadlineDays = settings.returnDeadlineDays ?? 7

  if (!order || !hasReturnableItems(order, returnDeadlineDays)) {
    notFound()
  }

  return {
    title: `Return Request - Order #${order.display_id}`,
    description: `Request a return for your order`,
  }
}

export default function ReturnRequestPage(props: Props) {
  return (
    <InstantPageBoundary fallback={<SkeletonReturnRequest />}>
      <ReturnRequestContent params={props.params} />
    </InstantPageBoundary>
  )
}

async function ReturnRequestContent(props: Props) {
  const params = await props.params

  const order = await retrieveOrder(params.id).catch(() => null)
  const settings = await getStorefrontSettings()
  const returnDeadlineDays = settings.returnDeadlineDays ?? 7

  if (!order || !hasReturnableItems(order, returnDeadlineDays)) {
    return notFound()
  }

  const [shippingOptions, returnReasons] = await Promise.all([
    listReturnShippingOptions((order as any).cart?.id || ""),
    listReturnReasons(),
  ])

  return (
    <ReturnRequestTemplate
      order={order}
      shippingOptions={shippingOptions}
      returnReasons={returnReasons}
    />
  )
}
