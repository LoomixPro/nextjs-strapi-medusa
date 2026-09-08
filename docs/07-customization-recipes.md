# 🛠️ Developer Customization Recipes

This guide provides practical, code-level recipes for extending or customizing the codebase.

---

## 📖 Recipe 1: Adding a Custom API Endpoint & Workflow in Medusa v2

To expose a custom REST endpoint (e.g., "Daily Deals"):

### Step 1: Create Workflow in `store-admin/src/workflows/daily-deals.ts`
```typescript
import { createWorkflow, createStep, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk";

const fetchDealsStep = createStep("fetch-deals-step", async () => {
  const deals = [{ id: "deal_1", title: "Daily Flash Sale", discount: "25%" }];
  return new StepResponse(deals);
});

export const getDailyDealsWorkflow = createWorkflow("get-daily-deals", function () {
  const deals = fetchDealsStep();
  return new WorkflowResponse(deals);
});
```

### Step 2: Define API Route Handler in `store-admin/src/api/store/daily-deals/route.ts`
```typescript
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getDailyDealsWorkflow } from "../../../workflows/daily-deals";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { result } = await getDailyDealsWorkflow(req.scope).run();
  res.json({ deals: result });
}
```

---

## 📖 Recipe 2: Building & Registering a New Loomix Block Component

To add a new dynamic UI block (e.g., "Countdown Banner"):

### Step 1: Create Schema in Strapi
In Strapi Content-Type Builder, create a new Component under group `blocks` named `countdown` (fields: `title`, `target_date`, `bg_color`).

### Step 2: Create React Component in `store/src/modules/blocks/countdown-block.tsx`
```tsx
interface CountdownProps {
  title: string;
  target_date: string;
  bg_color?: string;
}

export default function CountdownBlock({ title, target_date, bg_color }: CountdownProps) {
  return (
    <div className="py-8 text-center" style={{ backgroundColor: bg_color || "#f3f4f6" }}>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground">Ends: {target_date}</p>
    </div>
  );
}
```

### Step 3: Register in `store/src/modules/blocks/registry.ts`
```typescript
const CountdownBlock = dynamic(() => import("./countdown-block"));

export const blockRegistry = {
  // ... existing blocks
  "blocks.countdown": CountdownBlock,
};
```
*Once registered, adding this component in Strapi immediately renders it on the storefront!*

---

## 📖 Recipe 3: Configuring Product Option Translations & Color Swatches

### 🎨 1. Color Option Naming
1. In Medusa Admin (**Products** > **Options**), set the option title to **`color` (or `Color`)**.
2. Set variant values using standard color names or hex values (e.g. `#ff0000` or `Red`).
3. The Next.js storefront automatically renders visual color swatch circles and color filters based on the `color` key.

### 🌐 2. Option Translations via Strapi
1. In Strapi CMS, define option label translation mappings per locale.
2. For other options (Size, Material, etc.), any option title can be used.
3. Next.js fetches translated labels based on the active locale, preserving color filtering functionality.

---

## 📖 Recipe 4: Integrating a Custom Payment Provider

1. Implement `AbstractPaymentProvider` in `store-admin/src/modules/payment/`.
2. Register the provider in `medusa-config.ts` under the payment module config.
3. Add the payment option UI component in `store/src/modules/checkout/components/payment/`.
