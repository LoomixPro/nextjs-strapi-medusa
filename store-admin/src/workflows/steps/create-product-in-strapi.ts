import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { STRAPI_MODULE } from "../../modules/strapi"
import StrapiModuleService, { Collection } from "../../modules/strapi/service"

export type CreateProductInStrapiInput = {
  product: {
    id: string
    title: string
    subtitle?: string
    description?: string
    handle: string
    imageIds?: number[]
    thumbnailId?: number
    metadata?: Record<string, any>
  }
}

export const createProductInStrapiStep = createStep(
  "create-product-in-strapi",
  async ({ product }: CreateProductInStrapiInput, { container }) => {
    const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE)

    const productData = {
      medusaId: product.id,
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      // handle: product.handle,
      // images: product.imageIds || [],
      // thumbnail: product.thumbnailId,
    }

    // Create product in Strapi (creates in default locale)
    const strapiProduct = await strapiService.create(Collection.PRODUCTS, productData)

    try {
      // Get all available locales
      const locales = await strapiService.getLocales()
      const createdLocale = strapiProduct.data?.locale

      // Create localizations for all other languages
      for (const locale of locales) {
        if (locale.code && locale.code !== createdLocale && strapiProduct.data?.documentId) {
          let localizedProductData = { ...productData }
          
          // Use English metadata for English locales if available
          if ((locale.code === 'en' || locale.code === 'en-US') && product.metadata?.title_en) {
            localizedProductData.title = product.metadata.title_en as string
            localizedProductData.description = (product.metadata.desc_en as string) || product.description
          } else if ((locale.code === 'ar' || locale.code === 'ar-AE') && product.metadata?.title_ar) {
            localizedProductData.title = product.metadata.title_ar as string
            localizedProductData.description = (product.metadata.desc_ar as string) || (product.metadata.description_ar as string) || product.description
          }

          await strapiService.update(
            Collection.PRODUCTS,
            strapiProduct.data.documentId,
            localizedProductData,
            { locale: locale.code }
          )
        }
      }
    } catch (e) {
      strapiService.logger.warn(`Failed to create product localizations for ${product.id}: ${e}`)
    }

    return new StepResponse(
      strapiProduct.data,
      strapiProduct.data
    )
  },
  async (compensationData, { container }) => {
    if (!compensationData) {
      return
    }

    const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE)

    // Delete the product (all locales)
    await strapiService.delete(Collection.PRODUCTS, compensationData.documentId, { locale: '*' })
  }
)