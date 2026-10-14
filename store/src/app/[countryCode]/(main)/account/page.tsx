import { getMessages } from "next-intl/server"
import { retrieveCustomer } from "@lib/data/customer"
import { redirect } from "next/navigation"
import { safeRedirectUrl } from "@lib/util/safe-redirect"

export async function generateMetadata() {
  const messages: any = await getMessages()
  return {
    title: messages.Account?.Nav?.overview || "Account",
    description:
      messages.Account?.Overview?.manage_account ||
      "Overview of your account activity.",
  }
}

import { Suspense } from "react"

export default function AccountPage(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <Suspense fallback={null}>
      <AccountRedirect
        params={props.params}
        searchParams={props.searchParams}
      />
    </Suspense>
  )
}

async function AccountRedirect(props: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const params = await props.params
  const countryCode = params?.countryCode || ""
  const redirectUrl = searchParams?.redirect

  if (redirectUrl && typeof redirectUrl === "string") {
    const customer = await retrieveCustomer().catch(() => null)
    if (customer) {
      redirect(safeRedirectUrl(redirectUrl, `/${countryCode}/account`))
    }
  }

  return null
}
