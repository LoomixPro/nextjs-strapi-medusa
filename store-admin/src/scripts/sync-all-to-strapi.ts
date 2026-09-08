import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { STRAPI_MODULE } from "../modules/strapi";
import StrapiModuleService, { Collection } from "../modules/strapi/service";

export default async function syncAllToStrapi({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE);

  logger.info("=== SYNCING ALL MEDUSA DATA TO STRAPI (CATEGORIES, COLLECTIONS, PRODUCTS) ===");

  const targetLocales = ["en-US", "ar-AE"];
  logger.info(`Targeting Strapi locales: ${targetLocales.join(", ")}`);

  // 1. Sync Categories
  logger.info("1. Syncing categories...");
  const categories = await productModuleService.listProductCategories({}, { select: ["id", "name", "handle", "description"], take: 500 });
  for (const cat of categories) {
    try {
      let existing = await strapiService.findByMedusaId(Collection.CATEGORIES, cat.id);
      let documentId = existing?.data?.documentId || (existing?.data as any)?.[0]?.documentId;

      if (!documentId) {
        const created = await strapiService.create(Collection.CATEGORIES, {
          medusaId: cat.id,
          name: cat.name,
          medusaHandle: cat.handle,
          description: cat.description || ""
        }, { locale: "en-US", status: "published" });
        documentId = created?.data?.documentId;
        logger.info(`[+] Created Category (en-US): ${cat.name} (${cat.handle})`);
      }

      if (documentId) {
        await strapiService.update(Collection.CATEGORIES, documentId, {
          name: cat.name,
          medusaHandle: cat.handle,
          description: cat.description || ""
        }, { locale: "ar-AE", status: "published" });
      }
    } catch (e: any) {
      logger.warn(`Error syncing category ${cat.handle}: ${e.message}`);
    }
  }

  // 2. Sync Collections
  logger.info("2. Syncing collections...");
  const collections = await productModuleService.listProductCollections({}, { select: ["id", "title", "handle"], take: 500 });
  for (const col of collections) {
    try {
      let existing = await strapiService.findByMedusaId(Collection.COLLECTIONS, col.id);
      let documentId = existing?.data?.documentId || (existing?.data as any)?.[0]?.documentId;

      if (!documentId) {
        const created = await strapiService.create(Collection.COLLECTIONS, {
          medusaId: col.id,
          title: col.title,
          medusaHandle: col.handle
        }, { locale: "en-US", status: "published" });
        documentId = created?.data?.documentId;
        logger.info(`[+] Created Collection (en-US): ${col.title} (${col.handle})`);
      }

      if (documentId) {
        await strapiService.update(Collection.COLLECTIONS, documentId, {
          title: col.title,
          medusaHandle: col.handle
        }, { locale: "ar-AE", status: "published" });
      }
    } catch (e: any) {
      logger.warn(`Error syncing collection ${col.handle}: ${e.message}`);
    }
  }

  // 3. Sync Products
  logger.info("3. Syncing products...");
  const products = await productModuleService.listProducts({}, { select: ["id", "title", "subtitle", "description", "handle", "metadata"], take: 500 });
  for (const prod of products) {
    try {
      let existing = await strapiService.findByMedusaId(Collection.PRODUCTS, prod.id);
      let documentId = existing?.data?.documentId || (existing?.data as any)?.[0]?.documentId;

      const titleAr = (prod.metadata?.title_ar as string) || prod.title;
      const descAr = (prod.metadata?.desc_ar as string) || (prod.description || "");

      if (!documentId) {
        const created = await strapiService.create(Collection.PRODUCTS, {
          medusaId: prod.id,
          title: prod.title,
          subtitle: prod.subtitle || "",
          description: prod.description || ""
        }, { locale: "en-US", status: "published" });
        documentId = created?.data?.documentId;
        logger.info(`[+] Created Product (en-US): ${prod.title}`);
      }

      if (documentId) {
        await strapiService.update(Collection.PRODUCTS, documentId, {
          title: titleAr,
          subtitle: prod.subtitle || "",
          description: descAr
        }, { locale: "ar-AE", status: "published" });
      }
    } catch (e: any) {
      logger.warn(`Error syncing product ${prod.title}: ${e.message}`);
    }
  }

  logger.info("=== MEDUSA TO STRAPI SYNC COMPLETE! ===");
}
