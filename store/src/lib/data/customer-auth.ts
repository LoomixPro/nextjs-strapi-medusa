"use server"

import { sdk } from "@lib/config"
import { jwtDecode } from "jwt-decode"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import { safeRedirectUrl } from "@lib/util/safe-redirect"
import {
  getAuthHeaders,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
  setCartId,
} from "./cookies"
import {
  checkLoginAllowed,
  isHoneypotTripped,
  recordLoginFailure,
  resetLoginFailures,
} from "@lib/util/auth-security"

import { authLog } from "@lib/util/auth-log"

export async function login(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const redirectUrl = formData.get("redirect") as string
  // Optional countryCode field — lets us redirect to /ir/account instead of /account
  const countryCode =
    (formData.get("countryCode") as string | null)?.toLowerCase() || ""

  // ── Security: honeypot check ──────────────────────────────────────────────
  if (isHoneypotTripped(formData)) {
    return "Invalid email or password."
  }

  // ── Security: account lockout check ───────────────────────────────────────
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
    authLog(`login(email=${email})`, err)
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

  const fallback = countryCode ? `/${countryCode}/account` : "/account"
  redirect(safeRedirectUrl(redirectUrl, fallback))
}

export async function signout(countryCode: string) {
  try {
    await sdk.auth.logout()
  } catch {
    // JWT-based auth doesn't use server sessions
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
      await sdk.store.customer.create(
        {
          email: decodedToken.user_metadata.email as string,
          first_name: (decodedToken.user_metadata.given_name as string) || "",
          last_name: (decodedToken.user_metadata.family_name as string) || "",
        },
        {},
        { authorization: `Bearer ${token}` }
      )
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

export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  if (!email) {
    return { success: false, error: "Email is required" }
  }

  try {
    const internalSecret = process.env.INTERNAL_API_SECRET
    const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
    await fetch(`${backendUrl}/custom/ensure-emailpass`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": internalSecret ?? "",
      },
      body: JSON.stringify({ email }),
    }).catch(() => {})

    await sdk.auth.resetPassword("customer", "emailpass", { identifier: email })
    return { success: true }
  } catch (err: any) {
    authLog(`requestPasswordReset(${email})`, err)
    return { success: true }
  }
}

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
    await sdk.auth.updateProvider(
      "customer",
      "emailpass",
      { email, password },
      token
    )

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
