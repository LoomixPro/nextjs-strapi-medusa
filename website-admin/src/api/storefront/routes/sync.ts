export default {
  routes: [
    {
      method: 'POST',
      path: '/storefront/sync-component',
      handler: 'sync.sync',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/storefront/sync-translations',
      handler: 'sync.syncTranslations',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/storefront/sync-settings',
      handler: 'sync.syncSettings',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/storefront/sync-history',
      handler: 'sync.getHistory',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/storefront/sync-undo',
      handler: 'sync.undoHistory',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/storefront/component-styles',
      handler: 'sync.getComponentStyles',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/storefront/style-preview',
      handler: 'sync.getStylePreview',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
