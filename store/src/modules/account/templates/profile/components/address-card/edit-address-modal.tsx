"use client"

import React, { useEffect, useState, useActionState } from "react"
import { useTranslations } from "next-intl"
import { Pencil, Trash2, MapPin, Building, Phone } from "lucide-react"
import { Heading, Text, clx } from "@medusajs/ui"
import { Button } from "@modules/common/components/shadcn/button"
import { Badge } from "@modules/common/components/shadcn/badge"

import useToggleState from "@lib/hooks/use-toggle-state"
import CountrySelect from "@/modules/checkout/templates/styles/style-1/components/country-select"
import ProvinceSelect from "@/modules/checkout/templates/styles/style-1/components/province-select"
import CitySelect from "@/modules/checkout/templates/styles/style-1/components/city-select"
import Input from "@modules/common/components/input"
import Modal from "@modules/common/components/modal"
import Spinner from "@modules/common/icons/spinner"
import { SubmitButton } from "@/modules/checkout/templates/styles/style-1/components/submit-button"
import { HttpTypes } from "@medusajs/types"
import {
  deleteCustomerAddress,
  updateCustomerAddress,
} from "@lib/data/customer"

type EditAddressProps = {
  region: HttpTypes.StoreRegion
  address: HttpTypes.StoreCustomerAddress
  isActive?: boolean
}

const EditAddress: React.FC<EditAddressProps> = ({
  region,
  address,
  isActive = false,
}) => {
  const t = useTranslations("Account")
  const [removing, setRemoving] = useState(false)
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)
  const [selectedCountry, setSelectedCountry] = useState(
    address.country_code || region?.countries?.[0]?.iso_2 || ""
  )
  const [selectedProvince, setSelectedProvince] = useState(
    address.province || ""
  )

  const [formState, formAction] = useActionState(updateCustomerAddress, {
    success: false,
    error: null,
    addressId: address.id,
  })

  const close = () => {
    setSuccessState(false)
    setSelectedCountry(
      address.country_code || region?.countries?.[0]?.iso_2 || ""
    )
    setSelectedProvince(address.province || "")
    closeModal()
  }

  useEffect(() => {
    setSelectedCountry(
      address.country_code || region?.countries?.[0]?.iso_2 || ""
    )
    setSelectedProvince(address.province || "")
  }, [address, region?.countries])

  useEffect(() => {
    if (successState) {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successState])

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true)
    }
  }, [formState])

  const removeAddress = async () => {
    setRemoving(true)
    await deleteCustomerAddress(address.id)
    setRemoving(false)
  }

  return (
    <>
      <div
        className={clx(
          "bg-background rounded-3xl border p-6 flex flex-col justify-between transition-all duration-500 group",
          {
            "border-primary shadow-2xl shadow-primary/5": isActive,
            "border-border hover:border-accent shadow-sm": !isActive,
          }
        )}
        data-testid="address-container"
      >
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/5 dark:bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <MapPin size={16} />
              </div>
              <Heading
                className="text-sm font-bold text-foreground"
                data-testid="address-name"
              >
                {address.first_name} {address.last_name}
              </Heading>
            </div>
            {isActive && (
              <Badge
                variant="secondary"
                className="bg-primary text-primary-foreground border-none rounded-lg text-[8px] uppercase tracking-widest font-bold"
              >
                {t("AddressBook.default")}
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            {address.company && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building size={14} className="shrink-0" />
                <Text
                  className="text-xs font-bold text-foreground"
                  data-testid="address-company"
                >
                  {address.company}
                </Text>
              </div>
            )}

            <div className="flex items-start gap-2 text-muted-foreground bg-muted/50 p-3 rounded-2xl border border-border">
              <MapPin size={14} className="shrink-0 mt-0.5" />
              <Text className="flex flex-col text-xs font-medium leading-relaxed">
                <span
                  data-testid="address-address"
                  className="font-bold text-foreground"
                >
                  {address.address_1}
                  {address.address_2 && <span>, {address.address_2}</span>}
                </span>
                <span data-testid="address-postal-city">
                  {address.postal_code}, {address.city}
                </span>
                <span
                  data-testid="address-province-country"
                  className="uppercase tracking-wider text-[10px] text-muted-foreground font-bold mt-1"
                >
                  {address.province && `${address.province}, `}
                  {address.country_code?.toUpperCase()}
                </span>
              </Text>
            </div>

            {address.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone size={14} className="shrink-0" />
                <span
                  className="text-xs font-bold text-foreground inline-block"
                  dir="ltr"
                >
                  {address.phone}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-border">
          <Button
            variant="secondary"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-accent rounded-xl text-[10px] font-bold text-muted-foreground uppercase tracking-widest transition-all h-10 shadow-xs border-none"
            onClick={open}
            data-testid="address-edit-button"
          >
            <Pencil size={14} />
            {t("Profile.edit")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="flex items-center justify-center w-10 h-10 bg-red-50 dark:bg-red-950/20 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all shadow-xs border-none"
            onClick={removeAddress}
            data-testid="address-delete-button"
          >
            {removing ? <Spinner /> : <Trash2 size={16} />}
          </Button>
        </div>
      </div>

      <Modal isOpen={state} close={close} data-testid="edit-address-modal">
        <Modal.Title>{t("AddressBook.edit_address_title")}</Modal.Title>
        <form action={formAction}>
          <input type="hidden" name="addressId" value={address?.id || ""} />
          <Modal.Body>
            <div className="grid grid-cols-1 gap-y-2">
              <div className="grid grid-cols-2 gap-x-2">
                <Input
                  label={t("Register.first_name")}
                  name="first_name"
                  required
                  autoComplete="given-name"
                  defaultValue={address.first_name || undefined}
                  data-testid="first-name-input"
                />
                <Input
                  label={t("Register.last_name")}
                  name="last_name"
                  required
                  autoComplete="family-name"
                  defaultValue={address.last_name || undefined}
                  data-testid="last-name-input"
                />
              </div>
              <Input
                label={t("AddressBook.company")}
                name="company"
                autoComplete="organization"
                defaultValue={address.company || undefined}
                data-testid="company-input"
              />
              <Input
                label={t("AddressBook.address")}
                name="address_1"
                required
                autoComplete="address-line1"
                defaultValue={address.address_1 || undefined}
                data-testid="address-1-input"
              />
              <Input
                label={t("AddressBook.apartment")}
                name="address_2"
                autoComplete="address-line2"
                defaultValue={address.address_2 || undefined}
                data-testid="address-2-input"
              />
              <CountrySelect
                name="country_code"
                region={region}
                required
                autoComplete="country"
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value)
                  setSelectedProvince("")
                }}
                data-testid="country-select"
              />
              <div className="grid grid-cols-2 gap-x-2">
                <ProvinceSelect
                  name="province"
                  required
                  autoComplete="address-level1"
                  countryCode={selectedCountry}
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  data-testid="state-input"
                />
                <CitySelect
                  name="city"
                  required
                  autoComplete="address-level2"
                  countryCode={selectedCountry}
                  stateCode={selectedProvince}
                  defaultValue={address.city || undefined}
                  data-testid="city-input"
                />
              </div>
              <Input
                label={t("AddressBook.postal_code")}
                name="postal_code"
                required
                autoComplete="postal-code"
                defaultValue={address.postal_code || undefined}
                data-testid="postal-code-input"
              />
              <Input
                label={t("Profile.phone")}
                name="phone"
                autoComplete="phone"
                defaultValue={address.phone || undefined}
                data-testid="phone-input"
              />
            </div>
            {formState.error && (
              <div className="text-rose-500 text-small-regular py-2">
                {formState.error}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="flex gap-3 mt-6">
              <Button
                type="reset"
                variant="secondary"
                onClick={close}
                className="h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-muted text-muted-foreground border-none hover:bg-accent"
                data-testid="cancel-button"
              >
                {t("Profile.cancel")}
              </Button>
              <SubmitButton data-testid="save-button" className="rounded-xl">
                {t("AddressBook.save")}
              </SubmitButton>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  )
}

export default EditAddress
