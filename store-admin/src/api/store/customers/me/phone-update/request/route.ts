import { randomInt } from "node:crypto"
import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"

type RequestBody = {
    phone: string
}

export const POST = async (
    req: AuthenticatedMedusaRequest<RequestBody>,
    res: MedusaResponse
) => {
    const { phone } = req.body
    const logger = req.scope.resolve("logger")

    if (!phone) {
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Phone number is required"
        )
    }

    // Clean phone number (keep only digits and +)
    const cleanPhone = phone.replace(/[^0-9+]/g, "")
    const customerId = req.auth_context.actor_id

    const customerModule = req.scope.resolve(Modules.CUSTOMER)
    const authModuleService = req.scope.resolve(Modules.AUTH)

    // 1. Check if the phone number is already taken by another customer
    const [existingCustomer] = await customerModule.listCustomers({ phone: cleanPhone } as any)
    if (existingCustomer && existingCustomer.id !== customerId) {
        return res.status(409).json({
            error: "This phone number is already registered by another account."
        })
    }

    // 2. Check if the phone number is already registered to another AuthIdentity
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

    // 3. Generate cryptographically secure 6-digit OTP code
    const code = randomInt(100000, 1000000).toString()

    // 4. Save to cache with 2 minutes (120s) TTL
    const cacheService = req.scope.resolve(Modules.CACHE)
    const cacheKey = `phone-update-otp:${customerId}:${cleanPhone}`
    await cacheService.set(cacheKey, code, 120)

    // 5. Send OTP via Notification Service
    const notificationModuleService = req.scope.resolve(Modules.NOTIFICATION)
    try {
        await notificationModuleService.createNotifications({
            to: cleanPhone,
            channel: "sms",
            template: "otp-template",
            data: {
                otp: code,
            },
        })
        logger.info(`[phone-update-request] OTP sent successfully to ${cleanPhone}`)
    } catch (notificationError: any) {
        logger.error(`[phone-update-request] Failed to send OTP notification: ${notificationError.message}`)
        throw new MedusaError(
            MedusaError.Types.UNEXPECTED_STATE,
            "Failed to send verification SMS. Please try again."
        )
    }

    // For development/debugging, log the OTP code to terminal
    if (process.env.NODE_ENV !== "production") {
        logger.info(`[phone-update-request] OTP code for ${cleanPhone}: ${code}`)
    }

    return res.status(200).json({
        success: true,
        message: "Verification code sent successfully."
    })
}
