import React from "react"
import type { StrapiApp } from "@strapi/strapi/admin"
import { Play } from "@strapi/icons"

export default {
  config: {
    locales: ["en"],
  },
  bootstrap(app: StrapiApp) {
    // List-view injections removed. We now use a dedicated sidebar page.
  },
  register(app: StrapiApp) {
    app.addMenuLink({
      to: "/plugins/storefront",
      icon: Play,
      intlLabel: {
        id: "storefront.plugin.name",
        defaultMessage: "Storefront",
      },
      Component: async () => {
        const component = await import("./pages/Storefront")
        return component
      },
      permissions: [],
    })
  },
}
