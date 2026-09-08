# 📦 E-Commerce Backend Guide (Medusa v2)

The e-commerce backend service is located in `store-admin/`, built on **Medusa.js v2 (v2.15.5)**.

---

## 📂 Source Directory Structure (`store-admin/src/`)

```
store-admin/src/
├── admin/               # Custom Medusa Admin Dashboard UI components & widgets
├── api/                 # Custom REST API endpoints (Store & Admin routes)
├── jobs/                # Scheduled CRON jobs
├── links/               # Medusa v2 Cross-Module Link definitions (`defineLink`)
├── modules/             # Custom database modules & services
├── scripts/             # Database seed scripts & CLI utilities
├── subscribers/         # Redis Event Bus subscribers
└── workflows/           # Medusa v2 Workflows API business logic
```

---

## 🔗 Medusa v2 Cross-Module Link Definitions (`defineLink`)

In Medusa v2, independent data modules are coupled via link definitions located in `store-admin/src/links/`:

- `product-strapi.ts`: Binds Medusa Product IDs to Strapi Content IDs.
- `review-product.ts`: Binds Product Reviews to Medusa Products.
- `question-product.ts`: Binds Product Questions to Medusa Products.
- `wishlist-customer.ts`: Binds Customer Wishlists to Medusa Customer accounts.
- `wishlist-item-product-variant.ts`: Binds Wishlist items to Product Variants.

```typescript
// store-admin/src/links/review-product.ts
import { defineLink } from "@medusajs/framework/modules-sdk"
import ProductModule from "@medusajs/medusa/product"
import ProductReviewModule from "../modules/product-review"

export default defineLink(
  ProductModule.linkable.product,
  ProductReviewModule.linkable.productReview
)
```

---

## ⚡ CLI Utilities & Database Seeding Scripts

CLI utility scripts located in `store-admin/src/scripts/` simplify data management:

* **Initial Database Seeding**:
  ```bash
  npm run seed
  ```
* **Inject 30 Demo Products with Variants & Pricing**:
  ```bash
  npx medusa exec ./src/scripts/seed-30-products.ts
  ```
* **Force Full Re-Index of Products into Meilisearch**:
  ```bash
  npx medusa exec ./src/scripts/sync-meilisearch.ts
  ```
* **Purge All Catalog Products**:
  ```bash
  npx medusa exec ./src/scripts/delete-all-products.ts
  ```

---

## ⚙️ Custom Modules & Integrations

### 1. Iran Post Shipping Plugin (`medusa-fulfillment-iran-post`)
* Custom fulfillment provider integrated into Medusa's shipping engine.
* Dynamically calculates postal rates based on origin/destination province and total weight.

### 2. SMS OTP Authentication
* Allows customers to register and authenticate using mobile numbers.
* Custom module located in `store-admin/src/modules/` supporting Iranian SMS providers (Kavenegar, Melipayamak) and Twilio.
* Stores and expires OTP verification codes in Redis.

### 3. MinIO S3 File Storage Integration
* Handles image uploads via `@medusajs/file-s3` plugin configured in `medusa-config.ts`.

---

## 📧 Email & Notification Providers (Nodemailer SMTP & SendPulse)

Configure environment keys in `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_ADDRESS=noreply@yourdomain.com
CONTACT_FORM_RECIPIENT=info@yourdomain.com
SENDPULSE_API_ID=your_sendpulse_id
SENDPULSE_API_SECRET=your_sendpulse_secret
```

---

## 💳 Payment Providers (Stripe & PayPal)

Medusa v2 is equipped with the `@medusajs/payment` module configured in `store-admin/medusa-config.ts`:

- **Stripe (`@medusajs/payment-stripe`)**: Handles credit/debit cards, Apple Pay, Google Pay, iDeal, Bancontact, and integrated PayPal.
- **Manual (`pp_system_default`)**: Built-in fallback provider for offline orders (Cash on Delivery / Wire Transfer) and demo sandboxes.

For complete integration instructions, webhook setup, and test card credentials, refer to:
👉 **[Payment Gateways Guide (Stripe & PayPal)](15-payment-gateways-stripe-paypal.md)**

