import crypto from "crypto"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

function safeCompareSecret(provided?: string | null, expected?: string | null): boolean {
  if (!provided || !expected) {
    return false
  }

  const actual = new Uint8Array(
    crypto.createHash("sha256").update(provided).digest()
  )
  const expectedHash = new Uint8Array(
    crypto.createHash("sha256").update(expected).digest()
  )

  if (actual.length !== expectedHash.length) {
    return false
  }

  return crypto.timingSafeEqual(actual, expectedHash)
}

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const logger = req.scope.resolve("logger")
  const isDev = process.env.NODE_ENV !== "production"
  const expectedSecret = process.env.INTERNAL_API_SECRET
  const providedSecret =
    (req.headers["x-internal-secret"] as string) ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : undefined)

  if (!isDev && (!expectedSecret || !safeCompareSecret(providedSecret, expectedSecret))) {
    logger.warn("[ensure-emailpass] Unauthorized attempt: invalid or missing internal secret")
    res.status(401).json({ message: "Unauthorized: Invalid internal secret" })
    return
  }

  if (isDev && expectedSecret && !safeCompareSecret(providedSecret, expectedSecret)) {
    logger.warn("[ensure-emailpass] Unauthorized attempt: invalid internal secret")
    res.status(401).json({ message: "Unauthorized: Invalid internal secret" })
    return
  }

  const body = req.body as { email?: string }
  const email = body?.email?.trim().toLowerCase()

  if (!email) {
    res.status(400).json({ message: "Email is required" })
    return
  }

  try {
    const customerModule = req.scope.resolve(Modules.CUSTOMER)
    const authModuleService = req.scope.resolve(Modules.AUTH)

    // 1. Verify customer exists
    const [customer] = await customerModule.listCustomers({ email })
    if (!customer) {
      logger.warn(`[ensure-emailpass] Customer not found for email: ${email}`)
      res.status(404).json({ message: "Customer not found" })
      return
    }

    // 2. Check if a provider_identity of type emailpass already exists for this email
    const [existingEmailPassProvider] = await authModuleService.listProviderIdentities({
      entity_id: email,
      provider: "emailpass",
    })

    if (existingEmailPassProvider) {
      logger.info(`[ensure-emailpass] emailpass provider identity already exists for ${email}`)
      res.status(200).json({
        success: true,
        created: false,
        message: "Provider identity already exists",
      })
      return
    }

    // 3. Find the customer's linked AuthIdentity
    let linkedIdentities: any[] = []
    try {
      linkedIdentities = await authModuleService.listAuthIdentities({
        app_metadata: { customer_id: customer.id },
      })
    } catch {
      // Direct app_metadata filter may not be supported by all drivers
    }

    if (!linkedIdentities || linkedIdentities.length === 0) {
      const allIdentities = await authModuleService.listAuthIdentities({})
      linkedIdentities = allIdentities.filter(
        (identity: any) => identity.app_metadata?.customer_id === customer.id
      )
    }

    // Fallback: If not found by customer_id metadata, look for any provider identity matching this email
    if (linkedIdentities.length === 0) {
      const [emailProvider] = await authModuleService.listProviderIdentities({
        entity_id: email,
      })
      if (emailProvider?.auth_identity_id) {
        try {
          const idMatch = await authModuleService.retrieveAuthIdentity(emailProvider.auth_identity_id)
          if (idMatch) {
            linkedIdentities = [idMatch]
          }
        } catch {
          // ignore retrieval error
        }
      }
    }

    // 4. Create provider_identity or full AuthIdentity
    if (linkedIdentities.length > 0) {
      const authIdentity = linkedIdentities[0]
      try {
        await authModuleService.createProviderIdentities({
          provider: "emailpass",
          entity_id: email,
          auth_identity_id: authIdentity.id,
        })
        logger.info(
          `[ensure-emailpass] Added emailpass provider identity for existing auth identity ${authIdentity.id} (customer ${customer.id})`
        )
      } catch (createErr: any) {
        // Handle concurrent creation
        const [doubleCheck] = await authModuleService.listProviderIdentities({
          entity_id: email,
          provider: "emailpass",
        })
        if (!doubleCheck) {
          throw createErr
        }
      }

      res.status(200).json({
        success: true,
        created: true,
        auth_identity_id: authIdentity.id,
      })
      return
    }

    // If customer has no AuthIdentity at all, create one with emailpass provider
    const newAuthIdentity = await authModuleService.createAuthIdentities({
      app_metadata: {
        customer_id: customer.id,
      },
      provider_identities: [
        {
          provider: "emailpass",
          entity_id: email,
        },
      ],
    })

    logger.info(
      `[ensure-emailpass] Created new AuthIdentity ${newAuthIdentity.id} with emailpass provider for customer ${customer.id}`
    )

    res.status(200).json({
      success: true,
      created: true,
      auth_identity_id: newAuthIdentity.id,
    })
  } catch (error: any) {
    logger.error(`[ensure-emailpass] Failed to ensure emailpass provider identity: ${error.message || error}`)
    res.status(500).json({
      message: "Internal server error while ensuring emailpass identity",
      error: error.message,
    })
  }
}
