import { InjectManager, MedusaService, MedusaContext } from "@medusajs/framework/utils"
import Review from "./models/review"
import ReviewReaction from "./models/review-reaction"
import { Context } from "@medusajs/framework/types"
import { EntityManager } from "@medusajs/framework/mikro-orm/knex"

class ProductReviewModuleService extends MedusaService({
    Review,
    ReviewReaction,
}) {
    @InjectManager()
    async getAverageRating(
        productId: string,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<number> {
        const result = await sharedContext?.manager?.execute(
            `SELECT AVG(rating) as average 
      FROM review 
      WHERE product_id = ? AND status = 'approved'`,
            [productId]
        )

        return parseFloat(parseFloat(result?.[0]?.average ?? 0).toFixed(2))
    }

    @InjectManager()
    async getBatchSummaries(
        productIds: string[],
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<Record<string, { averageRating: number; count: number }>> {
        if (!productIds || productIds.length === 0) {
            return {}
        }

        const placeholders = productIds.map(() => '?').join(',')
        const rows = await sharedContext?.manager?.execute(
            `SELECT product_id, AVG(rating) as average, COUNT(id) as count 
             FROM review 
             WHERE product_id IN (${placeholders}) AND status = 'approved'
             GROUP BY product_id`,
            productIds
        )

        const summaries: Record<string, { averageRating: number; count: number }> = {}
        for (const row of rows || []) {
            summaries[row.product_id] = {
                averageRating: parseFloat(parseFloat(row.average ?? 0).toFixed(2)),
                count: parseInt(row.count ?? 0, 10),
            }
        }

        return summaries
    }

    @InjectManager()
    async toggleReaction(
        reviewId: string,
        customerId: string,
        type: "like" | "dislike",
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<{
        like_count: number
        dislike_count: number
        user_reaction: "like" | "dislike" | null
    }> {
        const manager = sharedContext?.manager!

        // Find existing reaction
        const existing = await manager.execute(
            `SELECT id, type FROM review_reaction 
             WHERE review_id = ? AND customer_id = ? AND deleted_at IS NULL`,
            [reviewId, customerId]
        )

        const existingReaction = existing?.[0]

        if (existingReaction) {
            if (existingReaction.type === type) {
                // Same type: remove reaction (toggle off)
                await manager.execute(
                    `UPDATE review_reaction SET deleted_at = NOW() WHERE id = ?`,
                    [existingReaction.id]
                )
                // Decrement count
                const countColumn = type === "like" ? "like_count" : "dislike_count"
                await manager.execute(
                    `UPDATE review SET ${countColumn} = GREATEST(${countColumn} - 1, 0), updated_at = NOW() WHERE id = ?`,
                    [reviewId]
                )
            } else {
                // Different type: switch reaction
                await manager.execute(
                    `UPDATE review_reaction SET type = ?, updated_at = NOW() WHERE id = ?`,
                    [type, existingReaction.id]
                )
                // Decrement old, increment new
                const oldColumn = existingReaction.type === "like" ? "like_count" : "dislike_count"
                const newColumn = type === "like" ? "like_count" : "dislike_count"
                await manager.execute(
                    `UPDATE review SET ${oldColumn} = GREATEST(${oldColumn} - 1, 0), ${newColumn} = ${newColumn} + 1, updated_at = NOW() WHERE id = ?`,
                    [reviewId]
                )
            }
        } else {
            // No existing reaction: create new
            const id = `rr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            await manager.execute(
                `INSERT INTO review_reaction (id, review_id, customer_id, type, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, NOW(), NOW())`,
                [id, reviewId, customerId, type]
            )
            // Increment count
            const countColumn = type === "like" ? "like_count" : "dislike_count"
            await manager.execute(
                `UPDATE review SET ${countColumn} = ${countColumn} + 1, updated_at = NOW() WHERE id = ?`,
                [reviewId]
            )
        }

        // Fetch updated counts
        const updated = await manager.execute(
            `SELECT like_count, dislike_count FROM review WHERE id = ?`,
            [reviewId]
        )

        // Fetch current user reaction
        const currentReaction = await manager.execute(
            `SELECT type FROM review_reaction 
             WHERE review_id = ? AND customer_id = ? AND deleted_at IS NULL`,
            [reviewId, customerId]
        )

        return {
            like_count: updated?.[0]?.like_count ?? 0,
            dislike_count: updated?.[0]?.dislike_count ?? 0,
            user_reaction: currentReaction?.[0]?.type ?? null,
        }
    }

    @InjectManager()
    async getUserReactionsForReviews(
        reviewIds: string[],
        customerId: string | undefined,
        @MedusaContext() sharedContext?: Context<EntityManager>
    ): Promise<Record<string, "like" | "dislike" | null>> {
        if (!customerId || reviewIds.length === 0) {
            return {}
        }

        const manager = sharedContext?.manager!
        const placeholders = reviewIds.map(() => "?").join(", ")
        const reactions = await manager.execute(
            `SELECT review_id, type FROM review_reaction 
             WHERE review_id IN (${placeholders}) AND customer_id = ? AND deleted_at IS NULL`,
            [...reviewIds, customerId]
        )

        const result: Record<string, "like" | "dislike" | null> = {}
        for (const id of reviewIds) {
            result[id] = null
        }
        for (const r of reactions ?? []) {
            result[r.review_id] = r.type
        }
        return result
    }
}

export default ProductReviewModuleService
