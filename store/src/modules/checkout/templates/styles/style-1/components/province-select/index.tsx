"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"
import { useTranslations } from "next-intl"

import NativeSelect, {
  NativeSelectProps,
} from "@modules/common/components/native-select"
import { useProvinceOptions } from "@lib/hooks/use-location-options"

const ProvinceSelect = forwardRef<
  HTMLSelectElement,
  NativeSelectProps & {
    countryCode?: string
  }
>(({ placeholder, countryCode, defaultValue, ...props }, ref) => {
  const t = useTranslations("Checkout")
  const innerRef = useRef<HTMLSelectElement>(null)
  const provinceOptions = useProvinceOptions(countryCode)

  const provincePlaceholder = placeholder || t("province")

  useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
    ref,
    () => innerRef.current
  )

  return (
    <NativeSelect
      ref={innerRef}
      placeholder={provincePlaceholder}
      defaultValue={defaultValue}
      {...props}
    >
      {provinceOptions.map(({ value, label }, index) => (
        <option key={index} value={value}>
          {label}
        </option>
      ))}
    </NativeSelect>
  )
})

ProvinceSelect.displayName = "ProvinceSelect"

export default ProvinceSelect
