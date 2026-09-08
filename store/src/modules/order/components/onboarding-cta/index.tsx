"use client"

import { resetOnboardingState } from "@lib/data/onboarding"
import { Button, Container, Text } from "@medusajs/ui"
import { useTranslations } from "next-intl"

const OnboardingCta = ({ orderId }: { orderId: string }) => {
  const t = useTranslations("Order.Onboarding")

  return (
    <Container className="max-w-4xl h-full bg-ui-bg-subtle w-full">
      <div className="flex flex-col gap-y-4 center p-4 md:items-center">
        <Text className="text-ui-fg-base text-xl">{t("title")}</Text>
        <Text className="text-ui-fg-subtle text-small-regular">
          {t("description")}
        </Text>
        <Button
          className="w-fit"
          size="xlarge"
          onClick={() => resetOnboardingState(orderId)}
        >
          {t("complete_setup")}
        </Button>
      </div>
    </Container>
  )
}

export default OnboardingCta
