"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions, getCacheTag } from "./cookies"
import { Wishlist, WishlistResponse } from "@/types/wishlist"
import { revalidateTag } from "next/cache"
import { getTranslations } from "next-intl/server"

/**
 * Retrieves the current customer's wishlist.
 * Returns null if not authenticated or no wishlist exists.
 */
export async function getWishlist(): Promise<Wishlist | null> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!("authorization" in headers)) {
    return null
  }

  const next = {
    ...(await getCacheOptions("wishlists")),
  }

  return await sdk.client
    .fetch<WishlistResponse>(`/store/customers/me/wishlists`, {
      method: "GET",
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ wishlist }) => wishlist)
    .catch(() => null)
}

/**
 * Adds a product variant to the customer's wishlist.
 * If no wishlist exists, one is created automatically.
 */
export async function addToWishlist(variantId: string) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!("authorization" in headers)) {
    const t = await getTranslations("Product.wishlist")
    return t("login_required")
  }

  try {
    // Ensure wishlist exists by trying to create one first (API will handle if exists)
    let wishlist = await getWishlist()

    if (!wishlist) {
      await sdk.client
        .fetch<WishlistResponse>(`/store/customers/me/wishlists`, {
          method: "POST",
          headers,
        })
        .catch(() => null)
    }

    await sdk.client.fetch<WishlistResponse>(
      `/store/customers/me/wishlists/items`,
      {
        method: "POST",
        headers,
        body: {
          variant_id: variantId,
        },
      }
    )

    const wishlistCacheTag = await getCacheTag("wishlists")
    revalidateTag(wishlistCacheTag, "max")
  } catch (e: any) {
    const t = await getTranslations("Product.wishlist")
    return e.message || t("error_add")
  }
}

/**
 * Removes a wishlist item by its ID.
 */
export async function removeFromWishlist(itemId: string) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!("authorization" in headers)) {
    const t = await getTranslations("Product.wishlist")
    return t("login_required_remove")
  }

  try {
    await sdk.client.fetch<WishlistResponse>(
      `/store/customers/me/wishlists/items/${itemId}`,
      {
        method: "DELETE",
        headers,
      }
    )

    const wishlistCacheTag = await getCacheTag("wishlists")
    revalidateTag(wishlistCacheTag, "max")
  } catch (e: any) {
    const t = await getTranslations("Product.wishlist")
    return e.message || t("error_remove")
  }
}
