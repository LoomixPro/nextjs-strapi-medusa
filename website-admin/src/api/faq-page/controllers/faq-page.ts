import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::faq-page.faq-page', ({ strapi }) => ({
  async find(ctx) {
    const locale = (ctx.query?.locale as string) || process.env.DEFAULT_LOCALE || 'en-US';
    
    const data = await strapi.documents('api::faq-page.faq-page').findFirst({
      locale,
      populate: {
        blocks: {
          on: {
            'faq.faq-hero': { populate: '*' },
            'faq.faq-category': {
              populate: {
                questions: { populate: '*' }
              }
            },
            'faq.faq-contact-cta': { populate: '*' }
          }
        }
      }
    } as any);

    return { data };
  }
}));
