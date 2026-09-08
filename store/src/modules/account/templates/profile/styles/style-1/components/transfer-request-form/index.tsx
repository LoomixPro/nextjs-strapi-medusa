"use client"

import { useActionState, useEffect, useState } from "react"
import { createTransferRequest } from "@lib/data/orders"
import { Text, Heading } from "@medusajs/ui"
import { Button } from "@modules/common/components/shadcn/button"
import { useFormStatus } from "react-dom"
import { CheckCircleMiniSolid, XCircleSolid } from "@medusajs/icons"

import { useTranslations } from "next-intl"
import { formatPhoneOrEmail } from "@lib/util/phone"

function FormSubmitButton({ text }: { text: string }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      isLoading={pending}
      className="w-full sm:w-fit whitespace-nowrap self-end rounded-xl h-11 px-4 text-[10px] font-bold uppercase tracking-widest"
    >
      {text}
    </Button>
  )
}

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
      <form action={formAction} className="flex flex-col gap-y-3 sm:items-end">
        <div className="flex flex-col gap-y-3 w-full">
          <input
            className="w-full h-11 text-sm bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-xl px-4 text-foreground transition-all placeholder:text-muted-foreground/60"
            name="order_id"
            placeholder={t("order_id")}
            required
            data-testid="order-id-input"
          />
          <FormSubmitButton text={t("request_transfer")} />
        </div>
      </form>

      {!state.success && state.error && (
        <Text className="text-xs text-rose-500 dark:text-rose-400 text-right font-medium bg-rose-50 dark:bg-rose-950/20 px-3 py-1 rounded-lg inline-block self-end border border-rose-100 dark:border-rose-900/50 mt-2">
          {state.error}
        </Text>
      )}
      {showSuccess && (
        <div className="flex justify-between p-4 bg-muted shadow-borders-base w-full self-stretch items-center border border-border rounded-2xl">
          <div className="flex gap-x-3 items-center">
            <CheckCircleMiniSolid className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            <div className="flex flex-col gap-y-1">
              <Text className="text-sm font-semibold text-foreground">
                {t("transfer_requested", { id: state.order?.id ?? "" })}
              </Text>
              <Text className="text-xs text-muted-foreground font-light leading-relaxed">
                {t("transfer_email_sent", {
                  email: formatPhoneOrEmail(state.order?.email) ?? "",
                })}
              </Text>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-background/80 text-muted-foreground border-none rounded-xl"
            onClick={() => setShowSuccess(false)}
          >
            <XCircleSolid className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
