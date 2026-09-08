import {
    SubscriberArgs,
    type SubscriberConfig,
} from "@medusajs/medusa"
import { Modules } from "@medusajs/framework/utils"
import { INotificationModuleService } from "@medusajs/types"

export default async function sendOtpHandler({
    event: { data: { phone, otp } },
    container,
}: SubscriberArgs<{ phone: string, otp: string }>) {
    const notificationModuleService: INotificationModuleService = container.resolve(
        Modules.NOTIFICATION
    )

    const logger = container.resolve("logger")

    try {
        await notificationModuleService.createNotifications({
            to: phone,
            channel: "sms",
            template: "otp-template",
            data: {
                otp,
            },
        })
    } catch (error: any) {
        logger.warn(`Failed to send OTP SMS to ${phone}: ${error.message || error}`)
    }
}

export const config: SubscriberConfig = {
    event: "phone-auth.otp.generated",
}
