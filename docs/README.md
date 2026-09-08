# 📚 Loomix Commerce — Developer Documentation Portal
## Next.js 16 + Strapi CMS + Medusa v2 Composable E-Commerce Platform

Welcome to the technical developer documentation for the **Loomix Commerce** enterprise e-commerce platform. This documentation is structured to help software developers understand the system architecture, run local/production environments, and easily extend or customize features.

---

## 🗺️ Documentation Modules

1. 🚀 **[Quickstart & Environment Setup](01-quickstart-and-setup.md)**  
   System prerequisites, environment variables (`.env`) matrix, and phased Docker Compose setup.

2. 🏗️ **[System Architecture & Data Flow](02-architecture-and-data-flow.md)**  
   Triple-engine architecture topology, service communication, data synchronization, security, and API tokens.

3. ⚛️ **[Storefront Guide (Next.js 16)](03-storefront-nextjs.md)**  
   App Router layout, internationalization (i18n), cart & checkout flows, Server Actions, and cache revalidation.

4. 📦 **[E-Commerce Backend Guide (Medusa v2)](04-medusa-backend.md)**  
   Medusa v2 framework modules, custom workflows, event subscribers, SMS/OTP authentication, and Iran Post shipping integration.

5. 📝 **[Content Management System (Strapi CMS)](05-strapi-cms.md)**  
   Content Types, dynamic page builder, S3/MinIO media upload, webhooks, and **Product Option Translations & Color Swatches**.

6. 🧩 **[Loomix Blocks Dynamic Engine](06-loom-blocks-system.md)**  
   Modular block architecture, component registry mapping, Strapi Storefront Management dashboard, and dynamic UI rendering.

7. 🛠️ **[Customization & Extension Recipes](07-customization-recipes.md)**  
   Step-by-step developer guides: adding Medusa workflows, creating custom Loomix blocks, option translations, and payment gateways.

8. 🌐 **[DevOps & VPS Deployment Guide](08-devops-and-deployment.md)**  
   VPS sizing, phased Docker deployment, Caddy reverse proxy with auto-HTTPS SSL, and Umami web analytics.

9. 🔍 **[Troubleshooting & FAQ](09-troubleshooting-and-faq.md)**  
   Fixing CORS issues, product visibility, color swatch debugging, Linux Swap configuration, and database migrations.

10. 📦 **[Custom Medusa v2 Modules & Features](10-custom-modules.md)**  
   Product reviews, Q&A, customer wishlist system, Iran Post shipping plugin, and 2-way Strapi sync workflows.

11. 🚀 **[Advanced Storefront Features](11-advanced-storefront-features.md)**  
   Next.js PWA setup, Enterprise Security Headers (CSP/HSTS), and dynamic multi-region XML Sitemaps.

12. 🛠️ **[Developer Utilities & Scripts](12-developer-utilities.md)**  
   Batch Image Optimizer (`image-optimizer`) utilizing Sharp for WebP conversion.

13. 📝 **[Content & Marketing Features](13-content-and-marketing.md)**  
   Live CMS Preview (Strapi + Next.js Draft Mode) and SendPulse Newsletter Integration with Rate Limiting.

14. 🛡️ **[Backend Security & Rate Limiting](14-security-and-rate-limiting.md)**  
   Advanced Medusa middleware logic utilizing intelligent `countOn` strategies to prevent SMS Bombing and Brute-Force attacks.

15. 💳 **[International Payment Gateways (Stripe & PayPal)](15-payment-gateways-stripe-paypal.md)**  
   Stripe Elements setup, Apple Pay / Google Pay, PayPal via Stripe APMs, sandbox test cards, and webhook event management.

---

## 🧑‍💻 Content Editor & Admin Guides

For store managers and content editors, please refer to the dashboard usage guides:

1. 🛒 **[Medusa Dashboard User Guide](editor-guides/01-medusa-admin-guide.md)**  
   Managing products, categories, shipping regions, and connecting to official standard documentation.

2. 📝 **[Strapi CMS User Guide](editor-guides/02-strapi-cms-guide.md)**  
   Comprehensive guide to using Single/Collection types, configuring global settings, building the dynamic homepage with Loomix Blocks, and style references for visual sections.

---

## 🛠️ High-Level Topology

```
                           +------------------------+
                           |  Next.js 16 Storefront |
                           |      (Port 8000)       |
                           +-----------+------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
     +---------------------------+           +---------------------------+
     |   Medusa 2.x E-Commerce   |           |    Strapi Headless CMS    |
     |        (Port 9000)        |           |        (Port 1337)        |
     +-------------+-------------+           +-------------+-------------+
                   |                                       |
       +-----------+-----------+               +-----------+-----------+
       |           |           |               |           |           |
       v           v           v               v           v           v
  +--------+  +---------+  +---------+    +--------+  +---------+  +---------+
  |Postgres|  |  Redis  |  | Meili   |    |Postgres|  |  MinIO  |  | Reval   |
  |  DB    |  |  Cache  |  | (internal)   |  DB    |  | S3 Store|  | Webhook |
  +--------+  +---------+  +---------+    +--------+  +---------+  +---------+
```

**Deployment entry point:** [../README.md](../README.md) (phased Docker guide)
