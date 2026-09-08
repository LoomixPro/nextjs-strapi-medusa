import { z } from "@medusajs/framework/zod"

export const PostStoreCreateWishlistItem = z.object({
    variant_id: z.string(),
})
