# 🚀 Loomix Commerce — Phased Docker Deployment & Developer Guide

> 🌐 **Official Website & Demos:** [https://loomix.pro](https://loomix.pro)  
> 📚 **Developer Documentation & Architecture Guides:** [https://loomix.pro/docs](https://loomix.pro/docs) (also available locally in [docs/README.md](docs/README.md)).

This guide provides step-by-step instructions for transferring files and running the **Loomix Commerce** services — infrastructure, **Strapi**, **Medusa**, the **Storefront** (Next.js), and **Portainer** container management & monitoring — on a Virtual Private Server (VPS) or local VM using Docker.

Due to the heavy resource consumption during Next.js and Strapi builds, the deployment process is designed to be **phased** to prevent server crashes caused by CPU or memory exhaustion.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Cloning the Repository onto the VPS](#2-cloning-the-repository-onto-the-vps)
3. [⚡ Quick Start: Interactive Setup Wizard (Recommended)](#3--quick-start-interactive-setup-wizard-recommended)
4. [Manual Phased Deployment](#4-manual-phased-deployment)
   - [Choose a Deployment Profile & Configure `.env`](#41-choose-a-deployment-profile--configure-env)
   - [Initial GitHub Actions Builds (Backend Images)](#4-initial-github-actions-builds-backend-images)
   - [Docker Login (Private Repositories Only)](#5-docker-login-private-repositories-only)
   - [Phase Overview (At a Glance)](#6-phase-overview-at-a-glance)
   - [Phase 1: Running Infrastructure](#7-phase-1-running-infrastructure)
   - [Phase 2: HTTPS Gateway (Caddy)](#8-phase-2-https-gateway-caddy--edge-security)
   - [Phase 3: Pulling and Running Strapi CMS](#9-phase-3-pulling-and-running-strapi-cms)
   - [Phase 4: Generating Strapi API Tokens](#10-phase-4-retrieving-strapi-api-tokens)
   - [Phase 5: Pulling and Running Medusa Backend](#11-phase-5-pulling-and-running-medusa-backend)
   - [Phase 6: Generating a Publishable API Key in Medusa](#12-phase-6-generating-a-publishable-api-key-in-medusa)
   - [Phase 7: Retrieving and Configuring Meilisearch Search API Key](#13-phase-7-retrieving-and-configuring-meilisearch-search-api-key)
   - [Phase 8: Umami Analytics (Before Storefront)](#14-phase-8-umami-analytics-before-storefront)
   - [Phase 9: Building & Deploying the Storefront (GitHub Actions)](#15-phase-9-building--deploying-the-storefront-github-actions)
   - [Phase 10: Container Management & Monitoring (Portainer)](#16-phase-10-container-management--monitoring-portainer)
5. [Switching Profiles Mid-Deployment](#5-switching-profiles-mid-deployment)
6. [Updating the Server (Push / Pull)](#6-updating-the-server-push--pull)
7. [Network Architecture & Port Reference](#7-network-architecture--port-reference)
8. [Sample Data Seeding Script](#8-sample-data-seeding-script)
9. [Useful Docker Commands](#9-useful-docker-commands)
10. [Storefront Settings & Component Syncing (Strapi → GitHub CI/CD)](#10-storefront-settings--component-syncing-strapi--github-cicd)
11. [License](#11-license)

---

### 1. Prerequisites

Ensure the following tools and system settings are configured on your VPS or VM:

- **Linux Swap (Crucial for 2GB – 4GB RAM VPS)**:  
  Multi-service Node.js / Next.js builds and Strapi startup can spike memory. Creating a 4GB swapfile completely prevents Linux Out-Of-Memory (OOM) crashes:
  ```bash
  sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```
- **Base Utilities & Tools**:  
  Ensure essential command-line tools are installed:
  ```bash
  sudo apt-get update && sudo apt-get install -y git curl openssl jq
  ```
- **Docker** and **Docker Compose (v2)**:  
  Quick install official Docker Engine on Ubuntu/Debian:
  ```bash
  curl -fsSL https://get.docker.com | sudo sh
  ```

**Docker permission (`docker.sock`):** On a fresh VPS or VM, `docker compose` may fail with:
`permission denied while trying to connect to the docker API at unix:///var/run/docker.sock`

Fix once per user:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

Avoid running `docker compose` with `sudo` long-term. See [Troubleshooting — Docker permission denied](docs/09-troubleshooting-and-faq.md#-8-docker-permission-denied-dockersock).

---

### 2. Cloning the Repository onto the VPS

Clone the repository onto your Linux server before configuring anything else:

#### Option A: Public Repository
```bash
git clone https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
cd <YOUR_REPOSITORY_NAME>
```

#### Option B: Private Repository (SSH Key — Recommended)
1. **Generate SSH Key on VPS:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
2. **Display and Copy Public Key:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
3. **Add Key to GitHub:** Go to **Settings > SSH and GPG keys > New SSH key**, title it `VPS Server`, and paste the key.
4. **Clone via SSH on VPS:**
   ```bash
   git clone git@github.com:<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
   cd <YOUR_REPOSITORY_NAME>
   ```

#### Option C: Private Repository (Personal Access Token)
Create a token under **Settings > Developer Settings > Personal Access Tokens > Tokens (classic)** with `repo` permission:
```bash
git clone https://<YOUR_GITHUB_USERNAME>:<PERSONAL_ACCESS_TOKEN>@github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
cd <YOUR_REPOSITORY_NAME>
```

---

### 3. ⚡ Quick Start: Interactive Setup Wizard (Recommended)

Instead of manually running each phase, execute the interactive setup wizard on your VPS. It guides you step-by-step through profile selection (A/B/C), automatically generates all cryptographic secrets, configures `.env`, starts services in the correct sequence, polls for container health, extracts Meilisearch keys, creates admin accounts, and seeds sample data:

```bash
chmod +x server-setup.sh
bash server-setup.sh
```

> [!TIP]
> If you prefer manual step-by-step execution or need to debug a specific service, proceed with the **[Manual Phased Deployment](#4-manual-phased-deployment)** guide below.

---

### 4. Manual Phased Deployment

#### 4.1. Choose a Deployment Profile & Configure `.env`

Copy the environment template before starting any container:
```bash
cp .env.example .env
nano .env
```

Pick a profile before running any phase. Public URLs are baked into Strapi, Medusa, and the Storefront at build time.

| Scenario | Profile | Cloudflare Tunnel? |
|---|---|---|
| **VM / LAN demo or portfolio (Recommended)** | **B** — HTTPS via `.local` + Caddy | Leave `CLOUDFLARE_TUNNEL_TOKEN` empty |
| **VM / LAN quick smoke test only** | **A** — plain HTTP + IP | Leave empty |
| **Real public domain on the internet** | **C** — real HTTPS URLs + Caddy | Optional |

---

#### Profile A — Quick LAN (HTTP + IP)
For smoke tests only. Replace `192.168.1.103` with your server IP (`ip a` on Linux):
```env
# Required for Profile A: allow Docker to bind service ports to all interfaces (0.0.0.0) without Caddy:
BIND_IP=0.0.0.0

STOREFRONT_PUBLIC_URL=http://192.168.1.103:8000
MEDUSA_BACKEND_PUBLIC_URL=http://192.168.1.103:9000
STRAPI_PUBLIC_URL=http://192.168.1.103:1337
MEILISEARCH_PUBLIC_URL=http://127.0.0.1:7700
MINIO_PUBLIC_URL=http://192.168.1.103:9001/mystore
GOOGLE_CALLBACK_URL=http://192.168.1.103:8000/ir/account/auth/callback

STORE_CORS=
ADMIN_CORS=
AUTH_CORS=

STOREFRONT_URL=http://storefront:8000
MEDUSA_NODE_ENV=production
MEDUSA_ALLOW_HTTP_COOKIES=true
CLOUDFLARE_TUNNEL_TOKEN=
```
*(Skip Phase 2 - Caddy on Profile A).*

---

#### Profile B — VM / LAN with HTTPS (Recommended)
Uses Caddy with `.local` hostnames and self-signed certificates.

1. **`.env` Configuration:**
```env
STOREFRONT_PUBLIC_URL=https://store.local
MEDUSA_BACKEND_PUBLIC_URL=https://api.local
STRAPI_PUBLIC_URL=https://admin.local
MEILISEARCH_PUBLIC_URL=https://search.local
MINIO_PUBLIC_URL=https://api.local/minio/mystore
GOOGLE_CALLBACK_URL=https://store.local/ir/account/auth/callback

STORE_CORS=
ADMIN_CORS=
AUTH_CORS=

STOREFRONT_URL=http://storefront:8000
MEDUSA_NODE_ENV=production
MEDUSA_ALLOW_HTTP_COOKIES=false
CLOUDFLARE_TUNNEL_TOKEN=
```
2. **Windows `hosts` file entry:**
   Open Notepad as Administrator → `C:\Windows\System32\drivers\etc\hosts` and add:
   ```text
   <VM_IP> store.local api.local admin.local search.local analytics.local portainer.local monitor.local
   ```

---

#### Profile C — Real Public Domain (Production)
Configure your registered domain and admin credentials in `.env`:
```env
# Public Base Domain & ACME SSL Email for Caddy:
DOMAIN=yourdomain.com
ACME_EMAIL=admin@yourdomain.com

# Public URLs (Derived from your domain):
STOREFRONT_PUBLIC_URL=https://yourdomain.com
MEDUSA_BACKEND_PUBLIC_URL=https://api.yourdomain.com
STRAPI_PUBLIC_URL=https://admin.yourdomain.com
MEILISEARCH_PUBLIC_URL=https://search.yourdomain.com
MINIO_PUBLIC_URL=https://api.yourdomain.com/minio/mystore
GOOGLE_CALLBACK_URL=https://yourdomain.com/ir/account/auth/callback
PORTAINER_PUBLIC_URL=https://portainer.yourdomain.com

# Optional Caddy HTTP Basic Auth (Extra edge protection for Strapi Admin):
BASIC_AUTH_USER=admin
BASIC_AUTH_HASH=$2a$14$5y/bX4mNtIj3Svb76Ria4eRekRIfEHFCYNE1ZyiBPeXYlj41rVvO.

STOREFRONT_URL=http://storefront:8000
MEDUSA_NODE_ENV=production
MEDUSA_ALLOW_HTTP_COOKIES=false
CLOUDFLARE_TUNNEL_TOKEN=
```

1. **Cloudflare DNS Records:**
   In your Cloudflare dashboard under **DNS > Records**, add `A` records pointing to your server IP:
   - `@` (root domain) $\rightarrow$ `YOUR_VPS_IP`
   - `www` $\rightarrow$ `YOUR_VPS_IP`
   - `api` $\rightarrow$ `YOUR_VPS_IP`
   - `admin` $\rightarrow$ `YOUR_VPS_IP`
   - `search` $\rightarrow$ `YOUR_VPS_IP`
   - `analytics` $\rightarrow$ `YOUR_VPS_IP`
   - `portainer` (and/or `monitor`) $\rightarrow$ `YOUR_VPS_IP`
   
   > [!IMPORTANT]
   > During initial setup and first Caddy startup, set Cloudflare proxy status to **DNS Only (Gray Cloud)** so Caddy can automatically complete the ACME HTTP-01 / TLS-ALPN challenge to issue free Let's Encrypt / ZeroSSL certificates.

2. **After Services are Running (Post-Deployment Hardening):**
   Once setup is complete and HTTPS is active:
   - **SSL/TLS Encryption Mode:** Set to **`Full (Strict)`** under **SSL/TLS > Overview**.
   - **Edge Certificates:** Enable **`Always Use HTTPS`**, **`Automatic HTTPS Rewrites`**, and set **Minimum TLS Version** to **`TLS 1.2`** (or `TLS 1.3`).
   - **DNS Proxying:** Switch all DNS records from gray to **Proxied (Orange Cloud)** for CDN speed and DDoS origin protection.
   - **Security / WAF:** Enable **Bot Fight Mode** under **Security > Bots**.
   - **Network:** Ensure **WebSockets** and **gRPC** are enabled under **Network**.
   - **Caching:** Under **Caching > Configuration**, verify **Browser Cache TTL** is set to **`Respect Existing Headers`** to preserve instant dynamic cart and inventory updates.

---

#### Unified URL Reference Table

| Service | Profile A (HTTP + IP) | Profile B (Local HTTPS) | Profile C (Production) |
|---|---|---|---|
| **Storefront** | `http://<VM_IP>:8000` | `https://store.local` | `https://yourdomain.com` |
| **Medusa Admin** | `http://<VM_IP>:9000/app` | `https://api.local/app` | `https://api.yourdomain.com/app` |
| **Strapi Admin** | `http://<VM_IP>:1337/admin` | `https://admin.local/admin` | `https://admin.yourdomain.com/admin` |
| **Portainer CE** | `https://<VM_IP>:9443` | `https://portainer.local` | `https://portainer.yourdomain.com` |
| **Umami Analytics** | `http://<VM_IP>:3005` | `https://analytics.local` | `https://analytics.yourdomain.com` |
| **Meilisearch** | `127.0.0.1:7700` *(Internal)* | `https://search.local` | `https://search.yourdomain.com` |

---

### 4. Initial GitHub Actions Builds (Backend Images)

Pushing to `main` automatically triggers GitHub Actions to build the Strapi and Medusa Docker images and publish them to GitHub Packages (GHCR).

1. Open the **Actions** tab in your repository.
2. Confirm **Build and Push Strapi Image** and **Build and Push Medusa Image** have finished with green checkmarks.
3. *Do not build Storefront yet* — API keys from Phases 4, 6, 7, and 8 must be generated first.

---

### 5. Docker Login (Private Repositories Only)

If your repository is private, log the VPS into GitHub Container Registry:
```bash
echo "<YOUR_PAT>" | docker login ghcr.io -u <YOUR_GITHUB_USERNAME> --password-stdin
```

---

### 6. Phase Overview (At a Glance)

| Phase | Services / Action | Profile A | Profile B & C |
|---|---|---|---|
| **Phase 1** | Postgres, Redis, MinIO, Meilisearch | ✅ | ✅ |
| **Phase 2** | Caddy HTTPS Gateway & Security | ⏭ Skip | ✅ Right after Phase 1 |
| **Phase 3** | Strapi CMS (Pull from GHCR) | ✅ | ✅ |
| **Phase 4** | Strapi API Tokens → `.env` | ✅ | ✅ |
| **Phase 5** | Medusa Backend (Pull from GHCR) | ✅ | ✅ |
| **Phase 6** | Medusa Publishable Key → `.env` | ✅ | ✅ |
| **Phase 7** | Meilisearch Search Key → `.env` | ✅ | ✅ |
| **Phase 8** | Umami Analytics | Optional | ✅ |
| **Phase 9** | Storefront Next.js (GitHub Actions Build & Deploy) | ✅ | ✅ |
| **Phase 10** | Container Management & Monitoring (Portainer CE) | Optional | ✅ Recommended |

---

### 7. Phase 1: Running Infrastructure

```bash
docker compose up -d postgres redis meilisearch minio minio-setup
docker compose ps
```
Wait until all services report `healthy`. Data is stored in Docker volumes and is never lost when changing public URLs or switching profiles.

---

### 8. Phase 2: HTTPS Gateway (Caddy) & Edge Security

*(Profile A skips this phase).*

Caddy runs as a lightweight reverse-proxy container providing automatic SSL certificates, HSTS/CSP security headers, and reverse-proxy routing.

1. **Profile B**: Uses pre-configured `.local` hostnames with internal TLS (`store.local`, `api.local`, `admin.local`, `analytics.local`, `portainer.local`, `monitor.local`).
2. **Profile C**: Automatically requests and renews free SSL certificates (Let's Encrypt / ZeroSSL) for your base domain and all subdomains (`api.`, `admin.`, `analytics.`, `portainer.`, `monitor.`). Ensure DNS `A` records point to your VPS IP before starting Caddy.
3. **HTTP Basic Auth Edge Protection (Optional)**:
   - **Strapi Admin Panel (`admin.yourdomain.com/admin*` and `/`)**: Protected with HTTP Basic Auth. Public API routes (`/api/*`) and uploaded media (`/uploads/*`) remain open so the Storefront and Medusa can fetch content freely without 401 errors.
   - **Portainer**: Protected natively by Portainer's own user authentication and session security.
   
   To generate a secure custom password hash for Strapi Admin:
   ```bash
   docker run --rm caddy:latest caddy hash-password --plaintext "your_secret_password"
   ```
   Copy the generated bcrypt hash and set `BASIC_AUTH_HASH` in `.env`.
4. **Live Access Logging**:
   Caddy logs all incoming requests in structured JSON format to `/var/log/caddy/access.log` with automatic log rotation (50MB rolls, 30 days retention).
5. **Start Caddy**:
   ```bash
   docker compose up -d caddy
   docker compose logs -f caddy
   ```

---

### 9. Phase 3: Pulling and Running Strapi CMS

```bash
docker compose pull strapi
docker compose up -d strapi
docker compose logs -f strapi
```
Wait until Strapi is listening on port **1337**. Open the Strapi Admin URL according to your profile (see [URL Table](#unified-url-reference-table)) and complete the one-time admin registration.

---

### 10. Phase 4: Retrieving Strapi API Tokens

1. In Strapi Admin, go to **Settings > API Tokens**.
2. **Full Access Token**: Click on the edit icon (✏️) next to **Full Access** → Click **Regenerate** → Copy the generated token → Paste into the `server-setup.sh` wizard prompt (or set as `STRAPI_API_TOKEN_FOR_MEDUSA` in `.env`).
3. **Read-Only Token**: Click on the edit icon (✏️) next to **Read Only** → Click **Regenerate** → Copy the generated token → Paste into the `server-setup.sh` wizard prompt (or set as `STRAPI_API_TOKEN_FOR_FRONT` in `.env`).

---

### 11. Phase 5: Pulling and Running Medusa Backend

```bash
docker compose pull medusa
docker compose up -d medusa
docker compose logs -f medusa
```
On first run, Medusa automatically applies database migrations and creates the initial admin user. Open the Medusa Admin URL (`/app`) and log in.

> [!NOTE]
> Always keep `MEDUSA_NODE_ENV=production` in `.env`. Development mode causes admin UI white screens in Docker.

---

### 12. Phase 6: Generating a Publishable API Key in Medusa

1. In Medusa Admin, go to **Settings > Publishable API Keys > Create Key**, name it `Storefront`, and copy the `pk_...` token.
2. Paste into the `server-setup.sh` wizard prompt (or set `MEDUSA_PUBLISHABLE_KEY` in `.env` if doing manual setup).
3. **Crucial**: Open the key → **Sales Channels** tab → Attach it to **Default Sales Channel** (otherwise products will not appear on the storefront).

---

### 13. Phase 7: Retrieving and Configuring Meilisearch Search API Key

Meilisearch is internal-only (`127.0.0.1:7700`). The setup wizard (`server-setup.sh`) extracts and configures this key automatically (utilizing `jq`, with built-in fallbacks to `Node.js` and `Python 3`). If configuring manually:
```bash
curl -H "Authorization: Bearer <MEILI_MASTER_KEY>" http://127.0.0.1:7700/keys
```
Copy the `Default Search API Key` and set `MEILI_SEARCH_KEY` in `.env`.

---

### 14. Phase 8: Umami Analytics (Before Storefront)

Umami runs before the Storefront because Next.js bakes the Website ID at compile time.
```bash
docker compose up -d umami
```
1. Open Umami dashboard (`admin` / `umami` - change password immediately).
2. Go to **Settings > Websites > Add Website** → Copy **Website ID**.
3. Paste into the `server-setup.sh` wizard prompt (or set `UMAMI_WEBSITE_ID` in `.env` if doing manual setup).

---

### 15. Phase 9: Building & Deploying the Storefront (GitHub Actions)

#### Step 1: Configure GitHub Secrets
In your GitHub repo, go to **Settings > Environments > New environment**, name it `production`, and add:

- **`STOREFRONT_BUILD_ARGS`**:
```text
MEDUSA_BACKEND_URL=http://medusa:9000
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_STRAPI_URL=https://admin.yourdomain.com
NEXT_PUBLIC_BASE_URL=https://store.yourdomain.com
NEXT_PUBLIC_MEILISEARCH_HOST=https://search.yourdomain.com
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY=...
NEXT_PUBLIC_UMAMI_WEBSITE_ID=...
NEXT_PUBLIC_DEFAULT_REGION=US
DEFAULT_LOCALE=en-US
NEXT_PUBLIC_MEILISEARCH_INDEX_NAME=products
NEXT_PUBLIC_ENABLE_IRAN_FEATURES=false
```
- **`REGISTRY_URL`**: `https://raw.githubusercontent.com/Loomix-pro/Loomix-registry/main/src/modules`
- **`DEPLOY_PATH`**: Absolute project path on VPS (`pwd` output, e.g. `/root/first_run`).

#### Step 2: Install Self-Hosted Runner on VPS
1. Go to **Settings > Actions > Runners > New self-hosted runner** and run the setup commands on the VPS.
2. Run `sudo ./svc.sh install && sudo ./svc.sh start` to persist the background service.

#### Step 3: Run Workflow & Start Storefront
1. Go to GitHub **Actions > Build and Push Storefront Image > Run workflow**.
2. Once complete, pull and start the container on VPS:
```bash
docker compose pull storefront
docker compose up -d storefront
```

---

### 16. Phase 10: Container Management & Monitoring (Portainer)

A lightweight container management & visual monitoring dashboard using **Portainer Community Edition (CE)** (~40MB RAM footprint). It replaces heavy monitoring stacks with instant, low-overhead container controls and resource metrics.

```bash
docker compose up -d portainer
docker compose ps portainer
```

- **Portainer Dashboard URLs**:
  - **Direct HTTPS (IP)**: `https://<YOUR_VPS_IP>:9443`
  - **Profile B**: `https://portainer.local` (or `https://monitor.local`)
  - **Profile C**: `https://portainer.yourdomain.com` (or `https://monitor.yourdomain.com`)

> [!IMPORTANT]
> **5-Minute Initial Admin Setup Window**:  
> For security, Portainer disables its initialization endpoint if the first administrator account is not created within 5 minutes of container startup.  
> Immediately open the dashboard URL in your browser upon starting the container, set your username (`admin`) and a password (minimum 12 characters), and click **Create user**.  
> *If you exceed the 5-minute window before creating the account, restart the container to reset the timer:*
> ```bash
> docker compose restart portainer
> ```

- **Connecting to Docker Environment**:
  - In the Portainer welcome screen, click **Get Started** to connect to the local Docker socket (`/var/run/docker.sock`).
  - You will see the entire Loomix stack in the **Containers** view.
- **Key Features in Portainer**:
  - **Container Controls**: Start, Stop, Kill, Restart, or Recreate any container with 1 click.
  - **Live Resource Metrics**: Click the **Stats** icon next to any container for real-time CPU %, Memory usage, Network traffic, and process list.
  - **Live Logs**: Click the **Logs** icon to inspect or stream logs with search filtering and line count settings.
  - **Web Console / Shell**: Click the **Console** icon (`_>`) to launch an interactive bash/sh terminal directly in your browser without needing SSH.
  - **Volume & Network Inspection**: Monitor persistent volumes and clean unused Docker images or caches safely.

---

### 5. Switching Profiles Mid-Deployment

Data in Docker volumes is never affected by profile switches.

| Change | Containers to restart |
|---|---|
| Public URLs in `.env` | Strapi, Medusa, Storefront (trigger GitHub Actions rebuild, then pull) |
| `MEDUSA_ALLOW_HTTP_COOKIES` | Medusa only |
| Adding Caddy (A → B/C) | Start Caddy; rebuild app images with new URLs |
| Windows `hosts` (Profile B) | Edit Windows `hosts` file only |

---

### 6. Updating the Server (Push / Pull)

All application images (Strapi, Medusa, Storefront) are built through GitHub Actions.

To pull and update after a workflow run:
```bash
docker compose pull
docker compose up -d
```

Pushing to `main` automatically triggers the Storefront CI/CD workflow and self-hosted deploy.

---

### 7. Network Architecture & Port Reference

#### Direct Port Access (Debugging / Profile A with BIND_IP=0.0.0.0)
| Service | Container Port | Host Port Binding (Default) | With `BIND_IP=0.0.0.0` (Profile A) | Access (Default) |
|---|---|---|---|---|
| Storefront | 8000 | `127.0.0.1:8000` | `0.0.0.0:8000` | Via Caddy only |
| Medusa API | 9000 | `127.0.0.1:9000` | `0.0.0.0:9000` | Via Caddy only |
| Strapi CMS | 1337 | `127.0.0.1:1337` | `0.0.0.0:1337` | Via Caddy only |
| MinIO API | 9000 | `127.0.0.1:9001` | `0.0.0.0:9001` | Via Caddy only |
| MinIO Console | 9001 | `127.0.0.1:9002` | `0.0.0.0:9002` | Via Caddy only |
| Umami | 3000 | `127.0.0.1:3005` | `0.0.0.0:3005` | Via Caddy only |
| Portainer CE | 9443 | `127.0.0.1:9443` | `0.0.0.0:9443` | Via Caddy only |
| Meilisearch | 7700 | `127.0.0.1:7700` | `127.0.0.1:7700` | Internal Only |
| Postgres | 5432 | `127.0.0.1:5432` | `127.0.0.1:5432` | Internal Only |
| Redis | 6379 | `127.0.0.1:6379` | `127.0.0.1:6379` | Internal Only |

---

### 8. Sample Data Seeding Script (Local Development)

For local development or quick testing with already-running containers:

**Linux / macOS:**
```bash
bash setup.sh
```

**Windows:**
```powershell
.\setup.bat
```

This populates Medusa and Strapi with 30 sample products, categories, collections, pages, blogs, and translations.

---

### 9. Useful Docker Commands

```bash
# Check container status
docker compose ps

# Live logs
docker compose logs -f medusa

# Real-time resource usage of all containers
docker stats

# Clean unused build cache
docker builder prune -f
docker system prune -f

# Full restart (volumes preserved)
docker compose down
docker compose up -d
```

---

### 10. Storefront Settings & Component Syncing (Strapi → GitHub CI/CD)

This project features a fully automated Git-backed synchronization architecture between the Strapi Admin Panel and the Next.js Storefront.

```
┌──────────────────────────────┐
│     Strapi Admin Panel       │
│  (Storefront Management)     │
└──────────────┬───────────────┘
               │ Click "Update Storefront"
               ▼
┌──────────────────────────────┐
│     Sync Controller API      │
│  (website-admin/.../sync.ts) │
└──────────────┬───────────────┘
               │
       ┌───────┴────────────────────────┐
       │ (NODE_ENV == 'development')    │ (NODE_ENV == 'production')
       ▼                                ▼
┌──────────────────────────────┐ ┌─────────────────────────────────────────┐
│ Local Filesystem Write       │ │ GitHub REST API Direct Commit           │
│ store/.../storefront-        │ │ Path: store/.../storefront-settings.json│
│ settings.json                │ └────────────────────┬────────────────────┘
│ (Immediate Hot Reload)       │                      │ Triggers Webhook / Dispatch
└──────────────────────────────┘                      ▼
                                 ┌─────────────────────────────────────────┐
                                 │ GitHub Actions CI/CD Pipeline           │
                                 │ (deploy-storefront.yml)                 │
                                 └────────────────────┬────────────────────┘
                                                      │ Self-Hosted Runner Deploy
                                                      ▼
                                 ┌─────────────────────────────────────────┐
                                 │ Production VPS Storefront Container     │
                                 │ (Updated with zero manual downtime)     │
                                 └─────────────────────────────────────────┘
```

#### 1. Storefront Settings Preset Sync (`storefront-settings.json`)
In Strapi under **Storefront Settings**, editors customize:
- Product card styles (`card-1`, `card-2`, `card-3`)
- Header and footer layouts, logos, and social links
- Page templates (Product, Checkout, Store, Cart, Login, Profile)
- Theme color palettes (Light & Dark modes)
- Global preferences (RTL/LTR mode, Multi-currency, Return deadlines)

When clicking **Update Storefront**:
- **Automatic Preset Sync**: Strapi automatically synchronizes the settings preset before starting the build.
  - **Development Mode (`NODE_ENV=development`)**: Strapi writes directly to `store/src/lib/config/storefront-settings.json` on disk for instant Next.js hot-reload.
  - **Production Mode (`NODE_ENV=production`)**: Strapi commits the JSON preset directly to the GitHub repository via the GitHub Contents API.
- **Build Trigger**: Strapi then dispatches the deployment to GitHub Actions (`deploy-storefront.yml`) to automatically build and deploy the updated container.

#### 2. Loomix Block Component Sync (`sync-loom-component.js`)
- In Strapi **Storefront Management**, clicking **+ Add to Storefront (Queue)** or **Remove Style (Queue)** queues component style modifications into `sync-history.json`.
- Clicking **Update Storefront** automatically syncs settings presets and dispatches the component updates to GitHub Actions to build the storefront.

#### Requirements for Production Sync:
Configure these in `website-admin/.env` (and server `.env`):
```env
GITHUB_DEPLOY_TOKEN=ghp_your_personal_access_token # Requires 'repo' and 'workflow' scopes
GITHUB_DEPLOY_REPO=your_username/your_repo_name
```
A GitHub Actions self-hosted runner must be running on the VPS.

---

### 11. License

This software is proprietary and commercial. All rights reserved by **Loomix.pro**.  
Deployment and use are governed by the terms specified in the [LICENSE](LICENSE) file.