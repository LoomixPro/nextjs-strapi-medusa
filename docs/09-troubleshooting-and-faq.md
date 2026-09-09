# 🔍 Troubleshooting & FAQ

Common troubleshooting scenarios and resolution steps for developers building or deploying the platform.

---

## 🛑 1. CORS Errors (Cross-Origin Resource Sharing)

### Symptom:
Browser console throws `Access to fetch at 'http://localhost:9000' from origin 'http://localhost:8000' has been blocked by CORS policy`.

### Solution:
1. Open `.env` file on host/server.
2. Ensure public URLs match how you access the site:
   ```env
   STOREFRONT_PUBLIC_URL=http://localhost:8000
   MEDUSA_BACKEND_PUBLIC_URL=http://localhost:9000
   ```
3. Either leave CORS empty (Docker auto-derives from public URLs) or set explicitly:
   ```env
   STORE_CORS=http://localhost:8000,https://yourdomain.com
   ADMIN_CORS=http://localhost:9000,https://api.yourdomain.com
   AUTH_CORS=http://localhost:8000,http://localhost:9000,https://yourdomain.com
   ```
4. Restart Medusa container:
   ```bash
   docker compose restart medusa
   ```

---

## 🛑 2. Products Not Appearing on Storefront

### Cause 1: Publishable API Key Unattached to Sales Channel
- Log into Medusa Admin (`http://localhost:9000/app`).
- Go to **Settings** > **Publishable API Keys**.
- Select your key, navigate to **Sales Channels**, and attach `Default Sales Channel`.

### Cause 2: Meilisearch Index Out of Sync
- Verify Meilisearch container is healthy (`docker compose ps`).
- Check `MEILI_SEARCH_KEY` in `.env` (must not equal `MEILI_MASTER_KEY`).

### Cause 3: Storefront built before keys were set
- After updating `MEDUSA_PUBLISHABLE_KEY` or `MEILI_SEARCH_KEY`, rebuild:
  ```bash
  docker compose up -d --build storefront
  ```

---

## 🛑 3. Color Swatch Filter Not Working

### Cause:
The product option title in Medusa is not set to `color`.

### Solution:
* Ensure option title is set to **`color`** or **`Color`** in Medusa Admin. Configure option translations in Strapi CMS for target locales instead of renaming the base key in Medusa.

---

## 🛑 4. Docker Build Memory Crash (Out of Memory / Killed)

### Symptom:
Build process terminates with `Killed` or `Code 137`.

### Solution:
1. Follow **Phased Deployment** instructions in [Quickstart Guide](01-quickstart-and-setup.md).
2. Configure 4GB Linux Swap memory on VPS:
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

---

## 🛑 5. Adding New Block Styles on Live Production VPS

### Question:
When adding a new block style (via Loomix CLI) on a running production VPS, what happens? Does it crash, auto-rebuild, or stay unchanged?

### Behavior & Solution:
1. **No Server Crash**: Adding a new style `.tsx` file only places new source code on disk. It will **not** crash or interrupt the currently running Next.js application container.
2. **No Automatic Re-Build**: In production, Next.js executes pre-compiled JavaScript in `.next`. The new style will not appear live until a new build process is triggered.
3. **Zero-Downtime Update**: Trigger the GitHub Actions workflow or click **Update Storefront** in Strapi admin. For local development, run:

   ```bash
   node scripts/sync-loom-component.js add home/components/FeaturesBlock/style-4
   npm run dev --prefix store
   ```

---

## 🛑 6. Running Database Migrations

### For Medusa:
```bash
docker compose exec medusa npx medusa db:migrate
```

### For Strapi:
Strapi automatically synchronizes database schemas on server startup.

---

## 🛑 7. Meilisearch / Search Modal Frozen or Not Working in Production

### Symptoms:
1. **Search input frozen / Cannot type into search field:** Clicking the search icon opens the modal, but typing on the keyboard does nothing and the field stays empty.
2. **Search modal empty or store filters return no products.**
3. **CORS policy error on `/multi-search`:** Console displays `Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present`.

### Cause:
The storefront uses `@meilisearch/instant-meilisearch` and queries Meilisearch directly from the visitor's browser (client-side) at `NEXT_PUBLIC_MEILISEARCH_HOST` (e.g. `https://search.yourdomain.com`). If the `search` DNS record is missing in Cloudflare or CORS preflight headers are missing in Caddy, InstantSearch's controlled input state freezes and suppresses typing.

### Solution:
1. **Add `search` DNS Record in Cloudflare:**
   - In Cloudflare Dashboard > **DNS > Records**, add an `A` record:
     - Name: `search`
     - IPv4: `<Your VPS IP>`
     - Proxy status: **DNS Only** (Gray Cloud) for initial Caddy Let's Encrypt SSL issuance, or Proxied (Orange Cloud) with SSL mode set to **Full (Strict)**.
2. **Ensure CORS Headers are Enabled in `Caddyfile`:**
   ```caddy
   search.{$DOMAIN} {
       encode zstd gzip
       import security_headers
       import access_log

       @cors_preflight method OPTIONS
       handle @cors_preflight {
           header Access-Control-Allow-Origin "*"
           header Access-Control-Allow-Methods "GET, POST, OPTIONS"
           header Access-Control-Allow-Headers "*"
           header Access-Control-Max-Age "86400"
           respond "" 204
       }

       header {
           Access-Control-Allow-Origin "*"
           Access-Control-Allow-Methods "GET, POST, OPTIONS"
           Access-Control-Allow-Headers "*"
           defer
       }

       reverse_proxy meilisearch:7700
   }
   ```
   Reload Caddy: `docker compose restart caddy`
3. **Verify public Meilisearch connectivity:**
   ```bash
   curl -I https://search.yourdomain.com/health
   # Must return HTTP 200 OK
   ```
4. **Verify Search Keys & Rebuild Storefront:**
   - In `.env` / build secrets, ensure `NEXT_PUBLIC_MEILISEARCH_HOST=https://search.yourdomain.com` and `NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY` are provided.
   - Rebuild if variables changed: `docker compose up -d --build storefront`

---

## 🛑 8. Docker Permission Denied (`docker.sock`)

### Symptom:
```
permission denied while trying to connect to the docker API at unix:///var/run/docker.sock
```

### Cause:
Your Linux user is not in the `docker` group. This happens on **any fresh VPS, VM, or local Linux install** — not specific to this project.

### Solution:
```bash
sudo groupadd docker 2>/dev/null || true
sudo usermod -aG docker $USER
newgrp docker
docker ps
```

If it still fails, **log out and SSH back in** (group membership applies on new sessions).

### Temporary workaround (not recommended):
```bash
sudo docker compose up -d
```
Files created by root-owned containers can cause permission issues later — prefer the `docker` group fix.

---

## 🛑 9. Service `Started` but URL Not Loading (Strapi / Medusa)

### Symptom:
`docker compose up` shows `Started`, but `http://<IP>:9000` or `:1337` does not load in the browser.

### Cause:
**Build finished ≠ application ready.** Containers run migrations and boot steps *after* Docker marks them as started.

| Service | What runs on first start | Typical wait | Correct URL |
| --- | --- | --- | --- |
| **Strapi** | PostgreSQL schema sync + `npm run start` | 1–3 min | `http://<IP>:1337/admin` |
| **Medusa** | `db:migrate` → create admin user → `medusa start` | 2–5+ min | `http://<IP>:9000/app` |

### Solution:
```bash
docker compose logs -f medusa    # or strapi
docker compose ps                # wait for "healthy"
curl http://127.0.0.1:9000/health
curl http://127.0.0.1:1337/_health
```

- **Medusa Admin is at `/app`**, not the root URL.
- If logs show errors or the container **Restarting**, check `.env` secrets (`MEDUSA_JWT_SECRET`, `POSTGRES_PASSWORD`, etc.).
- From Windows, confirm VM IP with `ip a` on the server and that UFW allows the port: `sudo ufw allow 9000/tcp`.

---

## 🛑 10. Strapi Shows `unhealthy` but Logs Say "Started Successfully"

### Symptom:
`docker compose ps` shows Strapi as **unhealthy**, but logs contain:
```
Strapi started successfully
Welcome back!
```

### Cause:
Older images used a Docker `HEALTHCHECK` with `wget`, which is **not installed** in the Alpine runtime image. The server is fine; the health probe fails.

### Verify Strapi is actually running:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:1337/_health   # expect 204 or 200
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:1337/admin      # expect 200
```

If those return success codes, open the admin in your browser (Profile B: `https://admin.local/admin`) and continue deployment.

### Fix the false unhealthy status (optional):
Pull the latest code (healthcheck uses Node `fetch`) and rebuild:
```bash
git pull
docker compose up -d --build strapi
```

---

## 🛑 13. Storefront Build Fails — `ERESOLVE` React / `@medusajs/ui`

### Symptom:
```
peer react@"^18.3.1" from @medusajs/ui@4.1.15
Found: react@19.2.8
target storefront: failed to solve ... npm install ... exit code: 1
```

### Cause:
The storefront uses React 19; `@medusajs/ui` still declares React 18 peer deps. Plain `npm install` in Docker rejects the tree.

### Fix:
Ensure you have the latest code (`store/.npmrc` with `legacy-peer-deps=true` and Dockerfile uses `npm ci`). Then rebuild:

```bash
git pull
docker compose up -d --build storefront
```

---

## 🛑 11. Medusa Restart Loop — Stripe `apiKey` Missing

### Symptom:
```
Loaders for module Payment failed: Required option `apiKey` is missing in Stripe plugin
medusa exited with code 1 (restarting)
```
Migrations finish (`Migrations completed`), then the container crashes and Docker keeps restarting it.

### Cause:
Stripe was registered in Medusa config without a secret key. For portfolio/demo VMs you can leave Stripe empty — checkout uses the built-in **manual** provider (`pp_system_default`) from seed data.

### Solution (demo / no Stripe):

1. Leave `STRIPE_KEY=` empty in `.env` (default).
2. Pull the latest repo (includes optional Stripe loading) and **rebuild Medusa**:
   ```bash
   docker compose up -d --build medusa
   docker compose logs -f medusa
   ```
3. Open Medusa Admin at `http://<IP>:9000/app`.

### Solution (enable Stripe checkout):

1. Add your [Stripe test secret key](https://dashboard.stripe.com/test/apikeys) to `.env`:
   ```env
   STRIPE_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...   # optional for local demo
   ```
2. Rebuild storefront so the publishable key is baked in:
   ```bash
   docker compose up -d --build medusa storefront
   ```

---

## 🛑 12. Medusa Admin — Login Loop or White Screen

### Symptom A: Login succeeds but returns to login (`/admin/users/me` → 401)

You see `POST /auth/user/emailpass` **200** and `POST /auth/session` **200**, then `GET /admin/users/me` **401**.

**Cause:** `MEDUSA_NODE_ENV=production` (default) sets **Secure** session cookies. Browsers ignore them on plain `http://<IP>:9000`.

**Fix (VM without HTTPS):** In `.env`:

```env
MEDUSA_NODE_ENV=production
MEDUSA_ALLOW_HTTP_COOKIES=true
```

Then rebuild Medusa (config is baked into the image):

```bash
docker compose up -d --build medusa
```

Hard-refresh the browser (`Ctrl+Shift+R`) and log in again. In DevTools → Application → Cookies, you should see `connect.sid`.

### Symptom B: Completely white page (no login form)

**Cause:** `MEDUSA_NODE_ENV=development` in Docker. The admin UI is **production-built** during `docker build`; running the server in development mode breaks the admin bundle.

**Fix:** Never use `development` in Docker. Revert:

```env
MEDUSA_NODE_ENV=production
MEDUSA_ALLOW_HTTP_COOKIES=true
```

```bash
docker compose up -d --build medusa
```

### Alternative: HTTPS via Caddy (Profile B — recommended)

Use README [Phase 2](README.md#6-phase-2-https-gateway-caddy): `hosts` file + `https://api.local/app`. Keep `MEDUSA_ALLOW_HTTP_COOKIES=false`.
