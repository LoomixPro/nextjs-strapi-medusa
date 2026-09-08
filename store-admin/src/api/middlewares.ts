import {
  defineMiddlewares,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  validateAndTransformBody,
  validateAndTransformQuery,
  authenticate,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  PostStoreCreateWishlistItem,
} from "./store/customers/me/wishlists/items/validators"
import { PostStoreReviewSchema } from "./store/reviews/route"
import { PostStoreReviewReactionSchema } from "./store/reviews/[id]/reactions/route"
import { GetAdminReviewsSchema } from "./admin/reviews/route"
import { PostAdminUpdateReviewsStatusSchema } from "./admin/reviews/status/route"
import { PostAdminDeleteReviewsSchema } from "./admin/reviews/delete/route"
import { GetStoreReviewsSchema } from "./store/products/[id]/reviews/route"
import { PostStoreQuestionSchema } from "./store/questions/route"
import { GetStoreQuestionsSchema } from "./store/products/[id]/questions/route"
import { GetAdminQuestionsSchema } from "./admin/questions/route"
import { PostAdminUpdateQuestionsStatusSchema } from "./admin/questions/status/route"
import { PostAdminDeleteQuestionsSchema } from "./admin/questions/delete/route"
import { PostAdminAnswerQuestionSchema } from "./admin/questions/[id]/route"
import { createRateLimitMiddleware } from "./middleware/rate-limiter"

/**
 * Helper function to emit product update events for cache invalidation
 * This triggers Medusa's automatic event-driven cache invalidation system
 */
async function invalidateCategoryProductCache(
  categoryId: string,
  productService: any,
  eventBus: any,
  logger: any
) {
  logger.info(`[Cache] Starting event-based cache invalidation for category: ${categoryId}`)

  try {
    // Get category with its products using relations
    const category = await productService.retrieveProductCategory(categoryId, {
      relations: ["products"]
    })

    if (!category || !category.products || category.products.length === 0) {
      logger.info(`[Cache] No products found in category ${categoryId}`)
      return
    }

    // Emit product.updated events for each product
    // This triggers Medusa's automatic cache invalidation
    for (const product of category.products) {
      await eventBus.emit({
        name: "product.updated",
        data: { id: product.id },
      })
    }

    logger.info(`[Cache] Emitted product.updated events for ${category.products.length} products`)

  } catch (error: any) {
    logger.error(`[Cache] Failed to emit events: ${error.message}`)
    logger.error(error.stack)
  }
}



export default defineMiddlewares({
  routes: [
    // ═══════════════════════════════════════════════════════════════════════
    // AUTH RATE LIMITING
    // These protect against brute-force and enumeration attacks on the
    // Medusa auth API regardless of which client calls them.
    //
    // countOn strategy:
    //   'success' → only increment when the OTP was actually sent (2xx).
    //               Prevents penalising registration step-1 failures (401)
    //               where the user didn't exist yet.
    //   'failure' → only increment on wrong code / wrong password (4xx).
    //               Allows successful logins without consuming the counter.
    // ═══════════════════════════════════════════════════════════════════════

    // ── OTP request: phone (POST /auth/customer/phone-auth) ───────────────
    // Triggers SMS OTP. Only count when OTP was actually sent (2xx).
    // A 401 here means "user doesn't exist yet" — not an abuse signal.
    {
      method: "POST",
      matcher: "/auth/customer/phone-auth",
      middlewares: [
        createRateLimitMiddleware({
          maxAttempts: 3,
          windowMs: 60 * 60 * 1000, // 1 hour
          countOn: "success",        // only count actual OTP sends
          message: "Too many OTP requests. Please try again later.",
        }),
      ],
    },
    // ── OTP register: phone ───────────────────────────────────────────────
    {
      method: "POST",
      matcher: "/auth/customer/phone-auth/register",
      middlewares: [
        createRateLimitMiddleware({
          maxAttempts: 3,
          windowMs: 60 * 60 * 1000,
          countOn: "success",        // only count successful registrations
          message: "Too many registration attempts. Please try again later.",
        }),
      ],
    },
    // ── OTP verify: phone (POST /auth/customer/phone-auth/callback) ───────
    // Count ONLY failed verifications (wrong code). A correct code doesn't
    // need to be penalised.
    {
      method: "POST",
      matcher: "/auth/customer/phone-auth/callback",
      middlewares: [
        createRateLimitMiddleware({
          maxAttempts: 10,
          windowMs: 30 * 60 * 1000, // 30 minutes
          lockoutMs: 30 * 60 * 1000, // 30-minute lockout
          countOn: "failure",        // only count wrong codes
          message: "Too many incorrect attempts. Please request a new code.",
        }),
      ],
    },
    // ── OTP request: email (POST /auth/customer/email-otp) ────────────────
    {
      method: "POST",
      matcher: "/auth/customer/email-otp",
      middlewares: [
        createRateLimitMiddleware({
          maxAttempts: 5,
          windowMs: 60 * 60 * 1000,
          countOn: "success",        // only count actual OTP sends
          message: "Too many OTP requests. Please try again later.",
        }),
      ],
    },
    // ── OTP register: email ───────────────────────────────────────────────
    {
      method: "POST",
      matcher: "/auth/customer/email-otp/register",
      middlewares: [
        createRateLimitMiddleware({
          maxAttempts: 5,
          windowMs: 60 * 60 * 1000,
          countOn: "success",
          message: "Too many registration attempts. Please try again later.",
        }),
      ],
    },
    // ── OTP verify: email (POST /auth/customer/email-otp/callback) ────────
    {
      method: "POST",
      matcher: "/auth/customer/email-otp/callback",
      middlewares: [
        createRateLimitMiddleware({
          maxAttempts: 10,
          windowMs: 30 * 60 * 1000,
          lockoutMs: 30 * 60 * 1000,
          countOn: "failure",        // only count wrong codes
          message: "Too many incorrect attempts. Please request a new code.",
        }),
      ],
    },
    // ── Password login: (POST /auth/customer/emailpass) ───────────────────
    // Count only failed logins. Successful login doesn't consume the counter.
    {
      method: "POST",
      matcher: "/auth/customer/emailpass",
      middlewares: [
        createRateLimitMiddleware({
          maxAttempts: 10,
          windowMs: 15 * 60 * 1000, // 15 minutes
          lockoutMs: 15 * 60 * 1000, // 15-minute lockout
          countOn: "failure",        // only count failed logins
          message: "Too many failed login attempts. Please try again later.",
        }),
      ],
    },

    // ── Profile Phone Update: Request OTP ──────────────────────────────────
    {
      method: "POST",
      matcher: "/store/customers/me/phone-update/request",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        createRateLimitMiddleware({
          maxAttempts: 3,
          windowMs: 60 * 60 * 1000, // 1 hour
          countOn: "success",
          message: "Too many OTP requests. Please try again later.",
        }),
      ],
    },
    // ── Profile Phone Update: Verify OTP ───────────────────────────────────
    {
      method: "POST",
      matcher: "/store/customers/me/phone-update/verify",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        createRateLimitMiddleware({
          maxAttempts: 10,
          windowMs: 30 * 60 * 1000, // 30 minutes
          countOn: "failure",
          message: "Too many incorrect attempts. Please try again later.",
        }),
      ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    // AUTH LOCALE CAPTURE
    // Intercepts auth endpoints to store the user's requested locale in Redis.
    // ═══════════════════════════════════════════════════════════════════════
    {
      method: "POST",
      matcher: "/auth/*",
      middlewares: [
        async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
          try {
            const logger = req.scope.resolve("logger")
            const locale = req.headers["x-locale"] || req.headers["accept-language"]?.split(',')[0] || "fa"
            
            // Try to find identifier in body
            const body = req.body as any
            const identifier = body?.email || body?.actor_id || body?.phone
            
            if (identifier) {
              const cacheService = req.scope.resolve(Modules.CACHE)
              // Save for 15 minutes (900 seconds)
              await cacheService.set(`auth_locale_${identifier.toLowerCase()}`, locale.toString().toLowerCase(), 900)
              logger.info(`[Auth Locale] Saved locale '${locale}' for identifier '${identifier}'`)
            }
          } catch (error: any) {
            // Do not block auth request if this fails
            req.scope.resolve("logger").warn(`[Auth Locale] Failed to store locale: ${error.message}`)
          }
          next()
        }
      ]
    },

    // ═══════════════════════════════════════════════════════════════════════
    // EXISTING MIDDLEWARES
    // ═══════════════════════════════════════════════════════════════════════
    {
      matcher: "/webhooks/strapi",
      middlewares: [
        // ... (existing strapi webhook middleware)
        async (
          req: MedusaRequest,
          res: MedusaResponse,
          next: MedusaNextFunction
        ) => {
          const apiKeyModuleService = req.scope.resolve(
            Modules.API_KEY
          )

          const authHeader = req.headers["authorization"]
          const apiKey = authHeader?.replace("Bearer ", "")

          if (!apiKey) {
            return res.status(401).json({
              message: "Unauthorized: Missing API key",
            })
          }

          try {
            const isValid = await apiKeyModuleService.authenticate(apiKey)
            if (!isValid) {
              return res.status(401).json({
                message: "Unauthorized: Invalid API key",
              })
            }
            next()
          } catch (error) {
            return res.status(401).json({
              message: "Unauthorized: API key authentication failed",
            })
          }
        },
      ],
    },
    {
      method: "POST",
      matcher: "/admin/products/:id/variants/:variant_id/images/batch",
      middlewares: [
        async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
          const { variant_id } = req.params
          const eventBus = req.scope.resolve("event_bus")
          const logger = req.scope.resolve("logger")

          res.on("finish", async () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              logger.info(`[Middleware] Successful image batch update for variant: ${variant_id}. Emitting manual update event.`)

              await eventBus.emit({
                name: "product-variant.updated",
                data: { id: variant_id },
              })
            }
          })

          next()
        },
      ],
    },
    {
      method: "POST",
      matcher: "/admin/product-categories/:id/products",
      middlewares: [
        async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
          const { id } = req.params
          const logger = req.scope.resolve("logger")
          const productService = req.scope.resolve(Modules.PRODUCT)

          logger.info(`[Middleware] Entering product-categories product link middleware for category: ${id}`)

          res.on("finish", async () => {
            logger.info(`[Middleware] Response finished with status: ${res.statusCode}`)
            if (res.statusCode >= 200 && res.statusCode < 300) {
              logger.info(`[Middleware] Products linked to category: ${id}. Triggering path revalidation and internal cache invalidation.`)

              const STOREFRONT_URL = process.env.STOREFRONT_URL
              const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET
              const DEFAULT_COUNTRY_CODE = (
                process.env.DEFAULT_REGION ||
                process.env.DEFAULT_COUNTRY_CODE ||
                "us"
              ).toLowerCase()

              if (!STOREFRONT_URL || !REVALIDATE_SECRET) {
                logger.warn("[Middleware] Missing STOREFRONT_URL or REVALIDATE_SECRET")
                return
              }

              try {
                // 1. Emit product.updated events for cache invalidation
                const eventBus = req.scope.resolve("event_bus")
                await invalidateCategoryProductCache(id, productService, eventBus, logger)

                // 2. Trigger Storefront Revalidation
                // Get category handle to build path
                const category = await productService.retrieveProductCategory(id, {
                  select: ["id", "handle"]
                })
                if (!category) {
                  logger.warn(`[Middleware] Category not found: ${id}`)
                  return
                }

                // Only revalidate the specific category path
                const categoryPath = `/${DEFAULT_COUNTRY_CODE}/categories/${category.handle}`
                logger.info(`[Middleware] Revalidating path: ${categoryPath}`)

                const revalidateUrl = `${STOREFRONT_URL}/api/revalidate?secret=${REVALIDATE_SECRET}`
                const response = await fetch(revalidateUrl, {
                  method: "POST",
                  body: JSON.stringify({ paths: [categoryPath] }),
                  headers: { "Content-Type": "application/json" }
                })

                if (!response.ok) {
                  const err = await response.text()
                  logger.error(`[Middleware] Revalidation failed: ${response.status} - ${err}`)
                } else {
                  logger.info("[Middleware] Revalidation successful")
                }
              } catch (error) {
                logger.error(`[Middleware] Revalidation error: ${error.message}`)
                logger.error(error.stack)
              }
            }
          })

          next()
        },
      ],
    },
    {
      method: "DELETE",
      matcher: "/admin/product-categories/:id/products",
      middlewares: [
        async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
          const { id } = req.params
          const logger = req.scope.resolve("logger")
          const productService = req.scope.resolve(Modules.PRODUCT)

          logger.info(`[Middleware] Entering product-categories product unlink middleware for category: ${id}`)

          res.on("finish", async () => {
            logger.info(`[Middleware] Response finished with status: ${res.statusCode}`)
            if (res.statusCode >= 200 && res.statusCode < 300) {
              logger.info(`[Middleware] Products unlinked from category: ${id}. Triggering path revalidation and internal cache invalidation.`)

              const STOREFRONT_URL = process.env.STOREFRONT_URL
              const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET
              const DEFAULT_COUNTRY_CODE = (
                process.env.DEFAULT_REGION ||
                process.env.DEFAULT_COUNTRY_CODE ||
                "us"
              ).toLowerCase()

              if (!STOREFRONT_URL || !REVALIDATE_SECRET) {
                logger.warn("[Middleware] Missing STOREFRONT_URL or REVALIDATE_SECRET")
                return
              }

              try {
                // 1. Emit product.updated events for cache invalidation (same logic as POST)
                const eventBus = req.scope.resolve("event_bus")
                await invalidateCategoryProductCache(id, productService, eventBus, logger)

                // 2. Trigger Storefront Revalidation
                const category = await productService.retrieveProductCategory(id, {
                  select: ["id", "handle"]
                })
                if (!category) {
                  logger.warn(`[Middleware] Category not found: ${id}`)
                  return
                }

                const categoryPath = `/${DEFAULT_COUNTRY_CODE}/categories/${category.handle}`
                logger.info(`[Middleware] Revalidating path: ${categoryPath}`)

                const revalidateUrl = `${STOREFRONT_URL}/api/revalidate?secret=${REVALIDATE_SECRET}`
                const response = await fetch(revalidateUrl, {
                  method: "POST",
                  body: JSON.stringify({ paths: [categoryPath] }),
                  headers: { "Content-Type": "application/json" }
                })

                if (!response.ok) {
                  const err = await response.text()
                  logger.error(`[Middleware] Revalidation failed: ${response.status} - ${err}`)
                } else {
                  logger.info("[Middleware] Revalidation successful")
                }
              } catch (error) {
                logger.error(`[Middleware] Revalidation error: ${error.message}`)
                logger.error(error.stack)
              }
            }
          })

          next()
        },
      ],
    },
    {
      method: "POST",
      matcher: "/store/customers/me/wishlists/items",
      middlewares: [
        validateAndTransformBody(PostStoreCreateWishlistItem),
      ],
    },
    {
      method: ["POST"],
      matcher: "/store/reviews",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformBody(PostStoreReviewSchema),
      ],
    },
    {
      method: ["POST"],
      matcher: "/store/reviews/:id/reactions",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformBody(PostStoreReviewReactionSchema),
      ],
    },
    {
      matcher: "/admin/reviews",
      method: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetAdminReviewsSchema, {
          isList: true,
          defaults: [
            "id",
            "title",
            "content",
            "rating",
            "product_id",
            "customer_id",
            "status",
            "created_at",
            "updated_at",
            "product.*",
          ],
        }),
      ],
    },
    {
      matcher: "/admin/reviews/status",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(PostAdminUpdateReviewsStatusSchema),
      ],
    },
    {
      matcher: "/admin/reviews/delete",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(PostAdminDeleteReviewsSchema),
      ],
    },
    {
      matcher: "/store/products/:id/reviews",
      method: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetStoreReviewsSchema, {
          isList: true,
          defaults: [
            "id",
            "rating",
            "title",
            "first_name",
            "last_name",
            "content",
            "like_count",
            "dislike_count",
            "is_verified_buyer",
            "created_at",
          ],
          allowed: [
            "id",
            "rating",
            "title",
            "first_name",
            "last_name",
            "content",
            "like_count",
            "dislike_count",
            "is_verified_buyer",
            "created_at",
          ],
        }),
      ],
    },
    {
      method: ["POST"],
      matcher: "/store/questions",
      middlewares: [
        validateAndTransformBody(PostStoreQuestionSchema),
      ],
    },
    {
      matcher: "/store/products/:id/questions",
      method: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetStoreQuestionsSchema, {
          isList: true,
          defaults: [
            "id",
            "name",
            "question_text",
            "answer_text",
            "status",
            "created_at",
          ],
        }),
      ],
    },
    {
      matcher: "/admin/questions",
      method: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetAdminQuestionsSchema, {
          isList: true,
          defaults: [
            "id",
            "name",
            "email",
            "question_text",
            "answer_text",
            "product_id",
            "status",
            "created_at",
            "updated_at",
            "product.*",
          ],
        }),
      ],
    },
    {
      matcher: "/admin/questions/status",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(PostAdminUpdateQuestionsStatusSchema),
      ],
    },
    {
      matcher: "/admin/questions/delete",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(PostAdminDeleteQuestionsSchema),
      ],
    },
    {
      matcher: "/admin/questions/:id",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(PostAdminAnswerQuestionSchema),
      ],
    },
    {
      matcher: "/admin/questions/:id",
      method: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetAdminQuestionsSchema, {
          isList: false,
          defaults: [
            "id",
            "name",
            "email",
            "question_text",
            "answer_text",
            "product_id",
            "status",
            "created_at",
            "updated_at",
          ],
        }),
      ],
    },
    {
      // این middleware قبل از core route handler اجرا می‌شه
      // تا مقدار no_notification را از body گرفته و روی Return ذخیره کنه
      // چون core workflow این مقدار را نادیده می‌گیره و در event data emit نمی‌کنه
      matcher: "/admin/returns/:id/receive/confirm",
      method: ["POST"],
      middlewares: [
        async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
          const { id } = req.params
          const logger = req.scope.resolve("logger")
          const body = req.body as { no_notification?: boolean }

          logger.info(`[ReturnReceive] Intercepting receive confirm for return: ${id}, no_notification=${body?.no_notification}`)

          // اگر no_notification در body موجود بود، مستقیم روی Return ذخیره می‌کنیم
          // از Order Module Service مستقیم استفاده می‌کنیم (بدون validation workflow)
          if (typeof body?.no_notification === "boolean") {
            try {
              const orderModule = req.scope.resolve(Modules.ORDER)
              await (orderModule as any).updateReturns([{
                id,
                no_notification: body.no_notification,
              }])
              logger.info(`[ReturnReceive] Saved no_notification=${body.no_notification} on return ${id}`)
            } catch (error: any) {
              logger.error(`[ReturnReceive] Failed to save no_notification: ${error.message}`)
              // خطا را نادیده می‌گیریم تا route اصلی ادامه پیدا کنه
            }
          }

          next()
        },
      ],
    },

  ],
})
