# ⚛️ Storefront Developer Guide (Next.js 16)

The storefront application is located in `store/`, built using **Next.js 16 App Router** and **TypeScript**.

---

## 📁 Source Directory Structure (`store/src/`)

```
store/src/
├── app/                  # Next.js App Router pages & layouts
│   ├── [locale]/         # i18n dynamic routing (fa, en, etc.)
│   │   ├── (main)/       # Main store pages (home, shop, product, account)
│   │   └── checkout/     # Checkout flow pages
│   └── api/              # API Route Handlers for Revalidation & Webhooks
├── modules/              # Modular UI components
│   ├── blocks/           # Loomix Blocks renderer and dynamic block components
│   ├── cart/             # Shopping cart state & drawer
│   ├── checkout/         # Shipping forms, delivery options, and payment gateways
│   ├── common/           # Generic components (Header, Footer, Buttons, Modals)
│   ├── products/         # Product card, image gallery, color option swatches
│   └── store/            # Store layout, sidebar filters, sorting controls
├── lib/                  # API Clients & Utilities
│   ├── medusa-client/    # Medusa JS SDK client
│   ├── strapi-client/    # Strapi REST client
│   └── meilisearch/      # Meilisearch query client
├── hooks/                # Custom React Hooks
└── i18n/                 # Localization configuration
```

---

## 🌐 Localization & RTL/LTR Support (i18n)

The storefront is fully integrated with `next-intl` to provide native support for both Right-to-Left (RTL - Persian/Arabic) and Left-to-Right (LTR - English) languages.

### Routing & Translation Files
* **Route pattern**: `/[locale]/store` (e.g., `/fa/store` or `/en/store`).
* **Default locale**: Configured via `DEFAULT_LOCALE=en` (or `fa`) in `.env`.
* **Static UI strings**: Stored as JSON files in `store/messages/` (e.g., `fa.json`, `en.json`).

### Dynamic Direction & Typography (`layout.tsx`)
The root layout (`src/app/[locale]/layout.tsx`) dynamically injects the `dir` attribute and swaps Tailwind font families based on the active locale. For instance, using `font-vazir` for RTL languages and `font-inter` for LTR:

```tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  const dir = locale === 'fa' || locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body className={dir === 'rtl' ? 'font-vazir' : 'font-inter'}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

---

## 🛍️ Product Rendering & Filtering Engine

1. **Store Catalog (`/store`)**:
   - Product listings are fetched via React Server Components directly from Meilisearch.
   - Sidebar filters (`store/src/modules/store/components/filter-sidebar.tsx`) support color swatches (`color` key), price ranges, and categories.
   - Selecting a color swatch filters results dynamically via search URL parameters.

2. **Product Details Page (`/products/[handle]`)**:
   - Fetches full product variant metadata from Medusa API.
   - Supports dynamic option selector (`color`, size, etc.).
   - "Add to Cart" triggers Next.js Server Actions updating cart session cookies.

---

## 🛒 Cart & Checkout Management

* **Cart Session**: Cart ID stored securely in HTTP cookies.
* **Shipping Calculation**: In checkout, configurable shipping options calculate rates based on delivery zone, address, and total parcel weight.
* **Payment Processing**: Integrated Stripe Elements for cards, digital wallets (Apple Pay, Google Pay), and PayPal via Stripe APMs. See [Payment Gateways Guide](15-payment-gateways-stripe-paypal.md).

---

## ⚡ Cache Management & On-Demand Revalidation

Next.js Server Components cache fetched API responses. Webhooks at `store/src/app/api/revalidate/route.ts` trigger `revalidateTag` when content is updated in Strapi or Medusa.
