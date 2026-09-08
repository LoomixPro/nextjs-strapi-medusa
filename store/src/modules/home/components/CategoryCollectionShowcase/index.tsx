import { STYLES } from "./registry"
import type { CategoryCollectionBlock } from "@lib/data/homepage"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import BlockError from "../BlockRenderer/block-error"

interface CategoryCollectionShowcaseProps {
  block: CategoryCollectionBlock
}

function flattenCategories(categories: any[]): any[] {
  const flat: any[] = []
  function traverse(list: any[]) {
    if (!list || !Array.isArray(list)) return
    for (const cat of list) {
      flat.push(cat)
      if (cat.category_children && cat.category_children.length > 0) {
        traverse(cat.category_children)
      }
    }
  }
  traverse(categories)
  return flat
}

export default async function CategoryCollectionShowcase({
  block,
}: CategoryCollectionShowcaseProps) {
  const section = block.section
  if (!section) {
    return <BlockError error="No section data found for this block" />
  }

  // Hydrate items with localized category / collection data from Medusa
  let hydratedItems = section.items
  if (section.items && section.items.length > 0) {
    try {
      const hasCategories = section.items.some(
        (i) => i.__component === "category-collection.category-item"
      )
      const hasCollections = section.items.some(
        (i) => i.__component === "category-collection.collection-item"
      )

      const [medusaCategories, medusaCollectionsRes] = await Promise.all([
        hasCategories ? listCategories().catch(() => []) : Promise.resolve([]),
        hasCollections
          ? listCollections().catch(() => ({ collections: [] }))
          : Promise.resolve({ collections: [] }),
      ])

      const allCategories = flattenCategories(medusaCategories || [])
      const categoryMap = new Map<string, any>(
        allCategories.map((cat) => [cat.id, cat])
      )
      const categoryHandleMap = new Map<string, any>(
        allCategories.map((cat) => [cat.handle, cat])
      )

      const collections = medusaCollectionsRes?.collections || []
      const collectionMap = new Map<string, any>(
        collections.map((col) => [col.id, col])
      )
      const collectionHandleMap = new Map<string, any>(
        collections.map((col) => [col.handle, col])
      )

      hydratedItems = section.items.map((item) => {
        if (item.__component === "category-collection.category-item") {
          const medusaId = item.category?.medusaId
          const handle = item.category?.medusaHandle
          const matchedCategory =
            (medusaId ? categoryMap.get(medusaId) : null) ||
            (handle ? categoryHandleMap.get(handle) : null)

          if (matchedCategory) {
            return {
              ...item,
              category: {
                ...item.category,
                medusaId: matchedCategory.id,
                name: matchedCategory.name || item.category?.name || "",
                description:
                  matchedCategory.description ||
                  item.category?.description ||
                  "",
                medusaHandle:
                  matchedCategory.handle || item.category?.medusaHandle || "",
              },
            }
          }
        } else if (item.__component === "category-collection.collection-item") {
          const medusaId = item.collection?.medusaId
          const handle = item.collection?.medusaHandle
          const matchedCollection =
            (medusaId ? collectionMap.get(medusaId) : null) ||
            (handle ? collectionHandleMap.get(handle) : null)

          if (matchedCollection) {
            return {
              ...item,
              collection: {
                ...item.collection,
                medusaId: matchedCollection.id,
                title: matchedCollection.title || item.collection?.title || "",
                medusaHandle:
                  matchedCollection.handle ||
                  item.collection?.medusaHandle ||
                  "",
              },
            }
          }
        }
        return item
      })
    } catch (e) {
      console.error(
        "Failed to hydrate category/collection items from Medusa:",
        e
      )
    }
  }

  const hydratedSection = {
    ...section,
    items: hydratedItems,
  }

  const formattedStyle = hydratedSection.style
    ? hydratedSection.style
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
    : "style-1"

  const DynamicComponent = STYLES[formattedStyle] || STYLES["style-1"]

  if (!DynamicComponent) return null

  return (
    <div className="w-full">
      <DynamicComponent section={hydratedSection} />
    </div>
  )
}
