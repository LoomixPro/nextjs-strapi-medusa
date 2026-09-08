import React from "react"
import { MapPin } from "lucide-react"
import { useTranslations } from "next-intl"

import AddAddress from "../address-card/add-address"
import EditAddress from "../address-card/edit-address-modal"
import { HttpTypes } from "@medusajs/types"

type AddressBookProps = {
  customer: HttpTypes.StoreCustomer
  region: HttpTypes.StoreRegion
}

const AddressBook: React.FC<AddressBookProps> = ({ customer, region }) => {
  const { addresses } = customer
  const t = useTranslations("Account.AddressBook")

  return (
    <div className="w-full pb-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-primary/5 dark:bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <MapPin size={18} />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {t("navigation_label")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("address_book_description")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
        <AddAddress region={region} addresses={addresses} />
        {addresses.map((address) => (
          <EditAddress region={region} address={address} key={address.id} />
        ))}
      </div>
    </div>
  )
}

export default AddressBook
