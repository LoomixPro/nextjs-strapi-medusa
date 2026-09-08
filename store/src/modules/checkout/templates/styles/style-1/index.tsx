import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@/modules/checkout/templates/styles/style-1/components/addresses"
import Payment from "@/modules/checkout/templates/styles/style-1/components/payment"
import Review from "@/modules/checkout/templates/styles/style-1/components/review"
import Shipping from "@/modules/checkout/templates/styles/style-1/components/shipping"

/**
 * Guide for creating a new Checkout Template style
 *
 * This component acts as the main form and layout for the checkout process.
 * If you intend to create a new style (e.g., style-3), you must consider the following:
 *
 * 1. Received Data (Props):
 *    - `cart`: The current cart object (`HttpTypes.StoreCart`). It is required for the checkout
 *      process. If it's missing, the component should return null or redirect.
 *    - `customer`: The currently logged-in customer (`HttpTypes.StoreCustomer`). This is passed
 *      down to pre-fill address forms or save new addresses to the customer's account.
 *
 * 2. Server-side Data Fetching:
 *    Because this is an async Server Component, it fetches required data before rendering:
 *    - `shippingMethods`: Fetched using the `cart.id`.
 *    - `paymentMethods`: Fetched using the `cart.region.id`.
 *    Both of these must be passed down to their respective child components.
 *
 * 3. Checkout Steps & Components:
 *    The checkout flow is generally composed of the following sequential steps:
 *    - `Addresses`: Form for collecting shipping and billing addresses.
 *    - `Shipping`: Selection of the shipping method (requires `availableShippingMethods`).
 *    - `Payment`: Selection of the payment method (requires `availablePaymentMethods`).
 *    - `Review`: Final order review and the "Place Order" submit button.
 *
 * 4. Customizing the Flow:
 *    You can rearrange these steps, merge them into a single-page accordion, or separate them
 *    into multi-step wizards by customizing this wrapper and its child components inside
 *    your style's `components` directory.
 */
export default async function CheckoutForm({
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
    <div className="w-full grid grid-cols-1 gap-y-8">
      <Addresses cart={cart} customer={customer} />

      <Shipping cart={cart} availableShippingMethods={shippingMethods as any} />

      <Payment cart={cart} availablePaymentMethods={paymentMethods} />

      <Review cart={cart} />
    </div>
  )
}
