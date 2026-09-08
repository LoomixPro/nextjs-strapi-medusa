"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"
import { useTranslations } from "next-intl"

import SelectField from "../select-field"
import { useProvinceOptions } from "@lib/hooks/use-location-options"

const ProvinceSelect = forwardRef<
  HTMLSelectElement,
  {
    placeholder?: string
    countryCode?: string
    defaultValue?: string
    name?: string
    required?: boolean
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
    "data-testid"?: string
    autoComplete?: string
    fullWidth?: boolean
  }
>(({ placeholder, countryCode, fullWidth = false, value, ...props }, ref) => {
  const t = useTranslations("Checkout")
  const innerRef = useRef<HTMLSelectElement>(null)
  const provinceOptions = useProvinceOptions(countryCode)

  const provincePlaceholder = placeholder || t("province")

  useImperativeHandle<HTMLSelectElement | null, HTMLSelectElement | null>(
    ref,
    () => innerRef.current
  )

  return (
    <SelectField
      ref={innerRef}
      label={t("province")}
      fullWidth={fullWidth}
      value={value}
      {...props}
    >
      <option value="">{provincePlaceholder}</option>
      {provinceOptions.map(({ value, label }, index) => (
        <option key={index} value={value}>
          {label}
        </option>
      ))}
    </SelectField>
  )
})

ProvinceSelect.displayName = "ProvinceSelect"

export default ProvinceSelect
