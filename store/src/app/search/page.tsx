import { redirect } from "next/navigation"

export default function SearchPage() {
  const defaultRegion = (
    process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"
  ).toLowerCase()
  redirect(`/${defaultRegion}/store`)
}
