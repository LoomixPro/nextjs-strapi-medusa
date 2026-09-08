import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import type { Logger, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/types"
import twilio from "twilio"

type TwilioOptions = {
  accountSid: string
  authToken: string
  fromNumber: string
}

type InjectedDependencies = {
  logger: Logger
}

export class TwilioProviderService extends AbstractNotificationProviderService {
  static identifier = "sms-twilio"
  protected options_: TwilioOptions
  protected logger_: Logger

  constructor({ logger }: InjectedDependencies, options: TwilioOptions) {
    super()
    this.logger_ = logger
    this.options_ = options
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const { accountSid, authToken, fromNumber } = this.options_

    if (!accountSid || !authToken || !fromNumber) {
      this.logger_.error("Twilio is not fully configured (accountSid, authToken, and fromNumber are required)")
      return {}
    }

    try {
      const client = twilio(accountSid, authToken)
      const { to, content, template, data } = notification

      // Format phone number to international E.164 format if needed
      let mobile = to.trim()
      if (!mobile.startsWith("+")) {
        // If it starts with 98 or 9 (Iranian numbers or similar), prepend +
        if (mobile.startsWith("98")) {
          mobile = "+" + mobile
        } else if (mobile.startsWith("09")) {
          mobile = "+98" + mobile.substring(1)
        } else if (mobile.startsWith("9")) {
          mobile = "+98" + mobile
        } else {
          // General fallback: prepend + if missing, assuming country code is already included
          mobile = "+" + mobile
        }
      }

      let messageBody = ""

      // Handle template mapping
      if (template === "otp-template" || template === "otp") {
        const otp = data?.otp || (content as any)?.otp
        messageBody = `Your verification code is: ${otp}`
      } else if (template === "order-placed-sms") {
        const orderId = data?.orderId || (content as any)?.orderId
        messageBody = `Thank you for your order! Your order ID is ${orderId}.`
      } else if (template === "order-ready-sms") {
        const orderId = data?.orderId || (content as any)?.orderId
        messageBody = `Your order ${orderId} is now ready!`
      } else if (template === "order-shipped-sms") {
        const orderId = data?.orderId || (content as any)?.orderId
        const tracking = data?.tracking || (content as any)?.tracking
        messageBody = `Your order ${orderId} has been shipped.${tracking ? ` Tracking number: ${tracking}` : ""}`
      } else if (template === "order-canceled-sms") {
        const orderId = data?.orderId || (content as any)?.orderId
        messageBody = `Your order ${orderId} has been canceled.`
      } else if (template === "refund-created-sms") {
        const orderId = data?.orderId || (content as any)?.orderId
        messageBody = `A refund has been created for your order ${orderId}.`
      } else if (template === "return-requested-sms") {
        const orderId = data?.orderId || (content as any)?.orderId
        messageBody = `A return has been requested for your order ${orderId}.`
      } else if (template === "return-received-sms") {
        const orderId = data?.orderId || (content as any)?.orderId
        messageBody = `We have received your returned items for order ${orderId}.`
      } else {
        // Default message body from content
        messageBody = (content as any)?.text || (content as any)?.message || String(content || "")
      }

      if (!messageBody) {
        this.logger_.error("Twilio SMS send error: Message body is empty")
        return {}
      }

      this.logger_.info(`Sending Twilio SMS to ${mobile}...`)

      const result = await client.messages.create({
        body: messageBody,
        from: fromNumber,
        to: mobile,
      })

      this.logger_.info(`Successfully sent SMS to ${to} via Twilio. SID: ${result.sid}`)
      return {}
    } catch (error: any) {
      this.logger_.error(`Failed to send SMS via Twilio: ${error.message}`)
      return {}
    }
  }
}
