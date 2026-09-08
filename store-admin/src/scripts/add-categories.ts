import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { 
  createProductCategoriesWorkflow, 
  createCollectionsWorkflow, 
  createTranslationsWorkflow 
} from "@medusajs/medusa/core-flows";

// Import subscribers to register workflow hooks during the exec script
import "../subscribers/category-sync";
import "../subscribers/collection-sync";

export default async function addCategories({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);

  logger.info("Adding categories and collections (English & Arabic)...");

  // Define Categories
  const categoriesInput = [
    {
      name: "Men's Clothing",
      handle: "mens-clothing",
      is_active: true,
    },
    {
      name: "T-Shirts & Polos",
      handle: "mens-tshirts-polos",
      parent_category_handle: "mens-clothing",
      is_active: true,
    },
    {
      name: "Shirts",
      handle: "mens-shirts",
      parent_category_handle: "mens-clothing",
      is_active: true,
    },
    {
      name: "Pants & Jeans",
      handle: "mens-pants-jeans",
      parent_category_handle: "mens-clothing",
      is_active: true,
    },
    {
      name: "Women's Clothing",
      handle: "womens-clothing",
      is_active: true,
    },
    {
      name: "Coats & Outerwear",
      handle: "womens-coats-outerwear",
      parent_category_handle: "womens-clothing",
      is_active: true,
    },
    {
      name: "Blouses & Tops",
      handle: "womens-blouses",
      parent_category_handle: "womens-clothing",
      is_active: true,
    },
    {
      name: "Dresses",
      handle: "womens-dresses",
      parent_category_handle: "womens-clothing",
      is_active: true,
    },
    {
      name: "Shoes",
      handle: "shoes",
      is_active: true,
    },
    {
      name: "Sneakers",
      handle: "shoes-sneakers",
      parent_category_handle: "shoes",
      is_active: true,
    },
    {
      name: "Formal Shoes",
      handle: "shoes-formal",
      parent_category_handle: "shoes",
      is_active: true,
    },
    {
      name: "Accessories",
      handle: "accessories",
      is_active: true,
    },
    {
      name: "Watches",
      handle: "accessories-watches",
      parent_category_handle: "accessories",
      is_active: true,
    },
    {
      name: "Sunglasses",
      handle: "accessories-sunglasses",
      parent_category_handle: "accessories",
      is_active: true,
    },
    {
      name: "Bags",
      handle: "bags",
      is_active: true,
    },
    {
      name: "Backpacks",
      handle: "bags-backpacks",
      parent_category_handle: "bags",
      is_active: true,
    },
    {
      name: "Handbags",
      handle: "bags-handbags",
      parent_category_handle: "bags",
      is_active: true,
    },
    {
      name: "Kids Clothing",
      handle: "kids-clothing",
      is_active: true,
    },
    {
      name: "Boys",
      handle: "kids-boys",
      parent_category_handle: "kids-clothing",
      is_active: true,
    },
    {
      name: "Girls",
      handle: "kids-girls",
      parent_category_handle: "kids-clothing",
      is_active: true,
    }
  ];

  const categoryTranslationsMap: Record<string, string> = {
    "mens-clothing": "ملابس رجالية",
    "mens-tshirts-polos": "تيشيرت وبولو",
    "mens-shirts": "قمصان",
    "mens-pants-jeans": "بنطلونات وجينز",
    "womens-clothing": "ملابس نسائية",
    "womens-coats-outerwear": "معاطف وملابس خارجية",
    "womens-blouses": "بلوزات وقمصان",
    "womens-dresses": "فساتين",
    "shoes": "أحذية",
    "shoes-sneakers": "أحذية رياضية",
    "shoes-formal": "أحذية رسمية",
    "accessories": "إكسسوارات",
    "accessories-watches": "ساعات",
    "accessories-sunglasses": "نظارات شمسية",
    "bags": "حقائب",
    "bags-backpacks": "حقائب ظهر",
    "bags-handbags": "حقائب يد",
    "kids-clothing": "ملابس أطفال",
    "kids-boys": "ولادي",
    "kids-girls": "بناتي"
  };

  // Define Collections
  const collectionsInput = [
    {
      title: "Summer Collection",
      handle: "summer-collection",
    },
    {
      title: "Best Sellers",
      handle: "best-sellers",
    },
    {
      title: "Special Sale",
      handle: "special-sale",
    },
    {
      title: "New Arrivals",
      handle: "new-arrivals",
    }
  ];

  const collectionTranslationsMap: Record<string, string> = {
    "summer-collection": "مجموعة الصيف",
    "best-sellers": "الأكثر مبيعاً",
    "special-sale": "عروض خاصة",
    "new-arrivals": "وصل حديثاً"
  };

  try {
    const productModuleService = container.resolve(Modules.PRODUCT);
    const existingCats = await productModuleService.listProductCategories({}, { take: 100 });
    const handleToIdMap: Record<string, string> = {};
    for (const c of existingCats) {
      handleToIdMap[c.handle] = c.id;
    }

    const createdCategories: any[] = [...existingCats];

    for (const catInput of categoriesInput) {
      if (!handleToIdMap[catInput.handle]) {
        const parent_category_id = catInput.parent_category_handle 
          ? handleToIdMap[catInput.parent_category_handle] 
          : null;

        const { result: [created] } = await createProductCategoriesWorkflow(container).run({
          input: {
            product_categories: [{
              name: catInput.name,
              handle: catInput.handle,
              is_active: catInput.is_active,
              parent_category_id: parent_category_id,
            }]
          }
        });

        createdCategories.push(created);
        handleToIdMap[catInput.handle] = created.id;
      }
    }
    logger.info(`Successfully verified ${createdCategories.length} categories.`);

    const existingCols = await productModuleService.listProductCollections({}, { take: 100 });
    const existingColHandles = existingCols.map(c => c.handle);
    const colsToCreate = collectionsInput.filter(c => !existingColHandles.includes(c.handle));

    let createdCollections: any[] = [...existingCols];
    if (colsToCreate.length > 0) {
      const { result: collectionsResult } = await createCollectionsWorkflow(container).run({
        input: {
          collections: colsToCreate
        }
      });
      createdCollections = [...createdCollections, ...collectionsResult];
    }
    logger.info(`Successfully verified ${createdCollections.length} collections.`);

    // Create Translations
    logger.info("Setting up Arabic (ar-AE) translations...");
    const translations: any[] = [];

    // Category Translations
    for (const cat of createdCategories) {
      if (categoryTranslationsMap[cat.handle]) {
        translations.push({
          reference_id: cat.id,
          reference: "product_category",
          locale_code: "ar-AE",
          translations: {
            name: categoryTranslationsMap[cat.handle]
          }
        });
      }
    }

    // Collection Translations
    for (const col of createdCollections) {
      if (collectionTranslationsMap[col.handle]) {
        translations.push({
          reference_id: col.id,
          reference: "product_collection",
          locale_code: "ar-AE",
          translations: {
            title: collectionTranslationsMap[col.handle]
          }
        });
      }
    }

    await createTranslationsWorkflow(container).run({
      input: {
        translations: translations as any
      }
    });

    logger.info("Successfully added all category & collection translations.");

  } catch (error) {
    logger.error("Error creating categories and collections:");
    console.error(error);
  }
}
