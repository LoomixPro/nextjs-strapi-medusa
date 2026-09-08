import { getMessages } from "next-intl/server"
import { retrieveCustomer } from "@lib/data/customer"
import { redirect } from "next/navigation"

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
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  return (
    <Suspense fallback={null}>
      <AccountRedirect searchParams={props.searchParams} />
    </Suspense>
  )
}

async function AccountRedirect(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const redirectUrl = searchParams?.redirect

  if (redirectUrl && typeof redirectUrl === "string") {
    const customer = await retrieveCustomer().catch(() => null)
    if (customer) {
      redirect(redirectUrl)
    }
  }

  return null
}
