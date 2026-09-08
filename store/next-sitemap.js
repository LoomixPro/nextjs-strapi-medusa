const excludedPaths = ["/checkout", "/account/*", "/cart"]

module.exports = {
  siteUrl:
    process.env.STOREFRONT_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:8000",
  generateRobotsTxt: true,
  exclude: [...excludedPaths, "/[sitemap]"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: "*",
        disallow: excludedPaths,
      },
    ],
  },
}
