import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework"
import { resolveOrderLocale, type SupportedLocale } from "../utils/resolve-locale"
import { escapeHtml } from "../utils/escape-html"
import { formatCurrency } from "../utils/format-currency"
import { Modules } from "@medusajs/framework/utils"

const locales: Record<SupportedLocale, any> = {
  "fa-IR": {
    dearCustomer: "مشتری گرامی",
    currency: "تومان",
    emailSubject: (id: string) => `لغو سفارش #${id}`,
    emailTitle: "سفارش شما لغو شد",
    emailGreeting: (name: string) => `جناب/سرکار ${name}، سلام.`,
    emailDesc: (id: string) => `بدین‌وسیله به اطلاع می‌رساند سفارش شما به شماره <strong>#${id}</strong> لغو گردیده است.`,
    emailReasonTitle: "علت لغو:",
    emailReasonDesc: "لغو توسط مدیر فروشگاه یا انصراف خریدار",
    emailRefundInfo: (amount: string, currency: string) => `مبلغ کل سفارش (<strong>${amount} ${currency}</strong>) طی ۴۸ الی ۷۲ ساعت آینده به حساب شما عودت داده خواهد شد.`,
    emailSupport: "اگر سوالی دارید، لطفا با پشتیبانی فروشگاه ما تماس بگیرید.",
    feedTitle: "سفارش لغو شد",
    feedDesc: (id: string, name: string) => `سفارش #${id} برای ${name} لغو گردید.`,
    dir: "rtl"
  },
  "en-US": {
    dearCustomer: "Dear Customer",
    currency: "", // Will fall back to uppercase currency code
    emailSubject: (id: string) => `Order Canceled #${id}`,
    emailTitle: "Your Order Has Been Canceled",
    emailGreeting: (name: string) => `Hello ${name},`,
    emailDesc: (id: string) => `This is to inform you that your order <strong>#${id}</strong> has been canceled.`,
    emailReasonTitle: "Reason for Cancellation:",
    emailReasonDesc: "Canceled by store admin or customer request",
    emailRefundInfo: (amount: string, currency: string) => `The total amount (<strong>${amount} ${currency}</strong>) will be refunded to your account within 48-72 hours.`,
    emailSupport: "If you have any questions, please contact our support team.",
    feedTitle: "Order Canceled",
    feedDesc: (id: string, name: string) => `Order #${id} for ${name} was canceled.`,
    dir: "ltr"
  },
  "ar-AE": {
    dearCustomer: "عميلنا العزيز",
    currency: "درهم",
    emailSubject: (id: string) => `إلغاء الطلب #${id}`,
    emailTitle: "تم إلغاء طلبك",
    emailGreeting: (name: string) => `مرحباً ${name}،`,
    emailDesc: (id: string) => `نود إعلامك بأنه تم إلغاء طلبك رقم <strong>#${id}</strong>.`,
    emailReasonTitle: "سبب الإلغاء:",
    emailReasonDesc: "تم الإلغاء بناءً على طلب العميل أو إدارة المتجر",
    emailRefundInfo: (amount: string, currency: string) => `سيتم استرداد المبلغ الإجمالي (<strong>${amount} ${currency}</strong>) إلى حسابك خلال 48 إلى 72 ساعة.`,
    emailSupport: "إذا كان لديك أي استفسار، يرجى التواصل مع فريق الدعم لدينا.",
    feedTitle: "تم إلغاء الطلب",
    feedDesc: (id: string, name: string) => `تم إلغاء الطلب #${id} لـ ${name}.`,
    dir: "rtl"
  }
}

export default async function orderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query")
  const logger = container.resolve("logger")

  try {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "email",
        "total",
        "currency_code",
        "metadata",
        "customer.phone",
        "customer.email",
        "shipping_address.phone",
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.country_code"
      ],
      filters: {
        id: data.id,
      },
    })

    if (!orders || orders.length === 0) {
      logger.error(`Order with id ${data.id} not found in order.canceled event.`)
      return
    }

    const order = orders[0]
    const lang = resolveOrderLocale(order)
    const t = locales[lang] || locales["en-US"]

    const phone = order.shipping_address?.phone || order.customer?.phone || ""
    const fullName = `${order.shipping_address?.first_name || ""} ${order.shipping_address?.last_name || ""}`.trim() || t.dearCustomer
    const safeFullName = escapeHtml(fullName)
    const safeDisplayId = escapeHtml(order.display_id)
    const formattedTotal = formatCurrency(order.total, order.currency_code, lang)
    const totalAmount = formattedTotal.formattedAmount
    const currency = formattedTotal.currency

    // 1. Prepare Email Notification Content
    const emailSubject = t.emailSubject(safeDisplayId)
    const emailHtml = `
      <div style="direction: ${t.dir}; font-family: Tahoma, Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; line-height: 1.6;">
        <h2 style="color: #d32f2f; text-align: center;">${t.emailTitle}</h2>
        <p>${t.emailGreeting(safeFullName)}</p>
        <p>${t.emailDesc(safeDisplayId)}</p>
        
        <div style="background-color: #ffebee; padding: 15px; border-radius: 4px; border-${t.dir === 'rtl' ? 'right' : 'left'}: 4px solid #d32f2f; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #c62828;"><strong>${t.emailReasonTitle}</strong> ${t.emailReasonDesc}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">${t.emailRefundInfo(totalAmount, currency)}</p>
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
          template: "order-canceled-sms",
          data: {
            orderId: order.display_id,
            fullName,
            totalAmount,
            currency
          }
        })
      } catch (error: any) {
        logger.warn(`Failed to send order canceled SMS to ${phone}: ${error.message || error}`)
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
          template: "order-canceled-email",
          content: {
            subject: emailSubject,
            html: emailHtml,
          },
        })
      } catch (error: any) {
        logger.warn(`Failed to send order canceled Email to ${realEmail}: ${error.message || error}`)
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
      `🔔 [NOTIFICATION LOG - ORDER CANCELLED]\n` +
      `Order ID: ${order.id} (Display ID: #${order.display_id})\n` +
      `--------------------------------------------------\n` +
      `📱 [SMS to ${phone || "None"}] sent via template 'order-canceled-sms'\n` +
      `--------------------------------------------------\n` +
      (realEmail 
        ? `📧 [Email to ${realEmail}] Subject: ${emailSubject}\n`
        : `📧 [Email]: Skipped (phone-only user)\n`
      ) +
      `==================================================\n`)
  } catch (error: any) {
    logger.error(`Error processing order.canceled notification: ${error.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
