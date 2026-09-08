# 🚀 Quickstart & Setup Guide

This guide covers local development setup and step-by-step phased production deployment using Docker Compose and GitHub Actions.

---

## 📋 System Prerequisites

Ensure your system or server has the following tools installed:

- **Docker** and **Docker Compose (v2)** (`docker compose version`)
- **Node.js**: Version 20.x or higher (`node -v`) for local development
- **Git**: For cloning and repository management
- **npm / yarn**: Package manager (`npm v10+`)

After installing Docker on a new Linux server, add your deploy user to the `docker` group so commands work without `sudo`:

```bash
sudo usermod -aG docker $USER
newgrp docker   # or re-login via SSH
docker ps
```

---

## ⚙️ Environment Variables Configuration (`.env`)

Copy the template file `.env.example` in the project root to `.env`:

```bash
cp .env.example .env
nano .env
```

### 🗝️ Key Environment Variables Reference

| Variable Key | Description | Example Value |
| :--- | :--- | :--- |
| `STOREFRONT_PUBLIC_URL` | Public URL for Next.js Storefront | `https://store.local` (Profile B) / `https://yourdomain.com` (Profile C) |
| `MEDUSA_BACKEND_PUBLIC_URL` | Public URL for Medusa API & Admin | `https://api.local` (Profile B) / `https://api.yourdomain.com` (Profile C) |
| `STRAPI_PUBLIC_URL` | Public URL for Strapi CMS | `https://admin.local` (Profile B) / `https://admin.yourdomain.com` (Profile C) |
| `POSTGRES_USER` | PostgreSQL Username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL Password | `secure_db_password` |
| `MEILI_MASTER_KEY` | Meilisearch Master Key (server/internal only) | `32_char_random_master_key` |
| `MEILI_SEARCH_KEY` | Meilisearch Search-only Key (storefront browser) | *(Generated in Phase 7)* |
| `MINIO_ROOT_USER` | MinIO S3 Root Admin | `minioadmin` |
| `MINIO_ROOT_PASSWORD` | MinIO S3 Root Secret | `minioadmin_secret` |
| `STRAPI_API_TOKEN_FOR_MEDUSA` | Strapi Full Access API Token for Medusa | *(Generated in Phase 4)* |
| `STRAPI_API_TOKEN_FOR_FRONT` | Strapi Read-Only Token for Storefront | *(Generated in Phase 4)* |
| `MEDUSA_PUBLISHABLE_KEY` | Medusa Publishable Key for Storefront | *(Generated in Phase 6)* |
| `UMAMI_WEBSITE_ID` | Umami Analytics Website ID | *(Generated in Phase 8)* |

**CORS:** Docker Compose auto-fills `STORE_CORS`, `ADMIN_CORS`, and `AUTH_CORS` from the public URLs when unset. Local defaults use storefront port **8000**.

---

## 🔌 Default Service Ports & Profiles

| Service | Profile A (HTTP + IP) | Profile B (Local HTTPS) | Profile C (Production Domain) |
| :--- | :--- | :--- | :--- |
| **Storefront** | `http://<VM_IP>:8000` | `https://store.local` | `https://yourdomain.com` |
| **Medusa Admin** | `http://<VM_IP>:9000/app` | `https://api.local/app` | `https://api.yourdomain.com/app` |
| **Strapi Admin** | `http://<VM_IP>:1337/admin` | `https://admin.local/admin` | `https://admin.yourdomain.com/admin` |
| **Umami Analytics**| `http://<VM_IP>:3005` | `https://analytics.local` | `https://analytics.yourdomain.com` |
| **Meilisearch** | `127.0.0.1:7700` | `https://search.local` | `https://search.yourdomain.com` |

---

## 🐳 Phased Docker Deployment Guide

To prevent server CPU/memory exhaustion during heavy Next.js and Strapi builds, deployment is executed in **phases**.

> 📖 **Full guide:** See [README.md](../README.md) for detailed deployment **Profiles A/B/C**, `.env` templates, and [switching profiles mid-deployment](../README.md#14-switching-profiles-mid-deployment).

| Phase | Service | Profile A | Profile B / C |
|:---|:---|:---|:---|
| **1** | Infrastructure (`postgres`, `redis`, `meilisearch`, `minio`, `minio-setup`) | ✅ | ✅ |
| **2** | Caddy HTTPS gateway (Docker) + `hosts` mapping | ⏭ Skip | ✅ **Right after Phase 1, before Strapi** |
| **3** | Strapi CMS | ✅ | ✅ |
| **4** | Strapi API tokens → `.env` | ✅ | ✅ |
| **5** | Medusa backend | ✅ | ✅ |
| **6** | Medusa publishable key → `.env` | ✅ | ✅ |
| **7** | Meilisearch search-only key → `.env` | ✅ | ✅ |
| **8** | Umami Analytics → `UMAMI_WEBSITE_ID` in `.env` | Umami optional | ✅ **Before Storefront build** |
| **9** | Next.js Storefront (GitHub Actions Build & Pull) + Cloudflare Tunnel | ✅ | ✅ |

---

### 🔹 Phase 1: Launch Infrastructure Services
```bash
docker compose up -d postgres redis meilisearch minio minio-setup
```
*Verify container health status:* `docker compose ps`

---

### 🔹 Phase 2: HTTPS Gateway (Profile B/C only)

> **Skip if using Profile A (HTTP + IP).** See [README §6](../README.md#6-phase-2-https-gateway-caddy).

```bash
docker compose up -d caddy
```

*For Profile B:* Add the VM IP to your Windows/client `hosts` file (`C:\Windows\System32\drivers\etc\hosts`):
```text
<VM_IP>  store.local api.local admin.local analytics.local
```

---

### 🔹 Phase 3: Start Strapi CMS

Pull the pre-built image from GitHub Packages (or build locally):

```bash
docker compose pull strapi
docker compose up -d strapi
```

```bash
docker compose logs -f strapi   # wait until server is listening on port 1337
docker compose ps strapi        # should show "healthy"
```

*Access Strapi admin at:* Profile A → `http://<VM_IP>:1337/admin` · Profile B → `https://admin.local/admin`

---

### 🔹 Phase 4: Generate Strapi API Tokens

1. Open Strapi Admin and complete the initial administrator registration.
2. Navigate to **Settings** > **API Tokens**.
3. **For Medusa (`STRAPI_API_TOKEN_FOR_MEDUSA`):**
   - Click on the default `Full Access` token.
   - Click **Regenerate**, copy the new token, and paste it into `.env` under `STRAPI_API_TOKEN_FOR_MEDUSA`.
4. **For Storefront (`STRAPI_API_TOKEN_FOR_FRONT`):**
   - Click on the default `Read-Only` token.
   - Click **Regenerate**, copy the new token, and paste it into `.env` under `STRAPI_API_TOKEN_FOR_FRONT`.

---

### 🔹 Phase 5: Start Medusa Backend

Pull the pre-built image from GitHub Packages and start it:

```bash
docker compose pull medusa
docker compose up -d medusa
```

**Startup (automatic inside container):**
1. `npx medusa db:migrate` — database migrations (**2–5+ min** on first run)
2. Admin user created from `MEDUSA_ADMIN_EMAIL` / `MEDUSA_ADMIN_PASSWORD`
3. Server listens on port **9000**

```bash
docker compose logs -f medusa
curl http://127.0.0.1:9000/health    # run on VPS; wait until OK
docker compose ps medusa             # "healthy" when ready
```

*Medusa Admin:* Profile A → `http://<VM_IP>:9000/app` · Profile B → `https://api.local/app` (**`/app`**, not `/`)

---

### 🔹 Phase 6: Generate Medusa Publishable API Key

1. Log into Medusa Admin (URL from Phase 5).
2. Go to **Settings** > **API Keys** > click **Create Key**.
3. Name: `Storefront` → Save → copy the generated key (`pk_...`).
4. Set `MEDUSA_PUBLISHABLE_KEY` in `.env`.
5. **CRITICAL STEP**: Click on the newly created key, go to **Sales Channels**, and attach it to `Default Sales Channel`.

---

### 🔹 Phase 7: Retrieve Meilisearch Search Key

The interactive setup wizard (`server-setup.sh`) automatically extracts and configures this key in `.env` using `jq`, with built-in multi-tier fallbacks to `Node.js` and `Python 3` if `jq` is not present on the host.

If you are performing a **manual** deployment step-by-step without the wizard, run:

```bash
curl -H "Authorization: Bearer <MEILI_MASTER_KEY>" http://127.0.0.1:7700/keys
```

Copy the `Default Search API Key` into `.env` under `MEILI_SEARCH_KEY`. Never expose `MEILI_MASTER_KEY` to the storefront.

---

### 🔹 Phase 8: Umami Analytics (Before Storefront)

*Note: Umami is set up before the Storefront because Next.js bakes the Umami Website ID at compile time.*

```bash
docker compose up -d umami
```

1. Open Umami at Profile A → `http://<VM_IP>:3005` · Profile B → `https://analytics.local`
2. Default login: `admin` / `umami` (change immediately; set `UMAMI_USERNAME` / `UMAMI_PASSWORD` in `.env`).
3. **Settings** → **Websites** → **Add website** → copy **Website ID**.
4. Set `UMAMI_WEBSITE_ID` in `.env`.

---

### 🔹 Phase 9: Build & Start Next.js Storefront

With all environment keys configured in GitHub Secrets / `.env`:

1. In your GitHub repository, go to **Actions** > **Build and Push Storefront Image** > click **Run workflow**.
2. Once the build completes, pull and launch the container on your VPS:

```bash
docker compose pull storefront
docker compose up -d storefront
```

*Access storefront at:* Profile A → `http://<VM_IP>:8000` · Profile B → `https://store.local` · Profile C → `https://yourdomain.com`

**Cloudflare Tunnel (Profile C / production only):**
```bash
docker compose up -d cloudflared
```

---

## 💻 Local Manual Development Setup (without Docker)

If you prefer running services locally with Hot Reloading:

### 1. Start Infrastructure Dependencies:
```bash
docker compose up -d postgres redis meilisearch minio minio-setup
```

### 2. Run Strapi CMS (`website-admin/`):
```bash
cd website-admin
npm install
npm run develop
```

### 3. Run Medusa Backend (`store-admin/`):
```bash
cd store-admin
npm install
npm run dev
```

### 4. Run Next.js Storefront (`store/`):
```bash
cd store
npm install
npm run dev
```
*(Storefront runs at `http://localhost:8000`)*
