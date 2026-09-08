"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useSyncExternalStore } from "react"
import { useTranslations } from "next-intl"
import { LayoutGrid, Rows3 } from "lucide-react"

import {
  getStoreFilterLoading,
  navigateWithStoreLoading,
  subscribeStoreFilterLoading,
} from "./store-filter-loading"
import {
  getStoreProductCount,
  subscribeStoreProductCount,
} from "./store-product-count-cache"

export type SortOptions = "created_at" | "price_asc" | "price_desc"

export function SortBar({
  count: countProp,
  sortBy: sortByProp,
}: {
  count?: number
  sortBy?: SortOptions
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("Store.sort_bar")

  const isFiltering = useSyncExternalStore(
    subscribeStoreFilterLoading,
    getStoreFilterLoading,
    () => false
  )

  const cachedCount = useSyncExternalStore(
    subscribeStoreProductCount,
    getStoreProductCount,
    () => 0
  )

  const sortBy =
    sortByProp ??
    ((searchParams.get("sortBy") as SortOptions | null) || "created_at")

  const cols = (searchParams.get("cols") as "1" | "2" | null) || "2"

  const count = countProp ?? cachedCount

  const handleSortChange = (value: SortOptions) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sortBy", value)
    params.delete("page")
    navigateWithStoreLoading(router, `${pathname}?${params.toString()}`)
  }

  const handleColsChange = (value: "1" | "2") => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "2") {
      params.delete("cols")
    } else {
      params.set("cols", value)
    }
    navigateWithStoreLoading(router, `${pathname}?${params.toString()}`)
  }

  const sortOptions: { value: SortOptions; label: string }[] = [
    { value: "created_at", label: t("newest") },
    { value: "price_asc", label: t("price_asc") },
    { value: "price_desc", label: t("price_desc") },
  ]

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 mb-6 sm:mb-8 rounded-2xl bg-card border border-border/60 shadow-sm">
      <div className="flex items-center justify-between w-full sm:w-auto gap-3">
        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
          {t("showing")}{" "}
          <span
            className={`text-foreground transition-opacity ${
              isFiltering ? "opacity-50" : ""
            }`}
          >
            {count.toLocaleString()}
          </span>{" "}
          {t("products")}
        </p>

        {/* Mobile Grid Layout Switcher (2-col default vs 1-col) */}
        <div className="flex sm:hidden items-center p-0.5 bg-muted/60 rounded-xl border border-border/50 gap-0.5">
          <button
            type="button"
            onClick={() => handleColsChange("2")}
            aria-label={t("grid_2_cols")}
            title={t("grid_2_cols")}
            className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${
              cols === "2"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleColsChange("1")}
            aria-label={t("grid_1_col")}
            title={t("grid_1_col")}
            className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-200 ${
              cols === "1"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Rows3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSortChange(option.value)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border whitespace-nowrap ${
              sortBy === option.value
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "text-muted-foreground border-transparent hover:bg-muted"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function StoreListingToolbar() {
  return <SortBar />
}
