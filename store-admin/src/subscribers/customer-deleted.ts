import {
    SubscriberArgs,
    type SubscriberConfig,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

export default async function handleCustomerDeleted({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const logger = container.resolve("logger")
    const authModuleService = container.resolve(Modules.AUTH)

    const customerId = data.id
    if (!customerId) return

    try {
        logger.info(`[customer-deleted] Customer ${customerId} deleted. Cleaning up linked AuthIdentities...`)

        // List all auth identities and find those linked to this customer
        let linkedIdentities: any[] = []
        try {
            linkedIdentities = await authModuleService.listAuthIdentities({
                app_metadata: { customer_id: customerId }
            })
        } catch {
            // fallback if direct app_metadata filtering is not supported by driver
        }

        if (!linkedIdentities || linkedIdentities.length === 0) {
            const identities = await authModuleService.listAuthIdentities({})
            linkedIdentities = identities.filter(
                (identity: any) => identity.app_metadata?.customer_id === customerId
            )
        }

        if (linkedIdentities.length === 0) {
            logger.info(`[customer-deleted] No linked AuthIdentities found for customer ${customerId}`)
            return
        }

        // Delete the auth identity entirely.
        // Medusa's create-customer-account workflow throws "Key customer_id already
        // exists in app_metadata" if we only null it out. Deleting is safe because:
        // - The email-otp and phone-auth providers auto-create a fresh identity
        //   when authenticate() is called and no identity exists.
        // - The fresh identity will have no customer_id, so the next customer
        //   creation will succeed without conflict.
        const idsToDelete = linkedIdentities.map((identity: any) => identity.id)
        await authModuleService.deleteAuthIdentities(idsToDelete)

        logger.info(`[customer-deleted] Deleted ${idsToDelete.length} AuthIdentities for customer ${customerId}: [${idsToDelete.join(", ")}]`)
    } catch (error: any) {
        logger.error(`[customer-deleted] Failed to clean up AuthIdentities for customer ${customerId}: ${error.message || error}`)
    }
}

export const config: SubscriberConfig = {
    event: "customer.deleted",
}
