import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { STRAPI_MODULE } from "../../modules/strapi"
import StrapiModuleService, { Collection } from "../../modules/strapi/service"

export type UpdateProductInStrapiInput = {
    product: {
        id: string
        title?: string
        subtitle?: string
        description?: string
        handle?: string
        imageIds?: number[]
        thumbnailId?: number
    }
}

export const updateProductInStrapiStep = createStep(
    "update-product-in-strapi",
    async ({ product }: UpdateProductInStrapiInput, { container }) => {
        const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE)

        // Fetch current Strapi product data for compensation
        const originalProduct = await strapiService.findByMedusaId(Collection.PRODUCTS, product.id)

        const updateData = {
            title: product.title,
            subtitle: product.subtitle,
            description: product.description,
            // handle: product.handle,
            // images: product.imageIds,
            // thumbnail: product.thumbnailId,
        }

        // Update product in Strapi (default locale)
        const updated = await strapiService.update(Collection.PRODUCTS, originalProduct.documentId, updateData)

        try {
            // Get all available locales
            const locales = await strapiService.getLocales()
            const updatedLocale = updated.data?.locale

            // Update localizations for all other languages
            for (const locale of locales) {
                if (locale.code && locale.code !== updatedLocale && updated.data?.documentId) {
                    await strapiService.update(
                        Collection.PRODUCTS,
                        updated.data.documentId,
                        updateData,
                        { locale: locale.code }
                    )
                }
            }
        } catch (e) {
            strapiService.logger.warn(`Failed to update product localizations for ${product.id}: ${e}`)
        }

        return new StepResponse(
            updated.data,
            originalProduct
        )
    },
    async (compensationData, { container }) => {
        if (!compensationData) {
            return
        }

        const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE)

        const compensationPayload = {
            title: compensationData.title,
            subtitle: compensationData.subtitle,
            description: compensationData.description,
            // handle: compensationData.handle,
            // images: compensationData.images,
            // thumbnail: compensationData.thumbnail,
        }

        await strapiService.update(Collection.PRODUCTS, compensationData.documentId, compensationPayload)
        
        try {
            const locales = await strapiService.getLocales()
            const updatedLocale = compensationData.locale

            for (const locale of locales) {
                if (locale.code && locale.code !== updatedLocale && compensationData.documentId) {
                    await strapiService.update(
                        Collection.PRODUCTS,
                        compensationData.documentId,
                        compensationPayload,
                        { locale: locale.code }
                    )
                }
            }
        } catch (e) {
            strapiService.logger.warn(`Failed to rollback product localizations for ${compensationData.medusaId}: ${e}`)
        }
    }
)
