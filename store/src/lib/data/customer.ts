"use server"

import { sdk } from "@lib/config"
import { jwtDecode } from "jwt-decode"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { safeRedirectUrl } from "@lib/util/safe-redirect"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
  setCartId,
} from "./cookies"
import {
  checkLoginAllowed,
  checkOtpRequestAllowed,
  checkOtpVerifyAllowed,
  isHoneypotTripped,
  recordLoginFailure,
  recordOtpVerifyFailure,
  resetLoginFailures,
  resetOtpVerifyFailures,
} from "@lib/util/auth-security"

/**
 * Logs auth errors to the Next.js server console for developer debugging.
 *
 * The real error is NEVER sent to the browser — this only appears in your
 * terminal / server logs so you can diagnose issues without exposing internals.
 *
 * Usage: check the terminal where `npm run dev` is running.
 */
function authLog(context: string, error: unknown): void {
  const msg = error instanceof Error ? error.message : String(error)
  console.error(`[AUTH ERROR] ${context}: ${msg}`)
  if (error instanceof Error && error.stack) {
    console.error(error.stack)
  }
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

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const redirectUrl = formData.get("redirect") as string
  // Optional countryCode field — lets us redirect to /ir/account instead of /account
  const countryCode =
    (formData.get("countryCode") as string | null)?.toLowerCase() || ""

  // ── Security: honeypot check ──────────────────────────────────────────────
  // Bots that auto-fill all fields will populate the hidden _hp_name field.
  // Legitimate users never see or fill it, so any value here signals a bot.
  if (isHoneypotTripped(formData)) {
    // Silently reject without revealing the mechanism
    return "Invalid email or password."
  }

  // ── Security: account lockout check ───────────────────────────────────────
  // Deny immediately if the account is temporarily locked due to prior failures.
  const lockoutCheck = await checkLoginAllowed(email)
  if (!lockoutCheck.allowed) {
    return lockoutCheck.error
  }

  try {
    await sdk.auth
      .login("customer", "emailpass", { email, password })
      .then(async (token) => {
        const authToken = (token as any).token || token
        await setAuthToken(authToken as string)

        // Clear failure counter on successful login
        await resetLoginFailures(email)

        // Ensure username exists on login
        const headers = { Authorization: `Bearer ${authToken}` }
        const { customer } = await sdk.client
          .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
            method: "GET",
            headers,
          })
          .catch(() => ({ customer: null }))

        if (customer && (!customer.metadata || !customer.metadata.username)) {
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
            .catch((e) => console.error("Error setting username in login:", e))
        }

        const customerCacheTag = await getCacheTag("customers")
        revalidateTag(customerCacheTag, "max")
      })
  } catch (err) {
    // Log the real error server-side for debugging
    authLog(`login(email=${email})`, err)
    // Record failure and return a generic message
    const failureResult = await recordLoginFailure(email)
    if (failureResult.locked) {
      const mins = Math.ceil((failureResult.lockedForSeconds ?? 900) / 60)
      return `Too many failed attempts. Please try again in ${mins} minute${
        mins !== 1 ? "s" : ""
      }.`
    }
    return "Invalid email or password."
  }

  try {
    await transferCart()
  } catch {
    // Cart transfer failure is non-fatal; don't block the redirect
  }

  // Validate redirect URL before use to prevent Open Redirect attacks
  // Fall back to /{countryCode}/account (or /account if no countryCode was sent)
  const fallback = countryCode ? `/${countryCode}/account` : "/account"
  redirect(safeRedirectUrl(redirectUrl, fallback))
}

export async function signout(countryCode: string) {
  try {
    await sdk.auth.logout()
  } catch {
    // JWT-based auth doesn't use server sessions,
    // so DELETE /auth/session may return 401 — that's fine.
  }

  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag, "max")

  await removeCartId()

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag, "max")

  redirect(`/${countryCode}/account`)
}

export async function transferCart() {
  const cartId = await getCartId()
  const headers = await getAuthHeaders()

  if (cartId) {
    try {
      await sdk.store.cart.transferCart(cartId, {}, headers)
    } catch (err: any) {
      console.error("Cart transfer failed:", err?.message || err)
    }
  } else {
    try {
      const customerRes = await sdk.client.fetch<{ customer: any }>(
        `/store/customers/me?fields=*carts`,
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      )
      const carts = customerRes.customer?.carts || []
      if (carts.length > 0) {
        carts.sort(
          (a: any, b: any) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
        await setCartId(carts[0].id)
      }
    } catch (e) {
      console.error("Failed to sync customer cart", e)
    }
  }

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag, "max")
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

export async function loginWithGoogle(_formData?: FormData): Promise<void> {
  let location: string | undefined
  try {
    const result = (await sdk.auth.login("customer", "google", {})) as any
    if (result?.location) {
      location = result.location
    }
  } catch (e: any) {
    console.error("Google login error:", e.message)
  }

  if (location) {
    redirect(location)
  }
}

export async function validateGoogleCallback(
  searchParams: Record<string, string>
) {
  try {
    const response = (await sdk.auth.callback(
      "customer",
      "google",
      searchParams
    )) as any
    const token = typeof response === "string" ? response : response?.token

    if (!token || typeof token !== "string") {
      throw new Error(
        `Did not receive a valid token from auth provider. Response: ${JSON.stringify(
          response
        )}`
      )
    }
    const decodedToken = jwtDecode<{
      actor_id: string
      user_metadata: Record<string, unknown>
    }>(token)

    if (!decodedToken.actor_id) {
      // Create customer
      await sdk.store.customer.create(
        {
          email: decodedToken.user_metadata.email as string,
          first_name: (decodedToken.user_metadata.given_name as string) || "",
          last_name: (decodedToken.user_metadata.family_name as string) || "",
        },
        {},
        { authorization: `Bearer ${token}` }
      )
      // Refresh token requires the auth token to be set first if we rely on SDK auto-headers
      await setAuthToken(token)
      const refreshResult = (await sdk.auth.refresh()) as any
      await setAuthToken(refreshResult.token)
    } else {
      await setAuthToken(token)
    }

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag, "max")

    return { success: true }
  } catch (e: any) {
    console.error("Google auth callback error:", e)
    let errorMessage = e.message
    if (errorMessage?.includes("already has an account") || e.status === 422) {
      errorMessage =
        "An account with this email already exists. Please log in using your email and password."
    }
    return { success: false, error: errorMessage }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reset Password
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Step 1 – Request a password reset.
 * Calls the Medusa auth endpoint which emits auth.password_reset event.
 * Our subscriber (reset-password-sender.ts) catches that event and sends an email.
 */
export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  if (!email) {
    return { success: false, error: "Email is required" }
  }

  try {
    // Ensure the customer has an emailpass identity (for users who signed up via OTP/Google)
    const internalSecret = process.env.INTERNAL_API_SECRET
    const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
    await fetch(`${backendUrl}/custom/ensure-emailpass`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authenticate this server-to-server call
        "x-internal-secret": internalSecret ?? "",
      },
      body: JSON.stringify({ email }),
    }).catch(() => {})

    // Medusa SDK: POST /auth/customer/emailpass/reset-password
    await sdk.auth.resetPassword("customer", "emailpass", { identifier: email })
    return { success: true }
  } catch (err: any) {
    authLog(`requestPasswordReset(${email})`, err)
    // Always return success to avoid leaking whether the email exists
    return { success: true }
  }
}

/**
 * Step 2 – Set the new password using the token from the reset email.
 * On success the user is automatically logged in.
 */
export async function resetPassword({
  email,
  password,
  token,
}: {
  email: string
  password: string
  token: string
}): Promise<{ success: boolean; error?: string }> {
  if (!email || !password || !token) {
    return { success: false, error: "All fields are required" }
  }

  try {
    // Medusa SDK: POST /auth/customer/emailpass/update with the reset token
    await sdk.auth.updateProvider(
      "customer",
      "emailpass",
      { email, password },
      token
    )

    // Log the user in with the new password
    const authToken = await sdk.auth.login("customer", "emailpass", {
      email,
      password,
    })
    const tokenStr = (authToken as any).token ?? authToken

    if (tokenStr && typeof tokenStr === "string") {
      await setAuthToken(tokenStr)
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag, "max")
    }

    return { success: true }
  } catch (err: any) {
    authLog(`resetPassword(${email})`, err)
    const msg: string = err?.message ?? ""
    if (
      msg.toLowerCase().includes("expired") ||
      msg.toLowerCase().includes("invalid")
    ) {
      return {
        success: false,
        error:
          "Reset link has expired or is invalid. Please request a new one.",
      }
    }
    return {
      success: false,
      error: "Failed to reset password. Please try again.",
    }
  }
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
