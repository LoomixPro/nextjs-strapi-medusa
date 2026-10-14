import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework"
import { resolveOrderLocale, type SupportedLocale } from "../utils/resolve-locale"
import { escapeHtml } from "../utils/escape-html"
import { Modules } from "@medusajs/framework/utils"

const locales: Record<SupportedLocale, any> = {
  "fa-IR": {
    dearCustomer: "مشتری گرامی",
    emailSubject: (id: string) => `آماده‌سازی سفارش #${id}`,
    emailTitle: "سفارش شما آماده ارسال شد",
    emailGreeting: (name: string) => `جناب/سرکار ${name}، سلام.`,
    emailDesc: (id: string) => `بدین‌وسیله به اطلاع می‌رساند سفارش شما به شماره <strong>#${id}</strong> با موفقیت بسته‌بندی و آماده ارسال گردید و به زودی تحویل شرکت حمل و نقل خواهد شد.`,
    trackingTitle: "اطلاعات رهگیری (در صورت تخصیص):",
    trackingNum: "کد رهگیری:",
    trackingLink: "لینک پیگیری:",
    trackingLinkText: "رهگیری مرسوله",
    addressTitle: "آدرس ارسال سفارش:",
    emailSupport: "پشتیبانی فروشگاه از همراهی شما سپاسگزار است.",
    feedTitle: "سفارش در حال آماده‌سازی",
    feedDesc: (id: string, name: string) => `سفارش #${id} برای ${name} آماده ارسال شد.`,
    dir: "rtl"
  },
  "en-US": {
    dearCustomer: "Dear Customer",
    emailSubject: (id: string) => `Order Ready to Ship #${id}`,
    emailTitle: "Your Order is Ready to Ship",
    emailGreeting: (name: string) => `Hello ${name},`,
    emailDesc: (id: string) => `This is to inform you that your order <strong>#${id}</strong> has been successfully packed and is ready for shipment. It will be handed over to the courier soon.`,
    trackingTitle: "Tracking Information:",
    trackingNum: "Tracking Number:",
    trackingLink: "Tracking Link:",
    trackingLinkText: "Track Package",
    addressTitle: "Shipping Address:",
    emailSupport: "Thank you for shopping with us.",
    feedTitle: "Order Fulfillment Created",
    feedDesc: (id: string, name: string) => `Order #${id} for ${name} is ready for shipment.`,
    dir: "ltr"
  },
  "ar-AE": {
    dearCustomer: "عميلنا العزيز",
    emailSubject: (id: string) => `طلبك جاهز للشحن #${id}`,
    emailTitle: "طلبك جاهز للشحن",
    emailGreeting: (name: string) => `مرحباً ${name}،`,
    emailDesc: (id: string) => `تم تجهيز وتغليف طلبك رقم <strong>#${id}</strong> بنجاح، وسيتم تسليمه لشركة الشحن قريباً.`,
    trackingTitle: "معلومات التتبع (إن وجدت):",
    trackingNum: "رقم التتبع:",
    trackingLink: "رابط التتبع:",
    trackingLinkText: "تتبع الشحنة",
    addressTitle: "عنوان الشحن:",
    emailSupport: "شكراً لتسوقك معنا.",
    feedTitle: "الطلب قيد التجهيز",
    feedDesc: (id: string, name: string) => `الطلب #${id} لـ ${name} جاهز للشحن.`,
    dir: "rtl"
  }
}

export default async function orderFulfillmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ fulfillment_id: string; order_id: string; no_notification?: boolean }>) {
  const query = container.resolve("query")
  const logger = container.resolve("logger")

  try {
    const { data: fulfillments } = await query.graph({
      entity: "fulfillment",
      fields: [
        "id",
        "provider_id",
        "labels.tracking_number",
        "labels.tracking_url",
        "order.id",
        "order.display_id",
        "order.email",
        "order.currency_code",
        "order.metadata",
        "order.customer.phone",
        "order.customer.email",
        "order.shipping_address.phone",
        "order.shipping_address.first_name",
        "order.shipping_address.last_name",
        "order.shipping_address.city",
        "order.shipping_address.address_1",
        "order.shipping_address.country_code"
      ],
      filters: {
        id: data.fulfillment_id,
      },
    })

    if (!fulfillments || fulfillments.length === 0) {
      logger.error(`Fulfillment with id ${data.fulfillment_id} not found in order.fulfillment_created event.`)
      return
    }

    const fulfillment = fulfillments[0]
    const order = fulfillment.order

    if (!order) {
      logger.error(`No associated order found for fulfillment ${data.fulfillment_id}.`)
      return
    }

    // Check if admin disabled notifications in the fulfillment modal
    if (data.no_notification === true) {
      logger.info(`[FulfillmentCreated] no_notification=true → Skipping all notifications for fulfillment ${data.fulfillment_id}`)
      return
    }

    const lang = resolveOrderLocale(order)
    const t = locales[lang] || locales["en-US"]

    const phone = order.shipping_address?.phone || order.customer?.phone || ""
    const fullName = `${order.shipping_address?.first_name || ""} ${order.shipping_address?.last_name || ""}`.trim() || t.dearCustomer
    const safeFullName = escapeHtml(fullName)
    const safeDisplayId = escapeHtml(order.display_id)
    const safeCity = escapeHtml(order.shipping_address?.city || "")
    const safeAddress1 = escapeHtml(order.shipping_address?.address_1 || "")

    // 1. Prepare Email Notification Content
    const emailSubject = t.emailSubject(safeDisplayId)
    const trackingRowsHtml = fulfillment.labels?.map((label: any) => {
      const safeTrackingNumber = escapeHtml(label.tracking_number)
      const safeTrackingUrl = label.tracking_url ? escapeHtml(label.tracking_url) : ""
      return `
        <div style="background-color: #f1f8e9; padding: 15px; border-radius: 4px; margin-bottom: 10px; border-${t.dir === 'rtl' ? 'right' : 'left'}: 4px solid #4caf50;">
          <p style="margin: 0; font-size: 14px;"><strong>${t.trackingNum}</strong> <span style="font-family: monospace; font-size: 16px;">${safeTrackingNumber}</span></p>
          ${safeTrackingUrl ? `<p style="margin: 5px 0 0 0; font-size: 14px;"><strong>${t.trackingLink}</strong> <a href="${safeTrackingUrl}" target="_blank" style="color: #4caf50; text-decoration: none;">${t.trackingLinkText}</a></p>` : ""}
        </div>
      `
    }).join("") || ""

    const emailHtml = `
      <div style="direction: ${t.dir}; font-family: Tahoma, Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; line-height: 1.6;">
        <h2 style="color: #0288d1; text-align: center;">${t.emailTitle}</h2>
        <p>${t.emailGreeting(safeFullName)}</p>
        <p>${t.emailDesc(safeDisplayId)}</p>
        
        ${trackingRowsHtml ? `
        <h3 style="border-bottom: 2px solid #0288d1; padding-bottom: 5px; color: #333;">${t.trackingTitle}</h3>
        ${trackingRowsHtml}
        ` : ""}
        
        <p style="margin-top: 20px;"><strong>${t.addressTitle}</strong><br>${safeCity} - ${safeAddress1}</p>
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
          template: "order-ready-sms",
          data: {
            orderId: order.display_id,
            fullName,
          }
        })
      } catch (error: any) {
        logger.warn(`Failed to send order ready SMS to ${phone}: ${error.message || error}`)
      }
    }

    const orderEmail = order.email && !order.email.endsWith("@phone.local") ? order.email : null;
    const customerEmail = order.customer?.email && !order.customer.email.endsWith("@phone.local") ? order.customer.email : null;
    const realEmail = orderEmail || customerEmail;

    if (realEmail) {
      try {
        await notificationModuleService.createNotifications({
          to: realEmail,
          channel: "email",
          template: "order-ready-email",
          content: {
            subject: emailSubject,
            html: emailHtml,
          },
        })
      } catch (error: any) {
        logger.warn(`Failed to send order ready Email to ${realEmail}: ${error.message || error}`)
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
      `🔔 [NOTIFICATION LOG - ORDER READY (FULFILLMENT CREATED)]\n` +
      `Order ID: ${order.id} (Display ID: #${order.display_id})\n` +
      `Fulfillment ID: ${fulfillment.id}\n` +
      `--------------------------------------------------\n` +
      `📱 [SMS to ${phone || "None"}] sent via template 'order-ready-sms'\n` +
      `--------------------------------------------------\n` +
      (realEmail
        ? `📧 [Email to ${realEmail}] Subject: ${emailSubject}\n`
        : `📧 [Email]: Skipped (phone-only user)\n`
      ) +
      `==================================================\n`)
  } catch (error: any) {
    logger.error(`Error processing order.fulfillment_created notification: ${error.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
}
