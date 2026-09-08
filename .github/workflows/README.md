# GitHub Actions Secrets

Configure these in **Settings → Secrets and variables → Actions**.

| Secret | Required | Description |
| --- | --- | --- |
| `DEPLOY_HOST` | Yes | VPS IP or hostname |
| `DEPLOY_USER` | Yes | SSH user with Docker access |
| `DEPLOY_SSH_KEY` | Yes | Private SSH key |
| `DEPLOY_PATH` | Yes | Absolute repo path on VPS |
| `DEPLOY_PORT` | No | SSH port, default `22` |
| `REGISTRY_URL` | For Loom sync | Raw GitHub URL to Loom registry |
| `LOOM_REGISTRY_PAT` | For private Loom | PAT with read access to registry repo |

Strapi production `.env` also needs:

- `GITHUB_DEPLOY_TOKEN` — PAT with `repo` scope to dispatch workflows
- `GITHUB_DEPLOY_REPO` — e.g. `your-org/next-strapi-medusa`
