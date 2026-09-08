import { MetadataRoute } from "next"
import { getStorefrontSettings } from "@lib/data/strapi-settings"

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getStorefrontSettings()
  const siteName = settings.siteName || "Loomix"
  const description =
    settings.siteDescription || "Modern Headless E-Commerce Storefront"

  return {
    name: siteName,
    short_name: siteName,
    description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/api/favicon?size=72",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "/api/favicon?size=96",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/api/favicon?size=128",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "/api/favicon?size=144",
        sizes: "144x144",
        type: "image/png",
      },
      {
        src: "/api/favicon?size=152",
        sizes: "152x152",
        type: "image/png",
      },
      {
        src: "/api/favicon?size=192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/api/favicon?size=256",
        sizes: "256x256",
        type: "image/png",
      },
      {
        src: "/api/favicon?size=384",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "/api/favicon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
