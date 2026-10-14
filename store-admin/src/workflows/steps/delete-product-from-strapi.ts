import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { STRAPI_MODULE } from "../../modules/strapi"
import StrapiModuleService, { Collection } from "../../modules/strapi/service"

export type DeleteProductFromStrapiInput = {
    id: string
}

export const deleteProductFromStrapiStep = createStep(
    "delete-product-from-strapi",
    async ({ id }: DeleteProductFromStrapiInput, { container }) => {
        const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE)

        // Find the Strapi product
        const strapiProduct = await strapiService.findByMedusaId(Collection.PRODUCTS, id)

        if (!strapiProduct) {
            return new StepResponse(void 0, null)
        }

        // Delete product from Strapi (all locales)
        await strapiService.delete(Collection.PRODUCTS, strapiProduct.documentId, { locale: '*' })

        return new StepResponse(
            void 0,
            strapiProduct
        )
    },
    async (deletedProduct: any, { container }) => {
        if (!deletedProduct) {
            return
        }

        const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE)

        await strapiService.create(Collection.PRODUCTS, {
            medusaId: deletedProduct.medusaId,
            title: deletedProduct.title,
            subtitle: deletedProduct.subtitle,
            description: deletedProduct.description,
            handle: deletedProduct.handle,
            images: deletedProduct.images || [],
            locale: deletedProduct.locale,
        })
    }
)
