// import type { Core } from '@strapi/strapi';

// import { pagesToSeed } from './mock-data';

// export async function seedStaticPages(strapi: any) {

//   for (const page of pagesToSeed) {
//     try {
//       // --- DATABASE AUTO-REPAIR ---
//       // Due to previous script versions, there might be multiple entries for the same locale,
//       // or entries with mismatched documentIds. This completely sanitizes the Single Type table.
//       const allEntries = await strapi.db.query(page.uid).findMany();
//       if (allEntries && allEntries.length > 0) {
//         const faEntry = allEntries.find((e: any) => e.locale === 'fa-IR');
//         const masterDocId = faEntry ? faEntry.documentId : allEntries[0].documentId;

//         const idsToDelete: any[] = [];
//         const seenLocales = new Set();

//         const sortedEntries = [...allEntries].sort((a: any, b: any) => (a.locale === 'fa-IR' ? -1 : 1));

//         for (const entry of sortedEntries) {
//           if (entry.documentId !== masterDocId || seenLocales.has(entry.locale)) {
//             idsToDelete.push(entry.id);
//           } else {
//             seenLocales.add(entry.locale);
//           }
//         }

//         if (idsToDelete.length > 0) {
//           await strapi.db.query(page.uid).deleteMany({
//             where: { id: { $in: idsToDelete } },
//           });
//           strapi.log.info(`[SEED] Deleted ${idsToDelete.length} garbage/duplicate entries for ${page.uid} to repair DB state.`);
//         }
//       }
//       // ----------------------------

//       // 1. Handle fa-IR (Default Locale) using Strapi 5 Document API
//       let existingFa = await strapi.documents(page.uid).findFirst({
//         locale: 'fa-IR',
//       });
      
//       let docId;
//       if (!existingFa) {
//         strapi.log.info(`[SEED] Creating ${page.uid} (fa-IR)...`);
//         existingFa = await strapi.documents(page.uid).create({
//           data: {
//             title: page.faTitle,
//             locale: 'fa-IR',
//             blocks: page.faBlocks,
//           },
//         });
//         docId = existingFa.documentId;
//       } else {
//         docId = existingFa.documentId;
//         // Force update existing entry to ensure it has the latest full mock data
//         strapi.log.info(`[SEED] Populating components for ${page.uid} (fa-IR)...`);
//         await strapi.documents(page.uid).update({
//           documentId: docId,
//           locale: 'fa-IR',
//           data: { blocks: page.faBlocks }
//         });
//       }

//       // 2. Handle en (Secondary Locale)
//       const locales = await strapi.plugin('i18n').service('locales').find();
//       const hasEn = locales.find((l: any) => l.code === 'en');

//       if (hasEn) {
//         let existingEn = await strapi.documents(page.uid).findFirst({
//           locale: 'en',
//         });
        
//         if (!existingEn) {
//           strapi.log.info(`[SEED] Creating ${page.uid} (EN)...`);
//           await strapi.documents(page.uid).create({
//             documentId: docId, // In Strapi 5, localizations share the same documentId
//             locale: 'en',
//             data: {
//               title: page.enTitle,
//               blocks: page.enBlocks,
//             },
//           });
//         } else {
//           // Force update existing entry to ensure it has the latest full mock data
//           strapi.log.info(`[SEED] Populating components for ${page.uid} (EN)...`);
//           await strapi.documents(page.uid).update({
//             documentId: docId,
//             locale: 'en',
//             data: { blocks: page.enBlocks }
//           });
//         }
//       }
//     } catch (error: any) {
//       strapi.log.warn(`[SEED] Failed to seed ${page.uid}: ${error.message}`);
//       if (error.details) {
//         strapi.log.warn(`[SEED] Error details: ${JSON.stringify(error.details, null, 2)}`);
//       }
//     }
//   }
// }
