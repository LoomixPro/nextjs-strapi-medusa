function parseOrigins(value: string | undefined): string[] {
  if (!value?.trim()) {
    return []
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
}

/** Join unique origins into a comma-separated CORS list. */
export function uniqueCorsOrigins(...parts: (string | undefined)[]): string {
  const origins = new Set<string>()

  for (const part of parts) {
    for (const origin of parseOrigins(part)) {
      origins.add(origin)
    }
  }

  return Array.from(origins).join(",")
}

/**
 * Resolve a CORS env var with fallbacks when unset.
 * Explicit values win; fallbacks are only used when primary is empty.
 */
export function resolveCors(
  primary: string | undefined,
  ...fallbacks: (string | undefined)[]
): string {
  if (primary?.trim()) {
    return primary.trim()
  }

  return uniqueCorsOrigins(...fallbacks)
}

export function resolveStoreCors(env: NodeJS.ProcessEnv = process.env): string {
  return resolveCors(
    env.STORE_CORS,
    env.STOREFRONT_PUBLIC_URL,
    env.STOREFRONT_URL,
    env.NODE_ENV !== "production" ? "http://localhost:8000" : undefined
  )
}

export function resolveAdminCors(env: NodeJS.ProcessEnv = process.env): string {
  return resolveCors(
    env.ADMIN_CORS,
    env.MEDUSA_BACKEND_PUBLIC_URL,
    env.STRAPI_PUBLIC_URL,
    env.NODE_ENV !== "production"
      ? "http://localhost:9000,http://localhost:5173"
      : undefined
  )
}

export function resolveAuthCors(env: NodeJS.ProcessEnv = process.env): string {
  return resolveCors(
    env.AUTH_CORS,
    env.STOREFRONT_PUBLIC_URL,
    env.MEDUSA_BACKEND_PUBLIC_URL,
    env.STOREFRONT_URL,
    env.NODE_ENV !== "production"
      ? "http://localhost:8000,http://localhost:9000,http://localhost:5173"
      : undefined
  )
}
