import { useTranslations } from "next-intl"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/shadcn/button"

const SignInPrompt = () => {
  const t = useTranslations("Cart")

  return (
    <div className="flex items-center justify-between bg-muted/40 p-6 rounded-2xl border border-border">
      <div>
        <h2 className="text-base font-bold text-foreground">
          {t("sign_in_title")}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {t("sign_in_message")}
        </p>
      </div>
      <div>
        <LocalizedClientLink href="/account">
          <Button
            variant="secondary"
            className="h-10 rounded-xl px-4 text-xs font-semibold"
            data-testid="sign-in-button"
          >
            {t("sign_in_button")}
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
