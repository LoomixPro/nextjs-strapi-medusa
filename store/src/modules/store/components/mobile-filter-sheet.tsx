"use client"

import { Button } from "@modules/common/components/shadcn/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@modules/common/components/shadcn/sheet"
import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"
import { FilterSidebar } from "./filter-sidebar"

import { StoreCampaign } from "@lib/data/campaigns"

interface ColorOption {
  name: string
  hex: string
}

interface MobileFilterSheetProps {
  categories?: HttpTypes.StoreProductCategory[]
  tags?: { id: string; value: string }[]
  availableColors?: ColorOption[]
  activeCampaigns?: StoreCampaign[]
  currencySymbol?: string
}

export function MobileFilterSheet({
  categories = [],
  tags = [],
  availableColors = [],
  activeCampaigns = [],
  currencySymbol,
}: MobileFilterSheetProps) {
  const t = useTranslations("Store.filter_sidebar")

  return (
    <div className="lg:hidden px-4 sm:px-0">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full gap-2 rounded-xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            {t("title")}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="p-0 border-none w-[300px]">
          <SheetHeader className="bg-background px-5 pt-5 pb-3">
            <SheetTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("title")}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {t("title")}
            </SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto overflow-x-hidden max-h-[calc(100vh-80px)] scrollbar-thin">
            <FilterSidebar
              categories={categories}
              tags={tags}
              availableColors={availableColors}
              activeCampaigns={activeCampaigns}
              currencySymbol={currencySymbol}
              hideHeader={true}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
