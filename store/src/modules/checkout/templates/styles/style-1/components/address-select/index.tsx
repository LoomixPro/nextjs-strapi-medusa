"use client"

import { Listbox, Transition } from "@headlessui/react"
import { ChevronUpDown } from "@medusajs/icons"
import { clx } from "@medusajs/ui"
import { Fragment, useEffect, useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import Radio from "@modules/common/components/radio"

type AddressSelectProps = {
  addresses: HttpTypes.StoreCustomerAddress[]
  addressInput: HttpTypes.StoreCartAddress | null
  onSelect: (
    address: HttpTypes.StoreCartAddress | undefined,
    email?: string
  ) => void
}

const AddressSelect = ({
  addresses,
  addressInput,
  onSelect,
}: AddressSelectProps) => {
  const t = useTranslations("Checkout")
  const [selectedId, setSelectedId] = useState("")

  const handleSelect = (id: string) => {
    setSelectedId(id)
    const savedAddress = addresses.find((a) => a.id === id)
    if (savedAddress) {
      onSelect(savedAddress as HttpTypes.StoreCartAddress)
    }
  }

  const selectedAddress = useMemo(() => {
    return addresses.find((a) => compareAddresses(a, addressInput))
  }, [addresses, addressInput])

  useEffect(() => {
    if (selectedAddress?.id) {
      setSelectedId(selectedAddress.id)
    }
  }, [selectedAddress?.id])

  return (
    <Listbox onChange={handleSelect} value={selectedId}>
      <div className="relative">
        <Listbox.Button
          type="button"
          className="relative w-full flex justify-between items-center px-4 py-3 ltr:text-left rtl:text-right bg-background cursor-pointer focus:outline-none border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-foreground"
          data-testid="shipping-address-select"
        >
          {({ open }) => (
            <>
              <span className="block truncate font-medium">
                {selectedAddress
                  ? selectedAddress.address_1
                  : t("choose_address")}
              </span>
              <ChevronUpDown
                className={clx(
                  "transition-transform duration-200 text-muted-foreground",
                  {
                    "transform rotate-180 text-foreground": open,
                  }
                )}
              />
            </>
          )}
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options
            className="absolute z-30 w-full mt-1 overflow-auto text-sm bg-background border border-border rounded-xl max-h-60 focus:outline-none shadow-lg text-foreground scrollbar-thin"
            data-testid="shipping-address-options"
          >
            {addresses.map((address) => {
              return (
                <Listbox.Option
                  key={address.id}
                  value={address.id}
                  className="cursor-pointer select-none relative ltr:pl-4 ltr:pr-10 rtl:pr-4 rtl:pl-10 hover:bg-muted py-4 transition-colors border-b border-border/40 last:border-b-0"
                  data-testid="shipping-address-option"
                >
                  <div className="flex gap-x-4 items-start">
                    <Radio
                      checked={selectedAddress?.id === address.id}
                      data-testid="shipping-address-radio"
                    />
                    <div className="flex flex-col text-right rtl:text-right ltr:text-left">
                      <span className="text-sm font-semibold text-foreground">
                        {address.first_name} {address.last_name}
                      </span>
                      {address.company && (
                        <span className="text-xs text-muted-foreground mt-0.5">
                          {address.company}
                        </span>
                      )}
                      <div className="flex flex-col text-xs text-muted-foreground mt-2 space-y-0.5">
                        <span>
                          {address.address_1}
                          {address.address_2 && (
                            <span>, {address.address_2}</span>
                          )}
                        </span>
                        <span>
                          {address.postal_code}, {address.city}
                        </span>
                        <span>
                          {address.province && `${address.province}, `}
                          {address.country_code?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Listbox.Option>
              )
            })}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  )
}

export default AddressSelect
