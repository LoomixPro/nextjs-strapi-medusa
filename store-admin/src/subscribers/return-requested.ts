import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework"
import { resolveOrderLocale, type SupportedLocale } from "../utils/resolve-locale"
import { Modules } from "@medusajs/framework/utils"

const locales: Record<SupportedLocale, any> = {
  "fa-IR": {
    dearCustomer: "مشتری گرامی",
    emailSubject: (id: string) => `ثبت درخواست مرجوعی سفارش #${id}`,
    emailTitle: "درخواست مرجوعی ثبت شد",
    emailGreeting: (name: string) => `جناب/سرکار ${name}، سلام.`,
    emailDesc: (id: string) => `درخواست مرجوعی شما برای سفارش شماره <strong>#${id}</strong> با موفقیت ثبت گردید و هم‌اکنون توسط همکاران ما در حال بررسی است.`,
    statusTitle: "وضعیت فعلی:",
    statusDesc: "در انتظار بررسی و تأیید اولیه",
    nextSteps: "نتیجه بررسی و مراحل بعدی ارسال مرسوله متعاقباً به اطلاع شما خواهد رسید.",
    emailSupport: "از شکیبایی شما سپاسگزاریم. پشتیبانی فروشگاه.",
    feedTitle: "درخواست مرجوعی ثبت شد",
    feedDesc: (id: string, name: string) => `درخواست مرجوعی برای سفارش #${id} ثبت شد.`,
    dir: "rtl"
  },
  "en-US": {
    dearCustomer: "Dear Customer",
    emailSubject: (id: string) => `Return Requested for Order #${id}`,
    emailTitle: "Return Request Received",
    emailGreeting: (name: string) => `Hello ${name},`,
    emailDesc: (id: string) => `Your return request for order <strong>#${id}</strong> has been successfully registered and is currently under review by our team.`,
    statusTitle: "Current Status:",
    statusDesc: "Pending initial review and approval",
    nextSteps: "The review results and next steps for shipping the package will be communicated to you later.",
    emailSupport: "Thank you for your patience. Store Support.",
    feedTitle: "Return Requested",
    feedDesc: (id: string, name: string) => `A return request was created for order #${id}.`,
    dir: "ltr"
  },
  "ar-AE": {
    dearCustomer: "عميلنا العزيز",
    emailSubject: (id: string) => `طلب إرجاع للطلب #${id}`,
    emailTitle: "تم استلام طلب الإرجاع",
    emailGreeting: (name: string) => `مرحباً ${name}،`,
    emailDesc: (id: string) => `تم تسجيل طلب الإرجاع الخاص بالطلب رقم <strong>#${id}</strong> بنجاح، وهو قيد المراجعة حالياً من قبل فريقنا.`,
    statusTitle: "الحالة الحالية:",
    statusDesc: "قيد المراجعة والموافقة المبدئية",
    nextSteps: "سيتم إعلامك بنتيجة المراجعة والخطوات التالية لشحن المنتجات لاحقاً.",
    emailSupport: "شكراً لصبركم ودعمكم.",
    feedTitle: "طلب إرجاع جديد",
    feedDesc: (id: string, name: string) => `تم تسجيل طلب إرجاع للطلب #${id}.`,
    dir: "rtl"
  }
}

export default async function returnRequestedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ order_id: string; return_id: string }>) {
  const query = container.resolve("query")
  const logger = container.resolve("logger")

  try {
    logger.info(`[DEBUG] event data: order_id=${data.order_id}, return_id=${data.return_id}`)

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "metadata",
        "customer.id",
        "customer.email",
        "customer.phone",
        "shipping_address.phone",
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.country_code",
      ],
      filters: {
        id: data.order_id,
      },
    })

    if (!orders || orders.length === 0) {
      logger.error(`Order with id ${data.order_id} not found in order.return_requested event.`)
      return
    }

    const order = orders[0] as any
    const lang = resolveOrderLocale(order)
    const t = locales[lang] || locales["en-US"]

    const phone = order.shipping_address?.phone || order.customer?.phone || ""
    const fullName = `${order.shipping_address?.first_name || ""} ${order.shipping_address?.last_name || ""}`.trim() || t.dearCustomer

    logger.info(`[DEBUG] order.email: ${order.email}`)
    logger.info(`[DEBUG] order.customer.email: ${order.customer?.email}`)

    // 1. Prepare Email Notification Content
    const emailSubject = t.emailSubject(order.display_id)
    const emailHtml = `
      <div style="direction: ${t.dir}; font-family: Tahoma, Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; line-height: 1.6;">
        <h2 style="color: #0288d1; text-align: center;">${t.emailTitle}</h2>
        <p>${t.emailGreeting(fullName)}</p>
        <p>${t.emailDesc(order.display_id)}</p>
        
        <div style="background-color: #e1f5fe; padding: 15px; border-radius: 4px; border-${t.dir === 'rtl' ? 'right' : 'left'}: 4px solid #0288d1; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #01579b;"><strong>${t.statusTitle}</strong> ${t.statusDesc}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">${t.nextSteps}</p>
        </div>
        
        <p style="font-size: 13px; color: #888; text-align: center; margin-top: 30px;">${t.emailSupport}</p>
      </div>
    `

    // 2. Send Notifications
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)

    if (phone) {
      try {
        await notificationModuleService.createNotifications({
          to: phone,
          channel: "sms",
          template: "return-requested-sms",
          data: {
            orderId: order.display_id,
            fullName
          }
        })
      } catch (error: any) {
        logger.warn(`Failed to send return requested SMS to ${phone}: ${error.message || error}`)
      }
    }

    const orderEmail = order.email && !order.email.endsWith("@phone.local") ? order.email : null
    const customerEmail = order.customer?.email && !order.customer.email.endsWith("@phone.local") ? order.customer.email : null
    const realEmail = orderEmail || customerEmail

    if (realEmail) {
      try {
        await notificationModuleService.createNotifications({
          to: realEmail,
          channel: "email",
          template: "return-requested-email",
          content: {
            subject: emailSubject,
            html: emailHtml,
          },
        })
      } catch (error: any) {
        logger.warn(`Failed to send return requested Email to ${realEmail}: ${error.message || error}`)
      }
    }

    // 3. Admin Feed Notification
    try {
      await notificationModuleService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: t.feedTitle,
          description: t.feedDesc(order.display_id, fullName),
        },
      })
    } catch (error: any) {
      logger.warn(`Failed to send Admin Feed Notification: ${error.message || error}`)
    }

    // 4. Log the Notifications
    logger.info(`\n==================================================\n` +
      `🔔 [NOTIFICATION LOG - RETURN REQUESTED]\n` +
      `Return ID: ${data.return_id} (Order Display ID: #${order.display_id})\n` +
      `--------------------------------------------------\n` +
      `📱 [SMS to ${phone || "None"}] sent via template 'return-requested-sms'\n` +
      `--------------------------------------------------\n` +
      (realEmail
        ? `📧 [Email to ${realEmail}] Subject: ${emailSubject}\n`
        : `📧 [Email]: Skipped (phone-only user)\n`
      ) +
      `==================================================\n`)
  } catch (error: any) {
    logger.error(`Error processing order.return_requested notification: ${error.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.return_requested",
}
