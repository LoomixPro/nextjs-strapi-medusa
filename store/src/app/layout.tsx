import NextTopLoader from "nextjs-toploader"
import { getBaseURL } from "@lib/util/env"
import { Metadata, Viewport } from "next"
import "../styles/globals.css"
import { GoogleTagManager } from "@next/third-parties/google"
import { Vazirmatn, Inter } from "next/font/google"
import Script from "next/script"
import { getStorefrontSettings } from "@lib/data/strapi-settings"
import RootProviders from "./root-providers"
import defaultMessages from "../../messages/default.json"

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const messages = defaultMessages as Record<string, any>
  const settings = await getStorefrontSettings()
  const allowIndexing = settings.allowIndexing ?? true
  const title = settings.siteName || messages?.HomePage?.title || "Loomix"
  const description =
    settings.siteDescription ||
    messages?.HomePage?.subtitle ||
    "Discover high quality products and articles."

  return {
    metadataBase: new URL(getBaseURL()),
    title: {
      template: `%s | ${title}`,
      default: title,
    },
    description,
    icons: {
      icon: [
        { url: "/api/favicon?size=32", sizes: "32x32", type: "image/png" },
        { url: "/api/favicon?size=192", sizes: "192x192", type: "image/png" },
      ],
      shortcut: "/api/favicon?size=32",
      apple: [
        { url: "/api/favicon?size=180", sizes: "180x180", type: "image/png" },
      ],
    },
    robots: {
      index: allowIndexing,
      follow: allowIndexing,
      googleBot: {
        index: allowIndexing,
        follow: allowIndexing,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      siteName: title,
      title: title,
      description: description,
      type: "website",
      locale: "default",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: title,
    },
  }
}

export const viewport: Viewport = {
  themeColor: "#000000",
}

// TODO: Cache Components adoption. Allow blocking prerender for root layout
export const instant = false

export default async function RootLayout(props: { children: React.ReactNode }) {
  const settings = await getStorefrontSettings()

  const lightPaletteClass =
    settings.theme?.lightPalette && settings.theme.lightPalette !== "default"
      ? `palette-light-${settings.theme.lightPalette}`
      : ""
  const darkPaletteClass =
    settings.theme?.darkPalette && settings.theme.darkPalette !== "default"
      ? `palette-dark-${settings.theme.darkPalette}`
      : ""

  const isRtl = settings.isRtl ?? false
  const defaultLocale =
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE ||
    process.env.DEFAULT_LOCALE ||
    "en-US"

  return (
    <html
      lang={defaultLocale}
      dir={isRtl ? "rtl" : "ltr"}
      className={`${vazirmatn.variable} ${inter.variable} ${lightPaletteClass} ${darkPaletteClass}`.trim()}
      suppressHydrationWarning
    >
      {process.env.NEXT_PUBLIC_GTM_ID &&
        !process.env.NEXT_PUBLIC_GTM_ID.includes("XXXX") &&
        !process.env.NEXT_PUBLIC_GTM_ID.includes("Optional") && (
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        )}
      {process.env.NEXT_PUBLIC_UMAMI_URL &&
        process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            async
            src={`${process.env.NEXT_PUBLIC_UMAMI_URL}/script.js`}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}

      <body>
        <NextTopLoader showSpinner={false} />
        <RootProviders settings={settings}>{props.children}</RootProviders>
      </body>
    </html>
  )
}
