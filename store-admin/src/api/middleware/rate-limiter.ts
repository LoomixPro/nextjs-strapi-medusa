/**
 * Redis-backed rate limiter for Medusa middleware.
 *
 * Strategy:
 *   1. If REDIS_URL is set and Redis connects successfully → use Redis
 *      (atomic, persists across server restarts and multiple instances).
 *   2. Otherwise → fall back to the in-memory store transparently.
 *
 * Redis key schema:  "rl:<key>:attempts"  (string, incremented via INCR)
 *                    "rl:<key>:locked_until"  (string, Unix ms timestamp)
 */

import { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import Redis from "ioredis"

// ─── Redis singleton ─────────────────────────────────────────────────────────

let redisClient: Redis | null = null
let redisReady = false

function getRedis(): Redis | null {
  if (redisClient) return redisReady ? redisClient : null

  const url = process.env.REDIS_URL
  if (!url) return null

  try {
    const client = new Redis(url, {
      // Don't retry forever on startup — fast fallback to in-memory
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 3000,
    })

    client.on("ready", () => { redisReady = true })
    client.on("error", (err: Error) => {
      if (redisReady) {
        // Log once so operators know, then silently degrade to in-memory
        console.error("[rate-limiter] Redis error, falling back to in-memory:", err.message)
      }
      redisReady = false
    })

    client.connect().catch(() => {
      // Connection failed on startup — in-memory fallback will be used
    })

    redisClient = client
  } catch {
    // ioredis constructor threw — in-memory fallback
  }

  return redisReady ? redisClient : null
}

// ─── In-memory fallback store ─────────────────────────────────────────────────

interface Entry {
  attempts: number
  windowStart: number
  lockedUntil?: number
}

const STORE_KEY = Symbol.for("__medusaRateLimitStore__")
if (!(STORE_KEY in globalThis)) {
  ;(globalThis as any)[STORE_KEY] = new Map<string, Entry>()
}
const memStore: Map<string, Entry> = (globalThis as any)[STORE_KEY]

const CLEANUP_KEY = Symbol.for("__medusaRateLimitCleanup__")
if (!(CLEANUP_KEY in globalThis)) {
  ;(globalThis as any)[CLEANUP_KEY] = true
  setInterval(() => {
    const now = Date.now()
    memStore.forEach((entry, key) => {
      const age = now - entry.windowStart
      const lockExpired = !entry.lockedUntil || entry.lockedUntil < now
      if (age > 24 * 60 * 60 * 1000 && lockExpired) memStore.delete(key)
    })
  }, 15 * 60 * 1000)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClientIp(req: MedusaRequest): string {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim()
  return (req as any).ip || "unknown"
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""}`
  const mins = Math.ceil(seconds / 60)
  return `${mins} minute${mins !== 1 ? "s" : ""}`
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface RateLimitOptions {
  maxAttempts: number
  windowMs: number
  lockoutMs?: number
  keyFn?: (req: MedusaRequest) => string
  message?: string
  countOn?: "always" | "success" | "failure"
}

// ─── Redis implementation ─────────────────────────────────────────────────────

const REDIS_PREFIX = "medusa_rl:"

async function isLockedRedis(key: string): Promise<{ locked: boolean; retryInSeconds: number }> {
  const redis = getRedis()
  if (!redis) return { locked: false, retryInSeconds: 0 }

  const lockedUntil = await redis.get(`${REDIS_PREFIX}${key}:locked_until`)
  if (!lockedUntil) return { locked: false, retryInSeconds: 0 }

  const now = Date.now()
  const until = parseInt(lockedUntil, 10)
  if (until > now) {
    return { locked: true, retryInSeconds: Math.ceil((until - now) / 1000) }
  }
  return { locked: false, retryInSeconds: 0 }
}

async function checkAttemptsRedis(
  key: string,
  options: RateLimitOptions
): Promise<{ blocked: boolean; retryInSeconds: number }> {
  const redis = getRedis()
  if (!redis) return { blocked: false, retryInSeconds: 0 }

  const attempts = parseInt((await redis.get(`${REDIS_PREFIX}${key}:attempts`)) ?? "0", 10)
  if (attempts >= options.maxAttempts) {
    const ttl = await redis.pttl(`${REDIS_PREFIX}${key}:attempts`)
    return { blocked: true, retryInSeconds: Math.ceil(Math.max(ttl, 0) / 1000) }
  }
  return { blocked: false, retryInSeconds: 0 }
}

async function incrementRedis(key: string, options: RateLimitOptions): Promise<void> {
  const redis = getRedis()
  if (!redis) return

  const attemptsKey = `${REDIS_PREFIX}${key}:attempts`
  const windowSecs = Math.ceil(options.windowMs / 1000)

  // Atomic increment — if key is new, INCR sets it to 1 and we set TTL
  const attempts = await redis.incr(attemptsKey)
  if (attempts === 1) {
    await redis.expire(attemptsKey, windowSecs)
  }

  // Apply lockout once threshold is exceeded
  if (attempts > options.maxAttempts && options.lockoutMs) {
    const lockedUntil = Date.now() + options.lockoutMs
    const lockSecs = Math.ceil(options.lockoutMs / 1000)
    await redis.set(`${REDIS_PREFIX}${key}:locked_until`, lockedUntil, "EX", lockSecs)
  }
}

// ─── In-memory implementation ─────────────────────────────────────────────────

function isLockedMem(key: string): { locked: boolean; retryInSeconds: number } {
  const now = Date.now()
  const entry = memStore.get(key)
  if (entry?.lockedUntil && entry.lockedUntil > now) {
    return { locked: true, retryInSeconds: Math.ceil((entry.lockedUntil - now) / 1000) }
  }
  return { locked: false, retryInSeconds: 0 }
}

function checkAttemptsMem(
  key: string,
  options: RateLimitOptions
): { blocked: boolean; retryInSeconds: number } {
  const now = Date.now()
  const entry = memStore.get(key)
  if (!entry || now - entry.windowStart >= options.windowMs) {
    return { blocked: false, retryInSeconds: 0 }
  }
  if (entry.attempts >= options.maxAttempts) {
    const retryInMs = options.lockoutMs ?? (entry.windowStart + options.windowMs - now)
    return { blocked: true, retryInSeconds: Math.ceil(retryInMs / 1000) }
  }
  return { blocked: false, retryInSeconds: 0 }
}

function incrementMem(key: string, options: RateLimitOptions): void {
  const now = Date.now()
  const entry = memStore.get(key)

  if (!entry || now - entry.windowStart >= options.windowMs) {
    memStore.set(key, { attempts: 1, windowStart: now })
    return
  }

  const newAttempts = entry.attempts + 1
  const updated: Entry = { ...entry, attempts: newAttempts }
  if (newAttempts > options.maxAttempts && options.lockoutMs) {
    updated.lockedUntil = now + options.lockoutMs
  }
  memStore.set(key, updated)
}

// ─── Public middleware factory ────────────────────────────────────────────────

/**
 * Returns an Express-compatible middleware that enforces rate limiting.
 * Automatically uses Redis when REDIS_URL is configured; otherwise falls back
 * to an in-memory store.
 *
 * @example
 * // Count only OTP requests that actually delivered a code (2xx)
 * createRateLimitMiddleware({ maxAttempts: 5, windowMs: 3600_000, countOn: 'success' })
 */
export function createRateLimitMiddleware(options: RateLimitOptions) {
  const countOn = options.countOn ?? "always"

  return async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    const ip = getClientIp(req)
    const key = options.keyFn ? options.keyFn(req) : `${req.path}:${ip}`
    const useRedis = !!getRedis()

    // ── 1. Always check limit BEFORE allowing the request ─────────────────
    const locked = useRedis
      ? await isLockedRedis(key)
      : isLockedMem(key)

    if (locked.locked) {
      return res.status(429).json({
        message:
          options.message ??
          `Too many requests. Please try again in ${formatSeconds(locked.retryInSeconds)}.`,
      })
    }

    const checked = useRedis
      ? await checkAttemptsRedis(key, options)
      : checkAttemptsMem(key, options)

    if (checked.blocked) {
      return res.status(429).json({
        message:
          options.message ??
          `Too many requests. Please try again in ${formatSeconds(checked.retryInSeconds)}.`,
      })
    }

    // ── 2. Increment counter at the right time ─────────────────────────────
    const increment = () =>
      useRedis ? incrementRedis(key, options) : Promise.resolve(incrementMem(key, options))

    if (countOn === "always") {
      await increment()
      return next()
    }

    // For 'success' or 'failure', count after the handler responds
    res.on("finish", () => {
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300
      if (countOn === "success" && isSuccess) increment()
      else if (countOn === "failure" && !isSuccess) increment()
    })

    next()
  }
}
