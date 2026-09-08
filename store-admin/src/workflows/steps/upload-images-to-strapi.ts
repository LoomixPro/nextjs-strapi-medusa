import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { STRAPI_MODULE } from "../../modules/strapi"
import StrapiModuleService from "../../modules/strapi/service"
import { promiseAll, Modules } from "@medusajs/framework/utils"

export type UploadImagesToStrapiInput = {
  items: {
    entity_id: string
    url: string
  }[]
}

export const uploadImagesToStrapiStep = createStep(
  "upload-images-to-strapi",
  async ({ items }: UploadImagesToStrapiInput, { container }) => {
    const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE)
    strapiService.logger.info("Ignoring image upload to Strapi as requested.")
    return new StepResponse(
      [] as { entity_id: string; image_id: number }[],
      [] as { entity_id: string; image_id: number }[]
    )
  },
  async (compensationData, { container }) => {
    // No-op since no images were uploaded
  }
)
