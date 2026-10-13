#!/usr/bin/env bash
# ==============================================================================
#  PostgreSQL Backup Wrapper for Next-Strapi-Medusa
#  Powered by battle-tested Docker Image: prodrigestivill/postgres-backup-local:15
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_DIR}"

BOLD='\033[1m'
NC='\033[0m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
GRAY='\033[0;90m'

INCLUDE_MEDIA=false
ENV_FILE="${PROJECT_DIR}/.env"

for arg in "$@"; do
    case "$arg" in
        --with-media)
            INCLUDE_MEDIA=true
            ;;
        --help|-h)
            echo "Usage: ./scripts/backup.sh [OPTIONS]"
            echo ""
            echo "Triggers an instant backup using 'postgres-backup' (prodrigestivill/postgres-backup-local:15)."
            echo ""
            echo "Options:"
            echo "  --with-media    Also archive MinIO & uploads media"
            echo "  -h, --help      Show this help message"
            exit 0
            ;;
    esac
done

info() { echo -e "${BLUE}${BOLD}ℹ [INFO]${NC} $1"; }
success() { echo -e "${GREEN}${BOLD}✔ [SUCCESS]${NC} $1"; }
warn() { echo -e "${YELLOW}${BOLD}⚠ [WARN]${NC} $1"; }
error() { echo -e "${RED}${BOLD}✖ [ERROR]${NC} $1"; }

echo -e "${CYAN}${BOLD}==============================================================================${NC}"
echo -e "${CYAN}${BOLD}  📦 POSTGRESQL BACKUP (prodrigestivill/postgres-backup-local)${NC}"
echo -e "${CYAN}${BOLD}==============================================================================${NC}"

# Ensure backups directory exists
mkdir -p "${PROJECT_DIR}/backups"

# Check if postgres-backup container is running
if ! docker ps --format '{{.Names}}' | grep -Eq '^postgres-backup$'; then
    info "Starting 'postgres-backup' container..."
    docker compose up -d postgres-backup
    sleep 3
fi

info "Executing backup via prodrigestivill/postgres-backup-local..."
if docker exec postgres-backup /backup.sh; then
    success "Databases (medusa, strapi, umami) backed up successfully!"
else
    error "Backup execution failed inside postgres-backup container."
    exit 1
fi

# Optional Media Archive
if [ "$INCLUDE_MEDIA" = true ]; then
    info "Archiving media uploads (MinIO data volume)..."
    MEDIA_DIR="${PROJECT_DIR}/backups/media"
    mkdir -p "${MEDIA_DIR}"
    TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
    MEDIA_ARCHIVE="${MEDIA_DIR}/media_${TIMESTAMP}.tar.gz"
    
    docker run --rm \
        -v minio_data:/data/minio:ro \
        -v strapi_uploads:/data/strapi:ro \
        -v medusa_uploads:/data/medusa:ro \
        -v "${MEDIA_DIR}":/backup \
        alpine:latest \
        sh -c "tar -czf /backup/media_${TIMESTAMP}.tar.gz -C /data . 2>/dev/null || true"
        
    if [ -f "${MEDIA_ARCHIVE}" ]; then
        MEDIA_SIZE=$(du -h "${MEDIA_ARCHIVE}" | cut -f1)
        success "Media archive created: media_${TIMESTAMP}.tar.gz (${MEDIA_SIZE})"
    fi
fi

# Optional S3 Offsite Sync trigger
if docker ps --format '{{.Names}}' | grep -Eq '^s3-backup-sync$'; then
    info "Triggering S3 Offsite Cloud Sync..."
    docker exec s3-backup-sync sh -c 'if [ -n "$RCLONE_CONFIG_S3REMOTE_ACCESS_KEY_ID" ] && [ -n "$RCLONE_CONFIG_S3REMOTE_ENDPOINT" ]; then rclone sync /backups s3remote:${OFFSITE_S3_BUCKET:-next-strapi-medusa-backups}/backups --fast-list --transfers=4 && echo "✔ Cloud sync complete."; fi' 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}${BOLD}✔ All backups stored in: ${PROJECT_DIR}/backups${NC}"
echo -e "  • Latest snapshots: ${CYAN}./backups/last/${NC}"
echo -e "  • Daily rotations:  ${CYAN}./backups/daily/${NC}"
echo ""
