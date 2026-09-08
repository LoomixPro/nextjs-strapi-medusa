import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import type { Logger, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/types"
import { Smsir } from "sms-typescript"

type SmsIrOptions = {
  apiKey: string
  otpTemplateId?: string | number
  orderPlacedTemplateId?: string | number
  orderReadyTemplateId?: string | number
  orderShippedTemplateId?: string | number
  orderCanceledTemplateId?: string | number
  refundCreatedTemplateId?: string | number
  returnRequestedTemplateId?: string | number
  returnReceivedTemplateId?: string | number
}

type InjectedDependencies = {
  logger: Logger
}

export class SmsIrProviderService extends AbstractNotificationProviderService {
  static identifier = "sms-ir"
  protected options_: SmsIrOptions
  protected logger_: Logger

  constructor({ logger }: InjectedDependencies, options: SmsIrOptions) {
    super()
    this.logger_ = logger
    this.options_ = options
  }

  // Helper to send using Verify API
  private async sendWithTemplate(smsClient: Smsir, mobile: string, templateIdRaw: string | number, parameters: {name: string, value: string}[]) {
    const templateId = typeof templateIdRaw === "string" ? parseInt(templateIdRaw, 10) : templateIdRaw
    const result = await smsClient.sendVerifyCode(mobile, templateId, parameters)
    if (result.status !== 1) {
      this.logger_.error(`SMS.ir verify code send error: ${result.message}`)
    } else {
      this.logger_.info(`Successfully sent SMS to ${mobile} via SMS.ir (Verify API)`)
    }
    return {}
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    if (!this.options_.apiKey) {
      this.logger_.error("SMS.ir API Key is not configured")
      return {}
    }

    try {
      const smsClient = new Smsir(this.options_.apiKey, 0)
      
      const { to, content, template, data } = notification

      // Sanitize phone number (remove +, spaces, etc)
      let mobile = to.replace(/\D/g, '')
      if (mobile.startsWith('989')) {
        mobile = '0' + mobile.substring(2)
      } else if (mobile.length === 10 && mobile.startsWith('9')) {
        mobile = '0' + mobile
      }

      // Handle OTP Template
      if (template === "otp-template" || template === "otp") {
        const otp = data?.otp || (content as any)?.otp
        if (this.options_.otpTemplateId && otp) {
          return await this.sendWithTemplate(smsClient, mobile, this.options_.otpTemplateId, [
            { name: "CODE", value: String(otp) }
          ])
        } else if (otp) {
          // Fallback to bulk if templateId is not configured
          const lineResponse = await smsClient.getLineNumbers()
          this.logger_.info(`[SMS.ir] getLineNumbers response (OTP fallback): ${JSON.stringify(lineResponse)}`)
          let lineNumber: number
          if (lineResponse.status === 1 && lineResponse.data && lineResponse.data.length > 0) {
            lineNumber = lineResponse.data[0]
            this.logger_.info(`[SMS.ir] Selected line number (OTP fallback): ${lineNumber}`)
          } else {
            this.logger_.error(`Could not fetch line number for SMS.ir (OTP fallback): ${JSON.stringify(lineResponse)}`)
            return {}
          }
          
          const text = `کد تایید شما: ${otp}`
          const result = await smsClient.sendBulk(text, [mobile], undefined, lineNumber)
          
          if (result.status !== 1) {
            this.logger_.error(`SMS.ir OTP fallback send error: ${result.message}`)
          } else {
            this.logger_.info(`Successfully sent OTP fallback to ${to} via SMS.ir Bulk`)
          }
          return {}
        }
      }

      // Handle Order Placed
      if (template === "order-placed-sms") {
        const orderId = data?.orderId || (content as any)?.orderId
        if (this.options_.orderPlacedTemplateId && orderId) {
          return await this.sendWithTemplate(smsClient, mobile, this.options_.orderPlacedTemplateId, [
            { name: "ORDERID", value: String(orderId) }
          ])
        }
      }

      // Handle Order Ready
      if (template === "order-ready-sms") {
        const orderId = data?.orderId || (content as any)?.orderId
        if (this.options_.orderReadyTemplateId && orderId) {
          return await this.sendWithTemplate(smsClient, mobile, this.options_.orderReadyTemplateId, [
            { name: "ORDERID", value: String(orderId) }
          ])
        }
      }

      // Handle Order Shipped
      if (template === "order-shipped-sms") {
        const orderId = data?.orderId || (content as any)?.orderId
        const tracking = data?.tracking || (content as any)?.tracking
        if (this.options_.orderShippedTemplateId && orderId) {
          const params = [{ name: "ORDERID", value: String(orderId) }]
          if (tracking) {
            params.push({ name: "TRACKING", value: String(tracking) })
          }
          return await this.sendWithTemplate(smsClient, mobile, this.options_.orderShippedTemplateId, params)
        }
      }

      // Handle Order Canceled
      if (template === "order-canceled-sms") {
        const orderId = data?.orderId || (content as any)?.orderId
        if (this.options_.orderCanceledTemplateId && orderId) {
          return await this.sendWithTemplate(smsClient, mobile, this.options_.orderCanceledTemplateId, [
            { name: "ORDERID", value: String(orderId) }
          ])
        }
      }

      // Handle Refund Created
      if (template === "refund-created-sms") {
        const orderId = data?.orderId || (content as any)?.orderId
        if (this.options_.refundCreatedTemplateId && orderId) {
          return await this.sendWithTemplate(smsClient, mobile, this.options_.refundCreatedTemplateId, [
            { name: "ORDERID", value: String(orderId) }
          ])
        }
      }

      // Handle Return Requested
      if (template === "return-requested-sms") {
        const orderId = data?.orderId || (content as any)?.orderId
        if (this.options_.returnRequestedTemplateId && orderId) {
          return await this.sendWithTemplate(smsClient, mobile, this.options_.returnRequestedTemplateId, [
            { name: "ORDERID", value: String(orderId) }
          ])
        }
      }

      // Handle Return Received
      if (template === "return-received-sms") {
        const orderId = data?.orderId || (content as any)?.orderId
        if (this.options_.returnReceivedTemplateId && orderId) {
          return await this.sendWithTemplate(smsClient, mobile, this.options_.returnReceivedTemplateId, [
            { name: "ORDERID", value: String(orderId) }
          ])
        }
      }

      // Default Bulk Send
      const lineResponse = await smsClient.getLineNumbers()
      this.logger_.info(`[SMS.ir] getLineNumbers response (Bulk): ${JSON.stringify(lineResponse)}`)
      let lineNumber: number
      if (lineResponse.status === 1 && lineResponse.data && lineResponse.data.length > 0) {
        lineNumber = lineResponse.data[0]
        this.logger_.info(`[SMS.ir] Selected line number (Bulk): ${lineNumber}`)
      } else {
        this.logger_.error(`Could not fetch line number for SMS.ir (Bulk): ${JSON.stringify(lineResponse)}`)
        return {}
      }

      const text = (content as any)?.text || (content as any)?.message || ""
      const result = await smsClient.sendBulk(text, [mobile], undefined, lineNumber)

      if (result.status !== 1) {
        this.logger_.error(`SMS.ir send error: ${result.message}`)
      } else {
        this.logger_.info(`Successfully sent SMS to ${to} via SMS.ir (ID: ${result.data?.packId})`)
      }

      return {}
    } catch (error: any) {
      this.logger_.error(`Failed to send SMS via SMS.ir: ${error.message}`)
      return {}
    }
  }
}
