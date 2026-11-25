#!/usr/bin/env bash
set -euo pipefail

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

echo "======================================================="
echo "   Next.js + Medusa + Strapi Installation Script"
echo "======================================================="
echo ""
echo "Starting Docker containers..."
docker compose up -d --build

wait_for_service() {
  local container="$1"
  local timeout="${2:-120}"
  local elapsed=0
  echo "Waiting for ${container} to become healthy..."
  while [ "$elapsed" -lt "$timeout" ]; do
    local status
    status=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container" 2>/dev/null || echo "starting")
    if [ "$status" = "healthy" ] || [ "$status" = "running" ]; then
      echo "✔ ${container} is ready ($status)"
      return 0
    fi
    sleep 3
    elapsed=$((elapsed + 3))
  done
  echo "✖ Timed out waiting for ${container}"
  return 1
}

wait_for_service postgres 90
wait_for_service medusa 150
wait_for_service strapi 150

echo ""
echo "Populating sample data in Medusa and Strapi..."
echo "1. Setting up Medusa store defaults (Regions, Shipping, Currencies)..."
docker exec medusa npm run seed

echo "2. Creating Super Admin User in Medusa..."
if [ -n "${MEDUSA_ADMIN_EMAIL:-}" ] && [ -n "${MEDUSA_ADMIN_PASSWORD:-}" ]; then
  docker exec medusa npx medusa user -e "${MEDUSA_ADMIN_EMAIL}" -p "${MEDUSA_ADMIN_PASSWORD}" || true
else
  echo "⚠ Skipping Medusa admin creation: MEDUSA_ADMIN_EMAIL / MEDUSA_ADMIN_PASSWORD not set in .env"
fi

echo "3. Creating 30 Sample Products, Categories, Collections & Tags in Medusa..."
docker cp store-admin/src/scripts medusa:/app/store-admin/src/ 2>/dev/null || true
docker exec medusa npx medusa exec ./src/scripts/seed-30-products.ts

echo "4. Synchronizing Medusa Categories, Collections & Products to Strapi..."
docker exec medusa npx medusa exec ./src/scripts/sync-all-to-strapi.ts

echo "5. Seeding Strapi Locales, Settings, Pages, Blogs & Complete Homepage..."
docker cp website-admin/seed-all.js strapi:/opt/app/seed-all.js 2>/dev/null || true
docker exec strapi node seed-all.js

echo "6. Syncing Storefront Translations..."
docker cp scripts strapi:/opt/app/scripts 2>/dev/null || true
docker exec strapi node ./scripts/sync-translations.js 2>/dev/null || docker exec storefront node ../scripts/sync-translations.js 2>/dev/null || node ./scripts/sync-translations.js 2>/dev/null || true

echo ""
echo "======================================================="
echo "   🎉 Setup Complete!"
echo "======================================================="
