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
    <div className="bg-white/40 dark:bg-zinc-950/40 backdrop-blur-3xl rounded-[24px] border border-white/50 dark:border-white/10 overflow-hidden shadow-[0_8px_32px_rgba(31,38,135,0.05)]">
      <div className="px-8 py-8 border-b border-dashed border-white/20 dark:border-zinc-800/50">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
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

        <div className="mt-10 pt-8 border-t border-dashed border-white/20 dark:border-zinc-800/50">
          <ProfileBillingAddress customer={customer} regions={regions} />
        </div>
      </div>
    </div>
  )
}
