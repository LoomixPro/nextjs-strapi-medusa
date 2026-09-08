"use server"

import { sdk } from "@lib/config"
import { revalidateTag } from "next/cache"
import { readCookie, requireCookieStore } from "@lib/util/safe-cookies"
import { getAuthHeaders, getCacheTag, getCartId, removeCartId } from "./cookies"

const LOCALE_COOKIE_NAME = "_medusa_locale"

/**
 * Gets the current locale from cookies
 */
export const getLocale = async (): Promise<string | null> => {
  return (await readCookie(LOCALE_COOKIE_NAME)) ?? null
}

/**
 * Sets the locale cookie
 */
export const setLocaleCookie = async (locale: string) => {
  const cookies = await requireCookieStore()
  cookies.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false, // Allow client-side access
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

/**
 * Updates the locale preference via SDK and stores in cookie.
 * Also updates the cart with the new locale if one exists.
 */
export const updateLocale = async (localeCode: string): Promise<string> => {
  await setLocaleCookie(localeCode)

  // Update cart with the new locale if a cart exists (for all locales including 'default')
  const cartId = await getCartId()
  if (cartId) {
    const headers = {
      ...(await getAuthHeaders()),
    }

    try {
      await sdk.store.cart.update(cartId, { locale: localeCode }, {}, headers)

      const cartCacheTag = await getCacheTag("carts")
      if (cartCacheTag) {
        revalidateTag(cartCacheTag, "max")
      }
    } catch (error: any) {
      console.error("Failed to update cart locale:", error)
      const errMsg = error.message || ""
      if (
        errMsg.includes("variant") ||
        errMsg.includes("Variant") ||
        errMsg.includes("Variants") ||
        errMsg.includes("do not exist") ||
        errMsg.includes("not published")
      ) {
        // The cart contains invalid/deleted variants. Remove the cart ID from cookies.
        await removeCartId()
      }
    }
  }

  // Revalidate relevant caches to refresh content
  const productsCacheTag = await getCacheTag("products")
  if (productsCacheTag) {
    revalidateTag(productsCacheTag, "max")
  }

  const categoriesCacheTag = await getCacheTag("categories")
  if (categoriesCacheTag) {
    revalidateTag(categoriesCacheTag, "max")
  }

  const collectionsCacheTag = await getCacheTag("collections")
  if (collectionsCacheTag) {
    revalidateTag(collectionsCacheTag, "max")
  }

  return localeCode
}
