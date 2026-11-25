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
let connectPromise: Promise<Redis | null> | null = null
let lastFailureTime = 0
const RETRY_COOLDOWN_MS = 10_000

async function getRedisAsync(): Promise<Redis | null> {
  const url = process.env.REDIS_URL
  if (!url) return null

  if (redisClient && redisReady && redisClient.status === "ready") {
    return redisClient
  }

  if (!redisReady && Date.now() - lastFailureTime < RETRY_COOLDOWN_MS) {
    return null
  }

  if (connectPromise) {
    return connectPromise
  }

  connectPromise = (async () => {
    try {
      if (!redisClient || redisClient.status === "end" || redisClient.status === "close") {
        const client = new Redis(url, {
          maxRetriesPerRequest: 1,
          enableReadyCheck: true,
          lazyConnect: true,
          connectTimeout: 3000,
        })

        client.on("ready", () => { redisReady = true })
        client.on("error", (err: Error) => {
          if (redisReady) {
            console.error("[rate-limiter] Redis error, falling back to in-memory:", err.message)
          }
          redisReady = false
        })
        client.on("close", () => { redisReady = false })
        client.on("end", () => { redisReady = false })

        redisClient = client
      }

      if (redisClient.status === "wait") {
        await redisClient.connect()
      } else if (redisClient.status !== "ready") {
        await new Promise<void>((resolve, reject) => {
          const onReady = () => { cleanup(); resolve() }
          const onError = (err: Error) => { cleanup(); reject(err) }
          const timer = setTimeout(() => { cleanup(); resolve() }, 1500)
          function cleanup() {
            clearTimeout(timer)
            redisClient?.off("ready", onReady)
            redisClient?.off("error", onError)
          }
          redisClient!.once("ready", onReady)
          redisClient!.once("error", onError)
        })
      }

      redisReady = redisClient.status === "ready"
      return redisReady ? redisClient : null
    } catch {
      redisReady = false
      lastFailureTime = Date.now()
      return null
    } finally {
      connectPromise = null
    }
  })()

  return connectPromise
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
  const cfIp = req.headers["cf-connecting-ip"]
  if (typeof cfIp === "string" && cfIp.trim()) return cfIp.trim()
  const realIp = req.headers["x-real-ip"]
  if (typeof realIp === "string" && realIp.trim()) return realIp.trim()
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim()
  }
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

async function isLockedRedis(redis: Redis, key: string): Promise<{ locked: boolean; retryInSeconds: number }> {
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
  redis: Redis,
  key: string,
  options: RateLimitOptions
): Promise<{ blocked: boolean; retryInSeconds: number }> {
  const attempts = parseInt((await redis.get(`${REDIS_PREFIX}${key}:attempts`)) ?? "0", 10)
  if (attempts >= options.maxAttempts) {
    const ttl = await redis.pttl(`${REDIS_PREFIX}${key}:attempts`)
    return { blocked: true, retryInSeconds: Math.ceil(Math.max(ttl, 0) / 1000) }
  }
  return { blocked: false, retryInSeconds: 0 }
}

async function incrementRedis(redis: Redis, key: string, options: RateLimitOptions): Promise<void> {
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
    const redis = await getRedisAsync()

    // ── 1. Always check limit BEFORE allowing the request ─────────────────
    const locked = redis
      ? await isLockedRedis(redis, key)
      : isLockedMem(key)

    if (locked.locked) {
      return res.status(429).json({
        message:
          options.message ??
          `Too many requests. Please try again in ${formatSeconds(locked.retryInSeconds)}.`,
      })
    }

    const checked = redis
      ? await checkAttemptsRedis(redis, key, options)
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
      redis ? incrementRedis(redis, key, options) : Promise.resolve(incrementMem(key, options))

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
