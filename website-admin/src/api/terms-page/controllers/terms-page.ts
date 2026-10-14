import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::terms-page.terms-page', ({ strapi }) => ({
  async find(ctx) {
    const locale = (ctx.query?.locale as string) || process.env.DEFAULT_LOCALE || 'en-US';
    
    const data = await strapi.documents('api::terms-page.terms-page').findFirst({
      locale,
      populate: {
        blocks: {
          on: {
            'terms.terms-hero': { populate: '*' },
            'terms.terms-text-section': { populate: '*' },
            'terms.terms-card-section': {
              populate: {
                cards: { populate: '*' }
              }
            },
            'terms.terms-contact-cta': { populate: '*' }
          }
        }
      }
    } as any);

    return { data };
  }
}));
