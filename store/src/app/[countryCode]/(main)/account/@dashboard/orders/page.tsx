import { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { listOrders } from "@lib/data/orders"
import { signout, retrieveCustomer } from "@lib/data/customer"
import { getProfileComponent } from "@modules/account/templates/profile"
import { Suspense } from "react"
import SkeletonOrdersList from "@/modules/common/skeletons/templates/skeleton-orders-list"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account.Orders")
  return {
    title: t("title"),
    description: t("description"),
  }
}

export default function Orders(props: {
  params: Promise<{ countryCode: string }>
}) {
  return (
    <Suspense fallback={<SkeletonOrdersList />}>
      <OrdersContent params={props.params} />
    </Suspense>
  )
}

async function OrdersContent(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const t = await getTranslations("Account.Orders")
  const tLogin = await getTranslations("Account.Login")

  let orders = null
  let isUnauthorized = false
  let customer = null

  try {
    orders = await listOrders()
    customer = await retrieveCustomer()
  } catch (error: any) {
    if (
      error.message &&
      (error.message.includes("Unauthorized") || error.message.includes("401"))
    ) {
      isUnauthorized = true
    } else {
      throw error
    }
  }

  if (isUnauthorized) {
    return (
      <div
        className="bg-background rounded-[24px] border border-border overflow-hidden p-8 text-center flex flex-col items-center justify-center min-h-[300px]"
        data-testid="orders-page-wrapper"
      >
        <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center text-amber-500 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-2">
          {tLogin("session_expired_title")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-sm mb-6 font-light leading-relaxed">
          {tLogin("session_expired_desc")}
        </p>
        <form
          action={async () => {
            "use server"
            await signout(countryCode)
          }}
        >
          <button
            type="submit"
            className="px-6 py-2.5 bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full text-sm font-medium hover:bg-gray-800 dark:hover:bg-zinc-200 transition-colors duration-200"
          >
            {tLogin("login_again")}
          </button>
        </form>
      </div>
    )
  }

  if (!orders) {
    notFound()
  }

  const OrdersDetails = await getProfileComponent("orders-details")

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      {OrdersDetails && <OrdersDetails orders={orders} customer={customer} />}
    </div>
  )
}
