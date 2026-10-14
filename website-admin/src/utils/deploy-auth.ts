import crypto from "crypto"
import type { Context } from "koa"

function safeEqualSecret(provided: string, expected: string): boolean {
  const actual = new Uint8Array(
    crypto.createHash("sha256").update(provided).digest()
  )
  const expectedHash = new Uint8Array(
    crypto.createHash("sha256").update(expected).digest()
  )

  if (actual.length !== expectedHash.length) {
    return false
  }

  return crypto.timingSafeEqual(actual, expectedHash)
}

export async function isDeployAuthorized(ctx: Context): Promise<boolean> {
  if (ctx.state.user) {
    return true
  }

  const sharedSecret = process.env.REVALIDATE_SECRET
  const providedSecret = ctx.request.headers["x-strapi-secret"]

  if (
    typeof providedSecret === "string" &&
    sharedSecret &&
    safeEqualSecret(providedSecret, sharedSecret)
  ) {
    return true
  }

  const authorization = ctx.request.headers.authorization
  if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim()

    // Use global strapi (not ctx.strapi) because auth:false routes don't populate ctx.strapi
    const globalStrapi = (global as any).strapi

    // Strapi 5.24+ uses sessionManager instead of admin.services.token.decodeJwtToken
    const sessionManager = globalStrapi?.sessionManager
    if (typeof sessionManager === "function") {
      try {
        const { isValid } = sessionManager("admin").validateAccessToken(token)
        if (isValid) {
          return true
        }
      } catch {
        // fall through to legacy checks
      }
    }

    const adminTokenService = globalStrapi?.admin?.services?.token
    if (adminTokenService?.decodeJwtToken) {
      try {
        const { isValid } = await adminTokenService.decodeJwtToken(token)
        if (isValid) {
          return true
        }
      } catch {
        // fall through
      }
    }
  }

  return false
}
