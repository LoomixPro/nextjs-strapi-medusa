import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../../../components/empty-cart-message"
import SignInPrompt from "../../../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

/**
 * Guide for creating a new Cart Template style
 *
 * This component serves as the layout wrapper for the shopping cart page.
 * If you intend to create a new style (e.g., style-3), you must consider the following:
 *
 * 1. Received Data (Props):
 *    - `cart`: The current cart object (`HttpTypes.StoreCart`). This contains the cart items,
 *      totals, and selected region/currency. If null or empty, you should show an empty cart state.
 *    - `customer`: The currently logged-in customer (`HttpTypes.StoreCustomer`). Used to decide
 *      whether to show a "Sign In" prompt above the cart.
 *    - `returnDeadlineDays`: (Optional) The number of days allowed for returns, used for display
 *      purposes in the cart summary or item list.
 *
 * 2. Layout Structure:
 *    A standard cart page is usually divided into two main sections:
 *    - Cart Items: A list of products currently in the cart (`ItemsTemplate`).
 *    - Order Summary: Subtotal, taxes, shipping, and the checkout button (`Summary`).
 *
 * 3. Conditional Rendering:
 *    - Empty Cart: You must handle the scenario where `cart?.items?.length` is 0 or undefined,
 *      typically by rendering an `<EmptyCartMessage />`.
 *    - Guest Checkout: If `!customer` is true, it is best practice to show a `<SignInPrompt />`
 *      so users can log in before proceeding to checkout.
 *
 * 4. Customizing Child Components:
 *    You can modify `ItemsTemplate`, `Summary`, and other child elements by creating new versions
 *    of them inside your style's directory (e.g., `styles/style-3/items.tsx`).
 */
const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  returnDeadlineDays?: number
}) => {
  return (
    <div className="pt-28 sm:pt-24 pb-28 sm:pb-24 min-h-[80vh]">
      <div className="content-container" data-testid="cart-container">
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-40">
            <div className="flex flex-col py-6 gap-y-6">
              {!customer && (
                <>
                  <SignInPrompt />
                  <Divider />
                </>
              )}
              <ItemsTemplate cart={cart} />
            </div>
            <div className="relative">
              <div className="flex flex-col gap-y-8 sticky top-12">
                {cart && cart.region && (
                  <>
                    <div className="py-6">
                      <Summary cart={cart as any} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
