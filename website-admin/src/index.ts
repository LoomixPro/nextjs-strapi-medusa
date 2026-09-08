// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: any }) {
    // If Iran features are disabled, remove convertToToman from storefront-setting content type
    if (process.env.NEXT_PUBLIC_ENABLE_IRAN_FEATURES !== 'true') {
      const storefrontSetting = strapi.contentType('api::storefront-setting.storefront-setting');
      if (storefrontSetting && storefrontSetting.attributes) {
        delete storefrontSetting.attributes.convertToToman;
      }
    }

    if (strapi.plugin('navigation')) {
      const clientController = strapi.plugin('navigation').controller('client');
      const originalRender = clientController.render;

      clientController.render = async (ctx: any) => {
        try {
          return await originalRender.call(clientController, ctx);
        } catch (err: any) {
          if (err.name === 'NotFoundError' || err.message?.includes('Entity not found')) {
            return ctx.send([]);
          }
          throw err;
        }
      };
    }
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: any }) {
    // CRITICAL FIX: Disable Sharp file caching to prevent EBUSY errors on Windows
    // This is a known issue with Strapi 5 + Sharp + WebP on Windows
    // See: https://github.com/strapi/strapi/issues
    try {
      const sharp = require('sharp');
      sharp.cache(false);
    } catch (error) {
      console.warn('[STRAPI] Failed to disable Sharp cache:', error);
    }

    // Custom lifecycle hook to auto-revalidate Next.js cache when Navigation changes
    strapi.db.lifecycles.subscribe({
      models: ['plugin::navigation.navigation', 'plugin::navigation.navigation-item'],

      async afterCreate(event) {
        triggerNextJsRevalidation();
      },
      async afterUpdate(event) {
        triggerNextJsRevalidation();
      },
      async afterDelete(event) {
        triggerNextJsRevalidation();
      },
    });

    // Seed static pages if they are empty
    try {
      const { seedStaticPages } = require('./bootstrap/seed-pages');
      if (typeof seedStaticPages === 'function') {
        await seedStaticPages(strapi);
      }
    } catch (err: any) {
      strapi.log.error('[STRAPI] Failed to seed static pages:', err.message);
    }

    // Automatically populate block adminTitle from selected section relations on save/publish
    strapi.documents.use(async (context: any, next: any) => {
      if (context.uid === 'api::homepage.homepage' && ['create', 'update', 'publish'].includes(context.action)) {
        const data = context.params?.data;
        if (data && Array.isArray(data.blocks)) {
          for (const block of data.blocks) {
            let targetUid = '';
            let relationVal: any = null;

            if (block.__component === 'ui.product-scroll-block') {
              targetUid = 'api::hp-section-scroll-product.hp-section-scroll-product';
              relationVal = block.section;
            } else if (block.__component === 'ui.product-showcase-block') {
              targetUid = 'api::hp-section-showcase.hp-section-showcase';
              relationVal = block.showcase;
            } else if (block.__component === 'ui.category-collection-block') {
              targetUid = 'api::hp-section-category-collection.hp-section-category-collection';
              relationVal = block.section;
            } else if (block.__component === 'ui.blog-posts-block') {
              targetUid = 'api::hp-section-blog.hp-section-blog';
              relationVal = block.blog_section;
            } else if (block.__component === 'ui.features-block') {
              targetUid = 'api::hp-section-feature.hp-section-feature';
              relationVal = block.features_section;
            } else if (block.__component === 'ui.hero-block') {
              targetUid = 'api::hp-section-hero.hp-section-hero';
              relationVal = block.section;
            }

            if (targetUid && relationVal) {
              try {
                const docIdOrId = extractRelationDocIdOrId(relationVal);

                if (docIdOrId) {
                  let relatedDoc: any = null;
                  if (typeof docIdOrId === 'string' && isNaN(Number(docIdOrId))) {
                    relatedDoc = await strapi.documents(targetUid).findOne({ documentId: docIdOrId });
                  } else {
                    relatedDoc = await strapi.db.query(targetUid).findOne({ where: { id: docIdOrId } });
                  }

                  if (relatedDoc) {
                    const autoName = relatedDoc.adminDisplayTitle || relatedDoc.title || '';
                    if (autoName) {
                      block.adminTitle = autoName;
                    }
                  }
                }
              } catch (e: any) {
                strapi.log.warn('[STRAPI] Auto-populating block adminTitle notice:', e.message);
              }
            }
          }
        }
      }
      return next();
    });

    // Automatically sync schema field descriptions and dynamic zone component settings
    await syncContentManagerFieldDescriptions(strapi);
  },
};

async function syncContentManagerFieldDescriptions(strapi: any) {
  try {
    for (const uid of Object.keys(strapi.contentTypes || {})) {
      if (!uid.startsWith('api::')) continue;
      const contentType = strapi.contentType(uid);
      if (!contentType || !contentType.attributes) continue;

      const storeKey = `configuration_content_types::${uid}`;
      let conf: any = null;
      try {
        conf = await strapi.store({ type: 'plugin', name: 'content_manager', key: storeKey }).get();
      } catch (e) {}

      if (conf && conf.metas) {
        let changed = false;
        for (const [attrName, attrSchema] of Object.entries<any>(contentType.attributes)) {
          const desc = attrSchema?.description;
          if (desc && conf.metas[attrName]?.edit) {
            if (conf.metas[attrName].edit.description !== desc) {
              conf.metas[attrName].edit.description = desc;
              changed = true;
            }
          }
        }
        if (changed) {
          await strapi.store({ type: 'plugin', name: 'content_manager', key: storeKey }).set({ value: conf });
          strapi.log.info(`[STRAPI] Synced field descriptions for ${uid}`);
        }
      }
    }

    for (const uid of Object.keys(strapi.components || {})) {
      const comp = strapi.components[uid];
      if (!comp || !comp.attributes) continue;

      const storeKey = `configuration_components::${uid}`;
      let conf: any = null;
      try {
        conf = await strapi.store({ type: 'plugin', name: 'content_manager', key: storeKey }).get();
      } catch (e) {}

      if (conf) {
        let changed = false;

        // Clear mainField for settings components so Strapi doesn't append "- style-1" or style names next to component title
        if (uid.startsWith('settings.')) {
          if (conf.settings?.mainField !== '') {
            if (!conf.settings) conf.settings = {};
            conf.settings.mainField = '';
            changed = true;
          }
        } else if (comp.attributes.adminTitle && conf.settings?.mainField !== 'adminTitle') {
          if (!conf.settings) conf.settings = {};
          conf.settings.mainField = 'adminTitle';
          changed = true;
        }

        if (conf.metas) {
          for (const [attrName, attrSchema] of Object.entries<any>(comp.attributes)) {
            const desc = attrSchema?.description;
            if (desc && conf.metas[attrName]?.edit) {
              if (conf.metas[attrName].edit.description !== desc) {
                conf.metas[attrName].edit.description = desc;
                changed = true;
              }
            }
            if (attrSchema?.type === 'relation' && conf.metas[attrName]?.edit) {
              if (conf.metas[attrName].edit.mainField !== 'adminDisplayTitle') {
                conf.metas[attrName].edit.mainField = 'adminDisplayTitle';
                changed = true;
              }
            }
          }
        }

        if (changed) {
          await strapi.store({ type: 'plugin', name: 'content_manager', key: storeKey }).set({ value: conf });
          strapi.log.info(`[STRAPI] Synced component settings for ${uid}`);
        }
      }
    }
  } catch (err: any) {
    strapi.log.warn('[STRAPI] Field description sync notice:', err.message);
  }
}

function triggerNextJsRevalidation() {
  try {
    const baseUrl =
      process.env.STOREFRONT_INTERNAL_URL ||
      process.env.STOREFRONT_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      'http://storefront:8000';
    const secret = process.env.REVALIDATE_SECRET;

    if (!secret) {
      console.warn('[STRAPI] REVALIDATE_SECRET is missing. Cannot trigger Next.js revalidation.');
      return;
    }

    const url = `${baseUrl}/api/revalidate/menu?secret=${secret}`;

    fetch(url, { method: 'POST' })
      .then(res => res.json())
      .catch(err => console.error('[STRAPI] Revalidation fetch error:', err.message));

  } catch (err: any) {
    console.error('[STRAPI] Error triggering revalidation:', err.message);
  }
}

function extractRelationDocIdOrId(val: any): string | number | null {
  if (!val) return null;
  if (typeof val === 'string' || typeof val === 'number') return val;
  if (Array.isArray(val)) {
    if (val.length === 0) return null;
    return extractRelationDocIdOrId(val[0]);
  }
  if (typeof val === 'object') {
    if (val.documentId) return val.documentId;
    if (val.id) return val.id;
    if (Array.isArray(val.connect) && val.connect.length > 0) {
      return extractRelationDocIdOrId(val.connect[0]);
    }
    if (Array.isArray(val.set) && val.set.length > 0) {
      return extractRelationDocIdOrId(val.set[0]);
    }
  }
  return null;
}




