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
    emailSubject: (id: string) => `دریافت مرسوله مرجوعی سفارش #${id}`,
    emailTitle: "مرسوله مرجوعی دریافت شد",
    emailGreeting: (name: string) => `جناب/سرکار ${name}، سلام.`,
    emailDesc: (id: string) => `بدین‌وسیله به اطلاع می‌رساند مرسوله مرجوعی مربوط به سفارش شماره <strong>#${id}</strong> با موفقیت توسط انبار دریافت و تایید گردید.`,
    statusTitle: "وضعیت مرجوعی:",
    statusDesc: "تایید شده و دریافت شده در انبار",
    nextSteps: "فرآیند عودت وجه یا تعویض کالا آغاز شده و مبلغ مربوطه طی ۴۸ الی ۷۲ ساعت آینده به حساب شما واریز خواهد شد.",
    emailSupport: "پشتیبانی فروشگاه از انتخاب و همراهی شما سپاسگزار است.",
    feedTitle: "مرجوعی دریافت شد",
    feedDesc: (id: string, name: string) => `مرسوله مرجوعی سفارش #${id} دریافت شد.`,
    dir: "rtl"
  },
  "en-US": {
    dearCustomer: "Dear Customer",
    emailSubject: (id: string) => `Return Received for Order #${id}`,
    emailTitle: "Return Package Received",
    emailGreeting: (name: string) => `Hello ${name},`,
    emailDesc: (id: string) => `This is to inform you that the returned package for order <strong>#${id}</strong> has been successfully received and approved by our warehouse.`,
    statusTitle: "Return Status:",
    statusDesc: "Approved and received in warehouse",
    nextSteps: "The refund or exchange process has begun, and the relevant amount will be credited to your account within 48 to 72 hours.",
    emailSupport: "Thank you for shopping with us.",
    feedTitle: "Return Received",
    feedDesc: (id: string, name: string) => `The returned package for order #${id} was received.`,
    dir: "ltr"
  },
  "ar-AE": {
    dearCustomer: "عميلنا العزيز",
    emailSubject: (id: string) => `تم استلام الشحنة المرتجعة للطلب #${id}`,
    emailTitle: "تم استلام الشحنة المرتجعة",
    emailGreeting: (name: string) => `مرحباً ${name}،`,
    emailDesc: (id: string) => `نود إعلامك بأنه تم استلام وتأكيد الشحنة المرتجعة للطلب رقم <strong>#${id}</strong> بنجاح في مستودعاتنا.`,
    statusTitle: "حالة الإرجاع:",
    statusDesc: "تم الاستلام والموافقة في المستودع",
    nextSteps: "بدأت عملية استرداد المبلغ أو الاستبدال، وسيتم إيداع المبلغ في حسابك خلال 48 إلى 72 ساعة.",
    emailSupport: "شكراً لتسوقك معنا ولدعمك الدائم.",
    feedTitle: "تم استلام المرتجع",
    feedDesc: (id: string, name: string) => `تم استلام الشحنة المرتجعة للطلب #${id}.`,
    dir: "rtl"
  }
}

export default async function returnReceivedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ order_id: string; return_id: string; no_notification?: boolean }>) {
  const query = container.resolve("query")
  const logger = container.resolve("logger")

  try {
    // 0. Check no_notification flag from event payload (set by admin in dashboard toggle)
    if (data.no_notification === true) {
      logger.info(`[ReturnReceived] no_notification=true (event payload) → Skipping all notifications for return ${data.return_id}`)
      return
    }

    // Query return to check no_notification flag AND actual status
    const { data: returns } = await query.graph({
      entity: "return",
      fields: ["id", "status", "no_notification"],
      filters: { id: data.return_id },
    })

    if (!returns || returns.length === 0) {
      logger.error(`Return with id ${data.return_id} not found in order.return_received event.`)
      return
    }

    const returnObj = returns[0] as any
    logger.info(`[ReturnReceived] Return ID: ${returnObj.id}, status=${returnObj.status}, no_notification=${returnObj.no_notification}`)

    if (returnObj.no_notification === true) {
      logger.info(`[ReturnReceived] no_notification=true → Skipping notification for return ${data.return_id}`)
      return
    }

    if (returnObj.status !== "received" && returnObj.status !== "completed") {
      logger.info(`[ReturnReceived] Return status is "${returnObj.status}" (not received/completed) → Skipping premature notification`)
      return
    }

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
      filters: { id: data.order_id },
    })

    if (!orders || orders.length === 0) {
      logger.error(`Order with id ${data.order_id} not found in order.return_received event.`)
      return
    }

    const order = orders[0] as any
    const lang = resolveOrderLocale(order)
    const t = locales[lang] || locales["en-US"]

    const phone = order.shipping_address?.phone || order.customer?.phone || ""
    const fullName = `${order.shipping_address?.first_name || ""} ${order.shipping_address?.last_name || ""}`.trim() || t.dearCustomer
    const safeFullName = escapeHtml(fullName)
    const safeDisplayId = escapeHtml(order.display_id)

    // 1. Prepare Email Notification Content
    const emailSubject = t.emailSubject(safeDisplayId)
    const emailHtml = `
      <div style="direction: ${t.dir}; font-family: Tahoma, Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; line-height: 1.6;">
        <h2 style="color: #2e7d32; text-align: center;">${t.emailTitle}</h2>
        <p>${t.emailGreeting(safeFullName)}</p>
        <p>${t.emailDesc(safeDisplayId)}</p>
        
        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 4px; border-${t.dir === 'rtl' ? 'right' : 'left'}: 4px solid #2e7d32; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #1b5e20;"><strong>${t.statusTitle}</strong> ${t.statusDesc}</p>
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
          template: "return-received-sms",
          data: {
            orderId: order.display_id,
            fullName
          }
        })
      } catch (error: any) {
        logger.warn(`Failed to send return received SMS to ${phone}: ${error.message || error}`)
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
          template: "return-received-email",
          content: {
            subject: emailSubject,
            html: emailHtml,
          },
        })
      } catch (error: any) {
        logger.warn(`Failed to send return received Email to ${realEmail}: ${error.message || error}`)
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
      `🔔 [NOTIFICATION LOG - RETURN RECEIVED]\n` +
      `Return ID: ${data.return_id} (Order Display ID: #${order.display_id})\n` +
      `--------------------------------------------------\n` +
      `📱 [SMS to ${phone || "None"}] sent via template 'return-received-sms'\n` +
      `--------------------------------------------------\n` +
      (realEmail
        ? `📧 [Email to ${realEmail}] Subject: ${emailSubject}\n`
        : `📧 [Email]: Skipped (phone-only user)\n`
      ) +
      `==================================================\n`)
  } catch (error: any) {
    logger.error(`Error processing order.return_received notification: ${error.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.return_received",
}
