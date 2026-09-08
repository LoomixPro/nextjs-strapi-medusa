import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { simpleHash, Modules } from "@medusajs/framework/utils"
import { 
  handleStrapiWebhookWorkflow, 
  WorkflowInput,
} from "../../../workflows/handle-strapi-webhook"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const body = req.body as Record<string, unknown>
  const logger = req.scope.resolve("logger")
  const cachingService = req.scope.resolve(Modules.CACHE)

  // Validate webhook secret if configured
  const expectedSecret =
    process.env.INTERNAL_API_SECRET || process.env.STRAPI_WEBHOOK_SECRET
  const providedSecret =
    (req.headers["x-webhook-secret"] as string) ||
    (req.headers["x-strapi-webhook-secret"] as string) ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : undefined)

  if (expectedSecret && providedSecret !== expectedSecret) {
    logger.warn(`Unauthorized Strapi webhook attempt: invalid secret`)
    res.status(401).json({ message: "Unauthorized: Invalid webhook secret" })
    return
  }
  
  // Generate a hash of the webhook payload to detect duplicates
  const payloadHash = simpleHash(JSON.stringify(body))
  const cacheKey = `strapi-webhook:${payloadHash}`
  
  // Check if we've already processed this webhook
  const alreadyProcessed = await cachingService.get(cacheKey)
  
  if (alreadyProcessed) {
    logger.debug(`Webhook already processed (hash: ${payloadHash}), skipping to prevent infinite loop`)
    res.status(200).send("OK - Already processed")
    return
  }
  
  if (body.event === "entry.update") {
    const entry = body.entry as Record<string, unknown>
    const entityCacheKey = `strapi-update:${body.model}:${entry.medusaId}`
    await cachingService.set(
      entityCacheKey,
      { status: "processing", timestamp: Date.now() },
      10
    )
    
    await handleStrapiWebhookWorkflow(req.scope).run({
      input: {
        entry: body,
      } as WorkflowInput,
    })
    
    // Cache the hash to prevent reprocessing (TTL: 60 seconds)
    await cachingService.set(
      cacheKey,
      { status: "processed", timestamp: Date.now() },
      60
    )
    logger.debug(`Webhook processed and cached (hash: ${payloadHash})`)
  }

  res.status(200).send("OK")
}