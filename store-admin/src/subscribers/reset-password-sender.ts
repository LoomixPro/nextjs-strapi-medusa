import {
    SubscriberArgs,
    type SubscriberConfig,
} from "@medusajs/framework"
import { resolveLocale, type SupportedLocale, DEFAULT_LOCALE } from "../utils/resolve-locale"
import { Modules } from "@medusajs/framework/utils"

// Event payload emitted by Medusa when a password reset is requested
type ResetPasswordPayload = {
    actor_type: string
    entity_id: string  // the customer's email
    token: string
    provider: string   // "emailpass"
}

const locales: Record<SupportedLocale, any> = {
    "fa-IR": {
        subject: "بازیابی رمز عبور",
        title: "بازیابی رمز عبور",
        desc: "کاربر گرامی، برای تنظیم رمز عبور جدید، روی دکمه زیر کلیک کنید:",
        button: "تنظیم رمز عبور جدید",
        expiry: "این لینک تنها ۱۵ دقیقه اعتبار دارد.<br/>اگر این درخواست را شما ارسال نکرده‌اید، این ایمیل را نادیده بگیرید.",
        trouble: "در صورت مشکل با دکمه، لینک زیر را در مرورگر خود کپی کنید:",
        dir: "rtl"
    },
    "en-US": {
        subject: "Reset Password",
        title: "Reset Password",
        desc: "Dear user, to set a new password, click the button below:",
        button: "Set New Password",
        expiry: "This link is only valid for 15 minutes.<br/>If you did not request this, please ignore this email.",
        trouble: "If you have trouble with the button, copy the link below into your browser:",
        dir: "ltr"
    },
    "ar-AE": {
        subject: "إعادة تعيين كلمة المرور",
        title: "إعادة تعيين كلمة المرور",
        desc: "عزيزي المستخدم، لتعيين كلمة مرور جديدة، يرجى النقر على الزر أدناه:",
        button: "تعيين كلمة مرور جديدة",
        expiry: "هذا الرابط صالح لمدة 15 دقيقة فقط.<br/>إذا لم تقم بطلب ذلك، يرجى تجاهل هذا البريد الإلكتروني.",
        trouble: "إذا واجهتك مشكلة مع الزر، انسخ الرابط أدناه في متصفحك:",
        dir: "rtl"
    }
}

export default async function handleResetPassword({
    event: { data },
    container,
}: SubscriberArgs<ResetPasswordPayload>) {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)
    const cacheService = container.resolve(Modules.CACHE)
    const logger = container.resolve("logger")

    const storeFrontUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8000"
    const defaultCountry = (process.env.DEFAULT_REGION || process.env.DEFAULT_COUNTRY_CODE || "us").toLowerCase()
    const email = data.entity_id
    const token = data.token

    // Build the reset-password URL based on actor_type
    let resetUrl = "";
    if (data.actor_type === "user") {
        const adminUrl = process.env.MEDUSA_ADMIN_URL || "http://localhost:9000/app"
        resetUrl = `${adminUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
    } else {
        resetUrl = `${storeFrontUrl}/${defaultCountry}/account/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
    }

    try {
        // 1. Fetch locale from Redis or fallback based on actor_type
        let cachedLocale: string | undefined
        try {
            cachedLocale = (await cacheService.get(`auth_locale_${email.toLowerCase()}`)) as string | undefined
        } catch (error) {
            logger.warn(`[Reset Password] Failed to get locale from cache: ${error}`)
        }

        const defaultLang = data.actor_type === "user" ? "en-US" : DEFAULT_LOCALE
        const lang = resolveLocale(cachedLocale || defaultLang)
        const t = locales[lang] || locales["en-US"]

        const emailHtml = `
            <div style="direction: ${t.dir}; font-family: Tahoma, Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9;">
                <h2 style="color: #333; text-align: center;">${t.title}</h2>
                <p style="font-size: 16px; color: #555; text-align: center;">
                    ${t.desc}
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}"
                       style="display: inline-block; background-color: #4f46e5; color: #fff; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold; text-decoration: none;">
                        ${t.button}
                    </a>
                </div>
                <p style="font-size: 14px; color: #999; text-align: center;">
                    ${t.expiry}
                </p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
                <p style="font-size: 12px; color: #bbb; text-align: center;">
                    ${t.trouble}<br/>
                    <a href="${resetUrl}" style="color: #4f46e5; word-break: break-all;">${resetUrl}</a>
                </p>
            </div>
        `

        await notificationModuleService.createNotifications({
            to: email,
            channel: "email",
            template: "reset-password",
            content: {
                subject: t.subject,
                html: emailHtml,
            },
        })
        logger.info(`[reset-password] Reset email sent to ${email} in ${lang}`)
    } catch (error: any) {
        logger.warn(`[reset-password] Failed to send reset email to ${email}: ${error.message || error}`)
    }
}

export const config: SubscriberConfig = {
    event: "auth.password_reset",
}
