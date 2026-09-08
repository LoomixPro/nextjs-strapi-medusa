import { Button, Container, Text } from "@medusajs/ui"
import { readCookie } from "@lib/util/safe-cookies"
import { getTranslations } from "next-intl/server"

const MEDUSA_ADMIN_URL =
  process.env.MEDUSA_ADMIN_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_ADMIN_URL ||
  "http://localhost:7001"

async function ProductOnboardingCta() {
  const t = await getTranslations("Product.onboarding")

  const isOnboarding = (await readCookie("_medusa_onboarding")) === "true"

  if (!isOnboarding) {
    return null
  }

  return (
    <Container className="max-w-4xl h-full bg-ui-bg-subtle w-full p-8">
      <div className="flex flex-col gap-y-4 center">
        <Text className="text-ui-fg-base text-xl">{t("title")}</Text>
        <Text className="text-ui-fg-subtle text-small-regular">
          {t("description")}
        </Text>
        <a
          href={`${MEDUSA_ADMIN_URL}/a/orders?onboarding_step=create_order_nextjs`}
        >
          <Button className="w-full">{t("continue_setup")}</Button>
        </a>
      </div>
    </Container>
  )
}

export default ProductOnboardingCta
