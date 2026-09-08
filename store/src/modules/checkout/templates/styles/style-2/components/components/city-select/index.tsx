"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"
import { useTranslations } from "next-intl"

import SelectField from "../select-field"
import { useCityOptions } from "@lib/hooks/use-location-options"

const CitySelect = forwardRef<
  HTMLSelectElement,
  {
    placeholder?: string
    countryCode?: string
    stateCode?: string
    defaultValue?: string
    name?: string
    required?: boolean
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
    "data-testid"?: string
    autoComplete?: string
    fullWidth?: boolean
  }
>(
  (
    { placeholder, countryCode, stateCode, fullWidth = false, value, ...props },
    ref
  ) => {
    const t = useTranslations("Checkout")
    const innerRef = useRef<HTMLSelectElement>(null)
    const cityOptions = useCityOptions(countryCode, stateCode)

    const cityPlaceholder = placeholder || t("city")

    useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
      ref,
      () => innerRef.current
    )

    return (
      <SelectField
        ref={innerRef}
        label={t("city")}
        fullWidth={fullWidth}
        value={value}
        {...props}
      >
        <option value="">{cityPlaceholder}</option>
        {cityOptions.map(({ value, label }, index) => (
          <option key={index} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
    )
  }
)

CitySelect.displayName = "CitySelect"

export default CitySelect
