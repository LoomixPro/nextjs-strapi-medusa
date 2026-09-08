"use client"

import { useState, useEffect } from "react"
import { retrieveCustomer } from "../../../../lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import { toast } from "sonner"
import { addProductReview } from "../../../../lib/data/products"
import { Star } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@modules/common/components/shadcn/button"

interface ProductReviewsFormProps {
  productId: string
  onSuccess?: () => void
}

function getDisplayName(customer: HttpTypes.StoreCustomer): {
  firstName: string
  lastName: string
} {
  if (customer.metadata?.username) {
    return { firstName: customer.metadata.username as string, lastName: "" }
  }
  const first =
    customer.first_name &&
    customer.first_name !== "null" &&
    customer.first_name !== "undefined"
      ? customer.first_name.trim()
      : ""
  const last =
    customer.last_name &&
    customer.last_name !== "null" &&
    customer.last_name !== "undefined"
      ? customer.last_name.trim()
      : ""
  return { firstName: first, lastName: last }
}

export default function ProductReviewsForm({
  productId,
  onSuccess,
}: ProductReviewsFormProps) {
  const t = useTranslations("Product.reviews")
  const [, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [rating, setRating] = useState(0)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)

  useEffect(() => {
    void retrieveCustomer().then((cust) => {
      setCustomer(cust)
      if (cust) {
        const { firstName: f, lastName: l } = getDisplayName(cust)
        setFirstName(f)
        setLastName(l)
        if (!f && !l) {
          setIsEditingName(true)
        }
      } else {
        setIsEditingName(true)
      }
    })
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!content || !rating || !firstName) {
      toast.error(t("fields_error"))
      return
    }

    setIsLoading(true)
    addProductReview({
      title,
      content,
      rating,
      first_name: firstName,
      last_name: lastName || "",
      product_id: productId,
    })
      .then(() => {
        setTitle("")
        setContent("")
        setRating(0)
        toast.success(t("review_success"))
        onSuccess?.()
      })
      .catch(() => {
        toast.error(t("review_error"))
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 sm:gap-5 w-full max-w-2xl mx-auto text-start p-4 sm:p-6 md:p-7 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-sm sm:text-base font-semibold text-foreground">
          {t("submit_new_review")}
        </h3>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="text-destructive">*</span>
          {t("required_fields")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-1">
          {t("rating")} <span className="text-destructive">*</span>
        </label>
        <div
          className="flex gap-1.5 p-2 bg-muted/30 rounded-xl border border-border/50 w-fit"
          dir="ltr"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i + 1)}
              className="p-1 hover:scale-110 active:scale-95 transition-transform focus:outline-none"
            >
              <Star
                className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                  i < rating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-muted text-muted-foreground/30 hover:text-amber-400/50"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs sm:text-sm font-medium text-foreground">
          {t("review_title")}
        </label>
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("placeholder_title")}
          className="bg-background w-full border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-1">
          {t("review_text")} <span className="text-destructive">*</span>
        </label>
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("placeholder_content")}
          required
          className="h-28 sm:h-32 bg-background w-full border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all"
        />
      </div>

      {isEditingName ? (
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="flex items-center gap-1 text-xs sm:text-sm font-medium text-foreground">
              {t("first_name")}
              <span className="text-destructive">*</span>
            </label>
            <input
              placeholder={t("placeholder_first_name")}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="bg-background w-full border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all"
            />
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="flex items-center gap-1 text-xs sm:text-sm font-medium text-foreground">
              {t("last_name")}
            </label>
            <input
              placeholder={t("placeholder_last_name")}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-background w-full border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-3.5 sm:p-4 bg-muted/30 rounded-xl border border-border/70">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t.rich("submit_notice", {
                name:
                  `${firstName} ${lastName}`.trim() || t("user_placeholder"),
                span: (chunks) => (
                  <span className="font-semibold text-foreground mx-1">
                    {chunks}
                  </span>
                ),
              })}
            </p>
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="text-xs text-primary hover:text-primary/90 font-medium px-2.5 py-1 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors whitespace-nowrap"
            >
              {t("edit_name")}
            </button>
          </div>
        </div>
      )}

      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full sm:w-48 sm:ms-auto rounded-xl mt-1"
      >
        {t("submit_btn")}
      </Button>
    </form>
  )
}
