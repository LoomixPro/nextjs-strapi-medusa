import { notFound } from "next/navigation"
import { getProfileComponent } from "@modules/account/templates/profile"
import { getRegion } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"
import { getMessages } from "next-intl/server"
import { Suspense } from "react"
import SkeletonAddresses from "@/modules/common/skeletons/templates/skeleton-addresses"

export async function generateMetadata() {
  const messages: any = await getMessages()
  return {
    title: messages.Account?.AddressBook?.navigation_label || "Addresses",
    description:
      messages.Account?.AddressBook?.address_book_description ||
      "View your addresses",
  }
}

export default function Addresses(props: {
  params: Promise<{ countryCode: string }>
}) {
  return (
    <Suspense fallback={<SkeletonAddresses />}>
      <AddressesContent params={props.params} />
    </Suspense>
  )
}

async function AddressesContent(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const customer = await retrieveCustomer()
  const region = await getRegion(countryCode)

  if (!customer || !region) {
    notFound()
  }

  const AddressBook = await getProfileComponent("address-book")

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      {AddressBook && <AddressBook customer={customer} region={region} />}
    </div>
  )
}
