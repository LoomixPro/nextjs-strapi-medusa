# 📝 Content Management System Guide (Strapi CMS)

The CMS backend service is located in `website-admin/`, built using **Strapi CMS (v4/v5)**.

---

## ⚡ Force-Caching & On-Demand Cache Revalidation

In the Next.js App Router, cached `fetch` requests use `{ cache: 'force-cache' }` by default to achieve fast page load times. 

To keep the storefront content synchronized in real-time when editors publish changes in Strapi CMS, an **On-Demand Cache Revalidation** architecture is implemented.

---

## ⚙️ Configuring Strapi Webhooks & Security Headers

In Strapi Admin Dashboard under **Settings** > **Webhooks**, configure the following endpoints for instant ISR cache revalidation:

| # | Name | Endpoint URL | Events | Description |
|---|---|---|---|---|
| 1 | **home-page** | `/api/revalidate/home-page` | `Delete, Publish, Unpublish` | Invalidates homepage blocks & layout cache |
| 2 | **settings** | `/api/revalidate/strapi-settings` | `Delete, Publish, Unpublish` | Invalidates global storefront settings & dictionary translations |
| 3 | **blog** | `/api/revalidate/blog` | `Delete, Publish, Unpublish` | Invalidates blog articles and blog list cache |
| 4 | **pages** | `/api/revalidate` | `Create, Update, Delete` | Generic cache purging for dynamic pages and collections |
| 5 | **menu** | `/api/revalidate/menu` | *(Manual Trigger)* | Purges navigation menu cache when modified in Navigation plugin |

> **Note**: In Docker, use `http://storefront:8000/...` or public domain `https://yourdomain.com/...`.

### 🔑 Security Secret & Header Setup:
- **Environment Variable**: Set your secret key in `.env` under `REVALIDATE_SECRET` (e.g., `my_super_secret_revalidate_token`).
- **Header Name**: You **must** add a custom header named **`x-strapi-secret`** in the Strapi Webhook settings headers section.
- **Header Value**: Set the header value to match your `REVALIDATE_SECRET` token.
- *(Alternative method: Pass the secret as a URL query parameter: `?secret=my_super_secret_revalidate_token`)*.

---

## 🔒 Timing-Safe Secret Validation in Next.js

The route handler `store/src/app/api/revalidate/route.ts` enforces timing-safe secret comparison to prevent timing attacks:

```typescript
import crypto from "node:crypto"
import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

function isValidSecret(providedSecret: string | null): boolean {
  if (!providedSecret || !process.env.REVALIDATE_SECRET) return false
  const actual = new Uint8Array(crypto.createHash("sha256").update(providedSecret).digest())
  const expected = new Uint8Array(crypto.createHash("sha256").update(process.env.REVALIDATE_SECRET).digest())
  return crypto.timingSafeEqual(actual, expected)
}

export async function POST(request: NextRequest) {
  // Extract secret from custom header x-strapi-secret or query parameter
  const secret = request.headers.get("x-strapi-secret") || request.nextUrl.searchParams.get("secret")

  if (!isValidSecret(secret)) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 })
  }

  const body = await request.json()
  
  if (body.model) {
    revalidateTag(`strapi-${body.model}`)
  }

  return NextResponse.json({ revalidated: true, now: Date.now() })
}
```

---

## 🎨 Product Option Translations & Color Swatches

### ⚠️ 1. Color Option Naming Convention (`color`)
* **Strict Rule**: In Medusa Admin, the option title for color **must strictly be named `color` (or `Color`)**.
* **Reason**: The Next.js storefront inspects the `color` key to render visual color swatch circles and enable color filters.

### 🌐 2. Option Translation via Strapi
Since Medusa options are stored in a single locale by default, Strapi acts as the translation layer:
1. Option titles and values are mapped in Strapi per locale.
2. Next.js fetches translated labels based on active locale while preserving `color` key for UI rendering.

---

## ☁️ Media Uploads via MinIO S3

Uploaded media files are stored in MinIO S3 via `@strapi/provider-upload-aws-s3`.
- **Docker Internal Endpoint**: `http://minio:9000`
- **Public Asset URL**: `MINIO_PUBLIC_URL`
