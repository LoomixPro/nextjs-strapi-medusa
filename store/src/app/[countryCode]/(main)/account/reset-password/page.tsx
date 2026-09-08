import { Metadata } from "next"
import ResetPasswordTemplate from "@modules/account/templates/reset-password"
import InstantPageBoundary from "@modules/common/components/instant-page-boundary"
import SkeletonResetPassword from "@/modules/common/skeletons/templates/skeleton-reset-password"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your account.",
}

type Props = {
  searchParams: Promise<{ token?: string; email?: string }>
}

export default function ResetPassword(props: Props) {
  return (
    <InstantPageBoundary fallback={<SkeletonResetPassword />}>
      <ResetPasswordContent searchParams={props.searchParams} />
    </InstantPageBoundary>
  )
}

async function ResetPasswordContent({ searchParams }: Props) {
  const params = await searchParams

  return <ResetPasswordTemplate token={params.token} email={params.email} />
}
