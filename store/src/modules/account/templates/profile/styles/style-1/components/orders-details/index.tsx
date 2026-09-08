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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("history_title")}
        </h1>
        <p className="text-sm text-muted-foreground font-light">
          {t("history_description")}
        </p>
      </div>

      <OrderOverview orders={orders} />

      <div className="bg-background rounded-[24px] border border-border overflow-hidden p-6 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-primary/5 transition-all duration-300">
        <h3 className="text-base font-medium text-foreground mb-4 tracking-tight">
          {t("transfer_request_title")}
        </h3>
        <TransferRequestForm />
      </div>
    </div>
  )
}
