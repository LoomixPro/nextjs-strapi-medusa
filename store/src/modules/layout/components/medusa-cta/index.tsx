import { Text } from "@medusajs/ui"
import { useTranslations } from "next-intl"

import Medusa from "../../../common/icons/medusa"
import NextJs from "../../../common/icons/nextjs"

const MedusaCTA = () => {
  const t = useTranslations("Layout.medusa_cta")
  return (
    <Text className="flex gap-x-2 txt-compact-small-plus items-center">
      {t("powered_by")}
      <a href="https://www.medusajs.com" target="_blank" rel="noreferrer">
        <Medusa fill="#9ca3af" className="fill-[#9ca3af]" />
      </a>
      &
      <a href="https://nextjs.org" target="_blank" rel="noreferrer">
        <NextJs fill="#9ca3af" />
      </a>
    </Text>
  )
}

export default MedusaCTA
