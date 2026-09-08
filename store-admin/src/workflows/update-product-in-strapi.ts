import {
  createWorkflow,
  WorkflowResponse,
  when,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { UpdateProductInStrapiInput, updateProductInStrapiStep } from "./steps/update-product-in-strapi"
import { UploadImagesToStrapiInput, uploadImagesToStrapiStep } from "./steps/upload-images-to-strapi"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { createProductInStrapiWorkflow } from "./create-product-in-strapi"

export type UpdateProductInStrapiWorkflowInput = {
  id: string
}

export const updateProductInStrapiWorkflow = createWorkflow(
  "update-product-in-strapi",
  (input: UpdateProductInStrapiWorkflowInput) => {
    // Fetch the product with all necessary fields including metadata
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
      ],
      filters: {
        id: input.id,
      },
      options: {
        throwIfKeyNotFound: true,
      }
    })

    // If product doesn't exist in Strapi, create it
    const createResult = when({ products }, (data) => !data.products[0].metadata?.strapi_id).then(() => {
      return createProductInStrapiWorkflow.runAsStep({
        input: {
          id: input.id,
        }
      })
    })

    // For update path: upload images first
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

    // Upload thumbnail separately (not nested in when)
    const thumbnailItems = transform({ products: products as any }, (data) => {
      if (data.products[0].thumbnail) {
        return [{
          entity_id: data.products[0].id,
          url: data.products[0].thumbnail,
        }]
      }
      return []
    })

    const strapiProductThumbnail = uploadImagesToStrapiStep({
      items: thumbnailItems,
    }).config({ name: "upload-product-thumbnail-update" })

    const updateResult = when({ products }, (data) => !!data.products[0].metadata?.strapi_id).then(() => {
      // Prepare update data with images
      const productWithImages = transform(
        { strapiProductImages, strapiProductThumbnail, products: products as any },
        (data) => {
          return {
            id: data.products[0].id,
            title: data.products[0].title,
            subtitle: data.products[0].subtitle,
            description: data.products[0].description,
            handle: data.products[0].handle,
            imageIds: data.strapiProductImages.map((image) => image.image_id),
            thumbnailId: data.strapiProductThumbnail?.[0]?.image_id,
          }
        }
      )

      // Try to update the product in Strapi
      return updateProductInStrapiStep({
        product: productWithImages,
      } as UpdateProductInStrapiInput)
    })

    const result = transform({
      createResult,
      updateResult,
    }, (data) => {
      return data.createResult || data.updateResult
    })

    return new WorkflowResponse(result)
  }
)

