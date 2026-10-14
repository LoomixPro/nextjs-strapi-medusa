import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::contact-page.contact-page', ({ strapi }) => ({
  async find(ctx) {
    const locale = (ctx.query?.locale as string) || process.env.DEFAULT_LOCALE || 'en-US';
    
    const data = await strapi.documents('api::contact-page.contact-page').findFirst({
      locale,
      populate: {
        blocks: {
          on: {
            'contact.contact-hero': { populate: '*' },
            'contact.contact-info-cards': {
              populate: {
                cards: { populate: '*' }
              }
            },
            'contact.contact-form-info': {
              populate: {
                expectations_list: { populate: '*' },
                quick_questions_card: { populate: '*' }
              }
            },
            'contact.contact-form-settings': { populate: '*' },
            'contact.contact-faq-preview': {
              populate: {
                faq_items: { populate: '*' }
              }
            }
          }
        }
      }
    } as any);

    return { data };
  }
}));
