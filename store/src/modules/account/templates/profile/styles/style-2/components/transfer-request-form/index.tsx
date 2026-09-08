"use client"

import { useActionState } from "react"
import { createTransferRequest } from "@lib/data/orders"
import { Text, Heading, Input, IconButton } from "@medusajs/ui"
import { SubmitButton } from "@/modules/checkout/templates/styles/style-1/components/submit-button"
import { CheckCircleMiniSolid, XCircleSolid } from "@medusajs/icons"
import { useEffect, useState } from "react"

import { useTranslations } from "next-intl"
import { formatPhoneOrEmail } from "@lib/util/phone"

export default function TransferRequestForm() {
  const t = useTranslations("Account.Transfer")
  const [showSuccess, setShowSuccess] = useState(false)

  const [state, formAction] = useActionState(createTransferRequest, {
    success: false,
    error: null,
    order: null,
  })

  useEffect(() => {
    if (state.success && state.order) {
      setShowSuccess(true)
    }
  }, [state.success, state.order])

  return (
    <div className="flex flex-col gap-y-4 w-full">
      <div className="flex flex-col gap-y-0.5">
        <Heading
          level="h3"
          className="text-sm font-medium text-foreground tracking-tight"
        >
          {t("heading")}
        </Heading>
        <Text className="text-xs font-light text-muted-foreground">
          {t("cant_find_order")}
          <br /> {t("connect_order")}
        </Text>
      </div>
      <form action={formAction} className="flex flex-col gap-y-1 sm:items-end">
        <div className="flex flex-col gap-y-2 w-full">
          <Input
            className="w-full h-9 text-xs bg-muted/50 border-border focus:border-primary rounded-lg px-3 text-foreground"
            name="order_id"
            placeholder={t("order_id")}
          />
          <SubmitButton
            variant="primary"
            className="w-full sm:w-fit whitespace-nowrap self-end rounded-lg h-9 px-4 text-[10px] font-medium uppercase tracking-[0.15em] shadow-md shadow-blue-500/10"
          >
            {t("request_transfer")}
          </SubmitButton>
        </div>
      </form>

      {!state.success && state.error && (
        <Text className="text-xs text-rose-500 dark:text-rose-400 text-right font-medium bg-rose-50 dark:bg-rose-950/20 px-3 py-1 rounded-lg inline-block self-end border border-rose-100 dark:border-rose-900/50 mt-2">
          {state.error}
        </Text>
      )}
      {showSuccess && (
        <div className="flex justify-between p-4 bg-muted shadow-borders-base w-full self-stretch items-center border border-border rounded-xl">
          <div className="flex gap-x-2 items-center">
            <CheckCircleMiniSolid className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <div className="flex flex-col gap-y-1">
              <Text className="text-medim-pl text-foreground">
                {t("transfer_requested", { id: state.order?.id ?? "" })}
              </Text>
              <Text className="text-base-regular text-muted-foreground">
                {t("transfer_email_sent", {
                  email: formatPhoneOrEmail(state.order?.email) ?? "",
                })}
              </Text>
            </div>
          </div>
          <IconButton
            variant="transparent"
            className="h-fit"
            onClick={() => setShowSuccess(false)}
          >
            <XCircleSolid className="w-4 h-4 text-muted-foreground" />
          </IconButton>
        </div>
      )}
    </div>
  )
}
