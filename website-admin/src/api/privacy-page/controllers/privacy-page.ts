import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::privacy-page.privacy-page', ({ strapi }) => ({
  async find(ctx) {
    const locale = (ctx.query?.locale as string) || process.env.DEFAULT_LOCALE || 'en-US';
    
    const data = await strapi.documents('api::privacy-page.privacy-page').findFirst({
      locale,
      populate: {
        blocks: {
          on: {
            'privacy.privacy-hero': { populate: '*' },
            'privacy.privacy-card-section': { populate: '*' },
            'privacy.privacy-grid-section': {
              populate: {
                cards: { populate: '*' }
              }
            },
            'privacy.privacy-text-section': { populate: '*' },
            'privacy.privacy-contact-cta': { populate: '*' }
          }
        }
      }
    } as any);

    return { data };
  }
}));
