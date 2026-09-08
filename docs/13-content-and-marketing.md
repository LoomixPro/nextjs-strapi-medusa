# 📝 Content & Marketing Features

The platform provides robust integrations for content managers and marketing teams, ensuring high flexibility without compromising security or performance.

---

## 👁️ Live CMS Preview (Next.js Draft Mode)

The storefront features full integration with **Strapi's Preview System** via **Next.js Draft Mode**. This allows content editors to securely preview unpublished draft content (e.g., blog posts or dynamic blocks) directly on the actual Next.js frontend before making it public.

### How it works:
1. **Initiation**: The editor clicks "Preview" inside the Strapi admin panel.
2. **Secure Validation**: Strapi redirects the browser to `store/src/app/api/preview/route.ts` with a signed URL containing `REVALIDATE_SECRET`.
3. **Draft Mode Enablement**: The route securely validates the HMAC hash using `node:crypto`. If valid, it enables Next.js Draft Mode via `draftMode().enable()`, setting a secure session cookie.
4. **Live Rendering**: The browser is redirected to the corresponding frontend page, which detects Draft Mode and fetches the `draft` version of the content directly from the API.

*Configuration*: Both the Strapi preview integration and ISR Webhooks share the single `REVALIDATE_SECRET` defined in your `.env`.

---

## 📨 Newsletter Integration & Anti-Spam Rate Limiting

The newsletter subscription endpoint (`store/src/app/api/newsletter/route.ts`) connects directly to the **SendPulse** marketing CRM.

### Security via Rate Limiting
To protect the database and third-party API limits from bot abuse or spam submissions, the endpoint utilizes a custom IP-based **Rate Limiter**.

- **Maximum Attempts**: 2 requests
- **Time Window**: 1 hour (60 * 60 * 1000 ms)
- **Tracking Mechanism**: The user's IP is extracted from the `x-forwarded-for` header and checked against an internal memory cache limit.
- If the limit is exceeded, the server responds with a `429 Too Many Requests` status, stopping spam at the edge.

### Environment Setup:
To enable the SendPulse integration, add the following to your `.env`:
```env
SENDPULSE_API_ID=your_api_id
SENDPULSE_API_SECRET=your_api_secret
SENDPULSE_BOOK_ID=your_target_mailing_list_id
```
