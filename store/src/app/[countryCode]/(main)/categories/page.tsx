import { Metadata } from "next"
import AllCategoriesTemplate from "@modules/categories/templates/all-categories"
import { getMessages } from "next-intl/server"
import { listCategories } from "@lib/data/categories"
import { getNavigation } from "@lib/data/navigation"

export async function generateMetadata(): Promise<Metadata> {
  const messages = (await getMessages()) as any
  return {
    title: messages.Layout?.nav?.categories || "Categories",
    description: "Explore all of our product categories.",
  }
}

export default async function CategoriesPage() {
  const [categories, navigationData] = await Promise.all([
    listCategories(),
    getNavigation("header").catch(() => []),
  ])

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      <AllCategoriesTemplate
        categories={categories}
        navigationData={navigationData}
      />
    </div>
  )
}
