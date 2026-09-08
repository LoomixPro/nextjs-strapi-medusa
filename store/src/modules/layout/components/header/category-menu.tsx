"use client"

import React from "react"
import { ChevronDown } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@modules/common/components/shadcn/dropdown-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@modules/common/components/shadcn/accordion"
import { Button } from "@modules/common/components/shadcn/button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Category } from "./types"
import { isRtlLocale } from "@lib/util/is-rtl"

interface CategoryMenuProps {
  categories: Category[]
  mobile?: boolean
  isOpen?: boolean
  setIsOpen?: (isOpen: boolean) => void
  language?: string
  hideTitle?: boolean
}

export function CategoryMenu({
  categories,
  mobile = false,
  isOpen: _isOpen,
  setIsOpen,
  language,
  hideTitle = false,
}: CategoryMenuProps) {
  const t = useTranslations("Layout.nav")

  // Filter root categories
  const rootCategories = categories?.filter((c) => !c.parent_category) || []

  if (mobile) {
    return (
      <div className="w-full">
        {!hideTitle && (
          <div className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            {t("categories")}
          </div>
        )}
        <Accordion type="multiple" className="w-full">
          {rootCategories.map((category) => (
            <MobileCategoryItem
              key={category.id}
              category={category}
              setIsOpen={setIsOpen}
            />
          ))}
        </Accordion>
      </div>
    )
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-3 h-10"
        >
          {t("categories")}
          <ChevronDown size={18} className="opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isRtlLocale(language) ? "end" : "start"}
        className="w-56 bg-background border-border shadow-xl"
      >
        {rootCategories.map((category) => (
          <DesktopCategoryItem key={category.id} category={category} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DesktopCategoryItem({ category }: { category: Category }) {
  const hasChildren =
    category.category_children && category.category_children.length > 0

  if (hasChildren) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="text-sm cursor-pointer focus:bg-muted py-2">
          <span className="flex items-center justify-between w-full">
            {category.name}
          </span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="bg-background border-border shadow-xl ml-1">
          {category.category_children!.map((child) => (
            <DesktopCategoryItem key={child.id} category={child} />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    )
  }

  return (
    <DropdownMenuItem asChild>
      <LocalizedClientLink
        href={`/categories/${category.handle}`}
        className="text-sm cursor-pointer focus:bg-muted py-2 w-full block"
      >
        {category.name}
      </LocalizedClientLink>
    </DropdownMenuItem>
  )
}

function MobileCategoryItem({
  category,
  setIsOpen,
}: {
  category: Category
  setIsOpen?: (isOpen: boolean) => void
}) {
  const hasChildren =
    category.category_children && category.category_children.length > 0

  if (hasChildren) {
    return (
      <AccordionItem value={category.id} className="border-none">
        <AccordionTrigger className="py-2 px-3 text-sm font-medium hover:no-underline hover:bg-muted rounded-lg">
          {category.name}
        </AccordionTrigger>
        <AccordionContent className="pb-0 pl-4 rtl:pl-0 rtl:pr-4">
          <div className="flex flex-col gap-1 border-l rtl:border-l-0 rtl:border-r border-border pl-3 rtl:pl-0 rtl:pr-3 py-1">
            {category.category_children!.map((child) => (
              <MobileCategoryItem
                key={child.id}
                category={child}
                setIsOpen={setIsOpen}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    )
  }

  return (
    <LocalizedClientLink
      href={`/categories/${category.handle}`}
      onClick={() => setIsOpen?.(false)}
      className="flex items-center py-2 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
    >
      {category.name}
    </LocalizedClientLink>
  )
}
