import { Suspense } from "react"
import SkeletonAccountLayout from "@/modules/common/skeletons/templates/skeleton-account-layout"
import { retrieveCustomer } from "@lib/data/customer"
import { getStorefrontSettings } from "@lib/data/strapi-settings"
import AccountLayout from "@modules/account/templates/profile"

export default function AccountPageLayout({
  dashboard,
  login,
  children,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <Suspense fallback={<SkeletonAccountLayout />}>
      <AccountPageLayoutContent dashboard={dashboard} login={login}>
        {children}
      </AccountPageLayoutContent>
    </Suspense>
  )
}

async function AccountPageLayoutContent({
  dashboard,
  login,
  children,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
  children?: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  const settings = await getStorefrontSettings()
  const style = settings.profilePage?.template ?? "style-1"

  return (
    <AccountLayout customer={customer} style={style}>
      {children}
      {customer ? dashboard : login}
    </AccountLayout>
  )
}
