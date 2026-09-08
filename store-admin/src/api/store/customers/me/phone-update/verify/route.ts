import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

type VerifyBody = {
    phone: string
    code: string
}

export const POST = async (
    req: AuthenticatedMedusaRequest<VerifyBody>,
    res: MedusaResponse
) => {
    const { phone, code } = req.body
    const logger = req.scope.resolve("logger")

    if (!phone || !code) {
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Phone number and verification code are required"
        )
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, "")
    const customerId = req.auth_context.actor_id

    const cacheService = req.scope.resolve(Modules.CACHE)
    const customerModule = req.scope.resolve(Modules.CUSTOMER)
    const authModuleService = req.scope.resolve(Modules.AUTH)

    // 1. Verify OTP code from cache
    const cacheKey = `phone-update-otp:${customerId}:${cleanPhone}`
    const cachedCode = await cacheService.get(cacheKey)

    if (!cachedCode || cachedCode !== code.trim()) {
        return res.status(400).json({
            error: "Invalid or expired verification code."
        })
    }

    // 2. Check customer uniqueness (to prevent race conditions)
    const [existingCustomer] = await customerModule.listCustomers({ phone: cleanPhone } as any)
    if (existingCustomer && existingCustomer.id !== customerId) {
        return res.status(409).json({
            error: "This phone number is already registered by another account."
        })
    }

    // 3. Check AuthIdentity uniqueness
    const [existingIdentity] = await authModuleService.listAuthIdentities({
        provider_identities: {
            entity_id: cleanPhone,
            provider: "phone-auth"
        }
    })
    if (existingIdentity && existingIdentity.app_metadata?.customer_id !== customerId) {
        return res.status(409).json({
            error: "This phone number is already registered by another account."
        })
    }

    // 4. Update the Customer
    const customer = await customerModule.retrieveCustomer(customerId)
    const updateData: any = { phone: cleanPhone }
    
    // If the customer signed up with phone auth, their email ends with @phone.local.
    // We should update the email to match the new phone number to keep it synced.
    if (customer.email && customer.email.endsWith("@phone.local")) {
        updateData.email = `${cleanPhone.replace(/\+/g, "")}@phone.local`
    }

    await customerModule.updateCustomers(customerId, updateData)
    logger.info(`[phone-update-verify] Updated Customer phone to ${cleanPhone} for customer ${customerId}`)

    // 5. Update the AuthIdentity's provider identity entity_id
    const [identity] = await authModuleService.listAuthIdentities({
        app_metadata: { customer_id: customerId }
    })
    if (identity) {
        const providerIdentities = await authModuleService.listProviderIdentities({
            auth_identity_id: identity.id
        })
        const phoneProvider = providerIdentities.find((p: any) => p.provider === "phone-auth")
        if (phoneProvider) {
            await authModuleService.updateProviderIdentities([
                {
                    id: phoneProvider.id,
                    entity_id: cleanPhone
                }
            ])
            logger.info(`[phone-update-verify] Updated AuthIdentity provider entity_id to ${cleanPhone} for identity ${identity.id}`)
        } else {
            logger.warn(`[phone-update-verify] No phone-auth provider identity found for auth identity ${identity.id}. Skipping provider update.`)
        }
    } else {
        logger.warn(`[phone-update-verify] No AuthIdentity found linked to customer ${customerId}. Skipping identity update.`)
    }

    // 6. Delete the verified cached OTP code
    await cacheService.invalidate(cacheKey)

    return res.status(200).json({
        success: true,
        message: "Phone number updated successfully."
    })
}
