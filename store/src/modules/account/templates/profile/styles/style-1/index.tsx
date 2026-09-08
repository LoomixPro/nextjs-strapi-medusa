import React from "react"

import AccountNav from "./components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

/**
 * Guide for creating a new Profile Account Layout style
 *
 * This component serves as the layout wrapper for the customer account pages
 * (such as Profile, Orders, Addresses, etc.).
 * If you intend to create a new style (e.g., style-3), you must consider the following:
 *
 * 1. Received Data (Props):
 *    - `customer`: The currently logged-in customer object (`HttpTypes.StoreCustomer`).
 *      If the user is logged out, this might be null.
 *    - `children`: The React components for the specific active account route (like the orders list,
 *      or the profile edit form). You must render `{children}` somewhere in your layout so the actual
 *      content is visible.
 *
 * 2. Layout Structure:
 *    The account area is typically split into two sections:
 *    - The Navigation/Sidebar (`AccountNav`): To switch between overview, profile, orders, addresses, etc.
 *    - The Main Content Area: Where `{children}` is rendered.
 *
 * 3. Customizing Child Components:
 *    You can modify the `AccountNav` by editing or creating a new version of it inside
 *    your style's `components` folder. The same goes for other UI elements on the account pages.
 *
 * 4. Final Output (Return):
 *    Your component should return JSX acting as the structural wrapper. Ensure it handles
 *    responsive design (e.g., a bottom tab or collapsible menu on mobile, and a sidebar on desktop).
 */
const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div
      className="flex-1 small:py-12 pb-24 md:pb-0"
      data-testid="account-page"
    >
      <div className="flex-1 content-container h-full max-w-5xl mx-auto flex flex-col pt-4 md:pt-0">
        <div className="flex flex-col md:flex-row gap-8 md:gap-10 py-8 md:py-12">
          {customer && (
            <div className="md:w-64 shrink-0">
              <AccountNav customer={customer} />
            </div>
          )}
          <div className="flex-1 w-full min-w-0">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
