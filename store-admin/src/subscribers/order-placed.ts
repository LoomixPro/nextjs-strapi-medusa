import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework"
import { resolveOrderLocale, type SupportedLocale } from "../utils/resolve-locale"
import { Modules } from "@medusajs/framework/utils"

const locales: Record<SupportedLocale, any> = {
  "fa-IR": {
    defaultAddress: "آدرس پیش‌فرض",
    dearCustomer: "مشتری گرامی",
    currency: "ریال",
    emailSubject: (id: string) => `تایید ثبت سفارش #${id}`,
    emailTitle: "ثبت سفارش با موفقیت انجام شد",
    emailGreeting: (name: string) => `جناب/سرکار ${name}، سلام.`,
    emailDesc: (id: string) => `سفارش شما به شماره <strong>#${id}</strong> با موفقیت ثبت و وارد مرحله پردازش شد.`,
    emailOrderDetails: "جزئیات سفارش:",
    emailColName: "نام محصول",
    emailColQty: "تعداد",
    emailColTotal: "قیمت کل",
    emailTotalPaid: "مبلغ کل پرداختی:",
    emailShippingAddress: "آدرس ارسال:",
    emailThanks: "از انتخاب و خرید شما از فروشگاه ما سپاسگزاریم.",
    feedTitle: "ثبت سفارش جدید",
    feedDesc: (id: string, name: string, amount: string, currency: string) => `سفارش #${id} توسط ${name} به مبلغ ${amount} ${currency} ثبت شد.`,
    dir: "rtl"
  },
  "en-US": {
    defaultAddress: "Default Address",
    dearCustomer: "Dear Customer",
    currency: "", // Will fall back to uppercase currency code
    emailSubject: (id: string) => `Order Confirmation #${id}`,
    emailTitle: "Order Placed Successfully",
    emailGreeting: (name: string) => `Hello ${name},`,
    emailDesc: (id: string) => `Your order <strong>#${id}</strong> has been successfully placed and is being processed.`,
    emailOrderDetails: "Order Details:",
    emailColName: "Product Name",
    emailColQty: "Quantity",
    emailColTotal: "Total Price",
    emailTotalPaid: "Total Paid:",
    emailShippingAddress: "Shipping Address:",
    emailThanks: "Thank you for shopping with us.",
    feedTitle: "New Order Placed",
    feedDesc: (id: string, name: string, amount: string, currency: string) => `Order #${id} was placed by ${name} for ${amount} ${currency}.`,
    dir: "ltr"
  },
  "ar-AE": {
    defaultAddress: "العنوان الافتراضي",
    dearCustomer: "عميلنا العزيز",
    currency: "درهم",
    emailSubject: (id: string) => `تأكيد الطلب #${id}`,
    emailTitle: "تم استلام طلبك بنجاح",
    emailGreeting: (name: string) => `مرحباً ${name}،`,
    emailDesc: (id: string) => `تم استلام طلبك رقم <strong>#${id}</strong> بنجاح وجارٍ معالجته.`,
    emailOrderDetails: "تفاصيل الطلب:",
    emailColName: "اسم المنتج",
    emailColQty: "الكمية",
    emailColTotal: "السعر الإجمالي",
    emailTotalPaid: "إجمالي المبلغ المدفوع:",
    emailShippingAddress: "عنوان الشحن:",
    emailThanks: "شكراً لتسوقك معنا.",
    feedTitle: "طلب جديد",
    feedDesc: (id: string, name: string, amount: string, currency: string) => `تم تسجيل الطلب #${id} بواسطة ${name} بقيمة ${amount} ${currency}.`,
    dir: "rtl"
  }
}

export default async function orderPlacedHandler({
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
        "customer.id",
        "customer.phone",
        "customer.email",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "items.detail.quantity",
        "shipping_address.phone",
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.city",
        "shipping_address.address_1",
        "shipping_address.address_2",
        "shipping_address.postal_code",
        "shipping_address.province",
        "shipping_address.country_code",
        "shipping_address.company"
      ],
      filters: {
        id: data.id,
      },
    })

    if (!orders || orders.length === 0) {
      logger.error(`Order with id ${data.id} not found in order.placed event.`)
      return
    }

    const order = orders[0]
    const lang = resolveOrderLocale(order)
    const t = locales[lang] || locales["en-US"]

    // Save shipping address of the first order to customer profile if they have no addresses yet
    const customerId = order.customer?.id
    if (customerId) {
      try {
        const { data: customers } = await query.graph({
          entity: "customer",
          fields: ["id", "addresses.id"],
          filters: {
            id: customerId,
          },
        })

        const customer = customers[0]
        if (customer && (!customer.addresses || customer.addresses.length === 0)) {
          if (order.shipping_address) {
            const customerModuleService = container.resolve(Modules.CUSTOMER)
            const addressData = {
              customer_id: customerId,
              first_name: order.shipping_address.first_name,
              last_name: order.shipping_address.last_name,
              phone: order.shipping_address.phone,
              company: order.shipping_address.company,
              address_1: order.shipping_address.address_1,
              address_2: order.shipping_address.address_2,
              city: order.shipping_address.city,
              country_code: order.shipping_address.country_code,
              province: order.shipping_address.province,
              postal_code: order.shipping_address.postal_code,
              address_name: t.defaultAddress,
              is_default_shipping: true,
              is_default_billing: true,
            }
            await customerModuleService.createCustomerAddresses(addressData)
            logger.info(`Successfully saved the first purchase address for customer: ${customerId}`)
          }
        }
      } catch (addrError: any) {
        logger.error(`Error saving customer address on first purchase: ${addrError.message || addrError}`)
      }
    }

    const phone = order.shipping_address?.phone || order.customer?.phone || ""
    const fullName = `${order.shipping_address?.first_name || ""} ${order.shipping_address?.last_name || ""}`.trim() || t.dearCustomer
    const totalAmount = Number(order.total || 0).toLocaleString(lang)
    const currency = order.currency_code === "irr" ? t.currency : order.currency_code.toUpperCase()

    // 1. Prepare Email Notification Content
    const emailSubject = t.emailSubject(order.display_id)
    const itemsListHtml = order.items
      ?.map(
        (item: any) => {
          const qty = Number(item.detail?.quantity ?? item.quantity ?? 1)
          const price = Number(item.unit_price || 0)
          const itemTotal = (price * qty).toLocaleString(lang)
          const qtyString = qty.toLocaleString(lang)
          return `<tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${qtyString}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: left;">${itemTotal} ${currency}</td>
          </tr>`
        }
      )
      .join("") || ""

    const emailHtml = `
      <div style="direction: ${t.dir}; font-family: Tahoma, Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; line-height: 1.6;">
        <h2 style="color: #2e7d32; text-align: center;">${t.emailTitle}</h2>
        <p>${t.emailGreeting(fullName)}</p>
        <p>${t.emailDesc(order.display_id)}</p>
        
        <h3 style="border-bottom: 2px solid #2e7d32; padding-bottom: 5px; color: #333;">${t.emailOrderDetails}</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <thead>
            <tr style="background-color: #f1f1f1;">
              <th style="padding: 10px; text-align: ${t.dir === 'rtl' ? 'right' : 'left'};">${t.emailColName}</th>
              <th style="padding: 10px; text-align: center;">${t.emailColQty}</th>
              <th style="padding: 10px; text-align: left;">${t.emailColTotal}</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHtml}
          </tbody>
        </table>
        
        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 4px; font-weight: bold; text-align: ${t.dir === 'rtl' ? 'left' : 'right'};">
          ${t.emailTotalPaid} ${totalAmount} ${currency}
        </div>
        
        <p style="margin-top: 20px;"><strong>${t.emailShippingAddress}</strong><br>${order.shipping_address?.city || ""} - ${order.shipping_address?.address_1 || ""}</p>
        <p style="font-size: 13px; color: #888; text-align: center; margin-top: 30px;">${t.emailThanks}</p>
      </div>
    `

    // 3. Send Notifications
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)

    if (phone) {
      try {
        await notificationModuleService.createNotifications({
          to: phone,
          channel: "sms",
          template: "order-placed-sms",
          data: {
            orderId: order.display_id,
            fullName: fullName,
            totalAmount: totalAmount,
          }
        })
      } catch (error: any) {
        logger.warn(`Failed to send order placed SMS to ${phone}: ${error.message || error}`)
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
          template: "order-placed-email",
          content: {
            subject: emailSubject,
            html: emailHtml,
          },
        })
      } catch (error: any) {
        logger.warn(`Failed to send order placed Email to ${realEmail}: ${error.message || error}`)
      }
    }

    // 4. Admin Feed Notification (Bell icon in dashboard)
    try {
      await notificationModuleService.createNotifications({
        to: "",
        channel: "feed",
        template: "admin-ui",
        data: {
          title: t.feedTitle,
          description: t.feedDesc(order.display_id, fullName, totalAmount, currency),
        },
      })
    } catch (error: any) {
      logger.warn(`Failed to send order placed Admin Feed Notification: ${error.message || error}`)
    }

    // 5. Log the Notifications
    logger.info(`\n==================================================\n` +
      `🔔 [NOTIFICATION LOG - ORDER PLACED]\n` +
      `Order ID: ${order.id} (Display ID: #${order.display_id})\n` +
      `--------------------------------------------------\n` +
      `📱 [SMS to ${phone || "None"}] sent via template 'order-placed-sms'\n` +
      `--------------------------------------------------\n` +
      (realEmail
        ? `📧 [Email to ${realEmail}] Subject: ${emailSubject}\nHTML Preview:\n${emailHtml}\n`
        : `📧 [Email]: Skipped (phone-only user)\n`
      ) +
      `==================================================\n`)
  } catch (error: any) {
    logger.error(`Error processing order.placed notification: ${error.message || error}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
