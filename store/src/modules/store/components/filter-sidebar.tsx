"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState, useRef } from "react"
import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"

import { Button } from "@modules/common/components/shadcn/button"
import { Switch } from "@modules/common/components/shadcn/switch"
import { Search, ChevronDown, Check, X } from "lucide-react"

import { StoreCampaign } from "@lib/data/campaigns"
import { navigateWithStoreLoading } from "./store-filter-loading"

interface ColorOption {
  name: string
  hex: string
}

interface FilterSidebarProps {
  categories?: HttpTypes.StoreProductCategory[]
  tags?: { id: string; value: string }[]
  availableColors?: ColorOption[]
  activeCampaigns?: StoreCampaign[]
  currencySymbol?: string
  hideHeader?: boolean
}

export function FilterSidebar({
  categories = [],
  tags = [],
  availableColors = [],
  activeCampaigns = [],
  currencySymbol = "",
  hideHeader = false,
}: FilterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations("Store.filter_sidebar")

  const pushFilters = (url: string) => navigateWithStoreLoading(router, url)

  const [minPrice, setMinPrice] = useState(searchParams.get("price_min") || "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("price_max") || "")

  const [onlyAvailable, setOnlyAvailable] = useState(
    searchParams.get("only_available") === "true"
  )
  const [onSale, setOnSale] = useState(searchParams.get("on_sale") === "true")
  const [colorSearch, setColorSearch] = useState("")
  const [showAllColors, setShowAllColors] = useState(false)

  useEffect(() => {
    setMinPrice(searchParams.get("price_min") || "")
    setMaxPrice(searchParams.get("price_max") || "")
    setOnlyAvailable(searchParams.get("only_available") === "true")
    setOnSale(searchParams.get("on_sale") === "true")
  }, [searchParams])

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString())

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === "") {
          newSearchParams.delete(key)
        } else {
          newSearchParams.set(key, value)
        }
      })

      return newSearchParams.toString()
    },
    [searchParams]
  )

  const updateFilters = (params: Record<string, string | null>) => {
    const queryString = createQueryString({ ...params, page: null })
    pushFilters(`${pathname}?${queryString}`)
  }

  const handlePriceApply = () => {
    updateFilters({
      price_min: minPrice.trim() ? minPrice.trim() : null,
      price_max: maxPrice.trim() ? maxPrice.trim() : null,
    })
  }

  const toggleCategory = (categoryId: string) => {
    const currentCategories = searchParams.getAll("category_id")
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter((c) => c !== categoryId)
      : [...currentCategories, categoryId]

    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete("category_id")
    newSearchParams.delete("page")
    newCategories.forEach((cat) => newSearchParams.append("category_id", cat))

    pushFilters(`${pathname}?${newSearchParams.toString()}`)
  }

  const toggleTag = (tagId: string) => {
    const currentTags = searchParams.getAll("tag_id")
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId]

    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete("tag_id")
    newSearchParams.delete("page")
    newTags.forEach((tag) => newSearchParams.append("tag_id", tag))

    pushFilters(`${pathname}?${newSearchParams.toString()}`)
  }

  const toggleColor = (colorName: string) => {
    const currentColors =
      searchParams.get("color")?.split(",").filter(Boolean) ?? []
    const newColors = currentColors.includes(colorName)
      ? currentColors.filter((c) => c !== colorName)
      : [...currentColors, colorName]

    updateFilters({
      color: newColors.length > 0 ? newColors.join(",") : null,
    })
  }

  const handleAvailabilityChange = (checked: boolean) => {
    setOnlyAvailable(checked)
    updateFilters({ only_available: checked ? "true" : null })
  }

  const handleOnSaleChange = (checked: boolean) => {
    setOnSale(checked)
    updateFilters({ on_sale: checked ? "true" : null })
  }

  const toggleCampaign = (campaignId: string) => {
    const currentCampaigns = searchParams.getAll("campaign_id")
    const newCampaigns = currentCampaigns.includes(campaignId)
      ? currentCampaigns.filter((c) => c !== campaignId)
      : [...currentCampaigns, campaignId]

    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete("campaign_id")
    newSearchParams.delete("page")
    newCampaigns.forEach((camp) => newSearchParams.append("campaign_id", camp))

    pushFilters(`${pathname}?${newSearchParams.toString()}`)
  }

  const resetFilters = () => {
    pushFilters(pathname)
  }

  const currentCategories = searchParams.getAll("category_id")
  const currentTags = searchParams.getAll("tag_id")
  const currentCampaigns = searchParams.getAll("campaign_id")
  const currentColors =
    searchParams.get("color")?.split(",").filter(Boolean) ?? []

  const hasActiveFilters =
    currentCategories.length > 0 ||
    currentTags.length > 0 ||
    currentCampaigns.length > 0 ||
    currentColors.length > 0 ||
    Boolean(searchParams.get("price_min")) ||
    Boolean(searchParams.get("price_max")) ||
    onlyAvailable ||
    onSale

  return (
    <div
      className={
        hideHeader
          ? "p-1 w-full max-w-full overflow-x-hidden"
          : "p-6 rounded-xl bg-card border border-border/50 sticky top-28 w-full max-w-full overflow-x-hidden"
      }
    >
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/40">
          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground rtl:text-right">
            {t("title")}
          </h3>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-[10px] uppercase font-bold text-destructive hover:text-destructive/80 transition-colors"
            >
              {t("clear")}
            </button>
          )}
        </div>
      )}

      {/* Active Campaigns — Multi-select Search */}
      {activeCampaigns.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 rtl:text-right">
            {t("active_campaigns")}
          </p>
          <SearchableMultiSelect
            options={activeCampaigns.map((c) => ({ id: c.id, label: c.name }))}
            selectedValues={currentCampaigns}
            onToggle={toggleCampaign}
            placeholder={t("select_campaign")}
          />
          {currentCampaigns.length > 0 && (
            <div className="mt-3 space-y-2">
              {currentCampaigns.map((cId) => {
                const camp = activeCampaigns.find((c) => c.id === cId)
                if (!camp) return null
                const codes =
                  camp.promotions?.map((p) => p.code).filter(Boolean) ?? []
                if (!codes.length) return null
                return (
                  <div
                    key={camp.id}
                    className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs flex flex-col gap-1.5"
                  >
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                      {t("discount_code", { name: camp.name })}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {codes.map((code) => (
                        <span
                          key={code}
                          className="px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-mono font-black text-xs tracking-wider select-all"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Categories — Multi-select Search */}
      {categories.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 rtl:text-right">
            {t("categories")}
          </p>
          <SearchableMultiSelect
            options={categories.map((c) => ({ id: c.id, label: c.name }))}
            selectedValues={currentCategories}
            onToggle={toggleCategory}
            placeholder={t("categories")}
          />
        </div>
      )}

      {/* Tags — Multi-select Search */}
      {tags.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 rtl:text-right">
            {t("tags")}
          </p>
          <SearchableMultiSelect
            options={tags.map((t) => ({ id: t.id, label: t.value }))}
            selectedValues={currentTags}
            onToggle={toggleTag}
            placeholder={t("tags")}
          />
        </div>
      )}

      {/* Color Swatches */}
      {availableColors.length > 0 &&
        (() => {
          const filteredColors = availableColors.filter((c) =>
            c.name.toLowerCase().includes(colorSearch.toLowerCase().trim())
          )

          // Prioritize currently active colors to always show them first
          const sortedColors = [...filteredColors].sort((a, b) => {
            const aActive = currentColors.includes(a.name) ? 1 : 0
            const bActive = currentColors.includes(b.name) ? 1 : 0
            return bActive - aActive
          })

          const INITIAL_LIMIT = 12
          const isSearching = Boolean(colorSearch.trim())
          const displayedColors =
            isSearching || showAllColors || sortedColors.length <= INITIAL_LIMIT
              ? sortedColors
              : sortedColors.slice(0, INITIAL_LIMIT)

          const remainingCount = sortedColors.length - INITIAL_LIMIT

          return (
            <div className="mb-8 pt-6 border-t border-border/40">
              {/* Color Filter Header */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground rtl:text-right flex items-center gap-1.5">
                  <span>{t("colors")}</span>
                  {currentColors.length > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full text-[9px] font-extrabold bg-primary/15 text-primary">
                      {currentColors.length}
                    </span>
                  )}
                </p>
                {currentColors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => updateFilters({ color: null })}
                    className="text-[10px] font-semibold text-muted-foreground hover:text-destructive transition-colors"
                  >
                    {t("clear")}
                  </button>
                )}
              </div>

              {/* Selected Color Badges */}
              {currentColors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {currentColors.map((colorName) => {
                    const matched = availableColors.find(
                      (c) => c.name.toLowerCase() === colorName.toLowerCase()
                    )
                    const hex = matched?.hex || "#888888"
                    return (
                      <span
                        key={colorName}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/80 border border-border/60 text-[10px] font-bold text-foreground animate-in fade-in"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/15 dark:border-white/15 shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="truncate max-w-[90px]">
                          {colorName}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleColor(colorName)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={`Remove ${colorName}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Quick Search for Colors (only shown if there are > 8 colors) */}
              {availableColors.length > 8 && (
                <div className="relative mb-3">
                  <Search className="w-3.5 h-3.5 text-muted-foreground/60 absolute left-2.5 rtl:left-auto rtl:right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={t("search_colors")}
                    value={colorSearch}
                    onChange={(e) => setColorSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-7 rtl:pl-7 rtl:pr-8 text-xs rounded-lg bg-muted/30 border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/50"
                  />
                  {colorSearch && (
                    <button
                      type="button"
                      onClick={() => setColorSearch("")}
                      className="absolute right-2 rtl:right-auto rtl:left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Swatches Container */}
              {displayedColors.length > 0 ? (
                <div
                  className={`flex flex-wrap gap-2 p-0.5 w-full max-w-full overflow-x-hidden ${
                    showAllColors && sortedColors.length > 15
                      ? "max-h-44 overflow-y-auto overflow-x-hidden scrollbar-thin pr-1 rtl:pr-0 rtl:pl-1"
                      : ""
                  }`}
                >
                  {displayedColors.map((color) => {
                    const isActive = currentColors.includes(color.name)
                    const isLight = isLightColor(color.hex)
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => toggleColor(color.name)}
                        title={color.name}
                        aria-label={color.name}
                        className={`relative w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full border transition-all duration-150 group flex items-center justify-center shrink-0 ${
                          isActive
                            ? "border-primary ring-2 ring-primary ring-offset-1 scale-105 shadow-xs"
                            : "border-black/10 dark:border-white/10 ring-1 ring-inset ring-neutral-300/60 dark:ring-neutral-700 hover:ring-neutral-400 hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {isActive && (
                          <Check
                            className="w-3.5 h-3.5 drop-shadow-xs"
                            stroke={isLight ? "#000" : "#fff"}
                            strokeWidth={3}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-xs text-muted-foreground/60 py-2">
                  {t("no_results")}
                </p>
              )}

              {/* Expand / Collapse Button (When > 10 colors and not searching) */}
              {!isSearching && sortedColors.length > INITIAL_LIMIT && (
                <button
                  type="button"
                  onClick={() => setShowAllColors(!showAllColors)}
                  className="mt-3 text-[11px] font-bold text-primary hover:text-primary/80 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors"
                >
                  <span>
                    {showAllColors
                      ? t("show_less_colors")
                      : t("show_more_colors", { count: remainingCount })}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      showAllColors ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}
            </div>
          )
        })()}

      {/* Price Range — Direct Min / Max Inputs */}
      <div className="mb-8 pt-6 border-t border-border/40">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 rtl:text-right">
          {currencySymbol
            ? t("price_range", { currency: currencySymbol })
            : t("title")}
        </p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">
                {t("from_price")}
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
                className="w-full px-3 py-2 text-xs rounded-xl bg-muted/40 border border-border/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">
                {t("to_price")}
              </label>
              <input
                type="number"
                min="0"
                placeholder="—"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
                className="w-full px-3 py-2 text-xs rounded-xl bg-muted/40 border border-border/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePriceApply}
            className="w-full h-8 text-xs font-semibold rounded-xl border-border/60 hover:bg-primary hover:text-primary-foreground transition-all"
          >
            {t("apply_price")}
          </Button>
        </div>
      </div>

      {/* Availability & Discounts */}
      <div className="mb-8 pt-6 border-t border-border/40 space-y-4">
        <div className="flex items-center justify-between">
          <label
            htmlFor="availability-filter"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer rtl:text-right"
          >
            {t("only_available")}
          </label>
          <Switch
            id="availability-filter"
            checked={onlyAvailable}
            onCheckedChange={handleAvailabilityChange}
            className="data-[state=checked]:bg-foreground scale-90"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/20">
          <label
            htmlFor="on-sale-filter"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer rtl:text-right"
          >
            {t("only_discounted")}
          </label>
          <Switch
            id="on-sale-filter"
            checked={onSale}
            onCheckedChange={handleOnSaleChange}
            className="data-[state=checked]:bg-foreground scale-90"
          />
        </div>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          onClick={resetFilters}
          variant="secondary"
          className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-muted hover:bg-muted/80 text-foreground transition-colors"
        >
          {t("clear_filters")}
        </Button>
      )}
    </div>
  )
}

/** Helper to determine if a hex color is light (for checkmark contrast) */
function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "")
  if (c.length !== 6) return false
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155
}

function SearchableMultiSelect({
  options,
  selectedValues,
  onToggle,
  placeholder = "Select...",
}: {
  options: { id: string; label: string }[]
  selectedValues: string[]
  onToggle: (id: string) => void
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const t = useTranslations("Store.filter_sidebar")

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[44px] w-full bg-background border border-border/50 rounded-xl p-2 flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
      >
        <div className="flex flex-wrap gap-1.5 flex-1 items-center rtl:space-x-reverse">
          {selectedValues.length === 0 && (
            <span className="text-muted-foreground/60 text-xs px-2 font-medium">
              {placeholder}
            </span>
          )}
          {selectedValues.map((val) => {
            const label = options.find((o) => o.id === val)?.label || val
            return (
              <span
                key={val}
                className="bg-foreground text-background text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle(val)
                }}
              >
                {label}
                <X className="w-3 h-3 cursor-pointer opacity-70 hover:opacity-100" />
              </span>
            )
          })}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground ml-2 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-lg z-50 overflow-hidden flex flex-col max-h-60 animate-in fade-in slide-in-from-top-2">
          <div className="p-2.5 border-b border-border/30 flex items-center gap-2.5 bg-muted/20">
            <Search className="w-4 h-4 text-muted-foreground/60" />
            <input
              className="bg-transparent border-none outline-none text-xs w-full text-foreground placeholder:text-muted-foreground/50"
              placeholder={t("search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto overflow-x-hidden flex-1 p-1.5 scrollbar-thin">
            {filteredOptions.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground/60">
                {t("no_results")}
              </div>
            )}
            {filteredOptions.map((opt) => {
              const isSelected = selectedValues.includes(opt.id)
              return (
                <div
                  key={opt.id}
                  onClick={() => onToggle(opt.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-colors mb-0.5 ${
                    isSelected
                      ? "bg-primary/10 text-primary font-bold"
                      : "hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
