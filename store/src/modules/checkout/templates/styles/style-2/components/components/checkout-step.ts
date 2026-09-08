import { HttpTypes } from "@medusajs/types"

export const getNextIncompleteStep = (cart: HttpTypes.StoreCart) => {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if ((cart.shipping_methods?.length ?? 0) === 0) {
    return "delivery"
  } else if (
    !cart.payment_collection?.payment_sessions?.length &&
    cart.total > 0
  ) {
    return "payment"
  } else {
    return "review"
  }
}
