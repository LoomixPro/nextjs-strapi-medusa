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
    emailSubject: (id: string) => `عودت وجه سفارش #${id}`,
    emailTitle: "عودت وجه انجام شد",
    emailGreeting: (name: string) => `جناب/سرکار ${name}، سلام.`,
    emailDesc: (id: string, amount: string) => `بدین‌وسیله به اطلاع می‌رساند مبلغ <strong>${amount}</strong> مربوط به سفارش شماره <strong>#${id}</strong> با موفقیت عودت داده شد.`,
    refundTitle: "مبلغ عودت داده شده:",
    refundDesc: "مبلغ فوق طی ۳ تا ۷ روز کاری به حساب بانکی شما واریز خواهد شد.",
    emailSupport: "پشتیبانی فروشگاه از اعتماد و همراهی شما سپاسگزار است.",
    feedTitle: "عودت وجه ثبت شد",
    feedDesc: (id: string, name: string) => `عودت وجه برای سفارش #${id} ثبت شد.`,
    dir: "rtl"
  },
  "en-US": {
    dearCustomer: "Dear Customer",
    currency: "", // Will fall back to uppercase currency code
    emailSubject: (id: string) => `Refund Processed for Order #${id}`,
    emailTitle: "Refund Processed",
    emailGreeting: (name: string) => `Hello ${name},`,
    emailDesc: (id: string, amount: string) => `This is to inform you that a refund of <strong>${amount}</strong> for your order <strong>#${id}</strong> has been successfully processed.`,
    refundTitle: "Refunded Amount:",
    refundDesc: "The amount will be credited to your bank account within 3 to 7 business days.",
    emailSupport: "Thank you for shopping with us.",
    feedTitle: "Refund Created",
    feedDesc: (id: string, name: string) => `A refund was created for order #${id}.`,
    dir: "ltr"
  },
  "ar-AE": {
    dearCustomer: "عميلنا العزيز",
    currency: "درهم",
    emailSubject: (id: string) => `تم استرداد المبلغ للطلب #${id}`,
    emailTitle: "تم استرداد المبلغ بنجاح",
    emailGreeting: (name: string) => `مرحباً ${name}،`,
    emailDesc: (id: string, amount: string) => `نود إعلامك بأنه تم استرداد مبلغ <strong>${amount}</strong> للطلب رقم <strong>#${id}</strong> بنجاح.`,
    refundTitle: "المبلغ المسترد:",
    refundDesc: "سيتم إيداع المبلغ في حسابك البنكي خلال 3 إلى 7 أيام عمل.",
    emailSupport: "شكراً لثقتكم وتسوّقكم معنا.",
    feedTitle: "تم استرداد المبلغ",
    feedDesc: (id: string, name: string) => `تم تسجيل استرداد المبلغ للطلب #${id}.`,
    dir: "rtl"
  }
}

export default async function refundCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query")
  const logger = container.resolve("logger")

  try {
    // مرحله ۱: اطلاعات payment رو می‌گیریم (payment_collection_id برای link به order)
    const { data: payments } = await query.graph({
      entity: "payment",
      fields: [
        "id",
        "amount",
        "raw_amount",
        "currency_code",
        "payment_collection_id",
        "refunds.id",
        "refunds.amount",
        "refunds.raw_amount",
      ],
      filters: {
        id: data.id,
      },
    })

    if (!payments || payments.length === 0) {
      logger.error(`Payment with id ${data.id} not found in payment.refunded event.`)
      return
    }

    const payment = payments[0] as any
    logger.info(`[RefundCreated] Payment ID: ${payment.id}, payment_collection_id: ${payment.payment_collection_id}`)

    if (!payment.payment_collection_id) {
      logger.error(`[RefundCreated] No payment_collection_id on payment ${data.id}.`)
      return
    }

    // مرحله ۲: از payment_collection_id، order رو پیدا می‌کنیم
    const { data: orderPaymentCollections } = await query.graph({
      entity: "order_payment_collection",
      fields: [
        "order_id",
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
        "order.shipping_address.country_code",
      ],
      filters: {
        payment_collection_id: payment.payment_collection_id,
      },
    })

    const order = (orderPaymentCollections?.[0] as any)?.order
    if (!order) {
      logger.error(`[RefundCreated] No associated order found for payment_collection ${payment.payment_collection_id}.`)
      return
    }

    const lang = resolveOrderLocale(order)
    const t = locales[lang] || locales["en-US"]

    // مبلغ آخرین refund را می‌گیریم
    const refunds = payment.refunds || []
    const latestRefund = refunds[refunds.length - 1]
    const refundAmount = latestRefund?.amount ?? payment.amount

    // فرمت مبلغ
    const formattedRefund = formatCurrency(refundAmount, payment.currency_code || order.currency_code, lang)
    const formattedAmount = formattedRefund.formattedAmount
    const amountLabel = formattedRefund.label

    const phone = order.shipping_address?.phone || order.customer?.phone || ""
    const fullName = `${order.shipping_address?.first_name || ""} ${order.shipping_address?.last_name || ""}`.trim() || t.dearCustomer
    const safeFullName = escapeHtml(fullName)
    const safeDisplayId = escapeHtml(order.display_id)
    const safeAmountLabel = escapeHtml(amountLabel)

    // 1. Email Content
    const emailSubject = t.emailSubject(safeDisplayId)
    const emailHtml = `
      <div style="direction: ${t.dir}; font-family: Tahoma, Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; line-height: 1.6;">
        <h2 style="color: #1565c0; text-align: center;">${t.emailTitle}</h2>
        <p>${t.emailGreeting(safeFullName)}</p>
        <p>${t.emailDesc(safeDisplayId, safeAmountLabel)}</p>

        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 4px; border-${t.dir === 'rtl' ? 'right' : 'left'}: 4px solid #1565c0; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #0d47a1;"><strong>${t.refundTitle}</strong> ${safeAmountLabel}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">${t.refundDesc}</p>
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
          template: "refund-created-sms",
          data: {
            orderId: order.display_id,
            amountLabel,
            fullName
          }
        })
      } catch (error: any) {
        logger.warn(`Failed to send refund created SMS to ${phone}: ${error.message || error}`)
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
          template: "refund-created-email",
          content: {
            subject: emailSubject,
            html: emailHtml,
          },
        })
      } catch (error: any) {
        logger.warn(`Failed to send refund created Email to ${realEmail}: ${error.message || error}`)
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

    // 4. Log
    logger.info(
      `\n==================================================\n` +
      `🔔 [NOTIFICATION LOG - REFUND CREATED]\n` +
      `Payment ID: ${payment.id} (Order Display ID: #${order.display_id})\n` +
      `Refund Amount: ${amountLabel}\n` +
      `--------------------------------------------------\n` +
      `📱 [SMS to ${phone || "None"}] sent via template 'refund-created-sms'\n` +
      `--------------------------------------------------\n` +
      (realEmail
        ? `📧 [Email to ${realEmail}] Subject: ${emailSubject}\n`
        : `📧 [Email]: Skipped (phone-only user)\n`
      ) +
      `==================================================\n`
    )
  } catch (error: any) {
    logger.error(`Error processing payment.refunded notification: ${error.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "payment.refunded",
}
