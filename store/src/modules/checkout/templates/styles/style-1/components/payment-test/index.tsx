import { Badge } from "@medusajs/ui"
import { useTranslations } from "next-intl"

const PaymentTest = ({ className }: { className?: string }) => {
  const t = useTranslations("Checkout")
  return (
    <Badge color="orange" className={className}>
      <span className="font-semibold">{t("attention")}</span>{" "}
      {t("testing_only")}
    </Badge>
  )
}

export default PaymentTest
