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
    emailSubject: (id: string) => `ارسال سفارش #${id}`,
    emailTitle: "سفارش شما ارسال شد",
    emailGreeting: (name: string) => `جناب/سرکار ${name}، سلام.`,
    emailDesc: (id: string) => `سفارش شما به شماره <strong>#${id}</strong> آماده و تحویل شرکت حمل و نقل شد.`,
    trackingTitle: "اطلاعات رهگیری:",
    trackingNum: "کد رهگیری:",
    trackingLink: "لینک پیگیری:",
    trackingLinkText: "رهگیری مرسوله",
    trackingPending: "کد رهگیری به زودی ثبت خواهد شد.",
    addressTitle: "آدرس ارسال سفارش:",
    emailSupport: "از خرید شما متشکریم و امیدواریم تجربه خوبی داشته باشید.",
    feedTitle: "سفارش ارسال شد",
    feedDesc: (id: string, name: string) => `سفارش #${id} برای ${name} تحویل شرکت حمل و نقل شد.`,
    dir: "rtl"
  },
  "en-US": {
    dearCustomer: "Dear Customer",
    emailSubject: (id: string) => `Order Shipped #${id}`,
    emailTitle: "Your Order Has Been Shipped",
    emailGreeting: (name: string) => `Hello ${name},`,
    emailDesc: (id: string) => `Your order <strong>#${id}</strong> has been handed over to the courier.`,
    trackingTitle: "Tracking Information:",
    trackingNum: "Tracking Number:",
    trackingLink: "Tracking Link:",
    trackingLinkText: "Track Package",
    trackingPending: "Tracking number will be provided soon.",
    addressTitle: "Shipping Address:",
    emailSupport: "Thank you for your purchase. We hope you enjoy it!",
    feedTitle: "Order Shipped",
    feedDesc: (id: string, name: string) => `Order #${id} for ${name} was shipped.`,
    dir: "ltr"
  },
  "ar-AE": {
    dearCustomer: "عميلنا العزيز",
    emailSubject: (id: string) => `تم شحن طلبك #${id}`,
    emailTitle: "تم شحن طلبك بنجاح",
    emailGreeting: (name: string) => `مرحباً ${name}،`,
    emailDesc: (id: string) => `تم شحن وتسليم طلبك رقم <strong>#${id}</strong> إلى شركة الشحن.`,
    trackingTitle: "معلومات التتبع:",
    trackingNum: "رقم التتبع:",
    trackingLink: "رابط التتبع:",
    trackingLinkText: "تتبع الشحنة",
    trackingPending: "سيتم توفير رقم التتبع قريباً.",
    addressTitle: "عنوان الشحن:",
    emailSupport: "شكراً لتسوقك معنا، ونتمنى لك تجربة ممتعة!",
    feedTitle: "تم شحن الطلب",
    feedDesc: (id: string, name: string) => `تم تسليم الطلب #${id} لـ ${name} إلى شركة الشحن.`,
    dir: "rtl"
  }
}

export default async function orderShipmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
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
        id: data.id,
      },
    })

    if (!fulfillments || fulfillments.length === 0) {
      logger.error(`Fulfillment with id ${data.id} not found in shipment.created event.`)
      return
    }

    const fulfillment = fulfillments[0]
    const order = fulfillment.order

    if (!order) {
      logger.error(`No associated order found for fulfillment ${data.id}.`)
      return
    }

    // Check if admin disabled notifications
    if (data.no_notification === true) {
      logger.info(`[ShipmentCreated] no_notification=true → Skipping all notifications for fulfillment ${data.id}`)
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

    // Extract tracking info from current fulfillment
    const trackingNumbers: string[] = []
    let trackingUrl = ""

    if (fulfillment.labels) {
      for (const label of fulfillment.labels) {
        if (label.tracking_number) trackingNumbers.push(label.tracking_number)
        if (label.tracking_url) trackingUrl = label.tracking_url
      }
    }

    const trackingString = trackingNumbers.join(", ")

    // 1. Prepare Email Notification Content
    const emailSubject = t.emailSubject(safeDisplayId)

    let trackingRowsHtml = ""
    if (trackingNumbers.length > 0) {
      trackingRowsHtml = trackingNumbers.map((num) => {
        const safeNum = escapeHtml(num)
        const safeUrl = trackingUrl ? escapeHtml(trackingUrl) : ""
        return `
          <div style="background-color: #f1f8e9; padding: 15px; border-radius: 4px; margin-bottom: 10px; border-${t.dir === 'rtl' ? 'right' : 'left'}: 4px solid #4caf50;">
            <p style="margin: 0; font-size: 14px;"><strong>${t.trackingNum}</strong> <span style="font-family: monospace; font-size: 16px;">${safeNum}</span></p>
            ${safeUrl ? `<p style="margin: 5px 0 0 0; font-size: 14px;"><strong>${t.trackingLink}</strong> <a href="${safeUrl}" target="_blank" style="color: #4caf50; text-decoration: none;">${t.trackingLinkText}</a></p>` : ""}
          </div>
        `
      }).join("")
    } else {
      trackingRowsHtml = `<p>${t.trackingPending}</p>`
    }

    const emailHtml = `
      <div style="direction: ${t.dir}; font-family: Tahoma, Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; line-height: 1.6;">
        <h2 style="color: #4caf50; text-align: center;">${t.emailTitle}</h2>
        <p>${t.emailGreeting(safeFullName)}</p>
        <p>${t.emailDesc(safeDisplayId)}</p>
        
        <h3 style="border-bottom: 2px solid #4caf50; padding-bottom: 5px; color: #333;">${t.trackingTitle}</h3>
        ${trackingRowsHtml}
        
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
          template: "order-shipped-sms",
          data: {
            orderId: order.display_id,
            tracking: trackingString,
            fullName
          }
        })
      } catch (error: any) {
        logger.warn(`Failed to send order shipment created SMS to ${phone}: ${error.message || error}`)
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
          template: "order-shipped-email",
          content: {
            subject: emailSubject,
            html: emailHtml,
          },
        })
      } catch (error: any) {
        logger.warn(`Failed to send order shipment created Email to ${realEmail}: ${error.message || error}`)
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
      `🔔 [NOTIFICATION LOG - ORDER SHIPPED (SHIPMENT CREATED)]\n` +
      `Order ID: ${order.id} (Display ID: #${order.display_id})\n` +
      `Fulfillment ID: ${fulfillment.id}\n` +
      `--------------------------------------------------\n` +
      `📱 [SMS to ${phone || "None"}] sent via template 'order-shipped-sms'\n` +
      `--------------------------------------------------\n` +
      (realEmail
        ? `📧 [Email to ${realEmail}] Subject: ${emailSubject}\n`
        : `📧 [Email]: Skipped (phone-only user)\n`
      ) +
      `==================================================\n`)
  } catch (error: any) {
    logger.error(`Error processing shipment.created notification: ${error.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "shipment.created",
}

