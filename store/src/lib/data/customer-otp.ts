"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCacheTag, setAuthToken } from "./cookies"
import { transferCart } from "./customer-auth"
import { authLog } from "@lib/util/auth-log"
import {
  checkOtpRequestAllowed,
  checkOtpVerifyAllowed,
  recordOtpVerifyFailure,
  resetOtpVerifyFailures,
} from "@lib/util/auth-security"

/**
 * Email OTP Login — Step 1
 * Triggers OTP to be sent to an existing account's email.
 */
export async function requestEmailLoginOtp(
  email: string
): Promise<{ success: boolean; error?: string }> {
  // ── Security: OTP request rate limit + cooldown ───────────────────────────
  const limitCheck = await checkOtpRequestAllowed(email)
  if (!limitCheck.allowed) {
    return { success: false, error: limitCheck.error }
  }

  // 1. Optimistic Login: Try to verify user exists by logging in (triggering OTP)
  try {
    const response = (await sdk.auth.login("customer", "email-otp", {
      email,
    })) as any

    if (response?.location === "otp" || response === "otp") {
      return { success: true }
    }
    authLog(
      `requestEmailLoginOtp step-1 (email=${email}) — unexpected response`,
      response
    )
  } catch (err: any) {
    // Login failed, likely user does not exist. Proceed to registration.
    authLog(`requestEmailLoginOtp step-1 (email=${email})`, err)
    const msg = err?.message?.toLowerCase() || ""
    if (msg.includes("too many") || msg.includes("429")) {
      return { success: false, error: "error:too_many_otp_requests" }
    }
  }

  // 2. Registration: Create user if they didn't exist
  try {
    const { token: regToken } = await sdk.client.fetch<{ token: string }>(
      `/auth/customer/email-otp/register`,
      {
        method: "POST",
        body: { email },
      }
    )

    // New user — create customer with registration token
    await setAuthToken(regToken as string)
    const headers = {
      ...(await getAuthHeaders()),
    }

    const emailName =
      email.split("@")[0]?.replace(/[^a-zA-Z0-9]/g, "") || "User"
    await sdk.store.customer.create(
      {
        email,
        first_name: emailName,
        last_name: "",
        metadata: {
          login_method: "email-otp",
          username: `user_${crypto.randomUUID().slice(0, 8)}`,
        },
      },
      {},
      headers
    )
  } catch (err) {
    // Registration may fail if user exists; log but continue to retry login
    authLog(`requestEmailLoginOtp step-2 register (email=${email})`, err)
  }

  // 3. Retry Login: Needed if we just registered (to trigger OTP)
  try {
    const response = (await sdk.auth.login("customer", "email-otp", {
      email,
    })) as any

    if (response?.location === "otp" || response === "otp") {
      return { success: true }
    }
    return { success: false, error: "error:send_failed" }
  } catch (err: any) {
    authLog(`requestEmailLoginOtp step-3 (email=${email})`, err)
    const msg = err?.message?.toLowerCase() || ""
    if (msg.includes("too many") || msg.includes("429")) {
      return { success: false, error: "error:too_many_otp_requests" }
    }
    return { success: false, error: "error:send_failed" }
  }
}

/**
 * Email OTP Login — Step 2
 * Verifies OTP and logs the user in.
 */
export async function verifyEmailLoginOtp({
  otp,
  email,
}: {
  otp: string
  email: string
}): Promise<{ success: boolean; error?: string }> {
  // ── Security: OTP verify rate limit ──────────────────────────────────────
  const verifyCheck = await checkOtpVerifyAllowed(email)
  if (!verifyCheck.allowed) {
    return { success: false, error: verifyCheck.error }
  }

  try {
    const token = await sdk.auth.callback("customer", "email-otp", {
      email,
      otp,
    })

    const authToken = (token as any).token || token
    await setAuthToken(authToken as string)

    // Clear verify failure counter on success
    await resetOtpVerifyFailures(email)

    const headers = { Authorization: `Bearer ${authToken}` }

    // Try fetching existing customer record
    let { customer } = await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        headers,
      })
      .catch(() => ({ customer: null }))

    // If no customer record yet, it means registration failed previously.
    // We shouldn't create it here because the token will be stale.
    if (!customer) {
      try {
        const adminUrl =
          process.env.MEDUSA_BACKEND_URL ||
          process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
          "http://localhost:9000"
        await fetch(`${adminUrl}/store/auth-identity/cleanup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            "x-publishable-api-key":
              process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
          },
          body: JSON.stringify({ entity_id: email }),
        })
        return { success: false, error: "error:auth_cleanup_refreshed" }
      } catch (cleanupErr) {
        authLog("verifyEmailLoginOtp: cleanup failed", cleanupErr)
        return { success: false, error: "error:account_setup_failed" }
      }
    } else if (!customer.metadata?.username) {
      // Existing customer without a username — assign one
      const username = `user_${crypto.randomUUID().slice(0, 8)}`
      await sdk.store.customer
        .update(
          { metadata: { ...(customer.metadata || {}), username } },
          {},
          headers
        )
        .catch((e) =>
          console.error("Error setting username in verifyEmailLoginOtp:", e)
        )
    }

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag, "max")

    await transferCart()

    return { success: true }
  } catch {
    // Record the failed attempt and return a generic error
    const failResult = await recordOtpVerifyFailure(email)
    if (failResult.locked) {
      return {
        success: false,
        error: `error:otp_verify_limit|${failResult.lockedForSeconds ?? 1800}`,
      }
    }
    return { success: false, error: "error:invalid_code" }
  }
}

export const authenticateWithPhone = async (phone: string) => {
  // ── Security: OTP request rate limit + cooldown ───────────────────────────
  const limitCheck = await checkOtpRequestAllowed(phone)
  if (!limitCheck.allowed) {
    return limitCheck.error as string
  }

  // 1. Optimistic Login: Try to verify user exists by logging in (triggering OTP)
  try {
    const response = (await sdk.auth.login("customer", "phone-auth", {
      phone,
    })) as { location?: string }

    // If login initiated successfully (OTP sent), return true
    if (response.location === "otp") {
      return true
    }
    authLog(
      `authenticateWithPhone step-1 (phone=${phone}) — unexpected response`,
      response
    )
  } catch (err: any) {
    // Login failed, likely user does not exist. Proceed to registration.
    authLog(`authenticateWithPhone step-1 (phone=${phone})`, err)
    const msg = err?.message?.toLowerCase() || ""
    if (msg.includes("too many") || msg.includes("429")) {
      return "error:too_many_otp_requests"
    }
  }

  // 2. Registration: Create user if they didn't exist
  try {
    const { token: regToken } = await sdk.client.fetch<{ token: string }>(
      `/auth/customer/phone-auth/register`,
      {
        method: "POST",
        body: {
          phone,
        },
      }
    )

    // New user — create customer with registration token
    await setAuthToken(regToken as string)
    const headers = {
      ...(await getAuthHeaders()),
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, "")
    const email = `${cleanPhone.replace(/\+/g, "")}@phone.local`
    await sdk.store.customer.create(
      {
        email,
        phone: cleanPhone,
        metadata: {
          login_method: "phone",
          username: `user_${crypto.randomUUID().slice(0, 8)}`,
        },
      },
      {},
      headers
    )
  } catch (err) {
    // Registration may fail if user exists; log but continue to retry login
    authLog(`authenticateWithPhone step-2 register (phone=${phone})`, err)
  }

  // 3. Retry Login: Needed if we just registered (to trigger OTP)
  try {
    const response = (await sdk.auth.login("customer", "phone-auth", {
      phone,
    })) as { location?: string }

    if (!response.location || response.location !== "otp") {
      authLog(
        `authenticateWithPhone step-3 (phone=${phone}) — unexpected response`,
        response
      )
      throw new Error("error:send_failed")
    }

    return true
  } catch (err: any) {
    authLog(`authenticateWithPhone step-3 (phone=${phone})`, err)
    const msg = err?.message?.toLowerCase() || ""
    if (msg.includes("too many") || msg.includes("429")) {
      return "error:too_many_otp_requests"
    }
    return "error:send_failed"
  }
}

export const verifyOtp = async ({
  otp,
  phone,
}: {
  otp: string
  phone: string
}) => {
  // ── Security: OTP verify rate limit ──────────────────────────────────────
  const verifyCheck = await checkOtpVerifyAllowed(phone)
  if (!verifyCheck.allowed) {
    return verifyCheck.error as string
  }

  try {
    const token = await sdk.auth.callback("customer", "phone-auth", {
      phone,
      otp,
    })

    const authToken = (token as any).token || token

    await setAuthToken(authToken as string)

    // Clear verify failure counter on success
    await resetOtpVerifyFailures(phone)

    // Ensure username exists on verifyOtp
    const headers = { Authorization: `Bearer ${authToken}` }
    let { customer } = await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        headers,
      })
      .catch(() => ({ customer: null }))

    if (!customer) {
      // No customer record — either new user or customer was deleted.
      // Auto-create a fresh customer record so the login completes successfully.
      try {
        const cleanPhone = phone.replace(/[^0-9+]/g, "")
        const email = `${cleanPhone.replace(/\+/g, "")}@phone.local`
        const username = `user_${crypto.randomUUID().slice(0, 8)}`
        const createResult = await sdk.store.customer.create(
          {
            email,
            phone: cleanPhone,
            metadata: {
              login_method: "phone",
              username,
            },
          },
          {},
          headers
        )
        customer = createResult.customer ?? null
      } catch (createErr: any) {
        // Customer creation can fail with "customer_id already exists in app_metadata"
        // when the customer was deleted from the dashboard but their AuthIdentity
        // was not cleaned up. We call the cleanup endpoint to delete the stale identity.
        authLog("verifyOtp: auto-create customer failed (attempt 1)", createErr)
        try {
          const adminUrl =
            process.env.MEDUSA_BACKEND_URL ||
            process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
            "http://localhost:9000"
          await fetch(`${adminUrl}/store/auth-identity/cleanup`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
              "x-publishable-api-key":
                process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
            },
            body: JSON.stringify({ entity_id: phone }),
          })
          // Since the old identity was deleted, the current auth token is now invalid.
          // The user MUST request a new OTP to create a fresh identity.
          return "error:auth_cleanup_refreshed"
        } catch (cleanupErr) {
          authLog("verifyOtp: cleanup failed", cleanupErr)
          return "error:account_setup_failed"
        }
      }
    } else if (!customer.metadata?.username) {
      const username = `user_${crypto.randomUUID().slice(0, 8)}`
      await sdk.store.customer
        .update(
          {
            metadata: {
              ...(customer.metadata || {}),
              username,
            },
          },
          {},
          headers
        )
        .catch((e) => console.error("Error setting username in verifyOtp:", e))
    }

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag, "max")

    await transferCart()

    return true
  } catch {
    // Record the failed attempt and return a generic error
    const failResult = await recordOtpVerifyFailure(phone)
    if (failResult.locked) {
      return `error:otp_verify_limit|${failResult.lockedForSeconds ?? 1800}`
    }
    return "error:invalid_code"
  }
}
