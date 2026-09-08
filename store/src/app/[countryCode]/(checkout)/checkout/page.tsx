import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { Suspense } from "react"
import SkeletonCheckoutPage from "@/modules/common/skeletons/templates/skeleton-checkout-page"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import {
  getCheckoutFormComponent,
  getCheckoutSummaryComponent,
} from "@modules/checkout/templates"
import BeginCheckoutEvent from "@modules/checkout/components/begin-checkout-event"
import { notFound, redirect } from "next/navigation"

import { getMessages } from "next-intl/server"

export async function generateMetadata() {
  const messages: any = await getMessages()
  return {
    title: messages.Cart?.checkout || "Checkout",
  }
}

export default function Checkout(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ step?: string }>
}) {
  return (
    <Suspense fallback={<SkeletonCheckoutPage />}>
      <CheckoutContent
        params={props.params}
        searchParams={props.searchParams}
      />
    </Suspense>
  )
}

async function CheckoutContent(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ step?: string }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams

  if (!searchParams.step) {
    redirect(`/${params.countryCode}/checkout?step=address`)
  }

  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const customer = await retrieveCustomer()

  if (!customer) {
    redirect(
      `/${params.countryCode}/account?redirect=/${params.countryCode}/checkout`
    )
  }

  const CheckoutForm = await getCheckoutFormComponent()
  const CheckoutSummary = await getCheckoutSummaryComponent()

  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
      <BeginCheckoutEvent cart={cart} />
      <PaymentWrapper cart={cart}>
        <CheckoutForm cart={cart} customer={customer} />
      </PaymentWrapper>
      <CheckoutSummary cart={cart} />
    </div>
  )
}
