"use client"

import {
  getProductReviews,
  toggleReviewReaction,
  getProductQuestions,
  submitQuestion,
} from "../../../../lib/data/products"
import { retrieveCustomer } from "../../../../lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import {
  StoreProductReview,
  StoreProductQuestion,
} from "../../../../types/global"
import { useState, useEffect, useCallback } from "react"
import ProductReviewsForm from "./form"
import {
  Star,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
} from "lucide-react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { toJalali } from "@lib/util/date"
import StarRating from "@modules/common/components/star-rating"
import { Button } from "@modules/common/components/shadcn/button"

type SortOption =
  | "-created_at"
  | "created_at"
  | "-like_count"
  | "-dislike_count"
  | "-rating"
  | "rating"

interface Filters {
  is_verified_buyer?: boolean
  order: SortOption
}

function getInitials(name: string) {
  if (!name) return "U"
  const words = name.trim().split(/\s+/)
  if (words.length >= 2 && words[0] && words[1]) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function SampleComment({
  review,
  onReaction,
}: {
  review: StoreProductReview
  onReaction: (
    reviewId: string,
    type: "like" | "dislike"
  ) => void | Promise<void>
}) {
  const t = useTranslations("Product.reviews")
  const [loading, setLoading] = useState<"like" | "dislike" | null>(null)
  const [expanded, setExpanded] = useState(false)
  const MAX_LENGTH = 140

  const handleReaction = (type: "like" | "dislike") => {
    setLoading(type)
    void onReaction(review.id, type)
    setTimeout(() => setLoading(null), 500)
  }

  const name =
    `${review.first_name || ""} ${review.last_name || ""}`.trim() ||
    t("user_placeholder")

  return (
    <div className="p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl bg-background border border-border/80 hover:border-border transition-all duration-200 shadow-sm flex flex-col gap-3">
      {/* Header: User avatar, Name & Badges, Date */}
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-border/80 bg-muted/70 text-foreground font-semibold text-xs sm:text-sm overflow-hidden">
            {getInitials(name)}
          </div>
          {review.is_verified_buyer && (
            <div
              className="absolute -bottom-1 -end-1 bg-background rounded-full p-0.5 shadow-sm"
              title={t("verified_buyer")}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <p className="font-semibold text-foreground text-sm sm:text-base truncate">
              {name}
            </p>
            {review.is_verified_buyer && (
              <span className="hidden sm:inline-flex text-[11px] px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
                {t("verified_buyer")}
              </span>
            )}
          </div>
          <span
            className="text-xs text-muted-foreground whitespace-nowrap"
            dir="ltr"
          >
            {toJalali(review.created_at)}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="ps-0 sm:ps-[52px] space-y-2">
        {review.rating > 0 && (
          <div>
            <StarRating
              rating={review.rating}
              iconClassName="w-3.5 h-3.5 sm:w-4 sm:h-4"
            />
          </div>
        )}

        {review.title && (
          <p className="font-semibold text-foreground text-sm sm:text-base">
            {review.title}
          </p>
        )}

        <div className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
          {review.content.length > MAX_LENGTH && !expanded ? (
            <>
              {review.content.slice(0, MAX_LENGTH)}...
              <button
                type="button"
                className="text-primary hover:underline font-medium ms-1 text-xs sm:text-sm"
                onClick={() => setExpanded(true)}
              >
                {t("read_more")}
              </button>
            </>
          ) : (
            <>
              {review.content}
              {review.content.length > MAX_LENGTH && (
                <button
                  type="button"
                  className="text-primary hover:underline font-medium ms-1 text-xs sm:text-sm"
                  onClick={() => setExpanded(false)}
                >
                  {t("close")}
                </button>
              )}
            </>
          )}
        </div>

        {/* Reaction Buttons */}
        <div className="flex gap-2 items-center justify-end pt-1" dir="ltr">
          <button
            className={`flex items-center gap-1.5 h-8 px-2.5 sm:h-9 sm:px-3 rounded-xl border text-xs sm:text-sm transition-all duration-200 active:scale-95 ${
              review.user_reaction === "like"
                ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/30 font-semibold"
                : "text-muted-foreground bg-muted/30 border-border/60 hover:bg-muted"
            }`}
            onClick={() => handleReaction("like")}
            disabled={loading === "like"}
          >
            <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{review.like_count > 0 ? review.like_count : ""}</span>
          </button>
          <button
            className={`flex items-center gap-1.5 h-8 px-2.5 sm:h-9 sm:px-3 rounded-xl border text-xs sm:text-sm transition-all duration-200 active:scale-95 ${
              review.user_reaction === "dislike"
                ? "text-destructive bg-destructive/10 border-destructive/30 font-semibold"
                : "text-muted-foreground bg-muted/30 border-border/60 hover:bg-muted"
            }`}
            onClick={() => handleReaction("dislike")}
            disabled={loading === "dislike"}
          >
            <ThumbsDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{review.dislike_count > 0 ? review.dislike_count : ""}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function FormQuestion({
  productId,
  onSuccess,
}: {
  productId: string
  onSuccess?: () => void
}) {
  const t = useTranslations("Product.reviews")
  const [form, setForm] = useState({ name: "", email: "", question: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)
    try {
      await submitQuestion({
        name: form.name,
        email: form.email,
        question_text: form.question,
        product_id: productId,
      })
      setForm({ name: "", email: "", question: "" })
      setMessage({ type: "success", text: t("question_success") })
      toast.success(t("question_success"))
      onSuccess?.()
    } catch {
      setMessage({ type: "error", text: t("question_error") })
      toast.error(t("question_error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e)
      }}
      className="flex flex-col gap-4 sm:gap-5 w-full max-w-2xl mx-auto text-start p-4 sm:p-6 md:p-7 rounded-2xl md:rounded-3xl bg-card border border-border/80 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <h3 className="text-sm sm:text-base font-semibold text-foreground">
          {t("ask_question_title")}
        </h3>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="text-destructive">*</span>
          {t("required_fields")}
        </p>
      </div>

      {message && (
        <div
          className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="flex items-center gap-1 text-xs sm:text-sm font-medium text-foreground">
          {t("question_text_label")}
          <span className="text-destructive">*</span>
        </label>
        <textarea
          placeholder={t("placeholder_question")}
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
          required
          className="h-28 sm:h-32 bg-background w-full border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="flex items-center gap-1 text-xs sm:text-sm font-medium text-foreground">
            {t("first_name")}
            <span className="text-destructive">*</span>
          </label>
          <input
            placeholder={t("placeholder_first_name")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="bg-background w-full border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all"
          />
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="flex items-center gap-1 text-xs sm:text-sm font-medium text-foreground">
            {t("email")}
            <span className="text-destructive">*</span>
          </label>
          <input
            type="email"
            placeholder={t("placeholder_email")}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="bg-background w-full border border-border/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all"
          />
        </div>
      </div>

      <Button
        type="submit"
        isLoading={isSubmitting}
        className="w-full sm:w-48 sm:ms-auto rounded-xl mt-1"
      >
        {t("submit_question_btn")}
      </Button>
    </form>
  )
}

function QuestionItem({ question }: { question: StoreProductQuestion }) {
  const t = useTranslations("Product.reviews")
  const initials = question.name
    ? getInitials(question.name)
    : t("user_placeholder").slice(0, 2)

  return (
    <div className="p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl bg-background border border-border/80 hover:border-border transition-all duration-200 shadow-sm flex flex-col gap-3">
      {/* Top header: User avatar, name, and date */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-border/80 bg-muted/60 text-foreground font-semibold text-xs sm:text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
          <p className="font-semibold text-foreground text-sm sm:text-base truncate">
            {question.name || t("user_placeholder")}
          </p>
          <span
            className="text-xs text-muted-foreground whitespace-nowrap"
            dir="ltr"
          >
            {toJalali(question.created_at)}
          </span>
        </div>
      </div>

      {/* Body: Question & Answer */}
      <div className="space-y-3 ps-0 sm:ps-[52px]">
        {/* Question row */}
        <div className="flex items-start gap-2.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 flex-shrink-0 mt-0.5">
            {t("question_label").replace(":", "")}
          </span>
          <p className="text-foreground leading-relaxed text-xs sm:text-sm break-words flex-1">
            {question.question_text}
          </p>
        </div>

        {/* Answer box (if exists) */}
        {question.answer_text ? (
          <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 border-s-4 border-s-emerald-500 rounded-xl sm:rounded-2xl p-3.5 sm:p-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {t("store_reply")}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-foreground/90 dark:text-zinc-200 leading-relaxed break-words">
              {question.answer_text}
            </p>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/80 bg-muted/40 px-2.5 py-1 rounded-lg mt-1 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 animate-pulse" />
            <span>{t("pending_answer")}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProductReviews({ productId }: { productId: string }) {
  const t = useTranslations("Product.reviews")
  const defaultLimit = 10
  const [page, setPage] = useState(1)
  const [reviews, setReviews] = useState<StoreProductReview[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [hasMoreReviews, setHasMoreReviews] = useState(false)
  const [count, setCount] = useState(0)
  const [filters, setFilters] = useState<Filters>({ order: "-created_at" })

  const [questions, setQuestions] = useState<StoreProductQuestion[]>([])
  const [, setQuestionsCount] = useState(0)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false)
  const [activeTab, setActiveTab] = useState<"review" | "question">("review")
  const [formMode, setFormMode] = useState<"review" | "question" | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingNext, setIsFetchingNext] = useState(false)
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)

  const fetchReviews = useCallback(
    (currentPage: number, currentFilters: Filters, append: boolean) => {
      if (currentPage === 1) setIsLoading(true)
      else setIsFetchingNext(true)

      getProductReviews({
        productId,
        limit: defaultLimit,
        offset: (currentPage - 1) * defaultLimit,
        is_verified_buyer: currentFilters.is_verified_buyer,
        order: currentFilters.order,
      })
        .then(({ reviews: fetched, average_rating, count, limit }) => {
          if (append) {
            setReviews((prev) => {
              const newReviews = fetched.filter(
                (review) => !prev.some((r) => r.id === review.id)
              )
              return [...prev, ...newReviews]
            })
          } else {
            setReviews(fetched)
          }
          setAvgRating(average_rating)
          setHasMoreReviews(count > limit * currentPage)
          setCount(count)
          setIsLoading(false)
          setIsFetchingNext(false)
        })
        .catch(() => {
          setIsLoading(false)
          setIsFetchingNext(false)
        })
    },
    [productId]
  )

  const fetchQuestions = useCallback(() => {
    setIsLoadingQuestions(true)
    getProductQuestions({ productId })
      .then(({ questions: fetched, count }) => {
        setQuestions(fetched)
        setQuestionsCount(count)
        setIsLoadingQuestions(false)
      })
      .catch(() => {
        setIsLoadingQuestions(false)
      })
  }, [productId])

  useEffect(() => {
    void retrieveCustomer().then((cust) => {
      setCustomer(cust)
    })
  }, [])

  useEffect(() => {
    setPage(1)
    fetchReviews(1, filters, false)
  }, [filters, fetchReviews])

  useEffect(() => {
    if (page > 1) {
      fetchReviews(page, filters, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  useEffect(() => {
    if (activeTab === "question") {
      fetchQuestions()
    }
  }, [activeTab, fetchQuestions])

  const handleReaction = async (reviewId: string, type: "like" | "dislike") => {
    if (!customer) {
      toast.error(t("login_required_reaction"))
      return
    }
    setReviews((prev) =>
      prev.map((review) => {
        if (review.id !== reviewId) return review
        const currentReaction = review.user_reaction
        let newReaction: "like" | "dislike" | null
        let likeDelta = 0,
          dislikeDelta = 0
        if (currentReaction === type) {
          newReaction = null
          if (type === "like") likeDelta = -1
          else dislikeDelta = -1
        } else {
          newReaction = type
          if (type === "like") {
            likeDelta = 1
            if (currentReaction === "dislike") dislikeDelta = -1
          } else {
            dislikeDelta = 1
            if (currentReaction === "like") likeDelta = -1
          }
        }
        return {
          ...review,
          user_reaction: newReaction,
          like_count: Math.max(0, review.like_count + likeDelta),
          dislike_count: Math.max(0, review.dislike_count + dislikeDelta),
        }
      })
    )
    try {
      const result = await toggleReviewReaction(reviewId, productId, type)
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                like_count: result.like_count,
                dislike_count: result.dislike_count,
                user_reaction: result.user_reaction,
              }
            : review
        )
      )
    } catch {
      fetchReviews(1, filters, false)
    }
  }

  return (
    <div className="product-page-constraint flex flex-col items-center w-full text-start my-10 md:my-16 px-4 md:px-0">
      {/* Header panel */}
      <div className="w-full bg-muted/20 dark:bg-zinc-900/40 border border-border/80 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-6 mb-6 md:mb-8 shadow-sm backdrop-blur-sm">
        <div className="space-y-2.5">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground leading-tight">
              {t("user_reviews")}
            </h2>
            <p className="mt-1 text-muted-foreground text-xs sm:text-sm leading-relaxed">
              {t("reviews_helper_text")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl font-bold text-sm sm:text-base leading-none">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              <span>{avgRating ? avgRating.toFixed(1) : "0.0"}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <StarRating
                rating={avgRating}
                iconClassName="w-3.5 h-3.5 sm:w-4 sm:h-4"
              />
              <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                {t("reviews_count_short", { count })}
              </span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2.5 sm:gap-3 flex-col sm:flex-row w-full md:w-auto">
          <button
            onClick={() => {
              if (!customer) {
                toast.error(t("login_required_review"))
                return
              }
              setFormMode(formMode === "review" ? null : "review")
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 border rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 ${
              formMode === "review"
                ? "bg-muted text-foreground border-border"
                : "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {t("submit_review_tab")}
          </button>
          <button
            onClick={() =>
              setFormMode(formMode === "question" ? null : "question")
            }
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 border rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 ${
              formMode === "question"
                ? "bg-muted text-foreground border-border"
                : "bg-background text-foreground border-border/80 hover:bg-muted shadow-sm"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            {t("ask_question_tab")}
          </button>
        </div>
      </div>

      {/* Expandable Form Box */}
      <div
        className={`w-full overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out ${
          formMode
            ? "max-h-[1200px] opacity-100 mb-8"
            : "max-h-0 opacity-0 mb-0"
        }`}
      >
        {formMode === "review" && (
          <ProductReviewsForm
            productId={productId}
            onSuccess={() => {
              setFormMode(null)
              fetchReviews(1, filters, false)
            }}
          />
        )}
        {formMode === "question" && (
          <FormQuestion
            productId={productId}
            onSuccess={() => {
              setFormMode(null)
              setActiveTab("question")
              fetchQuestions()
            }}
          />
        )}
      </div>

      <div className="w-full relative">
        {/* Switcher & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          {/* Segmented Control */}
          <div className="flex p-1 bg-muted/50 rounded-2xl w-full sm:w-auto sm:min-w-[240px] border border-border/40 dark:border-zinc-800/60">
            <button
              onClick={() => setActiveTab("review")}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeTab === "review"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("reviews_tab")}
            </button>
            <button
              onClick={() => setActiveTab("question")}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeTab === "question"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("questions_tab")}
            </button>
          </div>

          {/* Filters & Sorting (for Reviews) */}
          {activeTab === "review" && (
            <div className="flex items-center gap-2.5 justify-between sm:justify-end w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    is_verified_buyer: filters.is_verified_buyer
                      ? undefined
                      : true,
                  })
                }
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 active:scale-95 whitespace-nowrap ${
                  filters.is_verified_buyer
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm"
                    : "bg-muted/30 hover:bg-muted/50 text-foreground border-border hover:border-border/80"
                }`}
              >
                <CheckCircle2
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    filters.is_verified_buyer
                      ? "scale-105 text-emerald-500"
                      : "scale-90 text-muted-foreground"
                  }`}
                />
                {t("verified_buyers_filter")}
              </button>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="hidden sm:inline-block text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {t("sort_by")}
                </span>
                <div className="relative">
                  <select
                    className="appearance-none border border-border/80 rounded-full ps-3.5 pe-8 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer font-medium text-foreground min-w-[120px]"
                    value={filters.order}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        order: e.target.value as SortOption,
                      })
                    }
                  >
                    <option value="-created_at">{t("sort_newest")}</option>
                    <option value="created_at">{t("sort_oldest")}</option>
                    <option value="-rating">{t("sort_highest_rating")}</option>
                    <option value="rating">{t("sort_lowest_rating")}</option>
                    <option value="-like_count">{t("sort_most_liked")}</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2.5 text-muted-foreground">
                    <svg
                      className="fill-current h-3.5 w-3.5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {activeTab === "review" && (
          <div className="relative">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length > 0 ? (
              <div className="flex flex-col space-y-3 sm:space-y-4">
                {reviews.map((c) => (
                  <SampleComment
                    key={c.id}
                    review={c}
                    onReaction={handleReaction}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border/80 dark:border-zinc-800 rounded-2xl md:rounded-3xl bg-muted/10">
                <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3 text-muted-foreground">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-center font-semibold text-foreground text-sm mb-1">
                  {t("no_reviews_found")}
                </p>
                <p className="text-center text-xs text-muted-foreground leading-relaxed max-w-sm">
                  {t("reviews_helper_text")}
                </p>
              </div>
            )}

            {hasMoreReviews && (
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={isFetchingNext}
                className="w-full mt-5 border border-border/80 dark:border-zinc-800 text-muted-foreground dark:text-zinc-300 bg-background hover:bg-muted rounded-xl sm:rounded-2xl py-2.5 sm:py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
              >
                {isFetchingNext ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("loading_more")}
                  </>
                ) : (
                  t("show_more")
                )}
              </button>
            )}
          </div>
        )}

        {activeTab === "question" && (
          <div className="relative">
            {isLoadingQuestions ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : questions.length > 0 ? (
              <div className="flex flex-col space-y-3 sm:space-y-4">
                {questions.map((q) => (
                  <QuestionItem key={q.id} question={q} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-border/80 dark:border-zinc-800 rounded-2xl md:rounded-3xl bg-muted/10">
                <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3 text-muted-foreground">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <p className="text-center font-semibold text-foreground text-sm mb-1">
                  {t("no_questions_found")}
                </p>
                <p className="text-center text-xs text-muted-foreground leading-relaxed max-w-sm">
                  {t("reviews_helper_text")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
