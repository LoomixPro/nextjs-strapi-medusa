import { StorePrice } from "@medusajs/types"

export interface FeaturedProduct {
  id: string
  title: string
  handle: string
  thumbnail?: string
}

export interface VariantPrice {
  calculated_price_number: number
  calculated_price: string
  original_price_number: number
  original_price: string
  currency_code: string
  price_type: string
  percentage_diff: string
}

export interface StoreFreeShippingPrice extends StorePrice {
  target_reached: boolean
  target_remaining: number
  remaining_percentage: number
}

export interface StoreProductReview {
  id: string
  title: string
  rating: number
  content: string
  first_name: string
  last_name: string
  like_count: number
  dislike_count: number
  user_reaction: "like" | "dislike" | null
  is_verified_buyer: boolean
  created_at: string
}

export interface StoreProductQuestion {
  id: string
  name: string
  question_text: string
  answer_text: string | null
  status: string
  created_at: string
}

export interface ProductReviewSummary {
  averageRating: number
  count: number
}
