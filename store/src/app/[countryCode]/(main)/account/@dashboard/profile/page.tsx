import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getProfileComponent } from "@modules/account/templates/profile"

import { listRegions } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account.Nav")

  return {
    title: t("profile"),
    description: "View and edit your Medusa Store profile.",
  }
}

export default async function Profile() {
  const customer = await retrieveCustomer()
  const regions = await listRegions()
  const t = await getTranslations("Account.Profile")

  if (!customer || !regions) {
    notFound()
  }

  const ProfileDetails = await getProfileComponent("profile-details")

  return (
    <div className="w-full" data-testid="profile-page-wrapper">
      {ProfileDetails && (
        <ProfileDetails customer={customer} regions={regions} />
      )}
    </div>
  )
}
