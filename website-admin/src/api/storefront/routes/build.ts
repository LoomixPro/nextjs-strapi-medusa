export default {
  routes: [
    {
      method: 'POST',
      path: '/storefront/build',
      handler: 'build.trigger',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/storefront/status',
      handler: 'build.status',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
