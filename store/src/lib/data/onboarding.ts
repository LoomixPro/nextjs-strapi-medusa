"use server"

import { redirect } from "next/navigation"

import { requireCookieStore } from "@lib/util/safe-cookies"

const MEDUSA_ADMIN_URL =
  process.env.MEDUSA_ADMIN_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_ADMIN_URL ||
  "http://localhost:7001"

export async function resetOnboardingState(orderId: string) {
  const cookies = await requireCookieStore()
  cookies.set("_medusa_onboarding", "false", { maxAge: -1 })
  redirect(`${MEDUSA_ADMIN_URL}/a/orders/${orderId}`)
}
