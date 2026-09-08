/**
 * High-level auth security guards built on top of the rate limiter.
 *
 * All exported functions are designed to be called from "use server" actions
 * so they have access to Next.js request headers.
 *
 * NOTE: All guard functions are async because the underlying rate limiter now
 * uses Redis (when REDIS_URL is configured) for multi-instance correctness.
 */

import { headers } from "next/headers"
import {
  rateLimit,
  isRateLimited,
  resetRateLimit,
  RateLimitOptions,
} from "./rate-limiter"

// ─── Rate-limit configs ───────────────────────────────────────────────────────

/**
 * 120-second cooldown between consecutive OTP sends for the same identifier.
 * This is the server-enforced equivalent of the frontend countdown timer.
 */
const OTP_RESEND_COOLDOWN: RateLimitOptions = {
  maxAttempts: 1,
  windowMs: 120 * 1000, // 2 minutes
}

/**
 * Hourly cap on OTP sends per identifier (email / phone).
 * Prevents sustained abuse even after the cooldown resets.
 */
const OTP_HOURLY_LIMIT: RateLimitOptions = {
  maxAttempts: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
}

/**
 * Per-IP hourly cap on OTP requests across all identifiers.
 * Stops a single IP from hammering multiple accounts.
 */
const OTP_IP_HOURLY_LIMIT: RateLimitOptions = {
  maxAttempts: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
}

/**
 * Login failure lockout: 5 wrong password attempts → 15-minute lockout.
 */
const LOGIN_FAILURE_LIMIT: RateLimitOptions = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  lockoutMs: 15 * 60 * 1000, // 15-minute lockout
}

/**
 * OTP verification limit: 5 wrong codes → 30-minute lockout.
 * Forces the user to request a fresh OTP after too many guesses.
 */
const OTP_VERIFY_LIMIT: RateLimitOptions = {
  maxAttempts: 5,
  windowMs: 30 * 60 * 1000, // 30-minute window
  lockoutMs: 30 * 60 * 1000, // 30-minute lockout
}

// ─── IP helper ───────────────────────────────────────────────────────────────

/**
 * Extracts the originating client IP from standard proxy headers.
 * Falls back to a safe default so the app never crashes on missing headers.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers()
  return (
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "127.0.0.1"
  )
}

// ─── OTP request guards ───────────────────────────────────────────────────────

/**
 * Call this before sending any OTP (phone or email).
 *
 * Enforces three independent limits:
 *   1. Per-IP hourly cap (prevents IP-based enumeration)
 *   2. 120-second cooldown per identifier (server-enforced resend delay)
 *   3. Per-identifier hourly cap (prevents sustained spamming of one account)
 *
 * Increments all applicable counters on every call.
 */
export async function checkOtpRequestAllowed(
  identifier: string
): Promise<{ allowed: boolean; error?: string }> {
  const ip = await getClientIp()

  // 1. IP-level hourly cap
  const ipResult = await rateLimit(`ip_otp:${ip}`, OTP_IP_HOURLY_LIMIT)
  if (!ipResult.allowed) {
    return {
      allowed: false,
      error: `error:network_rate_limit|${
        ipResult.lockedForSeconds ?? ipResult.resetInSeconds
      }`,
    }
  }

  // 2. Per-identifier 120-second cooldown
  const cooldownResult = await rateLimit(
    `otp_cooldown:${identifier}`,
    OTP_RESEND_COOLDOWN
  )
  if (!cooldownResult.allowed) {
    return {
      allowed: false,
      error: `error:cooldown|${cooldownResult.resetInSeconds}`,
    }
  }

  // 3. Per-identifier hourly cap
  const hourlyResult = await rateLimit(
    `otp_hourly:${identifier}`,
    OTP_HOURLY_LIMIT
  )
  if (!hourlyResult.allowed) {
    return {
      allowed: false,
      error: `error:identifier_rate_limit|${hourlyResult.resetInSeconds}`,
    }
  }

  return { allowed: true }
}

// ─── Login failure tracking ───────────────────────────────────────────────────

/**
 * Check (without incrementing) whether the account is currently locked.
 * Call this at the beginning of the login action.
 */
export async function checkLoginAllowed(email: string): Promise<{
  allowed: boolean
  error?: string
}> {
  const result = await isRateLimited(
    `login_fail:${email.trim().toLowerCase()}`,
    LOGIN_FAILURE_LIMIT
  )
  if (!result.allowed) {
    const wait = result.lockedForSeconds ?? result.resetInSeconds
    return {
      allowed: false,
      error: `error:login_failed_limit|${wait}`,
    }
  }
  return { allowed: true }
}

/**
 * Increment the failure counter for an email address.
 * Returns whether the account is now locked after this failure.
 */
export async function recordLoginFailure(email: string): Promise<{
  locked: boolean
  lockedForSeconds?: number
}> {
  const result = await rateLimit(
    `login_fail:${email.trim().toLowerCase()}`,
    LOGIN_FAILURE_LIMIT
  )
  return {
    locked: !result.allowed,
    lockedForSeconds: result.lockedForSeconds,
  }
}

/**
 * Clear the failure counter after a successful login.
 */
export async function resetLoginFailures(email: string): Promise<void> {
  await resetRateLimit(`login_fail:${email.trim().toLowerCase()}`)
}

// ─── OTP verification guards ──────────────────────────────────────────────────

/**
 * Check (without incrementing) whether OTP verification is still allowed.
 * Call this before attempting to verify a code.
 */
export async function checkOtpVerifyAllowed(identifier: string): Promise<{
  allowed: boolean
  error?: string
}> {
  const result = await isRateLimited(
    `otp_verify:${identifier}`,
    OTP_VERIFY_LIMIT
  )
  if (!result.allowed) {
    const wait = result.lockedForSeconds ?? result.resetInSeconds
    return {
      allowed: false,
      error: `error:otp_verify_limit|${wait}`,
    }
  }
  return { allowed: true }
}

/**
 * Record a failed OTP verification attempt.
 */
export async function recordOtpVerifyFailure(identifier: string): Promise<{
  locked: boolean
  lockedForSeconds?: number
}> {
  const result = await rateLimit(`otp_verify:${identifier}`, OTP_VERIFY_LIMIT)
  return { locked: !result.allowed, lockedForSeconds: result.lockedForSeconds }
}

/**
 * Clear the OTP verification failure counter after a successful verify.
 */
export async function resetOtpVerifyFailures(
  identifier: string
): Promise<void> {
  await resetRateLimit(`otp_verify:${identifier}`)
}

// ─── Honeypot helper ──────────────────────────────────────────────────────────

/**
 * Returns true if the hidden honeypot field was filled in — a strong signal
 * of automated form submission.
 */
export function isHoneypotTripped(formData: FormData): boolean {
  const value = formData.get("_hp_name") as string | null
  return !!value && value.length > 0
}
