"use client"

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react"
import SelectField from "../select-field"
import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"

import { isIranFeaturesEnabled } from "@lib/util/storefront-settings"

const CountrySelect = forwardRef<
  HTMLSelectElement,
  {
    placeholder?: string
    region?: HttpTypes.StoreRegion
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
    {
      placeholder = "Country",
      region,
      defaultValue,
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const t = useTranslations("Checkout")
    const innerRef = useRef<HTMLSelectElement>(null)

    useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
      ref,
      () => innerRef.current
    )

    const countryOptions = useMemo(() => {
      if (!region) {
        return []
      }

      return region.countries?.map((country) => ({
        value: country.iso_2,
        label:
          isIranFeaturesEnabled && country.iso_2?.toLowerCase() === "ir"
            ? t("iran")
            : country.display_name,
      }))
    }, [region, t])

    return (
      <SelectField
        ref={innerRef}
        label="Country / Region"
        defaultValue={defaultValue}
        fullWidth={fullWidth}
        {...props}
      >
        <option value="">{placeholder}</option>
        {countryOptions?.map(({ value, label }, index) => (
          <option key={index} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
    )
  }
)

CountrySelect.displayName = "CountrySelect"

export default CountrySelect
