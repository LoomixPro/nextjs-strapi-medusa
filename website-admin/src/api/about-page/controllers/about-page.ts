import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::about-page.about-page', ({ strapi }) => ({
  async find(ctx) {
    const locale = (ctx.query?.locale as string) || process.env.DEFAULT_LOCALE || 'en-US';
    
    // Fetch the single page with i18n support
    const data = await strapi.documents('api::about-page.about-page').findFirst({
      locale,
      populate: {
        blocks: {
          on: {
            'about.about-hero': { populate: '*' },
            'about.about-story': { populate: '*' },
            'about.about-values': {
              populate: {
                items: { populate: '*' }
              }
            },
            'about.about-features': {
              populate: {
                items: { populate: '*' }
              }
            },
            'about.about-promise': { populate: '*' },
            'about.about-cta': { populate: '*' }
          }
        }
      }
    });

    return { data };
  }
}));
