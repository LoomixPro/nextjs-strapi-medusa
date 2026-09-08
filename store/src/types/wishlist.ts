export interface WishlistItem {
  id: string
  product_variant_id: string
  product_variant?: {
    id: string
    title?: string
    sku?: string
    thumbnail?: string
    product?: {
      id: string
      title?: string
      handle?: string
      thumbnail?: string
    }
  }
}

export interface Wishlist {
  id: string
  customer_id: string
  sales_channel_id: string
  items: WishlistItem[]
}

export interface WishlistResponse {
  wishlist: Wishlist
}
