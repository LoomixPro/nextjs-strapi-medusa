"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCacheOptions, getCacheTag } from "./cookies"
import { authLog } from "@lib/util/auth-log"

import * as customerAuth from "./customer-auth"
import * as customerOtp from "./customer-otp"

// ── Backward-compatible Server Action delegates ──────────────────────────────
// Next.js Turbopack strictly requires every export in a "use server" file to be
// a declared async function (export { ... } from "..." or export * is rejected).

export async function login(currentState: unknown, formData: FormData) {
  return customerAuth.login(currentState, formData)
}

export async function signout(countryCode: string) {
  return customerAuth.signout(countryCode)
}

export async function transferCart() {
  return customerAuth.transferCart()
}

export async function loginWithGoogle(formData?: FormData) {
  return customerAuth.loginWithGoogle(formData)
}

export async function validateGoogleCallback(
  searchParams: Record<string, string>
) {
  return customerAuth.validateGoogleCallback(searchParams)
}

export async function requestPasswordReset(email: string) {
  return customerAuth.requestPasswordReset(email)
}

export async function resetPassword(data: {
  email: string
  password: string
  token: string
}) {
  return customerAuth.resetPassword(data)
}

export async function requestEmailLoginOtp(email: string) {
  return customerOtp.requestEmailLoginOtp(email)
}

export async function verifyEmailLoginOtp(data: {
  otp: string
  email: string
}) {
  return customerOtp.verifyEmailLoginOtp(data)
}

export async function authenticateWithPhone(phone: string) {
  return customerOtp.authenticateWithPhone(phone)
}

export async function verifyOtp(data: { otp: string; phone: string }) {
  return customerOtp.verifyOtp(data)
}

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()

    if (!authHeaders || !("authorization" in authHeaders)) {
      return null
    }

    const token = authHeaders.authorization.split(" ")[1]
    if (token) {
      try {
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64").toString()
        )
        if (payload.exp && payload.exp < Date.now() / 1000) {
          return null
        }
      } catch {
        // ignore
      }
    }

    const headers = {
      ...authHeaders,
    }

    const next = {
      ...(await getCacheOptions("customers")),
    }

    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: {
          fields: "*orders,*addresses",
        },
        headers,
        next,
        cache: "force-cache",
      })
      .then(({ customer }) => customer)
      .catch(() => null)
  }

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(body, {}, headers)
    .then(({ customer }) => customer)
    .catch(medusaError)

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag, "max")

  return updateRes
}

export const addCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const isDefaultBilling = (currentState.isDefaultBilling as boolean) || false
  const isDefaultShipping = (currentState.isDefaultShipping as boolean) || false

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
    phone: formData.get("phone") as string,
    is_default_billing: isDefaultBilling,
    is_default_shipping: isDefaultShipping,
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag, "max")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<void> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.customer
    .deleteAddress(addressId, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag, "max")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const updateCustomerAddress = async (
  currentState: Record<string, unknown>,
  formData: FormData
): Promise<any> => {
  const addressId =
    (currentState.addressId as string) || (formData.get("addressId") as string)

  if (!addressId) {
    return { success: false, error: "Address ID is required" }
  }

  const address = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: formData.get("company") as string,
    address_1: formData.get("address_1") as string,
    address_2: formData.get("address_2") as string,
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
  } as HttpTypes.StoreUpdateCustomerAddress

  const phone = formData.get("phone") as string

  if (phone) {
    address.phone = phone
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .updateAddress(addressId, address, {}, headers)
    .then(async () => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag, "max")
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

/**
 * Request Profile Phone Update OTP
 */
export async function requestPhoneUpdateOtp(
  phone: string
): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders()

  try {
    const response = await sdk.client.fetch<{
      success: boolean
      message: string
    }>(`/store/customers/me/phone-update/request`, {
      method: "POST",
      body: { phone },
      headers,
    })

    if (response?.success) {
      return { success: true }
    }
    return { success: false, error: "Failed to request OTP." }
  } catch (err: any) {
    authLog(`requestPhoneUpdateOtp(phone=${phone})`, err)
    const status = err?.status || err?.response?.status
    const msg = (err?.message || "").toLowerCase()

    if (
      status === 409 ||
      msg.includes("409") ||
      msg.includes("conflict") ||
      msg.includes("already registered")
    ) {
      return { success: false, error: "duplicate" }
    }
    if (
      status === 429 ||
      msg.includes("429") ||
      msg.includes("too many") ||
      msg.includes("rate limit")
    ) {
      return { success: false, error: "rate_limit" }
    }
    return {
      success: false,
      error: err.message || "Failed to send verification SMS.",
    }
  }
}

/**
 * Verify Profile Phone Update OTP
 */
export async function verifyPhoneUpdateOtp(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const headers = await getAuthHeaders()

  try {
    const response = await sdk.client.fetch<{
      success: boolean
      message: string
    }>(`/store/customers/me/phone-update/verify`, {
      method: "POST",
      body: { phone, code },
      headers,
    })

    if (response?.success) {
      // Revalidate customer cache tag so the profile page shows the new phone number
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag, "max")
      return { success: true }
    }
    return { success: false, error: "Verification failed." }
  } catch (err: any) {
    authLog(`verifyPhoneUpdateOtp(phone=${phone})`, err)
    const status = err?.status || err?.response?.status
    const msg = (err?.message || "").toLowerCase()

    if (
      status === 400 ||
      msg.includes("400") ||
      msg.includes("invalid") ||
      msg.includes("expired")
    ) {
      return { success: false, error: "invalid_code" }
    }
    if (
      status === 409 ||
      msg.includes("409") ||
      msg.includes("conflict") ||
      msg.includes("already registered")
    ) {
      return { success: false, error: "duplicate" }
    }
    return {
      success: false,
      error: err.message || "Failed to verify phone number.",
    }
  }
}
