"use client"

import { Plus } from "lucide-react"
import { Button } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import { useEffect, useState, useActionState } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import CountrySelect from "@/modules/checkout/templates/styles/style-1/components/country-select"
import ProvinceSelect from "@/modules/checkout/templates/styles/style-1/components/province-select"
import CitySelect from "@/modules/checkout/templates/styles/style-1/components/city-select"
import Input from "@modules/common/components/input"
import Modal from "@modules/common/components/modal"
import { SubmitButton } from "@/modules/checkout/templates/styles/style-1/components/submit-button"
import { HttpTypes } from "@medusajs/types"
import { addCustomerAddress } from "@lib/data/customer"

const AddAddress = ({
  region,
  addresses,
}: {
  region: HttpTypes.StoreRegion
  addresses: HttpTypes.StoreCustomerAddress[]
}) => {
  const t = useTranslations("Account")
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)
  const [selectedCountry, setSelectedCountry] = useState(
    region?.countries?.[0]?.iso_2 || ""
  )
  const [selectedProvince, setSelectedProvince] = useState("")

  const [formState, formAction] = useActionState(addCustomerAddress, {
    isDefaultShipping: addresses.length === 0,
    success: false,
    error: null,
  })

  const close = () => {
    setSuccessState(false)
    setSelectedCountry(region?.countries?.[0]?.iso_2 || "")
    setSelectedProvince("")
    closeModal()
  }

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

  return (
    <>
      <button
        className="border-2 border-dashed border-border rounded-3xl p-8 min-h-[240px] h-full w-full flex flex-col items-center justify-center gap-4 bg-muted/20 hover:bg-accent hover:border-accent-foreground transition-all duration-500 group"
        onClick={open}
        data-testid="add-address-button"
      >
        <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shadow-sm group-hover:shadow-md">
          <Plus size={32} />
        </div>
        <div className="text-center">
          <span className="text-sm font-bold text-foreground block mb-1">
            {t("AddressBook.new_address")}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {t("AddressBook.add_to_list")}
          </span>
        </div>
      </button>

      <Modal isOpen={state} close={close} data-testid="add-address-modal">
        <Modal.Title>{t("AddressBook.add_address")}</Modal.Title>
        <form action={formAction}>
          <Modal.Body>
            <div className="flex flex-col gap-y-2">
              <div className="grid grid-cols-2 gap-x-2">
                <Input
                  label={t("Register.first_name")}
                  name="first_name"
                  required
                  autoComplete="given-name"
                  data-testid="first-name-input"
                />
                <Input
                  label={t("Register.last_name")}
                  name="last_name"
                  required
                  autoComplete="family-name"
                  data-testid="last-name-input"
                />
              </div>
              <Input
                label={t("AddressBook.company")}
                name="company"
                autoComplete="organization"
                data-testid="company-input"
              />
              <Input
                label={t("AddressBook.address")}
                name="address_1"
                required
                autoComplete="address-line1"
                data-testid="address-1-input"
              />
              <Input
                label={t("AddressBook.apartment")}
                name="address_2"
                autoComplete="address-line2"
                data-testid="address-2-input"
              />
              <CountrySelect
                region={region}
                name="country_code"
                required
                autoComplete="country"
                data-testid="country-select"
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value)
                  setSelectedProvince("")
                }}
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
                  data-testid="city-input"
                />
              </div>
              <Input
                label={t("AddressBook.postal_code")}
                name="postal_code"
                required
                autoComplete="postal-code"
                data-testid="postal-code-input"
              />
              <Input
                label={t("Profile.phone")}
                name="phone"
                autoComplete="phone"
                data-testid="phone-input"
              />
            </div>
            {formState.error && (
              <div
                className="text-rose-500 text-small-regular py-2"
                data-testid="address-error"
              >
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

export default AddAddress
