"use client"

import React from "react"
import { useTranslations } from "next-intl"

import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

/**
 * ProfileEmail displays the customer's account email.
 * In Medusa v2, email serves as the primary authentication identity key and is read-only.
 */
const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  const t = useTranslations("Account.Profile")

  return (
    <div className="w-full">
      <AccountInfo
        label={t("email")}
        currentInfo={
          customer.email?.endsWith("@phone.local")
            ? "-"
            : (customer.email ?? "-")
        }
        clearState={() => {}}
        isEditable={false}
        data-testid="account-email-editor"
      />
    </div>
  )
}

export default ProfileEmail
