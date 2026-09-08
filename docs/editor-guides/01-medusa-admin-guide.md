# 🛒 Medusa Dashboard User Guide

This guide covers the essentials of managing your e-commerce operations through the **Medusa Admin Dashboard**.

The Medusa Dashboard is your central hub for managing Products, Categories, Orders, Customers, and Shipping logic.

---

## 1. Accessing the Dashboard

- **Local Development URL:** `http://localhost:7001`
- **Default Login:** Check your `store-admin/.env` for default seeder credentials (typically `admin@medusa-test.com` / `supersecret`).

---

## 2. Managing Products & Categories

### Creating a Product
To create a new product:
1. Navigate to **Products** in the left sidebar.
2. Click the **Create** button.
3. Fill in the essential details (Title, Description, Handle, Thumbnail).
4. **Variants & Options:** You can add options like `Size` or `Color`. 
   > [!IMPORTANT]
   > Note on Colors: In Medusa, the color option value (e.g., `#FF0000` or `Red`) is strictly used for logic. If you need rich color swatches and localized translations for the storefront, you must map these values in the **Strapi CMS** (see the Strapi Guide).

### Assigning Categories
Categories determine how products are grouped in the store's mega-menu and collection pages.
1. Navigate to **Categories**.
2. Create hierarchical categories (e.g., `Men` -> `T-Shirts`).
3. To assign a product, edit the product, go to the **Organize** section, and select the corresponding categories.

---

## 3. Regions & Shipping (Iran Post)

Medusa uses **Regions** to determine pricing and available shipping/payment methods per country.

### Configuring Regions
1. Navigate to **Settings > Regions**.
2. Create a region (e.g., `Iran`).
3. Set the currency (e.g., `IRR`).
4. Select the enabled countries (e.g., `IR`).

### Iran Post Integration
If you are using the custom `medusa-fulfillment-iran-post` plugin:
1. When editing your Region, scroll down to **Providers**.
2. Ensure `Iran Post` is selected under Fulfillment Providers.
3. You can now create specific shipping options (Pishtaz, Sefareshi) that will calculate rates based on the customer's province and city.

---

## 4. Official Medusa Documentation

Because Medusa is a standard, globally used framework, most day-to-day operations (like managing Orders, Discounts, and Customers) work out-of-the-box exactly as designed by the Medusa team.

For detailed tutorials on these standard features, please refer to the official Medusa User Guides:
- 📖 [Managing Orders](https://docs.medusajs.com/user-guide/orders/manage)
- 📖 [Creating Discounts & Promotions](https://docs.medusajs.com/user-guide/discounts/manage)
- 📖 [Managing Customers](https://docs.medusajs.com/user-guide/customers/manage)
