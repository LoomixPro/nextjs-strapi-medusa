/**
 * Redis-backed rate limiter for Next.js server actions.
 *
 * Strategy:
 *   1. If REDIS_URL is set and Redis connects successfully → use Redis
 *      (atomic, survives restarts, works across serverless instances).
 *   2. Otherwise → fall back to an in-memory store transparently.
 *
 * PRODUCTION: set REDIS_URL in your environment (same Redis used by Medusa).
 *
 * Redis key schema:
 *   "store_rl:<key>:attempts"     — string, incremented via INCR
 *   "store_rl:<key>:locked_until" — string, Unix ms timestamp
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface RateLimitEntry {
  attempts: number
  windowStart: number
  lockedUntil?: number
}

export interface RateLimitOptions {
  maxAttempts: number
  windowMs: number
  lockoutMs?: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInSeconds: number
  lockedForSeconds?: number
}

// ─── Redis singleton (lazy init) ──────────────────────────────────────────────

// We use a dynamic import so the module still loads on environments where
// ioredis cannot connect (e.g. build time, test runners).
let _redis: any = null
let _redisReady = false

function getRedis(): any | null {
  if (_redis) return _redisReady ? _redis : null

  const url = process.env.REDIS_URL
  if (!url) return null

  try {
    // Dynamic require keeps the module compatible with bundlers that
    // cannot statically analyse ioredis.
    const Redis = require("ioredis")
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 3000,
    })

    client.on("ready", () => {
      _redisReady = true
    })
    client.on("error", (err: Error) => {
      if (_redisReady) {
        // Log once, then silently degrade to in-memory
        console.error(
          "[rate-limiter] Redis error, falling back to in-memory:",
          err.message
        )
      }
      _redisReady = false
    })

    client.connect().catch(() => {
      // Startup failure → in-memory fallback will be used
    })

    _redis = client
  } catch {
    // ioredis not importable → in-memory fallback
  }

  return _redisReady ? _redis : null
}

// ─── In-memory fallback ───────────────────────────────────────────────────────

// Persists across Next.js hot-module-replacement in development.
const STORE_KEY = Symbol.for("__rateLimitStore__")
if (!(STORE_KEY in globalThis)) {
  ;(globalThis as any)[STORE_KEY] = new Map<string, RateLimitEntry>()
}
const memStore: Map<string, RateLimitEntry> = (globalThis as any)[STORE_KEY]

// Periodic cleanup to avoid unbounded memory growth
const CLEANUP_KEY = Symbol.for("__rateLimitCleanupStarted__")
if (!(CLEANUP_KEY in globalThis)) {
  ;(globalThis as any)[CLEANUP_KEY] = true
  setInterval(
    () => {
      const now = Date.now()
      memStore.forEach((entry, key) => {
        const windowExpired = now - entry.windowStart > 24 * 60 * 60 * 1000
        const lockExpired = !entry.lockedUntil || entry.lockedUntil < now
        if (windowExpired && lockExpired) memStore.delete(key)
      })
    },
    10 * 60 * 1000
  )
}

// ─── Redis helpers ────────────────────────────────────────────────────────────

const REDIS_PREFIX = "store_rl:"

async function redisRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const redis = getRedis()
  if (!redis) throw new Error("Redis unavailable")

  const now = Date.now()
  const attemptsKey = `${REDIS_PREFIX}${key}:attempts`
  const lockKey = `${REDIS_PREFIX}${key}:locked_until`

  // Check hard lockout first
  const lockedUntilStr = await redis.get(lockKey)
  if (lockedUntilStr) {
    const lockedUntil = parseInt(lockedUntilStr, 10)
    if (lockedUntil > now) {
      const lockedForSeconds = Math.ceil((lockedUntil - now) / 1000)
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds: lockedForSeconds,
        lockedForSeconds,
      }
    }
  }

  // Atomic increment
  const windowSecs = Math.ceil(options.windowMs / 1000)
  const attempts = await redis.incr(attemptsKey)
  if (attempts === 1) {
    await redis.expire(attemptsKey, windowSecs)
  }

  const ttlMs = Math.max(await redis.pttl(attemptsKey), 0)
  const resetInSeconds = Math.ceil(ttlMs / 1000)

  if (attempts > options.maxAttempts) {
    if (options.lockoutMs) {
      const lockedUntil = now + options.lockoutMs
      const lockSecs = Math.ceil(options.lockoutMs / 1000)
      await redis.set(lockKey, lockedUntil, "EX", lockSecs)
      const lockedForSeconds = Math.ceil(options.lockoutMs / 1000)
      return { allowed: false, remaining: 0, resetInSeconds, lockedForSeconds }
    }
    return { allowed: false, remaining: 0, resetInSeconds }
  }

  return {
    allowed: true,
    remaining: Math.max(0, options.maxAttempts - attempts),
    resetInSeconds,
  }
}

async function redisIsRateLimited(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const redis = getRedis()
  if (!redis) throw new Error("Redis unavailable")

  const now = Date.now()
  const attemptsKey = `${REDIS_PREFIX}${key}:attempts`
  const lockKey = `${REDIS_PREFIX}${key}:locked_until`

  // Check lockout
  const lockedUntilStr = await redis.get(lockKey)
  if (lockedUntilStr) {
    const lockedUntil = parseInt(lockedUntilStr, 10)
    if (lockedUntil > now) {
      const lockedForSeconds = Math.ceil((lockedUntil - now) / 1000)
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds: lockedForSeconds,
        lockedForSeconds,
      }
    }
  }

  const attemptsStr = await redis.get(attemptsKey)
  const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0
  const ttlMs = Math.max(await redis.pttl(attemptsKey), 0)
  const resetInSeconds =
    Math.ceil(ttlMs / 1000) || Math.ceil(options.windowMs / 1000)

  if (attempts >= options.maxAttempts) {
    return { allowed: false, remaining: 0, resetInSeconds }
  }

  return {
    allowed: true,
    remaining: Math.max(0, options.maxAttempts - attempts),
    resetInSeconds,
  }
}

async function redisReset(key: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  await redis.del(
    `${REDIS_PREFIX}${key}:attempts`,
    `${REDIS_PREFIX}${key}:locked_until`
  )
}

// ─── In-memory helpers ────────────────────────────────────────────────────────

function buildMemResult(
  entry: RateLimitEntry,
  options: RateLimitOptions,
  now: number
): RateLimitResult {
  const resetInSeconds = Math.max(
    0,
    Math.ceil((entry.windowStart + options.windowMs - now) / 1000)
  )
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
      lockedForSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    }
  }
  const exceeded = entry.attempts > options.maxAttempts
  return {
    allowed: !exceeded,
    remaining: Math.max(0, options.maxAttempts - entry.attempts),
    resetInSeconds,
  }
}

function memRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const entry = memStore.get(key)

  if (entry?.lockedUntil && entry.lockedUntil > now) {
    return buildMemResult(entry, options, now)
  }

  if (!entry || now - entry.windowStart >= options.windowMs) {
    const fresh: RateLimitEntry = { attempts: 1, windowStart: now }
    memStore.set(key, fresh)
    return buildMemResult(fresh, options, now)
  }

  const updated: RateLimitEntry = { ...entry, attempts: entry.attempts + 1 }
  if (updated.attempts > options.maxAttempts && options.lockoutMs) {
    updated.lockedUntil = now + options.lockoutMs
  }
  memStore.set(key, updated)
  return buildMemResult(updated, options, now)
}

function memIsRateLimited(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  const entry = memStore.get(key)
  if (!entry || now - entry.windowStart >= options.windowMs) {
    return {
      allowed: true,
      remaining: options.maxAttempts,
      resetInSeconds: Math.ceil(options.windowMs / 1000),
    }
  }
  return buildMemResult(entry, options, now)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Check the rate limit for `key` AND increment the attempt counter.
 * Uses Redis when available, in-memory otherwise.
 */
export async function rateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  try {
    if (getRedis()) return await redisRateLimit(key, options)
  } catch {
    // Redis error mid-request → fall through to in-memory
  }
  return memRateLimit(key, options)
}

/**
 * Check whether `key` is currently rate-limited WITHOUT incrementing.
 * Use this for guard checks at the start of an action.
 */
export async function isRateLimited(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  try {
    if (getRedis()) return await redisIsRateLimited(key, options)
  } catch {
    // Redis error → fall through to in-memory
  }
  return memIsRateLimited(key, options)
}

/**
 * Fully remove the rate-limit state for `key` (e.g. after a successful login).
 */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    if (getRedis()) {
      await redisReset(key)
      return
    }
  } catch {
    // Redis error → fall through to in-memory
  }
  memStore.delete(key)
}
