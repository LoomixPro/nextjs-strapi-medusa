import { retrieveOrder } from "@lib/data/orders"
import OrderCompletedTemplate from "@/modules/order/templates"
import ClearCartOnMount from "@modules/order/components/clear-cart"
import InstantPageBoundary from "@modules/common/components/instant-page-boundary"
import SkeletonOrderConfirmed from "@/modules/common/skeletons/templates/skeleton-order-confirmed"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "You purchase was successful",
}

export default function OrderConfirmedPage(props: Props) {
  return (
    <InstantPageBoundary fallback={<SkeletonOrderConfirmed />}>
      <OrderConfirmedContent params={props.params} />
    </InstantPageBoundary>
  )
}

async function OrderConfirmedContent({ params: paramsPromise }: Props) {
  const params = await paramsPromise
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    return notFound()
  }

  return (
    <>
      <ClearCartOnMount />
      <OrderCompletedTemplate order={order} />
    </>
  )
}
