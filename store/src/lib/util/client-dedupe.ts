import { getWishlist } from "@lib/data/wishlist"
import { Wishlist } from "@/types/wishlist"

let wishlistPromise: Promise<Wishlist | null> | null = null
let cacheTime = 0
const CACHE_TTL = 3000 // 3 seconds TTL for client-side deduplication during mount

/**
 * A deduplicated wrapper around the getWishlist server action.
 * When multiple Client Components mount simultaneously (like 24 ProductCards),
 * this ensures they all await the exact same promise instead of firing 24 network POSTs.
 */
export const getWishlistDeduped = (): Promise<Wishlist | null> => {
  // If running on server during SSR, bypass deduplication (Next.js handles deduping on server)
  if (typeof window === "undefined") {
    return getWishlist()
  }

  const now = Date.now()

  // Return the active promise if within TTL
  if (wishlistPromise && now - cacheTime < CACHE_TTL) {
    return wishlistPromise
  }

  // Otherwise, create a new promise and cache it
  wishlistPromise = getWishlist()
  cacheTime = now

  // Add a quick catch just to ensure we don't hold a rejected promise forever
  wishlistPromise.catch(() => {
    wishlistPromise = null
  })

  return wishlistPromise
}
