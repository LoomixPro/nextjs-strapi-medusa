import {
    createWorkflow,
    WorkflowResponse,
    transform,
    when,
} from "@medusajs/framework/workflows-sdk"
import {
    CreateProductInStrapiInput,
    createProductInStrapiStep,
} from "./steps/create-product-in-strapi"
import { uploadImagesToStrapiStep } from "./steps/upload-images-to-strapi"
import {
    useQueryGraphStep,
    updateProductsWorkflow,
    acquireLockStep,
    releaseLockStep,
} from "@medusajs/medusa/core-flows"


export type CreateProductInStrapiWorkflowInput = {
    id: string
}

export const createProductInStrapiWorkflow = createWorkflow(
    "create-product-in-strapi",
    (input: CreateProductInStrapiWorkflowInput) => {
        acquireLockStep({
            key: ["strapi-product-create", input.id],
            timeout: 60,
        })
        const { data: products } = useQueryGraphStep({
            entity: "product",
            fields: [
                "id",
                "title",
                "subtitle",
                "description",
                "handle",
                "metadata",
                "images.url",
                "thumbnail",
                "variants.id",
                "options.id",
            ],
            filters: {
                id: input.id,
            },
            options: {
                throwIfKeyNotFound: true,
            },
        })

        const productImages = transform({ products: products as any }, (data) => {
            return data.products[0].images.map((image) => {
                return {
                    entity_id: data.products[0].id,
                    url: image.url,
                }
            })
        })

        const strapiProductImages = uploadImagesToStrapiStep({
            items: productImages,
        })

        const strapiProductThumbnail = when(
            ({ products: products as any }),
            // @ts-ignore
            (data) => !!data.products[0].thumbnail
        ).then(() => {
            return uploadImagesToStrapiStep({
                items: [{
                    entity_id: products[0].id,
                    url: products[0].thumbnail!,
                }],
            }).config({ name: "upload-product-thumbnail" })
        })

        const productWithImages = transform(
            { strapiProductImages, strapiProductThumbnail, products: products as any },
            (data) => {
                return {
                    id: data.products[0].id,
                    title: data.products[0].title,
                    subtitle: data.products[0].subtitle,
                    description: data.products[0].description,
                    handle: data.products[0].handle,
                    metadata: data.products[0].metadata,
                    imageIds: data.strapiProductImages.map((image) => image.image_id),
                    thumbnailId: data.strapiProductThumbnail?.[0]?.image_id,
                }
            }
        )

        const strapiProduct = createProductInStrapiStep({
            product: productWithImages,
        } as CreateProductInStrapiInput)

        const productMetadataUpdate = transform({ strapiProduct }, (data) => {
            return {
                selector: { id: data.strapiProduct.medusaId },
                update: {
                    metadata: {
                        strapi_id: data.strapiProduct.id,
                        strapi_document_id: data.strapiProduct.documentId,
                    },
                },
            }
        })

        updateProductsWorkflow.runAsStep({
            input: productMetadataUpdate,
        })

        releaseLockStep({
            key: ["strapi-product-create", input.id],
        })

        return new WorkflowResponse(strapiProduct)
    }
)