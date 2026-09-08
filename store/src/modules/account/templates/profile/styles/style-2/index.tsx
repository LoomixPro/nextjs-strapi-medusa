import React from "react"
import { HttpTypes } from "@medusajs/types"
import AccountNav from "./components/account-nav"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div
      className="relative flex-1 small:py-12 pb-24 md:pb-0 overflow-hidden bg-background"
      data-testid="account-page"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[50%] bg-indigo-500/20 dark:bg-indigo-600/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-lighten pointer-events-none animate-pulse-slow"></div>
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-purple-500/20 dark:bg-purple-600/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-lighten pointer-events-none animate-pulse-slow"
        style={{ animationDelay: "2s" }}
      ></div>
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[40%] bg-pink-500/10 dark:bg-pink-600/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-lighten pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>

      <div className="relative z-10 flex-1 content-container h-full max-w-7xl mx-auto flex flex-col pt-4 md:pt-0">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 py-8 md:py-12">
          {customer && (
            <div className="lg:w-72 shrink-0">
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
