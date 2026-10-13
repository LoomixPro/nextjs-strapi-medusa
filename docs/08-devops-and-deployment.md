# 🌐 DevOps & VPS Deployment Guide

This guide details production deployment for **Next-Strapi-Medusa** on a Virtual Private Server (VPS Linux Ubuntu/Debian).

---

## 💻 Recommended Hardware Specifications

To comfortably run all microservices (Postgres, Redis, Meilisearch, MinIO, Strapi, Medusa, Next.js, Umami, Portainer):
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

portainer.yourdomain.com, monitor.yourdomain.com {
    reverse_proxy https://portainer:9443 {
        transport http {
            tls_insecure_skip_verify
        }
    }
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

## 🐳 Portainer CE (Container Management, Live Logs & Visual Metrics)

Portainer Community Edition (CE) provides a lightweight (~40MB RAM footprint), high-performance web dashboard for managing all Docker containers, viewing live streaming logs, tracking real-time CPU/RAM metrics, and executing commands inside container terminals directly from the browser.

### Features & Capabilities:
- **Container Lifecycle Controls:** Start, stop, restart, pause, kill, and inspect container health with a single click.
- **Live Logs (📄):** View live stdout/stderr logs from any container (`caddy`, `strapi`, `medusa`, `storefront`, `postgres`, etc.) in real time without SSH or typing `docker compose logs`.
- **Live Resource Stats (📊):** View real-time interactive charts of CPU consumption, RAM usage, network bandwidth, and active processes for each container.
- **In-Container Web Console (`>_`):** Open an interactive shell terminal (`sh` / `bash`) directly inside any container with one click (equivalent to `docker exec -it <container> sh`).
- **Stack Management (Docker Compose):** Inspect, modify environment variables, and redeploy Docker Compose stacks directly from the web interface.
- **Volume & Image Pruning:** Identify and remove unused Docker images or dangling volumes to reclaim server disk space.

### Access Portainer Dashboard:
- **Direct HTTPS (IP):** `https://<YOUR_VPS_IP>:9443`
- **Via Domain (Caddy):** `https://portainer.yourdomain.com` (or `https://monitor.yourdomain.com`)
- **Local HTTPS (Profile B):** `https://portainer.local` (or `https://monitor.local`)

### Launch Portainer:
```bash
docker compose up -d portainer
```

### ⏱️ Initial 5-Minute Security Window & Setup
Portainer includes a built-in security timeout: the initial administrator password must be set within 5 minutes of starting the container.
1. Immediately open `https://<YOUR_VPS_IP>:9443` in your browser.
2. Enter your username (`admin`) and a secure password (**minimum 12 characters**).
3. Click **Create user** to complete setup.
4. If the page shows *"Your Portainer instance timed out for security purposes"*, simply reset the timer by restarting the container:
   ```bash
   docker restart portainer
   ```
   Then refresh the browser (`F5`) and submit the admin account form.


---

## 💾 Automated Database Backups (`prodrigestivill/postgres-backup-local`)

The system includes the official, battle-tested [prodrigestivill/postgres-backup-local:15](https://github.com/prodrigestivill/docker-postgres-backup-local) container integrated directly into `docker-compose.yml`.

### Features
- **Zero OS dependencies:** Backups run inside an isolated Docker container with standard `pg_dump`.
- **Multi-database support:** Automatically dumps `medusa`, `strapi`, and `umami` databases.
- **Rotation & Retention:** Organizes backups into `daily/`, `weekly/`, `monthly/`, and `last/` pointers, auto-purging old files (14 days retention).
- **Auto-run on schedule:** Runs every day (`@daily`) by default via cron inside the container.

### 1. Manual On-Demand Backup (Before Updates)
Before updating any container or code, take an immediate database snapshot:
```bash
docker exec postgres-backup /backup.sh
```
Files will be immediately created in `./backups/last/` and `./backups/daily/`.

### 2. Database Restoration
To restore a database from the latest or any specific backup:
```bash
# Restore Medusa
gzip -dc ./backups/last/medusa-*.sql.gz | docker exec -i postgres psql -U postgres -d medusa

# Restore Strapi
gzip -dc ./backups/last/strapi-*.sql.gz | docker exec -i postgres psql -U postgres -d strapi

# Restart services to refresh connection pools:
docker compose restart medusa strapi
```

### 3. Offsite S3 Cloud Backups (Cloudflare R2 / AWS S3 / Arvan / MinIO)
To ensure disaster recovery even if the server is permanently damaged or lost, the `s3-backup-sync` container (powered by `rclone/rclone`) automatically mirrors local backups to remote S3-compatible cloud storage.

1. **Configure S3 credentials in `.env`:**
   ```env
   OFFSITE_S3_PROVIDER=Cloudflare
   OFFSITE_S3_ACCESS_KEY_ID=your_r2_or_s3_access_key
   OFFSITE_S3_SECRET_ACCESS_KEY=your_r2_or_s3_secret_key
   OFFSITE_S3_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
   OFFSITE_S3_BUCKET=my-store-backups
   OFFSITE_SYNC_INTERVAL=3600
   ```
   *(If not configured, the container stands by dormant without consuming CPU or crashing).*

2. **Trigger Instant Offsite Cloud Sync:**
   ```bash
   docker exec s3-backup-sync rclone sync /backups s3remote:${OFFSITE_S3_BUCKET:-next-strapi-medusa-backups}/backups
   ```

3. **Disaster Recovery (Restoring from S3 onto a brand-new VPS):**
   ```bash
   docker run --rm -v ./backups:/backups \
     -e RCLONE_CONFIG_S3REMOTE_TYPE=s3 \
     -e RCLONE_CONFIG_S3REMOTE_PROVIDER=${OFFSITE_S3_PROVIDER:-Cloudflare} \
     -e RCLONE_CONFIG_S3REMOTE_ACCESS_KEY_ID=${OFFSITE_S3_ACCESS_KEY_ID} \
     -e RCLONE_CONFIG_S3REMOTE_SECRET_ACCESS_KEY=${OFFSITE_S3_SECRET_ACCESS_KEY} \
     -e RCLONE_CONFIG_S3REMOTE_ENDPOINT=${OFFSITE_S3_ENDPOINT} \
     rclone/rclone copy s3remote:${OFFSITE_S3_BUCKET}/backups /backups
   ```

### 4. Update & Rollback Workflow (Pre-built Docker Images)
Since services run pre-built Docker images pulled from GitHub Container Registry (GHCR):

1. **Snapshot DB:**
   ```bash
   docker exec postgres-backup /backup.sh
   ```
2. **Deploy new version:**
   ```bash
   docker compose pull storefront && docker compose up -d storefront
   ```
3. **If something fails (Rollback):**
   - GitHub Actions tags every build with both `:latest` and `:sha-<commit_sha>` (e.g. `sha-7a1b2c3`).
   - To roll back Storefront to the previous working commit without modifying files:
     ```bash
     # 1. Pull the previous working image by commit SHA:
     docker pull ghcr.io/<ORG>/<REPO>-storefront:sha-<PREVIOUS_COMMIT_SHA>

     # 2. Retag it as latest:
     docker tag ghcr.io/<ORG>/<REPO>-storefront:sha-<PREVIOUS_COMMIT_SHA> ghcr.io/<ORG>/<REPO>-storefront:latest

     # 3. Restart container:
     docker compose up -d storefront
     ```
   - *Alternative:* You can also set `STOREFRONT_IMAGE_TAG=sha-<PREVIOUS_COMMIT_SHA>` in `.env` and run `docker compose up -d storefront`.
   - If database migration broke backward compatibility, restore from `./backups/last/` as shown above.


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
