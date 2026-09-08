"use client"

import { acceptTransferRequest, declineTransferRequest } from "@lib/data/orders"
import { Button, Text } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import { useState } from "react"

type TransferStatus = "pending" | "success" | "error"

const TransferActions = ({ id, token }: { id: string; token: string }) => {
  const t = useTranslations("Order.Transfer")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<{
    accept: TransferStatus | null
    decline: TransferStatus | null
  } | null>({
    accept: null,
    decline: null,
  })

  const acceptTransfer = async () => {
    setStatus({ accept: "pending", decline: null })
    setErrorMessage(null)

    const { success, error } = (await acceptTransferRequest(id, token)) as {
      success: boolean
      error: string | null
    }

    if (error) setErrorMessage(error)
    setStatus({ accept: success ? "success" : "error", decline: null })
  }

  const declineTransfer = async () => {
    setStatus({ accept: null, decline: "pending" })
    setErrorMessage(null)

    const { success, error } = (await declineTransferRequest(id, token)) as {
      success: boolean
      error: string | null
    }

    if (error) setErrorMessage(error)
    setStatus({ accept: null, decline: success ? "success" : "error" })
  }

  return (
    <div className="flex flex-col gap-y-4">
      {status?.accept === "success" && (
        <Text className="text-emerald-500">{t("success")}</Text>
      )}
      {status?.decline === "success" && (
        <Text className="text-emerald-500">{t("decline_success")}</Text>
      )}
      {status?.accept !== "success" && status?.decline !== "success" && (
        <div className="flex gap-x-4">
          <Button
            size="large"
            onClick={() => {
              acceptTransfer().catch(() => {})
            }}
            isLoading={status?.accept === "pending"}
            disabled={
              status?.accept === "pending" || status?.decline === "pending"
            }
          >
            {t("accept")}
          </Button>
          <Button
            size="large"
            variant="secondary"
            onClick={() => {
              declineTransfer().catch(() => {})
            }}
            isLoading={status?.decline === "pending"}
            disabled={
              status?.accept === "pending" || status?.decline === "pending"
            }
          >
            {t("decline")}
          </Button>
        </div>
      )}
      {errorMessage && <Text className="text-red-500">{errorMessage}</Text>}
    </div>
  )
}

export default TransferActions
