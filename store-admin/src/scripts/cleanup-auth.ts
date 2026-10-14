import { Modules } from "@medusajs/framework/utils"
import { ExecArgs } from "@medusajs/framework/types"

/**
 * Administrative maintenance script to clean up orphaned AuthIdentities.
 * Run via: npx medusa exec ./src/scripts/cleanup-auth.ts
 *
 * This checks all AuthIdentities that have a `customer_id` stored in app_metadata.
 * If the customer record no longer exists in the Customer Module, the identity is cleaned up.
 */
export default async function cleanupOrphanedAuthIdentities({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const authModule = container.resolve(Modules.AUTH)
  const customerModule = container.resolve(Modules.CUSTOMER)

  logger.info("[cleanup-auth] Scanning for orphaned AuthIdentities...")

  const identities = await authModule.listAuthIdentities({})
  let deletedCount = 0

  for (const identity of identities) {
    const customerId = identity.app_metadata?.customer_id as string | undefined
    if (!customerId) continue

    let customerExists = false
    try {
      const [customer] = await customerModule.listCustomers({ id: [customerId] })
      customerExists = !!customer
    } catch {
      customerExists = false
    }

    if (!customerExists) {
      await authModule.deleteAuthIdentities([identity.id])
      logger.info(`[cleanup-auth] Deleted orphaned AuthIdentity ${identity.id} (linked to non-existent customer: ${customerId})`)
      deletedCount++
    }
  }

  logger.info(`[cleanup-auth] Completed. Cleaned up ${deletedCount} orphaned AuthIdentity records.`)
}
