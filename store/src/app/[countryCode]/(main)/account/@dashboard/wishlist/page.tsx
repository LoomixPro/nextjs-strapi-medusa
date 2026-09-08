import { getWishlist } from "@lib/data/wishlist"
import { getProfileComponent } from "@modules/account/templates/profile"

import { getMessages } from "next-intl/server"

export async function generateMetadata() {
  const messages: any = await getMessages()
  return {
    title: messages.Account?.Wishlist?.title || "Wishlist",
    description:
      messages.Account?.Wishlist?.description || "View your wishlist",
  }
}

export default async function WishlistPage() {
  const wishlist = await getWishlist()
  const WishlistOverview = await getProfileComponent("wishlist-overview")

  return WishlistOverview ? <WishlistOverview wishlist={wishlist} /> : null
}
