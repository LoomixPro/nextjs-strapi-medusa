@echo off
echo =======================================================
echo    Next.js + Medusa + Strapi Installation Script
echo =======================================================
echo.
echo Starting Docker containers...
docker compose up -d

echo.
echo Waiting for services to initialize (this may take a few minutes)...
:: Wait for 30 seconds for databases to boot
timeout /t 30 /nobreak >nul

echo.
echo Populating sample data in Medusa and Strapi...
echo 1. Setting up Medusa store defaults (Regions, Shipping, Currencies)...
docker exec medusa npm run seed

echo 2. Creating Super Admin User in Medusa...
docker exec medusa npx medusa user -e admin@example.com -p password123

echo 3. Creating 30 Sample Products, Categories, Collections ^& Tags in Medusa...
docker cp store-admin\src\scripts medusa:/app/store-admin/src/ 2>nul
docker exec medusa npx medusa exec ./src/scripts/seed-30-products.ts

echo 4. Synchronizing Medusa Categories, Collections ^& Products to Strapi...
docker exec medusa npx medusa exec ./src/scripts/sync-all-to-strapi.ts

echo 5. Seeding Strapi Locales, Settings, Pages, Blogs ^& Complete Homepage...
docker cp website-admin\seed-all.js strapi:/opt/app/seed-all.js 2>nul
docker exec strapi node seed-all.js

echo 6. Syncing Storefront Translations...
docker cp scripts strapi:/opt/app/scripts 2>nul
docker exec strapi node ./scripts/sync-translations.js 2>nul || docker exec storefront node ../scripts/sync-translations.js 2>nul || node .\scripts\sync-translations.js 2>nul || echo.

echo.
echo =======================================================
echo    🎉 Setup Complete!
echo =======================================================
pause
