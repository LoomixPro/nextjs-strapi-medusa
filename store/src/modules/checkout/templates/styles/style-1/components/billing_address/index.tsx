"use client"

import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"
import Input from "@modules/common/components/input"
import React, { useState } from "react"
import CountrySelect from "../country-select"
import ProvinceSelect from "../province-select"
import CitySelect from "../city-select"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"

const BillingAddress = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
  const tVal = useTranslations("Validation")
  const t = useTranslations("Checkout")
  const [formData, setFormData] = useState<any>({
    "billing_address.first_name": cart?.billing_address?.first_name || "",
    "billing_address.last_name": cart?.billing_address?.last_name || "",
    "billing_address.address_1": cart?.billing_address?.address_1 || "",
    "billing_address.company": cart?.billing_address?.company || "",
    "billing_address.postal_code": cart?.billing_address?.postal_code || "",
    "billing_address.city": cart?.billing_address?.city || "",
    "billing_address.country_code": cart?.billing_address?.country_code || "",
    "billing_address.province": cart?.billing_address?.province || "",
    "billing_address.phone": (cart?.billing_address?.phone || "").replace(
      /[^0-9+]/g,
      ""
    ),
  })

  const currentCountry = (
    formData["billing_address.country_code"] || "ir"
  ).toUpperCase()

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t("first_name")}
          name="billing_address.first_name"
          autoComplete="given-name"
          value={formData["billing_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="billing-first-name-input"
        />
        <Input
          label={t("last_name")}
          name="billing_address.last_name"
          autoComplete="family-name"
          value={formData["billing_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="billing-last-name-input"
        />
        <Input
          label={t("address")}
          name="billing_address.address_1"
          autoComplete="address-line1"
          value={formData["billing_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="billing-address-input"
        />
        <Input
          label={t("company")}
          name="billing_address.company"
          value={formData["billing_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="billing-company-input"
        />
        <Input
          label={t("postal_code")}
          name="billing_address.postal_code"
          autoComplete="postal-code"
          value={formData["billing_address.postal_code"]}
          onChange={handleChange}
          required
          data-testid="billing-postal-input"
        />
        <CountrySelect
          name="billing_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["billing_address.country_code"]}
          onChange={handleChange}
          required
          data-testid="billing-country-select"
        />
        <ProvinceSelect
          name="billing_address.province"
          autoComplete="address-level1"
          countryCode={formData["billing_address.country_code"]}
          value={formData["billing_address.province"]}
          onChange={handleChange}
          required
          data-testid="billing-province-select"
        />
        <CitySelect
          name="billing_address.city"
          autoComplete="address-level2"
          countryCode={formData["billing_address.country_code"]}
          stateCode={formData["billing_address.province"]}
          value={formData["billing_address.city"]}
          onChange={handleChange}
          required
          data-testid="billing-city-select"
        />
        <div className="flex flex-col w-full relative">
          <label className="absolute -top-2 ltr:left-3 rtl:right-3 px-1 text-[10px] font-bold text-gray-400 dark:text-zinc-500 bg-background dark:bg-zinc-950 uppercase tracking-widest z-10 transition-all">
            {t("phone")} <span className="text-rose-500">*</span>
          </label>
          <PhoneInput
            placeholder={t("phone")}
            value={formData["billing_address.phone"]}
            onChange={(value) =>
              setFormData((prev: any) => ({
                ...prev,
                "billing_address.phone": value || "",
              }))
            }
            name="billing_address.phone"
            required
            defaultCountry={currentCountry as any}
            internationalIcon={() => null}
            className="flex h-11 w-full rounded-xl border border-border dark:border-zinc-700 bg-background dark:bg-zinc-800/50 px-4 py-1 text-sm transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 outline-none [&_input]:outline-none [&_input]:border-none [&_input]:bg-transparent text-sm font-normal text-foreground dark:text-zinc-100"
            data-testid="billing-phone-input"
          />
        </div>
      </div>
    </>
  )
}

export default BillingAddress
