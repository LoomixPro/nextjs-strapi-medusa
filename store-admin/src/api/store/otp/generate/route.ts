
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
// import { z } from "zod" // Validation if needed

type OtpGenerateBody = {
    phone_number: string
}

export const POST = async (
    req: MedusaRequest<OtpGenerateBody>,
    res: MedusaResponse
) => {
    const { phone_number } = req.body

    if (!phone_number) {
        throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Phone number is required"
        )
    }

    const cacheService = req.scope.resolve(Modules.CACHE)

    // Generate 5-digit code
    const code = Math.floor(10000 + Math.random() * 90000).toString()

    // Store in Cache with 2 minutes TTL (120 seconds)
    // Cache service expects TTL in seconds
    await cacheService.set(`otp:${phone_number}`, code, 120)

    // TODO: Send SMS via Provider
    console.log(`[SMS] Sending code ${code} to ${phone_number}`)

    res.json({
        message: "OTP sent successfully",
    })
}

