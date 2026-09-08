# ============================================================
# Medusa v2 Dockerfile — Multi-stage Production Build
# ============================================================

# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

# Set working directory to root for monorepo-style build
WORKDIR /app

# Copy store-admin package files
COPY store-admin/package.json store-admin/package-lock.json ./store-admin/

WORKDIR /app/store-admin
RUN npm config set registry https://registry.npmmirror.com/ \
 && npm config set fetch-retry-maxtimeout 600000 -g \
 && npm ci

# Copy the rest of the store-admin code
COPY store-admin/ ./

# Build the Medusa project
RUN npm run build

# ── Stage 2: Production runner ──────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app/store-admin

# کپی کل app از مرحله build (همان ساختار اصلی که کار می‌کرد)
COPY --from=builder /app/store-admin /app/store-admin

ENV NODE_ENV=production
EXPOSE 9000

# Symlink the Medusa admin build to where the server expects it
RUN ln -sf .medusa/server/public public 2>/dev/null || true

# Change ownership to non-root node user for security
RUN chown -R node:node /app
USER node

HEALTHCHECK --interval=15s --timeout=5s --start-period=90s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:9000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "npx medusa db:migrate && (npx medusa user -e ${MEDUSA_ADMIN_EMAIL} -p ${MEDUSA_ADMIN_PASSWORD} || true) && npm run start"]
