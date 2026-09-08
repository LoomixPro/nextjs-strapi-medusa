import { notFound } from "next/navigation"
import { retrieveCustomer, signout } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { getProfileComponent } from "@modules/account/templates/profile"
import { Metadata } from "next"
import { getMessages, getTranslations } from "next-intl/server"

export async function generateMetadata(): Promise<Metadata> {
  const messages: any = await getMessages()
  return {
    title: messages.Account?.Nav?.overview || "Account",
    description:
      messages.Account?.Overview?.manage_account ||
      "Overview of your account activity.",
  }
}

import { Suspense } from "react"
import SkeletonAccountPage from "@/modules/common/skeletons/templates/skeleton-account-page"

export default function OverviewTemplate(props: {
  params: Promise<{ countryCode: string }>
}) {
  return (
    <Suspense fallback={<SkeletonAccountPage />}>
      <OverviewContent params={props.params} />
    </Suspense>
  )
}

async function OverviewContent(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const tLogin = await getTranslations("Account.Login")
  const customer = await retrieveCustomer().catch(() => null)

  let orders = null
  let isUnauthorized = false

  try {
    orders = await listOrders()
  } catch (error: any) {
    if (
      error.message &&
      (error.message.includes("Unauthorized") || error.message.includes("401"))
    ) {
      isUnauthorized = true
    } else {
      orders = null
    }
  }

  if (!customer) {
    notFound()
  }

  if (isUnauthorized) {
    return (
      <div
        className="bg-white dark:bg-zinc-900 rounded-[24px] border border-gray-100 dark:border-zinc-800 overflow-hidden p-8 text-center flex flex-col items-center justify-center min-h-[300px]"
        data-testid="overview-page-wrapper"
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

  const AuthEventModule = await import(
    `@modules/account/templates/login/styles/style-1/components/auth-event`
  )
  const AuthEvent = AuthEventModule.default
  const Overview = await getProfileComponent("overview")

  return (
    <>
      {AuthEvent && <AuthEvent customer={customer} />}
      {Overview && <Overview customer={customer} orders={orders} />}
    </>
  )
}
