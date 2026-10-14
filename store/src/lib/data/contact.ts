"use server"

import { getTranslations } from "next-intl/server"
import { createContactFormSchema } from "@lib/validations/contact-form-schema"
import { ZodError } from "zod"
import nodemailer from "nodemailer"
import { getClientIp } from "@lib/util/auth-security"
import { rateLimit } from "@lib/util/rate-limiter"

const escapeHtml = (str: string | number | null | undefined = "") =>
  String(str ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[m] || m
  )

function buildContactEmailHtml(
  data: {
    first_name: string
    last_name: string
    email: string
    phone?: string | null
    subject: string
    order_number?: string | null
    message: string
  },
  translations: Record<string, string>
) {
  const firstName = escapeHtml(data.first_name)
  const lastName = escapeHtml(data.last_name)
  const email = escapeHtml(data.email)
  const phone = data.phone ? escapeHtml(data.phone) : null
  const subject = escapeHtml(data.subject)
  const orderNumber = data.order_number ? escapeHtml(data.order_number) : null
  const message = escapeHtml(data.message)

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(translations.title || "New Contact Form Message")}</title>
</head>
<body style="background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; direction: rtl; margin: 0; padding: 20px;">
  <div style="background-color: #ffffff; margin: 0 auto; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); max-width: 600px;">
    <h1 style="color: #1a1a1a; font-size: 22px; font-weight: 600; margin: 0 0 15px; text-align: right;">${escapeHtml(translations.title || "New Contact Form Message")}</h1>
    <p style="color: #4a4a4a; font-size: 15px; margin: 0 0 20px; text-align: right;">${escapeHtml(translations.subtitle || "You have received a new message:")}</p>
    
    <div style="background-color: #f9fafb; padding: 18px; border-radius: 8px; margin-bottom: 20px; text-align: right;">
      <div style="color: #6b7280; font-size: 13px; font-weight: 600; margin-bottom: 4px;">${escapeHtml(translations.name || "Name:")}</div>
      <div style="color: #111827; font-size: 15px; margin-bottom: 12px;">${firstName} ${lastName}</div>
      
      <div style="color: #6b7280; font-size: 13px; font-weight: 600; margin-bottom: 4px;">${escapeHtml(translations.email || "Email:")}</div>
      <div style="color: #111827; font-size: 15px; margin-bottom: 12px;"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></div>
      
      ${
        phone
          ? `
      <div style="color: #6b7280; font-size: 13px; font-weight: 600; margin-bottom: 4px;">${escapeHtml(translations.phone || "Phone:")}</div>
      <div style="color: #111827; font-size: 15px; margin-bottom: 12px;">${phone}</div>
      `
          : ""
      }

      <div style="color: #6b7280; font-size: 13px; font-weight: 600; margin-bottom: 4px;">${escapeHtml(translations.subject || "Subject:")}</div>
      <div style="color: #111827; font-size: 15px; margin-bottom: 12px;">${subject}</div>

      ${
        orderNumber
          ? `
      <div style="color: #6b7280; font-size: 13px; font-weight: 600; margin-bottom: 4px;">${escapeHtml(translations.order_number || "Order Number:")}</div>
      <div style="color: #111827; font-size: 15px; margin-bottom: 12px;">${orderNumber}</div>
      `
          : ""
      }
    </div>

    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 18px; border-radius: 8px; margin-bottom: 20px; text-align: right;">
      <div style="color: #6b7280; font-size: 13px; font-weight: 600; margin-bottom: 6px;">${escapeHtml(translations.message || "Message:")}</div>
      <div style="color: #111827; font-size: 15px; line-height: 24px; white-space: pre-wrap;">${message}</div>
    </div>

    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">${translations.footer || "This is an automated message."}</p>
  </div>
</body>
</html>`
}

export async function submitContactForm(data: unknown) {
  const t = await getTranslations()

  try {
    const ip = await getClientIp()
    const limitCheck = await rateLimit(`contact:${ip}`, {
      maxAttempts: 2,
      windowMs: 60 * 60 * 1000,
    })

    if (!limitCheck.allowed) {
      return {
        success: false,
        message: t("Contact.rate_limit"),
      }
    }

    // Create schema with translations
    const contactFormSchema = createContactFormSchema((key) => t(key))

    // Validate with Zod schema
    const validatedData = contactFormSchema.parse(data)

    // Check if SMTP is configured
    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error(
        "SMTP is not configured in environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS)."
      )
      return {
        success: false,
        message:
          "Email service is not configured. Please contact support directly.",
      }
    }

    // Prepare translations for the email template
    const emailTranslations = {
      preview: t("Contact.ContactFormEmail.preview", {
        subject: validatedData.subject,
      }),
      title: t("Contact.ContactFormEmail.title"),
      subtitle: t("Contact.ContactFormEmail.subtitle"),
      name: t("Contact.ContactFormEmail.name"),
      email: t("Contact.ContactFormEmail.email"),
      phone: t("Contact.ContactFormEmail.phone"),
      subject: t("Contact.ContactFormEmail.subject"),
      order_number: t("Contact.ContactFormEmail.order_number"),
      message: t("Contact.ContactFormEmail.message"),
      footer: t("Contact.ContactFormEmail.footer"),
    }

    const emailHtml = buildContactEmailHtml(validatedData, emailTranslations)

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure:
        process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    const fromAddress = process.env.SMTP_FROM_ADDRESS || smtpUser
    const recipient = process.env.CONTACT_FORM_RECIPIENT || smtpUser

    await transporter.sendMail({
      from: `Storefront Contact <${fromAddress}>`,
      to: recipient,
      replyTo: validatedData.email,
      subject: t("Contact.email_subject", { subject: validatedData.subject }),
      html: emailHtml,
    })

    return {
      success: true,
      message: t("Contact.toast.success"),
    }
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return {
        success: false,
        message: t("Contact.toast.error"),
        errors: error.issues,
      }
    }

    // Handle other errors
    console.error("Contact form error:", error)
    return {
      success: false,
      message: t("Contact.toast.serverError"),
    }
  }
}
