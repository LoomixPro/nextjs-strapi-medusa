# 🧩 Loomix Blocks Dynamic Component Engine & Registry

The **Loomix Blocks** dynamic component engine establishes seamless, modular binding between Strapi CMS Dynamic Zones and Next.js frontend React components.

---

## 💡 Architecture & Execution Pipeline

```
[ Strapi CMS Dynamic Zone ] 
      | (Returns JSON payload with __component: "blocks.hero-banner" & style: "style-3")
      v
[ Next.js BlockRenderer ] 
      | (Looks up key in Component Registry Map & automatically imports style)
      v
[ HeroBanner Style 3 React Component ] 
      | (Renders UI dynamically with passed props)
      v
[ Final DOM Output in Browser ]
```

---

## 🎨 Creating New Block Style Variants (Automatic Component Loading)

To add a new visual style variant (e.g. `style-3.tsx`) to an existing block:

1. Navigate to the block's styles directory (e.g. `src/modules/home/components/ProductShowcase/styles/`).
2. Create a new file `style-3.tsx` with your custom React design and props typing.
3. **Automatic Binding**: The parent component automatically resolves and loads `style-3.tsx` based on `block.style` without modifying core rendering logic.
4. **Strapi CMS Entry**: In Strapi CMS, simply enter `style-3` directly into the block's `style` text field (all style fields in Strapi are flexible `string`/text inputs, so no manual enum or schema modification is needed).

```tsx
// src/modules/home/components/ProductShowcase/styles/style-3.tsx
import React from "react"
import { ProductShowcaseProps } from "../types"

export default function ProductShowcaseStyle3({ block, products }: ProductShowcaseProps) {
  return (
    <section className="py-12 bg-gradient-to-r from-gray-900 to-black text-white">
      <h2 className="text-2xl font-bold mb-6">{block.title}</h2>
      {/* Custom Style 3 Layout */}
    </section>
  )
}
```

---

## 📥 Managing & Synchronizing Blocks from Strapi Dashboard

All component additions, deletions, and live style synchronization are handled directly through the **Strapi Admin Storefront Management Dashboard**, eliminating the need for terminal commands or CLI tools:

### Storefront Management Dashboard Workflow
1. Go to Strapi Admin > **Storefront Management**.
2. Select the target **Component** from the dropdown menu (e.g. `Home - Product Showcase`).
3. In the **Styles Inspector**, preview installed and available styles visually.
4. Click **+ Add to Storefront (Queue)** to queue installation or **Remove Style (Queue)** to queue removal.
5. Review queued items in the **Pending Updates** section (with instant Undo support).
6. Click **Update Storefront**. Strapi automatically:
   - Exports the latest active layout and theme preset to `storefront-settings.json`.
   - Dispatches a GitHub Actions `repository_dispatch` event in production.
   - GitHub CI/CD pulls the components, commits them to the repository, compiles the new production image, and performs a zero-downtime container swap.

> [!TIP]
> **Automatic Settings Preset Sync**  
> When clicking **Update Storefront**, Strapi automatically synchronizes your storefront settings preset before initiating the build. Next.js bundles `storefront-settings.json` during the build, ensuring that on the **very first page load immediately after deployment**, the site renders with 100% accurate layouts and styles with zero layout shift or hydration delay.

> [!NOTE]
> **Local Development Fallback**  
> When developing locally (`NODE_ENV=development`), clicking Add/Remove in the dashboard writes directly to your local storefront files and automatically falls back to your local `Loomix-registry/` (or `loom-blocks-registry/`) directory if offline.

---

## ⚙️ Component Registry Configuration

By default, the project connects to the official public open-source Loomix Blocks Registry. You can also build your own team registry:

```env
# Default: Official public Loomix Blocks Registry (No token required)
REGISTRY_URL=https://raw.githubusercontent.com/Loomix-pro/Loomix-registry/main/src/modules

# Optional: If you use your own private GitHub registry repository:
# GITHUB_PAT=github_pat_your_personal_access_token
```
