import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::returns-page.returns-page', ({ strapi }) => ({
  async find(ctx) {
    const locale = (ctx.query?.locale as string) || 'en';
    
    const data = await strapi.documents('api::returns-page.returns-page').findFirst({
      locale,
      populate: {
        blocks: {
          on: {
            'support.return-hero': { populate: '*' },
            'support.section-grid': {
              populate: {
                cards: { populate: '*' }
              }
            },
            'support.return-faq': {
              populate: {
                faq_items: { populate: '*' }
              }
            },
            'support.contact-cta': { populate: '*' }
          }
        }
      }
    } as any);

    return { data };
  }
}));
