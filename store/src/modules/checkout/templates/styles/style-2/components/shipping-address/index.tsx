"use client"

import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import { Check } from "@medusajs/icons"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import AddressSelect from "../address-select"
import CountrySelect from "../components/country-select"
import ProvinceSelect from "../components/province-select"
import CitySelect from "../components/city-select"
import FormField from "../components/form-field"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
}) => {
  const t = useTranslations("Checkout")
  const tVal = useTranslations("Validation")
  const [formData, setFormData] = useState<Record<string, any>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code": cart?.shipping_address?.country_code || "",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": (cart?.shipping_address?.phone || "").replace(
      /[^0-9+]/g,
      ""
    ),
    email: cart?.email || "",
  })

  const currentCountry = (
    formData["shipping_address.country_code"] || "ir"
  ).toUpperCase()

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const skipCartSyncRef = useRef(false)

  const applyAddressToForm = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    setFormData((prevState: Record<string, any>) => {
      const nextState = { ...prevState }

      if (address) {
        nextState["shipping_address.first_name"] = address.first_name || ""
        nextState["shipping_address.last_name"] = address.last_name || ""
        nextState["shipping_address.address_1"] = address.address_1 || ""
        nextState["shipping_address.company"] = address.company || ""
        nextState["shipping_address.postal_code"] = address.postal_code || ""
        nextState["shipping_address.city"] = address.city || ""
        nextState["shipping_address.country_code"] =
          address.country_code?.toLowerCase() || ""
        nextState["shipping_address.province"] = address.province || ""
        nextState["shipping_address.phone"] = (address.phone || "").replace(
          /[^0-9+]/g,
          ""
        )
      }

      if (email) {
        nextState.email = email
      }

      return nextState
    })
  }

  const handleSavedAddressSelect = (address?: HttpTypes.StoreCartAddress) => {
    if (!address) {
      return
    }

    skipCartSyncRef.current = true
    applyAddressToForm(address, customer?.email || cart?.email || undefined)
  }

  useEffect(() => {
    if (skipCartSyncRef.current) {
      return
    }

    if (cart?.shipping_address) {
      applyAddressToForm(cart.shipping_address, cart.email || undefined)
    } else if (cart && !cart.email && customer?.email) {
      applyAddressToForm(undefined, customer.email)
    }
  }, [cart, customer?.email])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    skipCartSyncRef.current = true
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5 bg-accent border-border rounded-2xl">
          <p className="text-small-regular text-foreground">
            {t("saved_address_greeting", {
              name:
                customer.first_name &&
                customer.first_name !== "null" &&
                customer.first_name !== "undefined"
                  ? customer.first_name
                  : "",
            })}
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as HttpTypes.StoreCartAddress
            }
            onSelect={handleSavedAddressSelect}
          />
        </Container>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <FormField
          label={t("first_name")}
          name="shipping_address.first_name"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-first-name-input"
          placeholder={t("first_name_placeholder")}
        />
        <FormField
          label={t("last_name")}
          name="shipping_address.last_name"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-last-name-input"
          placeholder={t("last_name_placeholder")}
        />
        <CountrySelect
          name="shipping_address.country_code"
          autoComplete="country"
          region={cart?.region}
          value={formData["shipping_address.country_code"]}
          onChange={handleChange}
          required
          data-testid="shipping-country-select"
          fullWidth
        />
        <ProvinceSelect
          key={`province-${formData["shipping_address.country_code"]}-${formData["shipping_address.province"]}`}
          name="shipping_address.province"
          autoComplete="address-level1"
          countryCode={formData["shipping_address.country_code"]}
          value={formData["shipping_address.province"]}
          onChange={handleChange}
          data-testid="shipping-province-select"
          placeholder={t("province_placeholder")}
          required
          fullWidth
        />
        <CitySelect
          key={`city-${formData["shipping_address.province"]}-${formData["shipping_address.city"]}`}
          name="shipping_address.city"
          autoComplete="address-level2"
          countryCode={formData["shipping_address.country_code"]}
          stateCode={formData["shipping_address.province"]}
          value={formData["shipping_address.city"]}
          onChange={handleChange}
          required
          data-testid="shipping-city-select"
          placeholder={t("city_placeholder")}
          fullWidth
        />
        <FormField
          label={t("address")}
          name="shipping_address.address_1"
          autoComplete="address-line1"
          value={formData["shipping_address.address_1"]}
          onChange={handleChange}
          required
          data-testid="shipping-address-input"
          placeholder={t("address_placeholder")}
          fullWidth
        />
        <FormField
          label={t("company")}
          name="shipping_address.company"
          value={formData["shipping_address.company"]}
          onChange={handleChange}
          autoComplete="organization"
          data-testid="shipping-company-input"
          placeholder={t("company_placeholder")}
        />
        <FormField
          label={t("postal_code")}
          name="shipping_address.postal_code"
          autoComplete="postal-code"
          value={formData["shipping_address.postal_code"]}
          onChange={handleChange}
          required
          data-testid="shipping-postal-code-input"
          placeholder={t("postal_code_placeholder")}
        />
        <FormField
          label={t("email")}
          name="email"
          type="email"
          title={t("enter_valid_email")}
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="shipping-email-input"
          placeholder={t("email_placeholder")}
        />
        <div className="flex flex-col w-full relative">
          <label className="absolute -top-2 ltr:left-3 rtl:right-3 px-1 text-[10px] font-bold text-gray-400 dark:text-zinc-500 bg-background dark:bg-zinc-950 uppercase tracking-widest z-10 transition-all">
            {t("phone")} <span className="text-rose-500">*</span>
          </label>
          <PhoneInput
            placeholder={t("phone_placeholder")}
            value={formData["shipping_address.phone"]}
            onChange={(value) =>
              setFormData((prev: any) => ({
                ...prev,
                "shipping_address.phone": value || "",
              }))
            }
            name="shipping_address.phone"
            required
            defaultCountry={currentCountry as any}
            internationalIcon={() => null}
            className="flex h-11 w-full rounded-xl border border-border dark:border-zinc-700 bg-background dark:bg-zinc-800/50 px-4 py-1 text-sm transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 outline-none [&_input]:outline-none [&_input]:border-none [&_input]:bg-transparent text-sm font-normal text-foreground dark:text-zinc-100"
            data-testid="shipping-phone-input"
          />
        </div>
      </div>

      <div className="pt-4 mt-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              name="same_as_billing"
              checked={checked}
              onChange={onChange}
              className="sr-only"
              data-testid="billing-address-checkbox"
            />
            <div
              className={`w-5 h-5 border rounded-md flex items-center justify-center transition-colors shadow-sm ${
                checked
                  ? "bg-primary border-primary"
                  : "bg-background border-muted-foreground/50 group-hover:border-muted-foreground"
              }`}
            >
              {checked && <Check className="text-primary-foreground w-3 h-3" />}
            </div>
          </div>
          <span className="text-sm font-medium text-foreground">
            {t("billing_same_as_shipping")}
          </span>
        </label>
      </div>
    </>
  )
}

export default ShippingAddress
