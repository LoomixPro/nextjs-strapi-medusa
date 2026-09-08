import { MedusaService, InjectManager, MedusaContext } from "@medusajs/framework/utils"
import { Context } from "@medusajs/framework/types"
import { EntityManager } from "@mikro-orm/knex"
import { Wishlist } from "./models/wishlist"
import { WishlistItem } from "./models/wishlist-item"

class WishlistModuleService extends MedusaService({
    Wishlist,
    WishlistItem,
}) {
    async getWishlistItemCount(wishlistId: string): Promise<number> {
        const [, count] = await this.listAndCountWishlistItems({
            wishlist_id: wishlistId,
        })
        return count
    }

    @InjectManager()
    async getWishlistsOfVariants(
        variantIds: string[],
        @MedusaContext() context: Context<EntityManager> = {}
    ): Promise<number> {
        return (await context.manager?.createQueryBuilder("wishlist_item", "wi")
            .select(["wi.wishlist_id"], true)
            .where("wi.product_variant_id IN (?)", [variantIds])
            .execute())?.length || 0
    }
}

export default WishlistModuleService
