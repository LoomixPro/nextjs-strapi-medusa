import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework"
import { MedusaError } from "@medusajs/framework/utils"
import jwt, { JwtPayload } from "jsonwebtoken"

export async function GET(
    req: MedusaStoreRequest,
    res: MedusaResponse
) {
    if (!req.publishable_key_context?.sales_channel_ids.length) {
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "At least one sales channel ID is required to be associated with the publishable API key in the request header."
        )
    }

    const { http } = req.scope.resolve("configModule").projectConfig
    if (!http.jwtSecret) {
        throw new MedusaError(
            MedusaError.Types.UNEXPECTED_STATE,
            "JWT secret is not configured"
        )
    }

    let decodedToken: JwtPayload
    try {
        const decoded = jwt.verify(req.params.token, http.jwtSecret)
        if (typeof decoded !== "object" || !decoded || !decoded.wishlist_id) {
            throw new Error("Invalid payload")
        }
        decodedToken = decoded as JwtPayload
    } catch {
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Invalid or expired wishlist token"
        )
    }

    const query = req.scope.resolve("query")

    const { data } = await query.graph({
        entity: "wishlist",
        fields: ["*", "items.*", "items.product_variant.*"],
        filters: {
            id: decodedToken.wishlist_id,
        },
    })

    if (!data.length) {
        throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            "No wishlist found"
        )
    }

    if (data[0].sales_channel_id !== req.publishable_key_context.sales_channel_ids[0]) {
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Wishlist does not belong to the request's sales channel"
        )
    }

    res.json({
        wishlist: data[0],
    })
}
