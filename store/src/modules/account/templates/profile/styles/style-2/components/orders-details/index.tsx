"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { HttpTypes } from "@medusajs/types"
import OrderOverview from "../order-overview"
import TransferRequestForm from "../transfer-request-form"

type OrdersDetailsProps = {
  orders: HttpTypes.StoreOrder[]
  customer: HttpTypes.StoreCustomer | null
}

export default function OrdersDetails({
  orders,
  customer,
}: OrdersDetailsProps) {
  const t = useTranslations("Account.Orders")

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-1.5 px-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("history_title")}
        </h1>
        <p className="text-sm text-muted-foreground font-light">
          {t("history_description")}
        </p>
      </div>

      <OrderOverview orders={orders} />

      <div className="bg-white/40 dark:bg-zinc-950/40 backdrop-blur-3xl rounded-[24px] border border-white/50 dark:border-white/10 overflow-hidden p-6 shadow-[0_8px_32px_rgba(31,38,135,0.05)] transition-all duration-300">
        <h3 className="text-base font-semibold text-foreground mb-4 tracking-tight">
          {t("transfer_request_title")}
        </h3>
        <TransferRequestForm />
      </div>
    </div>
  )
}
