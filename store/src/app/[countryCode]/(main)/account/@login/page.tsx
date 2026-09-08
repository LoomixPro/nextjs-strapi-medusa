import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login"
import { getStorefrontSettings } from "@lib/data/strapi-settings"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Medusa Store account.",
}

export default async function Login() {
  const settings = await getStorefrontSettings()
  const loginMethods = settings?.loginPage?.loginMethods || "email"
  const style = settings?.loginPage?.template || "style-1"
  const images = settings?.loginPage?.images || []

  return (
    <LoginTemplate loginMethods={loginMethods} style={style} images={images} />
  )
}
