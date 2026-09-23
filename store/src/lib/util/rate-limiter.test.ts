import {
  rateLimit,
  isRateLimited,
  resetRateLimit,
  getRedis,
  _resetRedisForTesting,
} from "./rate-limiter"

describe("rate-limiter", () => {
  const originalEnv = process.env.REDIS_URL

  beforeEach(() => {
    delete process.env.REDIS_URL
    _resetRedisForTesting()
  })

  afterAll(() => {
    process.env.REDIS_URL = originalEnv
    _resetRedisForTesting()
  })

  describe("in-memory fallback (when REDIS_URL is not set)", () => {
    const testKey = "test_user_ip_1"

    beforeEach(async () => {
      await resetRateLimit(testKey)
    })

    it("allows attempts up to maxAttempts and then blocks", async () => {
      const options = { maxAttempts: 3, windowMs: 10_000 }

      // Attempt 1
      const res1 = await rateLimit(testKey, options)
      expect(res1.allowed).toBe(true)
      expect(res1.remaining).toBe(2)

      // Attempt 2
      const res2 = await rateLimit(testKey, options)
      expect(res2.allowed).toBe(true)
      expect(res2.remaining).toBe(1)

      // Attempt 3
      const res3 = await rateLimit(testKey, options)
      expect(res3.allowed).toBe(true)
      expect(res3.remaining).toBe(0)

      // Attempt 4 (exceeded)
      const res4 = await rateLimit(testKey, options)
      expect(res4.allowed).toBe(false)
      expect(res4.remaining).toBe(0)
    })

    it("enforces lockout period when lockoutMs is provided", async () => {
      const options = { maxAttempts: 2, windowMs: 5_000, lockoutMs: 60_000 }

      await rateLimit(testKey, options)
      await rateLimit(testKey, options)
      const locked = await rateLimit(testKey, options)

      expect(locked.allowed).toBe(false)
      expect(locked.lockedForSeconds).toBeDefined()
      expect(locked.lockedForSeconds).toBeGreaterThan(0)
    })

    it("checks rate limit status without incrementing counter using isRateLimited", async () => {
      const options = { maxAttempts: 2, windowMs: 10_000 }

      const check1 = await isRateLimited(testKey, options)
      expect(check1.allowed).toBe(true)
      expect(check1.remaining).toBe(2)

      // Increment once
      await rateLimit(testKey, options)

      const check2 = await isRateLimited(testKey, options)
      expect(check2.allowed).toBe(true)
      expect(check2.remaining).toBe(1)

      // Still 1 left after another check
      const check3 = await isRateLimited(testKey, options)
      expect(check3.allowed).toBe(true)
      expect(check3.remaining).toBe(1)
    })

    it("resets rate limit state when resetRateLimit is called", async () => {
      const options = { maxAttempts: 2, windowMs: 10_000 }

      await rateLimit(testKey, options)
      await rateLimit(testKey, options)
      const blocked = await rateLimit(testKey, options)
      expect(blocked.allowed).toBe(false)

      await resetRateLimit(testKey)

      const fresh = await rateLimit(testKey, options)
      expect(fresh.allowed).toBe(true)
      expect(fresh.remaining).toBe(1)
    })
  })

  describe("getRedis async connection handling", () => {
    it("returns null immediately when REDIS_URL is not set", async () => {
      delete process.env.REDIS_URL
      const redis = await getRedis()
      expect(redis).toBeNull()
    })

    it("coalesces concurrent getRedis calls to the same Promise without race condition", async () => {
      process.env.REDIS_URL = "redis://127.0.0.1:9999" // Unreachable port to trigger connection attempt

      // Call getRedis concurrently multiple times
      const p1 = getRedis()
      const p2 = getRedis()
      const p3 = getRedis()

      // All 3 calls should return Promises that resolve to the same result
      const [r1, r2, r3] = await Promise.all([p1, p2, p3])
      expect(r1).toBe(r2)
      expect(r2).toBe(r3)
    })
  })
})
