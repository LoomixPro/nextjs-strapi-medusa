# 🛠️ Developer Utilities & Scripts

The project includes standalone utility scripts designed to automate repetitive development and content management tasks.

---

## 🖼️ Batch Image Optimizer (`image-optimizer/`)

When uploading hundreds of product photos or blog banners, serving unoptimized raw images (like heavy JPGs/PNGs) can severely impact storefront load times. 

To solve this, the project provides a local Node.js batch image optimization script powered by the `sharp` library.

### What it does:
1. Scans the `image-optimizer/input/` folder for any `.jpg`, `.jpeg`, or `.png` files.
2. Resizes images proportionally (max width: 1200px) to prevent unnecessary extra-large resolutions.
3. Converts them to the modern, highly compressed **WebP** format (`quality: 80`).
4. Saves the optimized output in the `image-optimizer/output/` folder.

### How to use:
1. Navigate to the utility directory:
   ```bash
   cd image-optimizer
   ```
2. Install dependencies (only needed once):
   ```bash
   npm install
   ```
3. Place your raw, heavy images inside the `input/` directory.
4. Run the optimization script:
   ```bash
   npm start
   ```
5. Retrieve your lightweight, web-ready `.webp` files from the `output/` directory and upload them to Medusa or Strapi!
