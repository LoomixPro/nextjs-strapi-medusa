# 📝 Strapi CMS User Guide (Content Editors)

This comprehensive guide explains how to manage your website's content, build dynamic pages, and configure global settings using the **Strapi CMS Dashboard**.

---

## 1. Understanding the Strapi Architecture

In the left sidebar under **Content Manager**, you will see two main categories:

### Single Types
Single Types are collections that only have **one** instance. They are used for global configurations and unique pages.
- **Storefront Settings:** Controls global UI aspects (colors, headers, footers).
- **Homepage:** The singular data structure that drives the dynamic sections of your landing page.

### Collection Types
Collection Types hold multiple entries. Think of them as a database table.
- **Blog Posts:** Your articles.
- **Section (...):** These are modular "blocks" (like a Lego piece) that you create once and can insert into any page (like the Homepage) via a Dynamic Zone.

---

## 2. Changing Website Settings

To change the global appearance and configuration of the storefront:
1. Go to **Content Manager > Single Types > Storefront Setting**.
2. **General Flags:** You can toggle `isRtl` (Right-to-Left layout) and `convertToToman` (automatically converting Rial to Toman on the frontend).
3. **Modules (Dynamic Zone):** This is where you configure specific global sections. Click **Add a component to modules** to add settings for:
   - `Header Settings`
   - `Footer Settings`
   - `Theme Settings` (Colors and typography)
   - `Product Page Settings`
4. **Save & Publish:** Changes will reflect immediately on the frontend.

---

## 3. Building Pages with Dynamic Zones

The storefront uses the **Loomix Blocks** system. Instead of hardcoding the homepage, you build it by stacking blocks in a **Dynamic Zone**.

### How to build the Homepage:
1. Navigate to **Content Manager > Single Types > Homepage**.
2. Scroll to the **blocks** field (which is a Dynamic Zone).
3. Click **Add a component to blocks**.
4. You will see options like:
   - `Product Showcase Block`
   - `Features Block`
   - `Blog Posts Block`
   - `Category Collection Showcase Block`
5. **Connecting Content:** Each of these blocks acts as a "bridge". When you add a `Features Block`, it will ask you to select a relation to a **Section (Features)** that you have previously created in your Collection Types.
6. You can drag and drop these blocks to reorder how they appear on the live website.

---

## 4. Collection Styles & References

When you create a Section in the Collection Types, you have access to various **Styles**. Changing the style changes the UI layout on the frontend. 

Below is a reference of the available collections, their configuration options, and visual examples of their styles.

### 🎨 Section: Showcase (`hp-section-showcase`)
Used to display a carousel or grid of products.
- **Source:** Choose how to fetch products (`all`, `collection`, `category`, `campaign`, or `custom` hand-picked).
- **Styles available:** `style-1`
- **Header Styles:** `style-1`
- **Card Styles:** `card-1`

**Visual Reference:**
> ![Showcase Style 1](INSERT_IMAGE_OR_GIF_HERE)

---

### 🎨 Section: Features (`hp-section-feature`)
Used to highlight key selling points (e.g., Free Shipping, 24/7 Support).
- **Features:** Add repeatable items (Icon, Title, Description).
- **Styles available:** `style-1`

**Visual Reference:**
> ![Features Style 1](INSERT_IMAGE_OR_GIF_HERE)

---

### 🎨 Section: Category Collection (`hp-section-category-collection`)
Displays a visual grid linking to your store's categories or Medusa collections.
- **Items:** A dynamic zone where you can mix and match `category-item` and `collection-item`.
- **Styles available:** `style-1`
- **Header Styles:** `style-1`

**Visual Reference:**
> ![Category Collection Style 1](INSERT_IMAGE_OR_GIF_HERE)

---

### 🎨 Section: Blog (`hp-section-blog`)
Highlights articles from your Strapi Blog Posts.
- **Source:** Choose between `latest` (auto-fetch newest), `views` (most popular), or `manual` (hand-pick specific posts).
- **Styles available:** `style-1`
- **Header Styles:** `style-1`

**Visual Reference:**
> ![Blog Section Style 1](INSERT_IMAGE_OR_GIF_HERE)

---

### 🎨 Section: Split Banner (`hp-section-split-banner`)
A highly visual section mixing text, buttons, and media (images/videos).
- **Main Images:** Upload primary showcase media.
- **Side Images:** Upload supplementary media.
- **Styles available:** `style-1`

**Visual Reference:**
> ![Split Banner Style 1](INSERT_IMAGE_OR_GIF_HERE)

---

## 5. Storefront Management & Style Syncing

Strapi includes a dedicated **Storefront Management** page accessible directly from the left navigation menu:

1. Click on **Storefront Management** in the sidebar.
2. Under **Loomix Blocks Sync**:
   - **Component**: Select your desired component from the organized dropdown (Home, Layout, Account, Cart, Pages, Common).
   - **Styles Inspector**: Browse installed and available styles with live visual previews.
   - Click **+ Add to Storefront (Queue)** to install a style or **Remove Style (Queue)** to remove one.
3. Review the **Pending Updates** list. You can click **Undo** on any queued item if needed.
4. Click **Update Storefront**. Strapi automatically synchronizes active storefront settings and themes into `storefront-settings.json` and triggers an automated production build and deployment on GitHub Actions.

---

> [!TIP]
> **To add your own visuals to this documentation:** Replace the `INSERT_IMAGE_OR_GIF_HERE` placeholders in the markdown file with the actual absolute path or URL to your screenshots/GIFs!

