// Disable Node.js 22/24 compile cache to prevent V8 bytecode corruption during parallel typecheck on Windows
process.env.NODE_DISABLE_COMPILE_CACHE = "1"

const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Helper to parse URL strings from environment variables into Next.js remotePattern objects
 */
function parseUrlToPattern(urlString) {
  if (!urlString) return null
  try {
    const url = new URL(urlString)
    return {
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      port: url.port || undefined,
    }
  } catch (e) {
    return null
  }
}

/**
 * Dynamically extract image domains from environment variables
 */
const dynamicEnvPatterns = [
  process.env.NEXT_PUBLIC_STRAPI_URL,
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
  process.env.STRAPI_URL,
  process.env.MEDUSA_BACKEND_URL,
  process.env.MINIO_PUBLIC_URL,
  process.env.S3_URL,
  process.env.NEXT_PUBLIC_BASE_URL,
]
  .map(parseUrlToPattern)
  .filter(Boolean)

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

const withNextIntl = require("next-intl/plugin")()

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
})

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = withBundleAnalyzer(
  withPWA(
    withNextIntl({
      reactStrictMode: true,
      // Standalone output is only for Docker self-hosting; Vercel handles serverless tracing natively.
      output: process.env.VERCEL
        ? undefined
        : process.env.NEXT_OUTPUT_MODE || "standalone",

      typescript: {
        ignoreBuildErrors: false,
      },
      cacheComponents: true,
      experimental: {
        staleTimes: {
          dynamic: 30,
          static: 180,
        },
        optimizePackageImports: [
          "lucide-react",
          "lodash",
          "framer-motion",
          "@medusajs/ui",
          "@medusajs/icons",
          "@headlessui/react",
          "@radix-ui/react-dialog",
          "@radix-ui/react-accordion",
          "@radix-ui/react-select",
          "@radix-ui/react-switch",
        ],
      },
      async headers() {
        // ---------------------------------------------------------------------------
        // Strapi Preview & Iframe Security Configuration (CSP / Frame-Ancestors):
        //
        // 1. In Development:
        //    - Automatically allows Strapi Admin on 'http://localhost:1337' and 'http://127.0.0.1:1337'
        //      plus any custom NEXT_PUBLIC_STRAPI_URL / STRAPI_URL to embed the storefront inside Strapi's Preview iframe.
        //
        // 2. In Production:
        //    - Automatically reads the production Strapi URL from process.env.NEXT_PUBLIC_STRAPI_URL / STRAPI_URL.
        //    - If NEXT_PUBLIC_STRAPI_URL is set to 'https://admin.yourdomain.com', that domain will be allowed
        //      in 'frame-ancestors' for Strapi live preview, while blocking all unauthorized domains (Clickjacking protection).
        // ---------------------------------------------------------------------------
        const isDev = process.env.NODE_ENV === "development"
        let baseDomain = process.env.DOMAIN || ""
        if (!baseDomain && process.env.NEXT_PUBLIC_BASE_URL) {
          try {
            baseDomain = new URL(process.env.NEXT_PUBLIC_BASE_URL).hostname
          } catch (e) {}
        }
        const domainWildcard = baseDomain
          ? `https://*.${baseDomain} https://${baseDomain}`
          : ""

        const allowedStrapiOrigins = [
          process.env.NEXT_PUBLIC_STRAPI_URL,
          process.env.STRAPI_URL,
          domainWildcard,
          "https://admin.local",
          "http://localhost:1337 http://127.0.0.1:1337",
        ]
          .filter(Boolean)
          .join(" ")

        const frameAncestorsDirective = allowedStrapiOrigins
          ? `'self' ${allowedStrapiOrigins}`
          : "'self'"

        return [
          {
            source: "/(.*)",
            headers: [
              {
                key: "X-DNS-Prefetch-Control",
                value: "on",
              },
              {
                key: "Strict-Transport-Security",
                value: "max-age=63072000; includeSubDomains; preload",
              },
              {
                key: "X-XSS-Protection",
                value: "1; mode=block",
              },
              // Note: X-Frame-Options is intentionally omitted in favor of CSP 'frame-ancestors',
              // which is the modern standard and allows multiple origins (self + Strapi admin URL).
              {
                key: "X-Content-Type-Options",
                value: "nosniff",
              },
              {
                key: "Referrer-Policy",
                value: "origin-when-cross-origin",
              },
              {
                key: "Content-Security-Policy",
                value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https: http:; font-src 'self' data: https:; connect-src 'self' https: http: wss:; frame-ancestors ${frameAncestorsDirective};`,
              },
            ],
          },
        ]
      },
      images: {
        unoptimized: process.env.NODE_ENV === "development",
        formats: ["image/avif", "image/webp"],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        minimumCacheTTL: 2592000,
        qualities: [50, 75],
        dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
        remotePatterns: [
          {
            protocol: "http",
            hostname: "localhost",
          },
          {
            protocol: "http",
            hostname: "127.0.0.1",
          },
          {
            protocol: "http",
            hostname: "medusa",
          },
          {
            protocol: "http",
            hostname: "strapi",
          },
          {
            protocol: "http",
            hostname: "minio",
          },
          {
            protocol: "https",
            hostname: "images.unsplash.com",
          },
          {
            protocol: "https",
            hostname: "images.pexels.com",
          },
          ...(process.env.DOMAIN
            ? [
                {
                  protocol: "https",
                  hostname: process.env.DOMAIN,
                },
                {
                  protocol: "https",
                  hostname: `*.${process.env.DOMAIN}`,
                },
              ]
            : []),
          ...dynamicEnvPatterns,
          ...(S3_HOSTNAME && S3_PATHNAME
            ? [
                {
                  protocol: "https",
                  hostname: S3_HOSTNAME,
                  pathname: S3_PATHNAME,
                },
              ]
            : []),
        ],
      },
    })
  )
)

module.exports = nextConfig
