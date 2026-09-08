"use client"

import { clx } from "@medusajs/ui"
import React, {
  SelectHTMLAttributes,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { useTranslations } from "next-intl"

import ChevronDown from "@modules/common/icons/chevron-down"

type NativeSelectProps = {
  placeholder?: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "size">

const CartItemSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ placeholder, className, children, ...props }, ref) => {
    const t = useTranslations("Cart")
    const activePlaceholder = placeholder || t("select_placeholder")
    const innerRef = useRef<HTMLSelectElement>(null)
    const [isPlaceholder, setIsPlaceholder] = useState(false)

    useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
      ref,
      () => innerRef.current
    )

    useEffect(() => {
      if (innerRef.current && innerRef.current.value === "") {
        setIsPlaceholder(true)
      } else {
        setIsPlaceholder(false)
      }
    }, [innerRef.current?.value])

    return (
      <div>
        <div
          onFocus={() => innerRef.current?.focus()}
          onBlur={() => innerRef.current?.blur()}
          className={clx(
            "relative flex items-center text-xs border border-border text-foreground group bg-background rounded-xl transition-all duration-200",
            className,
            {
              "text-muted-foreground": isPlaceholder,
            }
          )}
        >
          <select
            ref={innerRef}
            {...props}
            className="appearance-none bg-transparent border-none w-full h-full py-2 ltr:pl-3 ltr:pr-8 rtl:pr-3 rtl:pl-8 outline-none text-inherit focus:ring-1 focus:ring-primary/30 rounded-xl cursor-pointer"
          >
            <option disabled value="" className="bg-background text-foreground">
              {activePlaceholder}
            </option>
            {React.Children.map(children, (child) => {
              if (
                React.isValidElement(child) &&
                (child as any).type === "option"
              ) {
                return React.cloneElement(child as any, {
                  className: "bg-background text-foreground",
                })
              }
              return child
            })}
          </select>
          <span className="absolute pointer-events-none ltr:right-2.5 rtl:left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-foreground transition-colors duration-200">
            <ChevronDown />
          </span>
        </div>
      </div>
    )
  }
)

CartItemSelect.displayName = "CartItemSelect"

export default CartItemSelect
