# 📦 Custom Medusa v2 Modules & Features

The **Next-Strapi-Medusa** platform includes several built-in custom Medusa v2 modules, subscribers, and edge middleware workflows tailored for rich e-commerce experiences.

---

## ⭐️ 1. Product Reviews Module (`product-review`)

Located in `store-admin/src/modules/product-review/`, this module allows customers to submit 1-5 star ratings, review titles, comments, and reaction votes (likes/dislikes).

* **Workflow**: `create-review.ts`, `toggle-review-reaction.ts`
* **API Endpoint**: `POST /api/store/reviews`

---

## 💬 2. Product Q&A Module (`product-question`)

Located in `store-admin/src/modules/product-question/`, this module enables customers to ask questions prior to purchasing. Answers can be provided by administrators via admin widgets or other users.

---

## 💖 3. Customer Wishlist Module (`wishlist`)

Located in `store-admin/src/modules/wishlist/`, this module allows authenticated customers to save favorite product variants to a personal wishlist.

---

## 🚚 4. Iran Post Shipping Plugin (`medusa-fulfillment-iran-post`)

The custom fulfillment provider plugin calculates live postal rates (Pishtaz & Safarishi) dynamically in the checkout step based on parcel weight, origin, and destination province/city.

---

## 🔄 5. Strapi 2-Way Product Sync Workflows

Medusa v2 Workflows (`create-product-in-strapi.ts`, `update-product-in-strapi.ts`, `handle-strapi-webhook.ts`) ensure seamless bi-directional synchronization between Medusa and Strapi CMS databases.

---

## 🔔 6. Order Lifecycle Events & Event Subscribers

Subscribers in `store-admin/src/subscribers/` automate notifications and workflows throughout the order lifecycle:

* `order-placed.ts`: Sends order confirmation SMS & emails immediately post-payment.
* `order-shipment-created.ts`: Dispatches tracking codes via SMS to customers.
* `return-requested.ts` & `return-received.ts`: Customer product return workflow handling.
* `order-canceled.ts` & `refund-created.ts`: Automated cancellation & refund notifications.

---

## 🌐 7. Next.js 16 Request Proxy & Multi-Region Currency Resolution (`proxy.ts`)

In **Next.js 16**, the legacy middleware pattern has been replaced by the modern proxy architecture in `store/src/proxy.ts` using the exported `proxy(request)` handler. It intercepts incoming traffic, inspects the URL path or geolocation IP headers, resolves the matching Medusa region and currency, and manages `_medusa_cache_id` and localization session cookies seamlessly.
