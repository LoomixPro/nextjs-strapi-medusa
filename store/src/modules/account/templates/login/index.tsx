import { notFound } from "next/navigation"
import { STYLES } from "./registry"

export type LoginMethods = "email" | "phone" | "both"

export default async function LoginTemplateSwitcher({
  loginMethods = "email",
  style = "style-1",
  images = [],
}: {
  loginMethods?: LoginMethods
  style?: string
  images?: string[]
}) {
  const Component = STYLES[style] || STYLES["style-1"]

  if (!Component) {
    console.error(`Failed to load Login style: ${style}`)
    return notFound()
  }

  return <Component loginMethods={loginMethods} images={images} />
}
