const nextCoreWebVitals = require("eslint-config-next/core-web-vitals")
const prettier = require("eslint-config-prettier")

module.exports = [
  ...nextCoreWebVitals,
  prettier,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/sw.js",
      "public/workbox-*.js",
      "next-sitemap.config.js",
      "next.config.js",
    ],
  },
  {
    rules: {
      "prefer-const": "off",
      eqeqeq: "off",
      "no-console": "off",
      "@next/next/no-img-element": "error",
      "@next/next/no-assign-module-variable": "off",
      // Legacy patterns across the storefront; new in react-hooks v7.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/static-components": "off",
    },
  },
]
