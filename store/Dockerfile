# ============================================================
# Storefront Dockerfile — Next.js 16 Standalone (Multi-stage)
# بر اساس مستندات رسمی Next.js برای self-hosting
# ============================================================

# ── Stage 1: Install dependencies ───────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
# --frozen-lockfile اطمینان می‌دهد نسخه‌ها دقیقاً از lock file خوانده شوند
RUN npm ci

# ── Stage 2: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# کپی node_modules از مرحله deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# متغیرهای زمان Build که کامپایل می‌شوند (NEXT_PUBLIC_*)
ARG MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_MEILISEARCH_HOST
ARG NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY
ARG NEXT_PUBLIC_STRAPI_URL
ARG NEXT_PUBLIC_DEFAULT_REGION
ARG DEFAULT_LOCALE
ARG NEXT_PUBLIC_ENABLE_IRAN_FEATURES
ARG NEXT_PUBLIC_STRIPE_KEY
ARG NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID
ARG NEXT_PUBLIC_MEILISEARCH_INDEX_NAME
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_UMAMI_URL
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ARG REGISTRY_URL
ARG GITHUB_PAT

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_OUTPUT_MODE=standalone \
    MEDUSA_BACKEND_URL=$MEDUSA_BACKEND_URL \
    NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    NEXT_PUBLIC_MEILISEARCH_HOST=$NEXT_PUBLIC_MEILISEARCH_HOST \
    NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY=$NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY \
    NEXT_PUBLIC_STRAPI_URL=$NEXT_PUBLIC_STRAPI_URL \
    NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION \
    DEFAULT_LOCALE=$DEFAULT_LOCALE \
    NEXT_PUBLIC_ENABLE_IRAN_FEATURES=$NEXT_PUBLIC_ENABLE_IRAN_FEATURES \
    NEXT_PUBLIC_STRIPE_KEY=$NEXT_PUBLIC_STRIPE_KEY \
    NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY \
    NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID=$NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID \
    NEXT_PUBLIC_MEILISEARCH_INDEX_NAME=$NEXT_PUBLIC_MEILISEARCH_INDEX_NAME \
    NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID \
    NEXT_PUBLIC_UMAMI_URL=$NEXT_PUBLIC_UMAMI_URL \
    NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID \
    REGISTRY_URL=$REGISTRY_URL \
    GITHUB_PAT=$GITHUB_PAT

# بیلد (node scripts/generate-style-registries.js هم داخل npm run build اجرا می‌شود)
RUN npm run build

# ── Stage 3: Production runner ──────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8000 \
    HOSTNAME="0.0.0.0"

# کاربر غیر root برای امنیت (توصیه رسمی Next.js)
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# کپی فایل‌های استاتیک (public/ و .next/static) به صورت جداگانه
# این کار اجباری در حالت standalone است
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:8000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# اجرای مستقیم با Node — سبک‌ترین و سریع‌ترین روش
CMD ["node", "server.js"]
