import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::size-guide-page.size-guide-page', ({ strapi }) => ({
  async find(ctx) {
    const locale = (ctx.query?.locale as string) || 'en';
    
    const data = await strapi.documents('api::size-guide-page.size-guide-page').findFirst({
      locale,
      populate: {
        blocks: {
          on: {
            'guide.guide-hero': { populate: '*' },
            'guide.guide-important-notice': { populate: '*' },
            'guide.guide-measurement': {
              populate: {
                measurement_steps: { populate: '*' },
                measurement_tips: { populate: '*' }
              }
            },
            'guide.guide-charts': {
              populate: {
                size_categories: {
                  populate: {
                    charts: {
                      populate: {
                        image: { populate: '*' }
                      }
                    }
                  }
                }
              }
            },
            'guide.guide-faq': {
              populate: {
                faq_items: { populate: '*' }
              }
            },
            'guide.guide-contact-cta': { populate: '*' }
          }
        }
      }
    } as any);

    return { data };
  }
}));
