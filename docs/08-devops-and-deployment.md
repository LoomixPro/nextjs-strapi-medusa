# 🌐 DevOps & VPS Deployment Guide

This guide details production deployment for **Next-Strapi-Medusa** on a Virtual Private Server (VPS Linux Ubuntu/Debian).

---

## 💻 Recommended Hardware Specifications

To comfortably run all microservices (Postgres, Redis, Meilisearch, MinIO, Strapi, Medusa, Next.js):
- **CPU**: 4 vCPU cores minimum
- **RAM**: 8 GB RAM minimum *(4 GB RAM supported if Linux Swap is enabled)*
- **Disk**: 40 GB SSD/NVMe minimum
- **OS**: Ubuntu 22.04 LTS / 24.04 LTS

---

## 🛠️ Production Networking Options (Cloudflare Tunnel vs Direct Caddy)

### Option A: Cloudflare Tunnel (`cloudflared` container) - Recommended for Security
In this setup, no inbound ports (80/443) need to be open on your VPS firewall, keeping your server IP address completely hidden.

1. Create a Tunnel in Cloudflare under **Networking → Tunnels**.
2. Copy the generated **Tunnel Token** into `.env` under `CLOUDFLARE_TUNNEL_TOKEN`.
3. Map public hostnames (e.g. `yourdomain.com`, `api.yourdomain.com`) to target `http://caddy:80` inside the Tunnel Public Hostnames configuration.

---

### Option B: Direct Caddy Setup with Automatic SSL (Without Cloudflare Tunnel)
If you prefer not using Cloudflare Tunnels, Caddy automatically obtains valid free SSL/TLS certificates via Let's Encrypt.

1. Point your domain A-records directly to your VPS IP address in your DNS control panel.
2. Open HTTP & HTTPS ports on your VPS firewall:
   ```bash
   sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
   ```
3. Update `Caddyfile` by removing `http://` prefixes:

```caddyfile
yourdomain.com {
    reverse_proxy storefront:8000
}

api.yourdomain.com {
    handle_path /minio/* {
        reverse_proxy minio:9000
    }
    handle {
        reverse_proxy medusa:9000
    }
}

admin.yourdomain.com {
    reverse_proxy strapi:1337
}

# Do NOT expose Meilisearch publicly. Storefront search uses NEXT_PUBLIC_MEILISEARCH_HOST
# only for browser queries with a search-only API key. Medusa syncs via the internal Docker network.

analytics.yourdomain.com {
    reverse_proxy umami:3000
}

monitor.yourdomain.com {
    reverse_proxy openobserve:5080
}
```

4. Launch Caddy directly:
```bash
docker compose up -d caddy
```

---

## 🔒 Meilisearch Security & Access Architecture

Meilisearch is safely reverse-proxied via Caddy (`https://search.yourdomain.com` / `https://search.local`) for fast client-side instant search, while write and administration endpoints are strictly protected:

| Service | Key | Access |
| --- | --- | --- |
| Medusa (index/sync) | `MEILI_MASTER_KEY` | Internal only (`http://meilisearch:7700`) |
| Storefront (browser search) | `MEILI_SEARCH_KEY` | Search-only read key via `NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY` |

**Security Note:** `MEILI_MASTER_KEY` must never be exposed publicly. Only the scoped, read-only `MEILI_SEARCH_KEY` is provided to the client for typo-tolerant product searches.

---

## 📊 Umami Web Analytics Configuration

1. Log into Umami Admin (`http://<YOUR_VPS_IP>:3005` or `https://analytics.local` / configured domain):
   - Default Username: `admin`
   - Default Password: `umami` *(Change immediately upon login)*.
2. Add website `Storefront` and copy generated **Website ID** (UUID).
3. Update `UMAMI_WEBSITE_ID` in `.env` and restart storefront:
```bash
docker compose up -d --force-recreate storefront
```

---

## 🔭 OpenObserve & Vector (Centralized Observability & Logging)

OpenObserve provides a unified, petabyte-scale observability platform for logs, metrics, and traces.

1. **Docker Logs Pipeline (Vector):**
   - The `vector` container automatically reads `/var/run/docker.sock` and streams all logs into OpenObserve under stream `docker_logs`.
2. **Access OpenObserve Dashboard:**
   - URL: `https://monitor.local` (Profile B) or `https://monitor.yourdomain.com` (Profile C) or `http://127.0.0.1:5080` (Local/Host).
   - Log in using `OPENOBSERVE_ROOT_USER_EMAIL` and `OPENOBSERVE_ROOT_USER_PASSWORD` configured in `.env`.
3. **Start Observability Stack:**
```bash
docker compose up -d openobserve vector
```


---

## 🔄 Useful Server Maintenance Commands

### Stream Container Live Logs:
```bash
docker compose logs -f medusa
```

### Zero-Downtime Storefront Update:
```bash
git pull origin main
docker compose up -d --build --no-deps storefront
```

---

## 🚀 GitHub Actions Storefront Deploy

Production storefront updates are handled by `.github/workflows/deploy-storefront.yml`.

### What triggers a deploy?

| Trigger | When |
| --- | --- |
| Strapi Storefront Management (`POST /api/storefront/sync-component` or `build`) | Queues sync / builds on GitHub Actions CI/CD |
| GitHub **Run workflow** | Manual deploy from Actions tab |

### Required GitHub repository secrets

| Secret | Purpose |
| --- | --- |
| `DEPLOY_HOST` | VPS IP or hostname |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_SSH_KEY` | Private SSH key for deploy user |
| `DEPLOY_PATH` | Absolute path to repo on VPS, e.g. `/var/www/next-strapi-medusa` |
| `DEPLOY_PORT` | Optional SSH port (default `22`) |
| `REGISTRY_URL` | Public Loomix Blocks raw GitHub URL (or your team's custom registry) |
| `GITHUB_PAT` | Optional: GitHub PAT only if your custom registry is private |

### Required Strapi environment variables (production)

```env
GITHUB_DEPLOY_TOKEN=github_pat_...
GITHUB_DEPLOY_REPO=your-org/next-strapi-medusa
REVALIDATE_SECRET=...
REGISTRY_URL=https://raw.githubusercontent.com/Loomix-pro/Loomix-registry/main/src/modules
# GITHUB_PAT=github_pat_... (only if using your own private repo)
```

The Strapi admin button calls GitHub Actions workflow dispatch directly instead of building Docker inside the Strapi container.

### End-to-end flow for a new Loomix style

1. Publish the style in the Loomix registry repository.
2. In Strapi Storefront Management, select the component and style, then sync or click **Update Storefront**.
3. GitHub Actions runs `node scripts/sync-loom-component.js add ...`.
4. `store/scripts/generate-style-registries.js` regenerates imports.
5. Changes are committed to `main` when needed.
6. VPS runs `git pull` and `docker compose up -d --build --no-deps storefront`.

---

### Prune Docker Build Cache & Reclaim Disk Space:
```bash
docker builder prune -f
docker system prune -f
```
