"use client"

import React, { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShieldCheck,
  Ticket,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { updateLineItem, deleteLineItem } from "@lib/data/cart"
import { useCartRefresh } from "@lib/hooks/use-cart-refresh"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import EmptyCartMessage from "../../../components/empty-cart-message"
import SignInPrompt from "../../../components/sign-in-prompt"
import Spinner from "@modules/common/icons/spinner"
import { Button } from "@modules/common/components/shadcn/button"
import LineItemOptions from "@modules/common/components/line-item-options"
import DiscountCode from "@/modules/common/components/discount-code"
import { convertToLocale } from "@lib/util/storefront-settings"
import { useLocale, useTranslations } from "next-intl"
import { isRtlLocale } from "@lib/util/is-rtl"

// Helpers
export function formatLocaleNumber(
  num: number | string,
  locale: string
): string {
  try {
    return new Intl.NumberFormat(locale).format(Number(num))
  } catch {
    return String(num)
  }
}

export default function CartTemplate({
  cart,
  customer,
  returnDeadlineDays = 7,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  returnDeadlineDays?: number
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const refreshCart = useCartRefresh()
  const locale = useLocale()
  const t = useTranslations("Cart")
  const tCommon = useTranslations("Common")
  const tOrder = useTranslations("Order")
  const isRtl = isRtlLocale(locale)

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div
        className="min-h-screen text-foreground font-sans relative pb-28 sm:pb-16 transition-colors duration-300"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="max-w-6xl mx-auto px-4 py-24">
          <EmptyCartMessage />
        </div>
      </div>
    )
  }

  const items = cart.items.sort((a, b) =>
    (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  )
  const subtotal = cart.item_total || 0

  const discountValue = cart.discount_total || 0
  const finalTotal = cart.total || 0

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    setUpdatingId(id)
    try {
      await updateLineItem({ lineId: id, quantity: newQuantity })
      refreshCart()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemoveItem = async (id: string) => {
    setUpdatingId(id)
    try {
      await deleteLineItem(id)
      refreshCart()
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div
      className="min-h-[80vh] pt-28 sm:pt-32 pb-28 sm:pb-12 text-foreground font-sans relative transition-colors duration-300"
      dir="rtl"
    >
      {!customer && (
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <SignInPrompt />
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Product list */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                {t("title")}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({formatLocaleNumber(items.length, locale)} {t("items")})
                </span>
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, x: -50 }}
                      transition={{ duration: 0.2 }}
                      className="bg-card text-card-foreground rounded-2xl border border-border p-4 md:p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center relative hover:shadow-md transition-shadow"
                    >
                      {updatingId === item.id && (
                        <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-[1px] rounded-2xl">
                          <Spinner className="animate-spin w-6 h-6 text-primary" />
                        </div>
                      )}
                      {/* Image Container */}
                      <div className="w-full sm:w-28 h-36 sm:h-28 rounded-xl overflow-hidden bg-muted relative group flex-shrink-0">
                        {item.thumbnail && (
                          <Image
                            src={item.thumbnail}
                            alt={item.product_title || "Product Image"}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/5 dark:bg-white/5 pointer-events-none" />
                      </div>

                      {/* Product Info Block */}
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <h3 className="text-sm md:text-base font-bold text-foreground mt-1.5 leading-tight">
                            {item.product_title}
                          </h3>
                        </div>

                        {/* Dynamic Live Apparel Attributes Tuning */}
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg z-20 relative">
                            <LineItemOptions
                              variant={item.variant}
                              data-testid="product-variant"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Control actions & price */}
                      <div className="flex sm:flex-col justify-between sm:items-end w-full sm:w-auto h-full min-h-[90px] gap-3 border-t border-border sm:border-0 pt-3 sm:pt-0">
                        <div className="flex items-center border border-border rounded-xl bg-muted/30 p-1 z-20 relative">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            className={`p-1.5 rounded-lg hover:bg-accent transition-colors ${
                              item.quantity <= 1
                                ? "opacity-30 cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                            disabled={
                              item.quantity <= 1 || updatingId === item.id
                            }
                          >
                            <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <span className="w-7 text-center font-bold text-xs select-none text-foreground">
                            {formatLocaleNumber(item.quantity, locale)}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                            className={`p-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer`}
                            disabled={updatingId === item.id}
                          >
                            <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </div>

                        <div className="flex items-center gap-4 sm:items-end sm:flex-col justify-end">
                          <span className="text-[11px] text-muted-foreground block">
                            {convertToLocale({
                              amount: item.unit_price,
                              currency_code: cart.currency_code,
                              locale,
                            })}{" "}
                            × {formatLocaleNumber(item.quantity, locale)}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-black text-foreground text-base md:text-lg">
                              {convertToLocale({
                                amount: item.total || 0,
                                currency_code: cart.currency_code,
                                locale,
                              })}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={updatingId === item.id}
                          className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer self-start sm:self-auto z-20 relative"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 h-fit">
            <div className="bg-card text-card-foreground p-6 rounded-3xl border border-border shadow-sm space-y-6">
              <h3 className="text-base font-black border-b border-border pb-4">
                {t("summary")}
              </h3>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{tCommon("subtotal")}</span>
                  <span className="font-medium">
                    {convertToLocale({
                      amount: subtotal,
                      currency_code: cart.currency_code,
                      locale,
                    })}
                  </span>
                </div>

                <div className="my-2">
                  <DiscountCode cart={cart as any} />
                </div>

                {cart.promotions && cart.promotions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between text-green-600 dark:text-green-400 font-bold bg-green-500/10 p-2.5 rounded-xl border border-green-500/20 mt-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5" />
                      <span>{tCommon("discount")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>
                        -
                        {convertToLocale({
                          amount: discountValue,
                          currency_code: cart.currency_code,
                          locale,
                        })}
                      </span>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center justify-between text-foreground border-t border-border pt-4 mt-2 text-sm font-black">
                  <span>{tCommon("total")}</span>
                  <span className="text-lg text-primary">
                    {convertToLocale({
                      amount: finalTotal,
                      currency_code: cart.currency_code,
                      locale,
                    })}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <LocalizedClientLink
                  href="/checkout?step=address"
                  className="w-full block"
                >
                  <Button
                    disabled={items.length === 0}
                    className="w-full h-14 rounded-full font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <span>{t("checkout")}</span>
                    <ArrowLeft className="w-4 h-4 ml-1" />
                  </Button>
                </LocalizedClientLink>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {tOrder("exchange_returns", {
                    days: formatLocaleNumber(returnDeadlineDays, locale),
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
