"use client"

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react"
import { useTranslations } from "next-intl"

import NativeSelect, {
  NativeSelectProps,
} from "@modules/common/components/native-select"
import { HttpTypes } from "@medusajs/types"

import { isIranFeaturesEnabled } from "@lib/util/storefront-settings"

const CountrySelect = forwardRef<
  HTMLSelectElement,
  NativeSelectProps & {
    region?: HttpTypes.StoreRegion
  }
>(({ placeholder, region, defaultValue, ...props }, ref) => {
  const t = useTranslations("Checkout")
  const innerRef = useRef<HTMLSelectElement>(null)

  const countryPlaceholder = placeholder || t("country")

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
    <NativeSelect
      ref={innerRef}
      placeholder={countryPlaceholder}
      defaultValue={defaultValue}
      {...props}
    >
      {countryOptions?.map(({ value, label }, index) => (
        <option key={index} value={value}>
          {label}
        </option>
      ))}
    </NativeSelect>
  )
})

CountrySelect.displayName = "CountrySelect"

export default CountrySelect
