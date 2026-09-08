import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@/modules/checkout/templates/styles/style-2/components/addresses"
import Payment from "@/modules/checkout/templates/styles/style-2/components/payment"
import Review from "@/modules/checkout/templates/styles/style-2/components/review"
import Shipping from "@/modules/checkout/templates/styles/style-2/components/shipping"
import CheckoutProgress from "@/modules/checkout/templates/styles/style-2/components/components/checkout-progress"

export default async function CheckoutStyle2({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          {/* Step Indicators */}
          <CheckoutProgress cart={cart} />

          {/* Sections */}
          <Addresses cart={cart} customer={customer} />
          <Shipping cart={cart} availableShippingMethods={shippingMethods} />
          <Payment cart={cart} availablePaymentMethods={paymentMethods} />
          <Review cart={cart} />
        </div>
      </div>
    </div>
  )
}
