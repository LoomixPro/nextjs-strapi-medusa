import { Suspense } from "react"
import SkeletonCartPage from "@/modules/common/skeletons/templates/skeleton-cart-page"
import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplateResolver from "@modules/cart/templates"
import { notFound } from "next/navigation"

import { getMessages } from "next-intl/server"

export async function generateMetadata() {
  const messages: any = await getMessages()
  return {
    title: messages.Cart?.title || "Cart",
    description: messages.Cart?.empty_message || "View your cart",
  }
}

export default function Cart() {
  return (
    <Suspense fallback={<SkeletonCartPage />}>
      <CartContent />
    </Suspense>
  )
}

async function CartContent() {
  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()

  return <CartTemplateResolver cart={cart} customer={customer} />
}
