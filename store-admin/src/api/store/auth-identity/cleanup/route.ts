import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import jwt from "jsonwebtoken"

/**
 * POST /store/auth-identity/cleanup
 *
 * Called by the storefront when customer creation fails with "customer_id already
 * exists in app_metadata". This happens when an old customer was deleted from the
 * dashboard but their AuthIdentity was not cleaned up.
 *
 * This endpoint:
 * 1. Reads the current Bearer token from the request
 * 2. Extracts the auth identity ID from the token
 * 3. Deletes that AuthIdentity so the user can register fresh
 *
 * Auth: requires a valid JWT (the user just verified their OTP)
 */
export const POST = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const authModuleService = req.scope.resolve(Modules.AUTH)
    const logger = req.scope.resolve("logger")

    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" })
    }

    const token = authHeader.slice(7)
    const { entity_id } = (req.body as { entity_id?: string }) || {}

    try {
        // Decode the JWT to get the auth identity ID
        const secret = process.env.JWT_SECRET || "supersecret"
        const payload = jwt.verify(token, secret) as any
        
        logger.info(`[auth-cleanup] JWT Payload: ${JSON.stringify(payload)}`)

        // The auth identity ID is stored as actor_id or auth_identity_id in the JWT
        const authIdentityId = payload?.actor_id || payload?.auth_identity_id

        let identity: any = null

        if (authIdentityId) {
            const identities = await authModuleService.listAuthIdentities({ id: [authIdentityId] })
            identity = identities[0]
        } else if (entity_id) {
            // Fallback: look up by entity_id (email or phone) if provided in the body
            const identities = await authModuleService.listAuthIdentities({})
            identity = identities.find((i: any) => i.provider_identities?.some((p: any) => p.entity_id === entity_id))
        }

        if (!identity) {
            return res.status(404).json({ error: "Auth identity not found" })
        }

        // The frontend only calls this endpoint when customer creation fails due to
        // the AuthIdentity having a stale customer_id (even if it's explicitly set to null).
        // Therefore, we unconditionally delete the identity so the user can re-authenticate cleanly.
        
        const customerId = identity.app_metadata?.customer_id
        
        // If there happens to be a real customer linked, refuse to delete to prevent account takeover
        if (customerId) {
            const customerModule = req.scope.resolve(Modules.CUSTOMER)
            let customerExists = false
            try {
                const [customer] = await customerModule.listCustomers({ id: [customerId as string] })
                customerExists = !!customer
            } catch {
                customerExists = false
            }

            if (customerExists) {
                logger.warn(`[auth-cleanup] Customer ${customerId} still exists — refusing to clean auth identity ${identity.id}`)
                return res.status(409).json({ error: "Customer still exists. Cannot clean up." })
            }
        }

        // Delete the stale AuthIdentity
        await authModuleService.deleteAuthIdentities([identity.id])
        logger.info(`[auth-cleanup] Deleted stale AuthIdentity ${identity.id}`)

        return res.status(200).json({ success: true })
    } catch (error: any) {
        logger.error(`[auth-cleanup] Error: ${error.message}`)
        return res.status(500).json({ error: "Cleanup failed" })
    }
}
