# 🏗️ System Architecture & Data Flow

The **Next-Strapi-Medusa** platform uses a **Decoupled Microservice Architecture**, separating frontend rendering, e-commerce core logic, and content management for maximum scalability, security, and performance.

---

## 🏛️ Triple-Engine Topology

```
                                  [ User Browser ]
                                         |
                                         v
                              [ Caddy Reverse Proxy ]
                                         |
                                         v
                            [ Next.js 16 Storefront ]
                             (Server & Client Components)
                                   /           \
                                  /             \
                                 v               v
             [ Medusa v2 E-Commerce Engine ]   [ Strapi CMS Content Engine ]
             - Products & Variants             - Dynamic Page Layouts
             - Cart, Checkout & Orders         - Blog Posts & Banners
             - Iran Post Shipping & OTP        - Product Option Translations
             - Customer Accounts               - Site Settings & Menus
                   |        |                        |
                   |        +-------------------+    |
                   v                            v    v
            [ PostgreSQL DB ]                 [ MinIO S3 Storage ]
            [ Redis Event Bus ]               (Uploaded Images & Media)
            [ Meilisearch Engine ]
```

---

## 🔄 Data Synchronization Workflows

### 1. Product Indexing Pipeline (Medusa -> Meilisearch -> Next.js)
1. **Product Mutation**: Administrator creates/updates a product variant in Medusa Admin.
2. **Redis Event Subscriber**: Medusa emits `product.created` or `product.updated` event over Redis event bus.
3. **Meilisearch Indexer**: Subscriber formats product prices, options, categories, and tags, indexing them into Meilisearch index `products`.
4. **Frontend Search**: Next.js Storefront queries Meilisearch directly for instant search, category listings, and color filtering.

---

### 2. Dynamic Page Composition Pipeline (Strapi -> Loomix Blocks -> Next.js)
1. **Content Layout in Strapi**: Content manager composes a page layout using **Dynamic Zones** in Strapi CMS.
2. **API Retrieval**: Next.js Storefront fetches page JSON payload from Strapi REST API via Server Components.
3. **Loomix Blocks Rendering**: `BlockRenderer` inspects `__component` keys and maps them dynamically to React components.
4. **Cache Revalidation**: Webhooks trigger Next.js `revalidateTag` to purge cached pages immediately upon publishing.

---

### 3. Media & File Handling (MinIO S3)
* Media uploaded in Strapi and Medusa is stored in an S3-compatible **MinIO** object storage container.
* Public URLs are served via reverse proxy or CDN endpoint.

---

## 🔒 Security & Authentication Architecture

### 1. API Token Hierarchy:
- **`STRAPI_API_TOKEN_FOR_MEDUSA`**: `Full Access` token for internal cross-service operations.
- **`STRAPI_API_TOKEN_FOR_FRONT`**: `Read-Only` token for public content fetching.
- **`MEDUSA_PUBLISHABLE_KEY`**: Public token bound to default sales channel for storefront cart operations.
- **`MEILI_SEARCH_KEY`**: Read-only Search key exposed to browser client for fast queries.

### 2. User Authentication:
- **SMS OTP**: One-Time Password registration & authentication via Iranian SMS providers or Twilio.
- **JWT & HTTP-Only Cookies**: Secure session token storage preventing XSS vulnerabilities.
