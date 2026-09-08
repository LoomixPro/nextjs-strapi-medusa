# 🛡️ Backend Security & Rate Limiting (Medusa)

Securing an e-commerce platform against brute-force attacks and financial exhaustion (like SMS Bombing) is critical, especially when dealing with OTP-based authentication.

The Medusa backend employs an advanced, Redis-backed Rate Limiter specifically designed to handle authentication workflows intelligently.

---

## 🛑 The Threat Landscape

E-Commerce platforms using SMS OTPs face two primary threats:
1. **SMS Bombing (Financial Exhaustion):** Bots repeatedly call the `send-otp` endpoint, causing the SMS provider to send thousands of messages, rapidly depleting account balance.
2. **Brute-Force & Credential Stuffing:** Attackers repeatedly guess OTP codes or passwords to hijack customer accounts.

---

## 🧠 Smart Rate Limiting: The `countOn` Strategy

A standard IP-based rate limiter blindly blocks users after N requests. This is flawed because users who encounter normal 4xx errors (e.g., incorrect passwords, or attempting to login when not registered) might get blocked unfairly, while attackers can still abuse the 2xx success routes.

To fix this, the custom `createRateLimitMiddleware` (located in `store-admin/src/api/middlewares.ts`) uses a `countOn` strategy.

### 1. `countOn: "success"` (SMS Protection)
Applied to the `/auth/customer/phone-auth` endpoint (Request OTP).

**Logic:** The rate limiter counter *only* increments if the server responds with a 2xx success code (meaning an SMS was actually dispatched and paid for). 
- If a user triggers a 401 (e.g., trying to login but they don't exist yet), the counter is NOT incremented. 
- **Configuration:** Max 3 successful SMS dispatches per IP per hour.

### 2. `countOn: "failure"` (Brute-Force Protection)
Applied to endpoints like `/auth/customer/phone-register` or login.

**Logic:** The rate limiter counter *only* increments if the server responds with a 4xx error (e.g., wrong OTP code entered).
- Successful logins (2xx) do NOT consume the counter. A real user logging in every day will never hit the limit.
- A bot guessing wrong codes will quickly hit the limit and be blocked.
- **Configuration:** Max 5 failed guesses per IP per 30 minutes.

---

## 🔧 Implementation Details

The rate limiter intercepts requests at the Medusa HTTP middleware layer before they hit the auth providers.

```typescript
// store-admin/src/api/middlewares.ts
import { createRateLimitMiddleware } from "./middleware/rate-limiter"

export default defineMiddlewares({
  routes: [
    {
      method: "POST",
      matcher: "/auth/customer/phone-auth",
      middlewares: [
        createRateLimitMiddleware({
          maxAttempts: 3,
          windowMs: 60 * 60 * 1000, // 1 hour
          countOn: "success",       // Only count actual OTP sends
          message: "Too many OTP requests. Please try again later.",
        }),
      ],
    },
    {
      method: "POST",
      matcher: "/auth/customer/phone-register",
      middlewares: [
        createRateLimitMiddleware({
          maxAttempts: 5,
          windowMs: 30 * 60 * 1000, // 30 minutes
          countOn: "failure",       // Only penalize wrong codes
          message: "Too many failed attempts. Please try again later.",
        }),
      ],
    },
  ]
})
```

### Redis Integration
All rate-limiting state is stored in the **Redis container** (`redis:6379`) configured in `docker-compose.yml`. This ensures that even if you horizontally scale the Medusa backend across multiple instances, the rate limits remain consistent and synchronized globally.
