# ============================================================
# Strapi v5 Dockerfile — Multi-stage Production Build
# بر اساس مستندات رسمی Strapi v5
# ============================================================

# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS build

# میرور آروان کلود (ایران) — پایدارترین میرور Alpine در ایران
RUN echo "https://mirror.arvancloud.ir/alpine/v$(cat /etc/alpine-release | cut -d. -f1,2)/main" > /etc/apk/repositories \
 && echo "https://mirror.arvancloud.ir/alpine/v$(cat /etc/alpine-release | cut -d. -f1,2)/community" >> /etc/apk/repositories

RUN apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips git > /dev/null 2>&1

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/
COPY package.json package-lock.json ./
RUN npm install -g node-gyp \
 && npm config set fetch-retry-maxtimeout 600000 -g \
 && npm ci

ENV PATH=/opt/node_modules/.bin:$PATH

WORKDIR /opt/app
COPY . .
ENV NODE_ENV=production
RUN npm run build

# ── Stage 2: Production runner ──────────────────────────────
FROM node:20-alpine

# میرور آروان برای runtime
RUN echo "https://mirror.arvancloud.ir/alpine/v$(cat /etc/alpine-release | cut -d. -f1,2)/main" > /etc/apk/repositories \
 && echo "https://mirror.arvancloud.ir/alpine/v$(cat /etc/alpine-release | cut -d. -f1,2)/community" >> /etc/apk/repositories \
 && apk add --no-cache vips

ENV NODE_ENV=production

WORKDIR /opt/app

# کپی کل app از مرحله build (مثل نسخه اصلی که کار می‌کرد)
# این روش dist/ و config/ و src/ را همه با هم کپی می‌کند
COPY --from=build /opt/app ./

# نصب فقط production dependencies
RUN npm ci --omit=dev && npm cache clean --force

RUN chown -R node:node /opt/app
USER node

EXPOSE 1337

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:1337/_health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "run", "start"]
