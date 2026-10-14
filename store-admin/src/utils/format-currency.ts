/**
 * Unified currency formatter for all store-admin subscribers and notifications.
 * Ensures consistent handling of Rial vs Toman, AED, USD, etc. across all emails.
 */

export interface FormattedPrice {
  /** The numeric amount after conversion (e.g. divided by 10 if Toman) */
  amount: number
  /** The formatted number string using locale number grouping (e.g. "۱۰۰,۰۰۰" or "100,000") */
  formattedAmount: string
  /** The currency title/symbol (e.g. "تومان", "درهم", "USD") */
  currency: string
  /** Combined label, e.g. "۱۰۰,۰۰۰ تومان" or "100.00 USD" */
  label: string
}

export interface FormatCurrencyOptions {
  /**
   * If true, amounts with currency 'irr' will be divided by 10 and labelled as 'تومان'
   * for Persian locale. Defaults to checking process.env.CONVERT_TO_TOMAN !== "false" (true).
   */
  convertToToman?: boolean
}

export function formatCurrency(
  rawAmount: number | string | null | undefined,
  currencyCode?: string | null,
  locale: string = "fa-IR",
  options?: FormatCurrencyOptions
): FormattedPrice {
  const num = typeof rawAmount === "number" ? rawAmount : Number(rawAmount || 0)
  const currencyClean = (currencyCode || "IRR").trim().toLowerCase()
  const isFa = locale.toLowerCase().startsWith("fa")
  const isAr = locale.toLowerCase().startsWith("ar")

  const envConvertToToman = process.env.CONVERT_TO_TOMAN !== "false"
  const shouldConvertToToman = options?.convertToToman ?? (envConvertToToman && isFa)

  let finalAmount = num
  let currencyLabel = ""

  if (currencyClean === "irr") {
    if (shouldConvertToToman) {
      finalAmount = Math.round(num / 10)
      currencyLabel = isFa ? "تومان" : "Toman"
    } else {
      currencyLabel = isFa ? "ریال" : "IRR"
    }
  } else if (currencyClean === "aed") {
    currencyLabel = isAr || isFa ? "درهم" : "AED"
  } else if (currencyClean === "usd") {
    currencyLabel = isFa ? "دلار" : "USD"
  } else if (currencyClean === "eur") {
    currencyLabel = isFa ? "یورو" : "EUR"
  } else {
    currencyLabel = currencyClean.toUpperCase()
  }

  const formattedAmount = new Intl.NumberFormat(locale).format(finalAmount)
  const label = `${formattedAmount} ${currencyLabel}`

  return {
    amount: finalAmount,
    formattedAmount,
    currency: currencyLabel,
    label,
  }
}
