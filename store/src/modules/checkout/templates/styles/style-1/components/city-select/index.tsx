"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"
import { useTranslations } from "next-intl"

import NativeSelect, {
  NativeSelectProps,
} from "@modules/common/components/native-select"
import { useCityOptions } from "@lib/hooks/use-location-options"

const CitySelect = forwardRef<
  HTMLSelectElement,
  NativeSelectProps & {
    countryCode?: string
    stateCode?: string
  }
>(({ placeholder, countryCode, stateCode, defaultValue, ...props }, ref) => {
  const t = useTranslations("Checkout")
  const innerRef = useRef<HTMLSelectElement>(null)
  const cityOptions = useCityOptions(countryCode, stateCode)

  const cityPlaceholder = placeholder || t("city")

  useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
    ref,
    () => innerRef.current
  )

  return (
    <NativeSelect
      ref={innerRef}
      placeholder={cityPlaceholder}
      defaultValue={defaultValue}
      {...props}
    >
      {cityOptions.map(({ value, label }, index) => (
        <option key={index} value={value}>
          {label}
        </option>
      ))}
    </NativeSelect>
  )
})

CitySelect.displayName = "CitySelect"

export default CitySelect
