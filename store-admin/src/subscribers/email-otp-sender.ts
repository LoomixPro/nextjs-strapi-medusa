import {
    SubscriberArgs,
    type SubscriberConfig,
} from "@medusajs/framework"
import { resolveLocale, type SupportedLocale } from "../utils/resolve-locale"
import { Modules } from "@medusajs/framework/utils"

const locales: Record<SupportedLocale, any> = {
    "fa-IR": {
        subject: "کد تایید ورود به سایت",
        title: "کد تایید ورود",
        desc: "کاربر گرامی، برای احراز هویت در سایت، از کد زیر استفاده کنید:",
        expiry: "این کد پس از ۵ دقیقه منقضی خواهد شد.",
        dir: "rtl"
    },
    "en-US": {
        subject: "Login Verification Code",
        title: "Verification Code",
        desc: "Dear user, use the following code to authenticate:",
        expiry: "This code will expire in 5 minutes.",
        dir: "ltr"
    },
    "ar-AE": {
        subject: "رمز التحقق لتسجيل الدخول",
        title: "رمز التحقق",
        desc: "عزيزي المستخدم، استخدم الرمز التالي لتسجيل الدخول:",
        expiry: "تنتهي صلاحية هذا الرمز خلال 5 دقائق.",
        dir: "rtl"
    }
}

export default async function handleEmailOtp({
    event: { data },
    container,
}: SubscriberArgs<{ email: string; otp: string }>) {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)
    const cacheService = container.resolve(Modules.CACHE)
    const logger = container.resolve("logger")

    try {
        // 1. Fetch locale from Redis or fallback to DEFAULT_LOCALE
        let cachedLocale: string | undefined
        try {
            cachedLocale = (await cacheService.get(`auth_locale_${data.email.toLowerCase()}`)) as string | undefined
        } catch (error) {
            logger.warn(`[Email OTP] Failed to get locale from cache: ${error}`)
        }

        const lang = resolveLocale(cachedLocale)
        const t = locales[lang] || locales["en-US"]

        const emailHtml = `
            <div style="direction: ${t.dir}; font-family: Tahoma, Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
                <h2 style="color: #333; text-align: center;">${t.title}</h2>
                <p style="font-size: 16px; color: #555; text-align: center;">${t.desc}</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 24px; font-weight: bold; background-color: #e0e0e0; padding: 10px 20px; border-radius: 4px; letter-spacing: 5px; color: #000;">${data.otp}</span>
                </div>
                <p style="font-size: 14px; color: #999; text-align: center;">${t.expiry}</p>
            </div>
        `

        await notificationModuleService.createNotifications({
            to: data.email,
            channel: "email",
            template: "email-otp",
            content: {
                subject: t.subject,
                html: emailHtml,
            },
        })
        logger.info(`[Email OTP] Sent OTP email to ${data.email} in ${lang}`)
    } catch (error: any) {
        logger.warn(`Failed to send OTP email to ${data.email}: ${error.message || error}`)
    }
}

export const config: SubscriberConfig = {
    event: "email-auth.otp.generated",
}
