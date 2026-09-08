# 🚀 Advanced Storefront Features (Next.js 16)

The Next.js storefront incorporates several advanced production-ready features focused on performance, security, and search engine optimization.

---

## 📱 Progressive Web App (PWA) & Offline Support

The storefront is configured as a fully installable Progressive Web App (PWA).

* **Configuration**: Managed via `@ducanh2912/next-pwa` in `store/next.config.js`.
* **Manifest**: The `store/src/app/manifest.ts` file dynamically generates the web app manifest, defining icons, theme colors, and display modes.
* **Offline Fallback**: When users lose internet connection, the service worker serves a custom offline page located in `store/src/app/~offline/page.tsx`.

*Note: The PWA service worker registration is automatically disabled in development mode (`NODE_ENV === "development"`) to prevent caching issues while coding.*

---

## 🔒 Enterprise-Grade Security Headers

To protect the storefront against common web vulnerabilities (like Cross-Site Scripting and Clickjacking), strict HTTP security headers are injected globally via `next.config.js`.

These include:
- `Strict-Transport-Security` (HSTS): Enforces HTTPS connections.
- `X-XSS-Protection`: Blocks cross-site scripting attacks.
- `X-Frame-Options: SAMEORIGIN`: Prevents clickjacking by restricting iframe embedding.
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
- `Content-Security-Policy` (CSP): Strictly controls which external scripts, images, and fonts are allowed to load.

---

## 🕷️ Dynamic SEO & Hybrid XML Sitemap

The storefront features an advanced SEO architecture that aggregates data from multiple microservices to generate a unified, multi-region XML Sitemap.

Located at `store/src/app/sitemap.ts`, the logic performs concurrent fetches:
1. **Static Routes**: Maps base pages (`/about`, `/contact`, `/faq`) across all active regions.
2. **Medusa Products**: Fetches the entire product catalog from the Medusa backend and maps URLs (e.g., `/en/products/[handle]`) with their last modified timestamps.
3. **Strapi Blog Posts**: Queries Strapi CMS for all published blog articles and appends them to the sitemap.

This ensures Google and other search engines instantly discover newly added products and articles without any manual sitemap updates.
