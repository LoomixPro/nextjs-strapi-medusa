"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "@lib/data/cookies"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { getTranslations } from "next-intl/server"

export const listReturnReasons = async () => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("return-reasons")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreReturnReasonListResponse>(`/store/return-reasons`, {
      method: "GET",
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ return_reasons }) => return_reasons)
    .catch(() => [] as HttpTypes.StoreReturnReason[])
}

export const listReturnShippingOptions = async (cartId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("shipping-options")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreShippingOptionListResponse>(
      `/store/shipping-options`,
      {
        method: "GET",
        query: {
          cart_id: cartId,
          is_return: true,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ shipping_options }) => shipping_options)
    .catch((err) => medusaError(err))
}

export const createReturnRequest = async (
  state: {
    success: boolean
    error: string | null
    return: any | null
  },
  formData: FormData
): Promise<{
  success: boolean
  error: string | null
  return: any | null
}> => {
  const orderId = formData.get("order_id") as string
  const itemsString = formData.get("items") as string
  const rawItems = itemsString ? JSON.parse(itemsString) : null
  const items = rawItems
    ? rawItems.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        reason_id: item.return_reason_id || null,
        note: item.note || null,
      }))
    : null
  const returnShippingOptionId = formData.get(
    "return_shipping_option_id"
  ) as string
  const locationId = formData.get("location_id") as string
  const shabaNumber = formData.get("shaba_number") as string | null

  if (!orderId || !items || !returnShippingOptionId) {
    return {
      success: false,
      error: "Order ID, items, and return shipping option are required",
      return: null,
    }
  }

  const headers = await getAuthHeaders()
  const t = await getTranslations("Account.return_request")

  return await sdk.client
    .fetch<HttpTypes.StoreReturnResponse>(`/store/returns`, {
      method: "POST",
      body: {
        order_id: orderId,
        items,
        return_shipping: {
          option_id: returnShippingOptionId,
        },
        location_id: locationId,
        ...(shabaNumber ? { note: `${t("shaba_note")}${shabaNumber}` } : {}),
      },
      headers,
    })
    .then(({ return: returnData }) => ({
      success: true,
      error: null,
      return: returnData,
    }))
    .catch((err) => ({
      success: false,
      error: err.message,
      return: null,
    }))
}
