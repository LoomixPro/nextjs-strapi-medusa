"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { HttpTypes } from "@medusajs/types"
import ProfileName from "../profile-name"
import ProfileUsername from "../profile-username"
import ProfileEmail from "../profile-email"
import ProfilePhone from "../profile-phone"
import ProfileBillingAddress from "../profile-billing-address"

type ProfileDetailsProps = {
  customer: HttpTypes.StoreCustomer
  regions: HttpTypes.StoreRegion[]
}

export default function ProfileDetails({
  customer,
  regions,
}: ProfileDetailsProps) {
  const t = useTranslations("Account.Profile")

  return (
    <div className="bg-background rounded-[24px] border border-border overflow-hidden">
      <div className="px-8 py-8 border-b border-dashed border-border">
        <h2 className="text-lg font-medium tracking-tight text-foreground">
          {t("personal_info")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-light">
          {t("personal_info_description")}
        </p>
      </div>
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <ProfileName customer={customer} />
          <ProfileUsername customer={customer} />
          <ProfileEmail customer={customer} />
          <ProfilePhone customer={customer} />
        </div>

        <div className="mt-10 pt-8 border-t border-dashed border-border">
          <ProfileBillingAddress customer={customer} regions={regions} />
        </div>
      </div>
    </div>
  )
}
