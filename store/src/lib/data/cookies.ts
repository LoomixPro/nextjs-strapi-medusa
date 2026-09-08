import "server-only"

import {
  getCookieStore,
  readCookie,
  requireCookieStore,
} from "@lib/util/safe-cookies"

export const getAuthHeaders = async (): Promise<
  { authorization: string } | {}
> => {
  const token = await readCookie("_medusa_jwt")

  if (!token) {
    return {}
  }

  return { authorization: `Bearer ${token}` }
}

export const getCacheTag = async (tag: string): Promise<string> => {
  const cacheId = await readCookie("_medusa_cache_id")

  if (!cacheId) {
    return ""
  }

  return `${tag}-${cacheId}`
}

export const getCacheOptions = async (
  tag: string
): Promise<{ tags: string[] } | {}> => {
  if (typeof window !== "undefined") {
    return {}
  }

  const cacheTag = await getCacheTag(tag)
  const finalTags = [tag]

  if (cacheTag) {
    finalTags.push(cacheTag)
  }

  return { tags: finalTags }
}

export const setAuthToken = async (token: string) => {
  const cookies = await requireCookieStore()
  cookies.set("_medusa_jwt", token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeAuthToken = async () => {
  const cookies = await requireCookieStore()
  cookies.set("_medusa_jwt", "", {
    maxAge: -1,
  })
}

export const getCartId = async () => {
  return readCookie("_medusa_cart_id")
}

export const setCartId = async (cartId: string) => {
  const cookies = await requireCookieStore()
  cookies.set("_medusa_cart_id", cartId, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  })
}

export const removeCartId = async () => {
  const cookies = await requireCookieStore()
  cookies.set("_medusa_cart_id", "", {
    maxAge: -1,
  })
}

export { getCookieStore, readCookie, requireCookieStore }
