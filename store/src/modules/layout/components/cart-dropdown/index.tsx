"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { convertToLocale } from "@lib/util/storefront-settings"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/shadcn/button"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { usePathname } from "next/navigation"
import { Fragment, useCallback, useEffect, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"

const CartDropdown = ({
  cart: cartState,
  customTrigger,
}: {
  cart?: HttpTypes.StoreCart | null
  customTrigger?: React.ReactNode
}) => {
  const t = useTranslations("Layout.cart_dropdown")
  const locale = useLocale()
  const [activeTimer, setActiveTimer] = useState<NodeJS.Timer | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = cartState?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)

  const timedOpen = useCallback(() => {
    setCartDropdownOpen(true)

    const timer = setTimeout(() => setCartDropdownOpen(false), 5000)

    setActiveTimer(timer)
  }, [])

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }

    open()
  }

  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  // Open cart dropdown when items are added, but only if we're not on the cart page.
  useEffect(() => {
    if (totalItems > itemRef.current && !pathname.includes("/cart")) {
      timedOpen()
    }
    itemRef.current = totalItems
  }, [totalItems, pathname, timedOpen])

  return (
    <div
      className="h-full z-50"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <PopoverButton
          as="div"
          role="button"
          tabIndex={0}
          aria-label={t("title")}
          className="h-full flex items-center justify-center cursor-pointer focus:outline-none"
        >
          {customTrigger || (
            <LocalizedClientLink
              className="hover:text-foreground transition-colors"
              href="/cart"
              data-testid="nav-cart-link"
            >{`${t("title")} (${totalItems})`}</LocalizedClientLink>
          )}
        </PopoverButton>
        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="hidden small:block absolute top-[calc(100%+10px)] ltr:right-0 rtl:left-0 bg-background rounded-2xl shadow-2xl border border-border w-[320px] sm:w-[350px] text-foreground overflow-hidden"
            data-testid="nav-cart-dropdown"
          >
            <div className="p-4 flex items-center justify-center">
              <h3 className="text-large-semi">{t("title")}</h3>
            </div>
            {cartState && cartState.items?.length ? (
              <>
                <div className="overflow-y-scroll max-h-[402px] px-4 grid grid-cols-1 gap-y-8 no-scrollbar p-px">
                  {cartState.items
                    .sort((a, b) => {
                      return (a.created_at ?? "") > (b.created_at ?? "")
                        ? -1
                        : 1
                    })
                    .map((item) => (
                      <div
                        className="grid grid-cols-[96px_1fr] gap-x-4"
                        key={item.id}
                        data-testid="cart-item"
                      >
                        <LocalizedClientLink
                          href={`/products/${item.product_handle}`}
                          className="w-24"
                        >
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            images={item.variant?.product?.images}
                            size="square"
                          />
                        </LocalizedClientLink>
                        <div className="flex flex-col justify-between flex-1 min-w-0">
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-x-2">
                              <div className="flex flex-col flex-1 min-w-0">
                                <h3 className="text-base-regular overflow-hidden text-ellipsis whitespace-nowrap">
                                  <LocalizedClientLink
                                    href={`/products/${item.product_handle}`}
                                    data-testid="product-link"
                                  >
                                    {item.title}
                                  </LocalizedClientLink>
                                </h3>
                                <LineItemOptions
                                  variant={item.variant}
                                  data-testid="cart-item-variant"
                                  data-value={item.variant}
                                />
                                <span
                                  data-testid="cart-item-quantity"
                                  data-value={item.quantity}
                                >
                                  {t("quantity")}: {item.quantity}
                                </span>
                              </div>
                              <div className="flex justify-end whitespace-nowrap">
                                <LineItemPrice
                                  item={item}
                                  style="tight"
                                  currencyCode={cartState.currency_code}
                                />
                              </div>
                            </div>
                          </div>
                          <DeleteButton
                            id={item.id}
                            className="mt-1"
                            data-testid="cart-item-remove-button"
                          >
                            {t("remove")}
                          </DeleteButton>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="p-4 flex flex-col gap-y-4 text-small-regular">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-semibold">
                      {t("subtotal")}{" "}
                      <span className="font-normal text-muted-foreground">
                        ({t("excl_taxes")})
                      </span>
                    </span>
                    <span
                      className="text-large-semi"
                      data-testid="cart-subtotal"
                      data-value={subtotal}
                    >
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: cartState.currency_code,
                        locale,
                      })}
                    </span>
                  </div>
                  <LocalizedClientLink href="/cart" passHref>
                    <Button
                      className="w-full h-12 rounded-full font-bold uppercase tracking-widest transition-all"
                      data-testid="go-to-cart-button"
                    >
                      {t("go_to_cart")}
                    </Button>
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div>
                <div className="flex py-16 flex-col gap-y-4 items-center justify-center">
                  <div className="bg-primary text-small-regular flex items-center justify-center w-6 h-6 rounded-full text-primary-foreground">
                    <span>0</span>
                  </div>
                  <span>{t("empty_bag")}</span>
                  <div>
                    <LocalizedClientLink href="/store">
                      <>
                        <span className="sr-only">{t("go_to_cart")}</span>
                        <Button onClick={close}>{t("explore_products")}</Button>
                      </>
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
