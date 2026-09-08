import type { StrapiClient } from "@strapi/client"
import { Logger } from "@medusajs/framework/types"
import { ModuleOptions } from "./loaders/init-client"
import { MedusaError } from "@medusajs/framework/utils"

type InjectedDependencies = {
    logger: Logger
    strapiClient: StrapiClient
}

export enum Collection {
    PRODUCTS = "products",
    CAMPAIGNS = "campaigns",
    COLLECTIONS = "collections",
    CATEGORIES = "categories",
    PRODUCT_OPTION_VALUES = "product-option-values",
}

export default class StrapiModuleService {
    protected readonly options_: ModuleOptions
    protected readonly logger_: any
    protected readonly client_: StrapiClient

    constructor(
        { logger, strapiClient }: InjectedDependencies,
        options: ModuleOptions
    ) {
        this.options_ = options
        this.logger_ = logger
        this.client_ = strapiClient
    }

    get logger() {
        return this.logger_
    }

    async formatStrapiError(error: any, context: string): Promise<string> {
        // Handle Strapi client HTTP response errors
        if (error?.response) {
            const response = error.response
            const parts = [context]

            if (response.status) {
                parts.push(`HTTP ${response.status}`)
            }

            if (response.statusText) {
                parts.push(response.statusText)
            }

            // Add request URL if available
            if (response.url) {
                parts.push(`URL: ${response.url}`)
            }

            // Add request method if available
            if (error.request?.method) {
                parts.push(`Method: ${error.request.method}`)
            }

            try {
                // Try to parse the response body for validation errors if it's a fetch Response
                if (typeof response.json === 'function') {
                    const body = await response.json()
                    if (body?.error) {
                        parts.push(`Details: ${JSON.stringify(body.error)}`)
                    }
                } else if (response.data) { // Axios response
                    parts.push(`Details: ${JSON.stringify(response.data.error || response.data)}`)
                }
            } catch (e) {
                // Ignore parsing errors
            }

            return parts.join(" - ")
        }

        // If error has a response with Strapi error structure
        if (error?.error) {
            const strapiError = error.error
            const parts = [context]

            if (strapiError.status) {
                parts.push(`Status ${strapiError.status}`)
            }

            if (strapiError.name) {
                parts.push(`[${strapiError.name}]`)
            }

            if (strapiError.message) {
                parts.push(strapiError.message)
            }

            if (strapiError.details && Object.keys(strapiError.details).length > 0) {
                parts.push(`Details: ${JSON.stringify(strapiError.details)}`)
            }

            return parts.join(" - ")
        }

        // Fallback for non-Strapi errors
        return `${context}: ${error.message || error}`
    }

    private buildValidatedUrl(imageUrl: string): string {
        try {
            // Minimal path validation
            if (imageUrl.includes('/../') || /\/%2e%2e\//i.test(imageUrl)) {
                throw new Error('Invalid path');
            }

            const url = new URL(imageUrl);

            // Protocol checks
            if (!['http:', 'https:'].includes(url.protocol)) {
                throw new Error('Invalid protocol');
            }

            const hostname = url.hostname.toLowerCase();

            // Check if host matches trusted storage endpoints (e.g. MinIO / S3 in Docker/LAN)
            const trustedHosts: string[] = ['minio', 'api.local', 'localhost', '127.0.0.1']
            const s3Url = process.env.S3_URL || process.env.MINIO_PUBLIC_URL || process.env.S3_ENDPOINT
            if (s3Url) {
                try {
                    trustedHosts.push(new URL(s3Url).hostname.toLowerCase())
                } catch {}
            }

            const isTrustedHost = trustedHosts.includes(hostname) || process.env.ALLOW_INTERNAL_IMAGE_URLS === 'true'

            // Block localhost and loopback (unless trusted storage)
            if (!isTrustedHost && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1')) {
                throw new Error('Invalid host');
            }

            // Block private IP ranges (unless trusted storage)
            if (!isTrustedHost && (hostname.match(/^10\./) || hostname.match(/^192\.168\./) || hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./) || hostname.match(/^169\.254\./))) {
                throw new Error('Invalid host');
            }

            // Block metadata endpoints
            if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
                throw new Error('Invalid host');
            }

            return url.href;
        } catch {
            throw new Error('Invalid URL');
        }
    }

    async uploadImages(imageUrls: string[]): Promise<number[]> {
        const uploadedIds: number[] = []

        for (const imageUrl of imageUrls) {
            try {
                // Validate and build secure URL
                const validatedUrl = this.buildValidatedUrl(imageUrl);

                // Fetch the image from the URL
                const imageResponse = await fetch(validatedUrl)
                if (!imageResponse.ok) {
                    this.logger_.warn(`Failed to fetch image: ${imageUrl}`)
                    continue
                }

                const imageBuffer = await imageResponse.arrayBuffer()

                // Extract filename from URL
                const urlParts = imageUrl.split("/")
                let filename = urlParts[urlParts.length - 1]

                // Get content type from response or infer from filename
                let contentType = imageResponse.headers.get("content-type")

                // If no content type, try to infer from filename extension
                if (!contentType || contentType === "application/octet-stream") {
                    if (filename.endsWith('.webp')) {
                        contentType = 'image/webp'
                    } else if (filename.endsWith('.png')) {
                        contentType = 'image/png'
                    } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
                        contentType = 'image/jpeg'
                    } else if (filename.endsWith('.gif')) {
                        contentType = 'image/gif'
                    } else {
                        contentType = 'image/jpeg' // fallback
                    }
                }

                // If filename doesn't have extension, add one based on content type
                if (!filename.includes('.')) {
                    const ext = contentType.split('/')[1] || 'jpg'
                    filename = `image-${Date.now()}.${ext}`
                }

                this.logger_.info(`Uploading image: ${filename} (${contentType})`)

                // Create a Blob from the buffer with correct content type
                const blob = new Blob([imageBuffer], { type: contentType })

                // Upload to Strapi using the files API
                const result = await this.client_.files.upload(blob, {
                    fileInfo: {
                        name: filename,
                    },
                })

                if (result && result[0] && result[0].id) {
                    uploadedIds.push(result[0].id)
                    this.logger_.info(`Successfully uploaded image ${filename} with ID: ${result[0].id}`)
                } else {
                    this.logger_.warn(`Upload succeeded but no ID returned for ${filename}`)
                }
            } catch (error) {
                this.logger_.error(await this.formatStrapiError(error, `Failed to upload image ${imageUrl}`))
                // Continue with next image instead of failing completely
            }
        }

        return uploadedIds
    }

    async deleteImage(imageId: number): Promise<void> {
        try {
            await this.client_.files.delete(imageId)
        } catch (error) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                await this.formatStrapiError(error, `Failed to delete image ${imageId} from Strapi`)
            )
        }
    }

    async create(collection: Collection, data: Record<string, unknown>, params?: Record<string, unknown>) {
        try {
            return await this.client_.collection(collection).create(data, params)
        } catch (error) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                await this.formatStrapiError(error, `Failed to create ${collection} in Strapi`)
            )
        }
    }

    async update(collection: Collection, id: string, data: Record<string, unknown>, params?: Record<string, unknown>) {
        try {
            return await this.client_.collection(collection).update(id, data, params)
        } catch (error) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                await this.formatStrapiError(error, `Failed to update ${collection} in Strapi`)
            )
        }
    }

    async delete(collection: Collection, id: string, params?: Record<string, unknown>) {
        try {
            return await this.client_.collection(collection).delete(id, params)
        } catch (error) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                await this.formatStrapiError(error, `Failed to delete ${collection} in Strapi`)
            )
        }
    }

    async getLocales() {
        try {
            const response = await fetch(`${this.options_.apiUrl}/i18n/locales`, {
                headers: {
                    'Authorization': `Bearer ${this.options_.apiToken}`,
                    'Content-Type': 'application/json'
                }
            })
            if (!response.ok) {
                this.logger_.warn(`Failed to fetch locales: ${response.statusText}`)
                return []
            }
            return await response.json()
        } catch (error) {
            this.logger_.error(await this.formatStrapiError(error, `Failed to get locales from Strapi`))
            return []
        }
    }

    async findByMedusaId(
        collection: Collection,
        medusaId: string,
        populate?: string[]
    ) {
        try {
            const result = await this.client_.collection(collection).find({
                filters: {
                    medusaId: {
                        $eq: medusaId,
                    },
                },
                populate,
            })

            return result.data[0]
        }
        catch (error) {
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                await this.formatStrapiError(error, `Failed to find ${collection} in Strapi`)
            )
        }
    }

    async list(filter: { product_id: string | string[] }) {
        const ids = Array.isArray(filter.product_id)
            ? filter.product_id
            : [filter.product_id]

        if (!ids || ids.length === 0) {
            return []
        }

        try {
            // Fetch all matching products in a single Strapi query with $in filter
            const result = await this.client_.collection("products").find({
                filters: {
                    medusaId: {
                        $in: ids,
                    },
                },
                populate: {
                    variants: {
                        populate: ["option_values"],
                    },
                    options: {
                        populate: ["values"],
                    },
                },
                pagination: {
                    limit: Math.max(ids.length, 100),
                },
            })

            const products = result.data || []
            return products.map((product) => ({
                ...product,
                id: `${product.id}`,
                product_id: product.medusaId,
                variants: (product.variants || []).map((variant) => ({
                    ...variant,
                    id: `${variant.id}`,
                    option_values: (variant.option_values || []).map((option_value) => ({
                        ...option_value,
                        id: `${option_value.id}`,
                    })),
                })),
                options: (product.options || []).map((option) => ({
                    ...option,
                    id: `${option.id}`,
                    values: (option.values || []).map((value) => ({
                        ...value,
                        id: `${value.id}`,
                    })),
                })),
            }))
        } catch (error) {
            this.logger_.warn(await this.formatStrapiError(error, `Failed to fetch products from Strapi`))
            return []
        }
    }

}