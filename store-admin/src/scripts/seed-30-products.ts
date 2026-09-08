import fs from "fs";
import path from "path";
import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils";
import {
  createProductsWorkflow,
  createProductCategoriesWorkflow,
  createCollectionsWorkflow,
  createTranslationsWorkflow
} from "@medusajs/medusa/core-flows";

// Import subscribers to register workflow hooks during the exec script
import "../subscribers/category-sync";
import "../subscribers/collection-sync";

export default async function seed30Products({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const productModuleService = container.resolve(Modules.PRODUCT);
  let fileModuleService: any = null;
  try {
    fileModuleService = container.resolve(Modules.FILE);
  } catch {
    // File module service not registered
  }

  const salesChannels = await salesChannelModuleService.listSalesChannels({ name: "Default Sales Channel" });
  const defaultSalesChannel = salesChannels.length ? salesChannels[0] : null;
  if (!defaultSalesChannel) return logger.error("Default Sales Channel not found!");

  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({ type: "default" });
  const shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;
  if (!shippingProfile) return logger.error("Default Shipping Profile not found!");

  // ==========================================
  // 1. CREATE CATEGORIES
  // ==========================================
  logger.info("Ensuring categories exist...");
  const categoriesDefinition = [
    // Men's
    { name: "Men's Clothing", nameAr: "ملابس رجالية", handle: "mens-clothing" },
    { name: "T-Shirts & Polos", nameAr: "تيشيرت وبولو", handle: "mens-tshirts-polos", parent: "mens-clothing" },
    { name: "Shirts", nameAr: "قمصان", handle: "mens-shirts", parent: "mens-clothing" },
    { name: "Pants & Jeans", nameAr: "بنطلونات وجينز", handle: "mens-pants-jeans", parent: "mens-clothing" },
    // Women's
    { name: "Women's Clothing", nameAr: "ملابس نسائية", handle: "womens-clothing" },
    { name: "Coats & Outerwear", nameAr: "معاطف وملابس خارجية", handle: "womens-coats-outerwear", parent: "womens-clothing" },
    { name: "Blouses & Tops", nameAr: "بلوزات وقمصان", handle: "womens-blouses", parent: "womens-clothing" },
    { name: "Dresses", nameAr: "فساتين", handle: "womens-dresses", parent: "womens-clothing" },
    // Shoes
    { name: "Shoes", nameAr: "أحذية", handle: "shoes" },
    { name: "Sneakers", nameAr: "أحذية رياضية", handle: "shoes-sneakers", parent: "shoes" },
    { name: "Formal Shoes", nameAr: "أحذية رسمية", handle: "shoes-formal", parent: "shoes" },
    // Accessories
    { name: "Accessories", nameAr: "إكسسوارات", handle: "accessories" },
    { name: "Watches", nameAr: "ساعات", handle: "accessories-watches", parent: "accessories" },
    { name: "Sunglasses", nameAr: "نظارات شمسية", handle: "accessories-sunglasses", parent: "accessories" },
    // Bags
    { name: "Bags", nameAr: "حقائب", handle: "bags" },
    { name: "Backpacks", nameAr: "حقائب ظهر", handle: "bags-backpacks", parent: "bags" },
    { name: "Handbags", nameAr: "حقائب يد", handle: "bags-handbags", parent: "bags" },
    // Kids
    { name: "Kids Clothing", nameAr: "ملابس أطفال", handle: "kids-clothing" },
    { name: "Boys", nameAr: "ولادي", handle: "kids-boys", parent: "kids-clothing" },
    { name: "Girls", nameAr: "بناتي", handle: "kids-girls", parent: "kids-clothing" }
  ];

  const existingCategories = await productModuleService.listProductCategories({}, { select: ["id", "handle", "name", "parent_category_id"], take: 500 });
  const categoryMap: Record<string, string> = {};
  const parentCategoryMap: Record<string, string> = {};
  for (const c of existingCategories) {
    if (c.handle) {
      categoryMap[c.handle] = c.id;
      if (c.parent_category_id) {
        parentCategoryMap[c.handle] = c.parent_category_id;
      }
    }
  }

  const categoryTranslations: any[] = [];

  for (const catDef of categoriesDefinition) {
    if (!categoryMap[catDef.handle]) {
      const parentId = catDef.parent ? categoryMap[catDef.parent] : null;
      const { result: [created] } = await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: [{
            name: catDef.name,
            handle: catDef.handle,
            is_active: true,
            parent_category_id: parentId,
          }]
        }
      });
      categoryMap[catDef.handle] = created.id;
      categoryTranslations.push({
        reference_id: created.id,
        reference: "product_category",
        locale_code: "ar-AE",
        translations: { name: catDef.nameAr }
      });
    } else {
      categoryTranslations.push({
        reference_id: categoryMap[catDef.handle],
        reference: "product_category",
        locale_code: "ar-AE",
        translations: { name: catDef.nameAr }
      });
    }
  }

  // ==========================================
  // 2. CREATE COLLECTIONS
  // ==========================================
  logger.info("Ensuring collections exist...");
  const collectionsDefinition = [
    { title: "Summer Collection", titleAr: "مجموعة الصيف", handle: "summer-collection" },
    { title: "Best Sellers", titleAr: "الأكثر مبيعاً", handle: "best-sellers" },
    { title: "Special Sale", titleAr: "عروض خاصة", handle: "special-sale" },
    { title: "New Arrivals", titleAr: "وصل حديثاً", handle: "new-arrivals" }
  ];

  const existingCollections = await productModuleService.listProductCollections({}, { select: ["id", "handle", "title"], take: 500 });
  const collectionMap: Record<string, string> = {};
  for (const col of existingCollections) {
    if (col.handle) collectionMap[col.handle] = col.id;
  }

  const collectionTranslations: any[] = [];

  for (const colDef of collectionsDefinition) {
    if (!collectionMap[colDef.handle]) {
      const { result: [created] } = await createCollectionsWorkflow(container).run({
        input: {
          collections: [{
            title: colDef.title,
            handle: colDef.handle
          }]
        }
      });
      collectionMap[colDef.handle] = created.id;
      collectionTranslations.push({
        reference_id: created.id,
        reference: "product_collection",
        locale_code: "ar-AE",
        translations: { title: colDef.titleAr }
      });
    } else {
      collectionTranslations.push({
        reference_id: collectionMap[colDef.handle],
        reference: "product_collection",
        locale_code: "ar-AE",
        translations: { title: colDef.titleAr }
      });
    }
  }

  // ==========================================
  // 3. TAGS & TRANSLATIONS MAP
  // ==========================================
  logger.info("Processing tags...");
  const tagsDefinition: Record<string, string> = {
    "Men": "رجالي",
    "Women": "نسائي",
    "Summer": "صيفي",
    "Winter": "شتوي",
    "Casual": "كاجوال",
    "Formal": "رسمي",
    "Sport": "رياضي",
    "Classic": "كلاسيك",
    "Linen": "كتان",
    "Cotton": "قطن",
    "Silk": "حرير",
    "Denim": "جينز",
    "Leather": "جلد",
    "Premium": "فاخر",
    "Watch": "ساعة",
    "Sunglasses": "نظارات شمسية",
    "Backpack": "حقيبة ظهر",
    "Tote": "حقيبة يد",
    "Boys": "ولادي",
    "Girls": "بناتي",
    "Kids": "أطفال",
    "Shoes": "أحذية",
    "Trending": "رائج"
  };

  const tagKeys = Object.keys(tagsDefinition);
  const existingTags = await productModuleService.listProductTags({ value: tagKeys }, { take: 1000 });
  const existingTagValues = existingTags.map(t => t.value);
  const tagsToCreate = tagKeys.filter(v => !existingTagValues.includes(v)).map(v => ({ value: v }));

  let allTags = [...existingTags];
  if (tagsToCreate.length > 0) {
    const createdTags = await productModuleService.createProductTags(tagsToCreate);
    allTags = [...allTags, ...createdTags];
  }
  const tagValueToId = allTags.reduce((acc, tag) => {
    acc[tag.value] = tag.id;
    return acc;
  }, {} as Record<string, string>);

  const tagTranslations: any[] = allTags.map(tag => ({
    reference_id: tag.id,
    reference: "product_tag",
    locale_code: "ar-AE",
    translations: { value: tagsDefinition[tag.value] || tag.value }
  }));

  // ==========================================
  // 4. 30 DETAILED PRODUCTS DEFINITION
  // ==========================================
  // Schema:
  // [TitleEn, TitleAr, DescEn, DescAr, CategoryHandle, CollectionHandle, TagsEnArray, PriceEur, Colors[En,Ar,Hex], Sizes[En,Ar], ImagesArray]
  const rawProducts: any[] = [
    // --- Men's T-Shirts & Polos ---
    [
      "Essential Organic Cotton T-Shirt",
      "تيشيرت قطن عضوي أساسي",
      "Crafted from 100% breathable organic cotton, offering all-day comfort and a clean modern silhouette. Machine washable at 30°C.",
      "مصنوع من القطن العضوي بنسبة 100% لتوفير راحة فائقة ومظهر عصري أنيق طوال اليوم. قابل للغسل في الغسالة على حرارة 30 درجة.",
      "mens-tshirts-polos",
      "summer-collection",
      ["Men", "Summer", "Casual", "Cotton"],
      25,
      [["White", "أبيض", "#ffffff"], ["Black", "أسود", "#000000"], ["Navy", "كحلي", "#001f3f"]],
      [["M", "متوسط"], ["L", "كبير"], ["XL", "كبير جداً"]],
      [
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80"
      ]
    ],
    [
      "Classic Piqué Polo Shirt",
      "قميص بولو كلاسيكي من البيكيه",
      "Timeless piqué knit polo shirt featuring a ribbed collar, mother-of-pearl buttons, and athletic fit.",
      "قميص بولو كلاسيكي من نسيج البيكيه بياقة محبوكة وأزرار أنيقة وقصة رياضية مميزة.",
      "mens-tshirts-polos",
      "best-sellers",
      ["Men", "Classic", "Casual"],
      38,
      [["Navy", "كحلي", "#001f3f"], ["Burgundy", "عنابي", "#800020"]],
      [["M", "متوسط"], ["L", "كبير"], ["XL", "كبير جداً"]],
      [
        "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80",
        "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&q=80"
      ]
    ],
    [
      "Relaxed Graphic Street T-Shirt",
      "تيشيرت عصري بتصميم ستريت وير",
      "Heavyweight streetwear graphic t-shirt with durable screen print and oversized drape.",
      "تيشيرت ستريت وير ثقيل الوزن بطباعة فنية متينة وقصة واسعة مريحة.",
      "mens-tshirts-polos",
      "new-arrivals",
      ["Men", "Casual", "Trending"],
      30,
      [["Washed Grey", "رمادي مغسول", "#4a4a4a"], ["Off-White", "أوف وايت", "#f8f8f2"]],
      [["M", "متوسط"], ["L", "كبير"]],
      [
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80",
        "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&q=80"
      ]
    ],

    // --- Men's Shirts ---
    [
      "Tailored Oxford Dress Shirt",
      "قميص أكسفورد رسمي مصمم بعناية",
      "Crisp cotton oxford shirt tailored for executive and formal elegance. Wrinkle-resistant finish.",
      "قميص أكسفورد من القطن الفاخر مصمم للأناقة الرسمية ورجال الأعمال، مع معالجة مقاومة للتجاعيد.",
      "mens-shirts",
      "best-sellers",
      ["Men", "Formal", "Classic", "Premium"],
      48,
      [["Sky Blue", "أزرق سماوي", "#87ceeb"], ["Crisp White", "أبيض ناصع", "#ffffff"]],
      [["M", "متوسط"], ["L", "كبير"], ["XL", "كبير جداً"]],
      [
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80"
      ]
    ],
    [
      "Breezy Pure Linen Resort Shirt",
      "قميص ريزورت من الكتان الطبيعي الخالص",
      "Lightweight pure French linen shirt designed for warm summer evenings and tropical getaways.",
      "قميص خفيف من الكتان الفرنسي الطبيعي الخالص مصمم للأيام الصيفية الحارة والرحلات الاستوائية.",
      "mens-shirts",
      "summer-collection",
      ["Men", "Summer", "Linen"],
      55,
      [["Sand Beige", "بيج رملي", "#f5f5dc"], ["Sage Green", "أخضر مريمي", "#9caf88"]],
      [["L", "كبير"], ["XL", "كبير جداً"]],
      [
        "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=800&q=80",
        "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80"
      ]
    ],

    // --- Men's Pants & Jeans ---
    [
      "Slim-Fit Selvedge Denim Jeans",
      "بنطلون جينز سيلفيدج بقصة ضيقة",
      "Premium Japanese raw selvedge denim jeans engineered with durable copper rivets and custom wash.",
      "جينز سيلفيدج ياباني فاخر مع مسامير نحاسية متينة وتصميم متناسق يدوم لسنوات.",
      "mens-pants-jeans",
      "best-sellers",
      ["Men", "Denim", "Casual"],
      65,
      [["Indigo", "أزرق نيلي", "#1a237e"], ["Washed Black", "أسود مغسول", "#212121"]],
      [["30", "30"], ["32", "32"], ["34", "34"]],
      [
        "https://images.unsplash.com/photo-1542272604-780c96856592?w=800&q=80",
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80"
      ]
    ],
    [
      "Pleated Stretch Chino Trousers",
      "بنطلون تشينو بكسرات وقماش مرن",
      "Versatile smart-casual trousers crafted from comfortable stretch cotton-twill.",
      "بنطلون أنيق وعملي مصنوع من قطن التويل المرن عالي الجودة لمظهر مريح طوال اليوم.",
      "mens-pants-jeans",
      "special-sale",
      ["Men", "Casual", "Cotton"],
      45,
      [["Khaki", "كاكي", "#c3b091"], ["Navy", "كحلي", "#001f3f"]],
      [["32", "32"], ["34", "34"], ["36", "36"]],
      [
        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80",
        "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80"
      ]
    ],

    // --- Women's Coats & Outerwear ---
    [
      "Double-Breasted Wool Trench Coat",
      "معطف ترنش صوف بأزرار مزدوجة",
      "Water-repellent wool blend trench coat with a structured belt and storm flap for effortless elegance.",
      "معطف ترنش فاخر من مزيج الصوف المقاوم للماء مع حزام خصر أنيق لإطلالة شتوية راقية.",
      "womens-coats-outerwear",
      "new-arrivals",
      ["Women", "Winter", "Classic", "Premium"],
      140,
      [["Camel", "جملي", "#c19a6b"], ["Midnight Black", "أسود داكن", "#000000"]],
      [["S", "صغير"], ["M", "متوسط"], ["L", "كبير"]],
      [
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80"
      ]
    ],
    [
      "Quilted Down Puffer Jacket",
      "جاكيت منفوخ مبطن بريش ناعم",
      "Thermal insulated lightweight jacket engineered to keep you warm through freezing temperatures.",
      "جاكيت شتوي خفيف الوزن مع عزل حراري متطور ومبطن بريش ناعم لدفء استثنائي.",
      "womens-coats-outerwear",
      "special-sale",
      ["Women", "Winter", "Sport"],
      95,
      [["Frost White", "أبيض ثلجي", "#f8f9fa"], ["Crimson Red", "أحمر قرمزي", "#dc3545"]],
      [["S", "صغير"], ["M", "متوسط"], ["L", "كبير"]],
      [
        "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&q=80",
        "https://images.unsplash.com/photo-1550614000-4b9a9578168f?w=800&q=80"
      ]
    ],
    [
      "Cropped Denim Trucker Jacket",
      "جاكيت جينز كروب عصري",
      "Vintage-washed cotton denim jacket featuring branded metal buttons and dual chest pockets.",
      "جاكيت جينز قصير بتأثير الفينتاج مع أزرار معدنية وجيوب أمامية عملية.",
      "womens-coats-outerwear",
      "summer-collection",
      ["Women", "Denim", "Casual"],
      60,
      [["Vintage Blue", "أزرق كلاسيكي", "#4682b4"]],
      [["S", "صغير"], ["M", "متوسط"]],
      [
        "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&q=80",
        "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=800&q=80"
      ]
    ],

    // --- Women's Blouses & Tops ---
    [
      "Pure Mulberry Silk Party Blouse",
      "بلوزة حرير التوت الطبيعي للمناسبات",
      "Luxurious flowing 100% mulberry silk top with a delicate cowl neckline and satin finish.",
      "بلوزة فاخرة من حرير التوت الطبيعي 100% بتصميم انسيابي وياقة درابيه ساحرة للمناسبات الخاصة.",
      "womens-blouses",
      "best-sellers",
      ["Women", "Silk", "Premium", "Formal"],
      75,
      [["Pearl White", "أبيض لؤلؤي", "#fdfbf7"], ["Rose Gold", "وردي ذهبي", "#b76e79"]],
      [["S", "صغير"], ["M", "متوسط"]],
      [
        "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=800&q=80",
        "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&q=80"
      ]
    ],
    [
      "Floral Printed Chiffon Blouse",
      "بلوزة شيفون بنقشات الزهور",
      "Airy chiffon blouse with romantic floral blooms and elasticated ruffled cuffs.",
      "بلوزة شيفون خفيفة مفعمة بالحيوية مع طبعات زهور رقيقة وأكمام مكشكشة أنيقة.",
      "womens-blouses",
      "summer-collection",
      ["Women", "Summer", "Casual"],
      42,
      [["Pastel Floral", "زهور باستيل", "#ffb6c1"], ["Emerald Floral", "زهور زمردية", "#2e8b57"]],
      [["M", "متوسط"], ["L", "كبير"]],
      [
        "https://images.unsplash.com/photo-1551803091-e20673f15770?w=800&q=80",
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80"
      ]
    ],

    // --- Women's Dresses ---
    [
      "Satin Slip Evening Midi Dress",
      "فستان ميدي من الساتان الفاخر للسهرات",
      "Graceful bias-cut satin slip dress with adjustable spaghetti straps and subtle side slit.",
      "فستان سهرة ميدي من الساتان اللامع بقصة مائلة وفتحة جانبية جذابة لأرقى المناسبات.",
      "womens-dresses",
      "new-arrivals",
      ["Women", "Formal", "Silk", "Trending"],
      88,
      [["Champagne", "شامبين", "#fad6a5"], ["Emerald Green", "أخضر زمردي", "#097969"]],
      [["S", "صغير"], ["M", "متوسط"], ["L", "كبير"]],
      [
        "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
        "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80"
      ]
    ],
    [
      "Tiered Bohemian Summer Maxi Dress",
      "فستان ماكسي بوهيمي صيفي متعدد الطبقات",
      "Breathable organic cotton maxi dress featuring intricate bohemian embroidery and flowing tiers.",
      "فستان ماكسي طويل مصنوع من القطن البارد مع تطريز بوهيمي مميز وطبقات فضفاضة مريحة.",
      "womens-dresses",
      "summer-collection",
      ["Women", "Summer", "Casual", "Cotton"],
      68,
      [["Terracotta", "طمي أحمر", "#e2725b"], ["Ivory White", "أبيض عاجي", "#fffff0"]],
      [["S", "صغير"], ["M", "متوسط"], ["L", "كبير"]],
      [
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80",
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80"
      ]
    ],

    // --- Shoes Sneakers ---
    [
      "Aero-Knit Performance Running Shoes",
      "حذاء جري رياضي بنسيج إيرو-نيت",
      "Engineered with responsive cushioned midsoles, high-traction rubber outsole, and breathable upper mesh.",
      "حذاء رياضي متطور مزود بنعل أوسط ممتص للصدمات ونعل سفلي عالي الثبات للتمارين والجري.",
      "shoes-sneakers",
      "best-sellers",
      ["Shoes", "Sport", "Trending"],
      85,
      [["Triple Black", "أسود كامل", "#111111"], ["Glacier Blue", "أزرق جليدي", "#708090"]],
      [["40", "40"], ["41", "41"], ["42", "42"], ["43", "43"]],
      [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
        "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80"
      ]
    ],
    [
      "Retro Minimalist Leather Sneakers",
      "حذاء سنيكرز جلدي كلاسيكي مينيمال",
      "Handcrafted clean white leather low-top sneakers that complement suits or casual denim.",
      "سنيكرز أبيض من الجلد الطبيعي بتصميم بسيط وأنيق يناسب الإطلالات الرسمية والكاجوال.",
      "shoes-sneakers",
      "summer-collection",
      ["Shoes", "Casual", "Leather", "Classic"],
      70,
      [["Clean White", "أبيض ناصع", "#ffffff"], ["White/Gum", "أبيض مع نعل بني", "#f5f5f5"]],
      [["39", "39"], ["40", "40"], ["41", "41"], ["42", "42"]],
      [
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
        "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80"
      ]
    ],
    [
      "High-Top Canvas Heritage Sneakers",
      "حذاء قماشي كلاسيكي برقبة عالية",
      "Durable canvas sneakers with vulcanized rubber toe-caps and heritage ankle patch.",
      "حذاء رياضي كلاسيكي من القماش المتين مع مقدمة مطاطية مدعمة لمظهر شبابي عصري.",
      "shoes-sneakers",
      "special-sale",
      ["Shoes", "Casual", "Trending"],
      52,
      [["Vintage Black", "أسود كلاسيكي", "#222222"], ["Racing Red", "أحمر سباق", "#c70039"]],
      [["38", "38"], ["39", "39"], ["40", "40"], ["41", "41"]],
      [
        "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80",
        "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80"
      ]
    ],

    // --- Shoes Formal ---
    [
      "Handcrafted Full-Grain Oxford Shoes",
      "حذاء أكسفورد جلد طبيعي صناعة يدوية",
      "Artisan Goodyear-welted dress shoes made from hand-burnished Italian calfskin leather.",
      "حذاء رسمي فاخر مصنوع يدوياً من جلد العجل الإيطالي الفاخر بتطريز متين وجودة استثنائية.",
      "shoes-formal",
      "best-sellers",
      ["Shoes", "Formal", "Leather", "Premium"],
      135,
      [["Chestnut Brown", "بني كستنائي", "#5c4033"], ["Onyx Black", "أسود أونيكس", "#0f0f0f"]],
      [["41", "41"], ["42", "42"], ["43", "43"], ["44", "44"]],
      [
        "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&q=80",
        "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&q=80"
      ]
    ],
    [
      "Pointed-Toe Velvet Evening Heels",
      "حذاء كعب عالي مخملي للسهرات",
      "Sophisticated 8.5cm stiletto heels with a plush velvet finish and memory-foam padded insoles.",
      "حذاء كعب عالي أنيق بطول 8.5 سم مغطى بالمخمل الفاخر ومبطن بنعل مريح للمناسبات الليلية.",
      "shoes-formal",
      "new-arrivals",
      ["Shoes", "Women", "Formal", "Party"],
      95,
      [["Nude Beige", "بيج نيود", "#e3bc9a"], ["Royal Black", "أسود ملكي", "#1a1a1a"]],
      [["37", "37"], ["38", "38"], ["39", "39"]],
      [
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80",
        "https://images.unsplash.com/photo-1535043934128-cf0b28d52f95?w=800&q=80"
      ]
    ],

    // --- Accessories Watches ---
    [
      "Minimalist Sapphire Leather Watch",
      "ساعة يد جلدية مينيمال بزجاج الياقوت",
      "Slim quartz watch with scratch-resistant sapphire crystal glass and genuine Italian leather strap.",
      "ساعة يد كوارتز بتصميم رفيع وراقي مع زجاج ياقوتي مقاوم للخدش وحزام جلد إيطالي أصلي.",
      "accessories-watches",
      "best-sellers",
      ["Accessories", "Watch", "Leather", "Premium"],
      160,
      [["Cognac Leather", "جلد كونياك", "#9a463d"], ["Black Leather", "جلد أسود", "#111111"]],
      [["One Size", "مقاس موحد"]],
      [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80"
      ]
    ],
    [
      "Stainless Steel Automatic Chronograph",
      "ساعة كرونوغراف أوتوماتيكية من الستانلس ستيل",
      "Precision automatic timepiece with three subdials, tachymeter bezel, and 100m water resistance.",
      "ساعة كرونوغراف ميكانيكية دقيقة مع ثلاثة موانئ فرعية ومقاومة للماء حتى عمق 100 متر.",
      "accessories-watches",
      "new-arrivals",
      ["Accessories", "Watch", "Premium", "Classic"],
      220,
      [["Silver Dial", "ميناء فضي", "#c0c0c0"], ["Gold Accent", "لمسات ذهبية", "#d4af37"]],
      [["One Size", "مقاس موحد"]],
      [
        "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80",
        "https://images.unsplash.com/photo-1508685096489-7aac291ba597?w=800&q=80"
      ]
    ],
    [
      "Titanium Sports Smartwatch",
      "ساعة ذكية رياضية بهيكل تيتانيوم",
      "Advanced AMOLED fitness smartwatch tracking heart-rate, GPS routes, and 14-day battery life.",
      "ساعة ذكية رياضية متطورة بشاشة أموليد وهيكل تيتانيوم قوي مع تتبع اللياقة وبطارية تدوم 14 يوماً.",
      "accessories-watches",
      "special-sale",
      ["Accessories", "Watch", "Sport", "Trending"],
      190,
      [["Space Grey", "رمادي فلكي", "#343d46"], ["Matte Black", "أسود غير لامع", "#1b1b1b"]],
      [["One Size", "مقاس موحد"]],
      [
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
        "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80"
      ]
    ],

    // --- Accessories Sunglasses ---
    [
      "Polarized Classic Aviator Sunglasses",
      "نظارات شمسية أفياتور كلاسيكية مستقطبة",
      "Iconic teardrop metal frame sunglasses with UV400 polarized lenses for glare reduction.",
      "نظارات أفياتور أيقونية بإطار معدني خفيف وعدسات مستقطبة تحمي من الأشعة فوق البنفسجية UV400.",
      "accessories-sunglasses",
      "summer-collection",
      ["Accessories", "Sunglasses", "Classic"],
      45,
      [["Gold / Green", "ذهبي مع عدسات خضراء", "#d4af37"], ["Gunmetal / Grey", "رمادي معدني", "#4a4a4a"]],
      [["One Size", "مقاس موحد"]],
      [
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80"
      ]
    ],
    [
      "Retro Square Acetate Sunglasses",
      "نظارات شمسية مربعة من الأسيتات بتصميم ريترو",
      "Chunky retro sunglasses crafted from premium hand-polished Italian acetate with tinted lenses.",
      "نظارات شمسية جريئة مصنوعة من أسيتات إيطالي فاخر مصقول يدوياً مع عدسات متدرجة أنيقة.",
      "accessories-sunglasses",
      "best-sellers",
      ["Accessories", "Sunglasses", "Trending"],
      40,
      [["Tortoiseshell", "تايجر بني", "#8b4513"], ["Glossy Black", "أسود لامع", "#050505"]],
      [["One Size", "مقاس موحد"]],
      [
        "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80",
        "https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&q=80"
      ]
    ],

    // --- Bags Backpacks ---
    [
      "Waterproof Urban Laptop Backpack",
      "حقيبة ظهر للابتوب مقاومة للماء للمدينة",
      "Modern commuter backpack featuring a padded 16-inch laptop sleeve, hidden anti-theft pocket, and USB port.",
      "حقيبة ظهر عصرية مزودة بجيب مبطن للابتوب حتى 16 بوصة وجيب سري مضاد للسرقة وقماش مقاوم للماء.",
      "bags-backpacks",
      "best-sellers",
      ["Bags", "Backpack", "Casual", "Trending"],
      75,
      [["Charcoal Grey", "رمادي فحمي", "#36454f"], ["Midnight Blue", "أزرق ليلي", "#191970"]],
      [["One Size", "مقاس موحد"]],
      [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
        "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80"
      ]
    ],
    [
      "Heavy-Duty Canvas Travel Duffle",
      "حقيبة سفر دافل من الكانفاس المتين",
      "Rugged weekender travel bag with genuine leather straps and spacious 45L storage compartment.",
      "حقيبة سفر أنيقة لعطلة نهاية الأسبوع مصنوعة من قماش الكانفاس القوي وأحزمة جلدية بمساحة 45 لتر.",
      "bags-backpacks",
      "special-sale",
      ["Bags", "Backpack", "Leather"],
      90,
      [["Olive Canvas", "كانفاس زيتي", "#556b2f"], ["Khaki Brown", "بني كاكي", "#8b7355"]],
      [["One Size", "مقاس موحد"]],
      [
        "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80",
        "https://images.unsplash.com/photo-1577733966973-d680bffd2e80?w=800&q=80"
      ]
    ],

    // --- Bags Handbags ---
    [
      "Structured Leather Shopper Tote",
      "حقيبة يد توت جلدية بتصميم منظم",
      "Spacious everyday handbag made from pebble-grain leather with magnetic clasp and organizer pouches.",
      "حقيبة يد نسائية واسعة وعملية من الجلد المحبب الفاخر مع إغلاق مغناطيسي وجيوب داخلية متعددة.",
      "bags-handbags",
      "new-arrivals",
      ["Bags", "Tote", "Leather", "Women", "Premium"],
      85,
      [["Caramel Tan", "كراميل تان", "#c68a4c"], ["Classic Black", "أسود كلاسيكي", "#121212"]],
      [["One Size", "مقاس موحد"]],
      [
        "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80",
        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80"
      ]
    ],
    [
      "Mini Crossbody Saddle Bag",
      "حقيبة كروس بودي ميني بتصميم السرج",
      "Compact crossbody bag with gold-tone metal hardware and adjustable shoulder strap.",
      "حقيبة كتف صغيرة أنيقة مع إكسسوارات ذهبية لامعة وحزام قابل للتعديل لتناسب كافة الطلات.",
      "bags-handbags",
      "summer-collection",
      ["Bags", "Women", "Casual", "Trending"],
      48,
      [["Scarlet Red", "أحمر قرمزي", "#b22222"], ["Blush Pink", "وردي ناعم", "#ffb6c1"]],
      [["One Size", "مقاس موحد"]],
      [
        "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80",
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80"
      ]
    ],

    // --- Kids Clothing ---
    [
      "Boys Adventure Graphic T-Shirt",
      "تيشيرت مغامرات ولادي برسومات ممتعة",
      "Hypoallergenic 100% soft cotton tee with vibrant wildlife prints designed for active play.",
      "تيشيرت أطفال ولادي من القطن الصافي 100% الناعم والمقاوم للحساسية مع رسومات مرحة تدوم طويلاً.",
      "kids-boys",
      "summer-collection",
      ["Kids", "Boys", "Cotton", "Summer"],
      18,
      [["Ocean Blue", "أزرق بحري", "#0077be"], ["Bright Yellow", "أصفر مشرق", "#ffd700"]],
      [["4-5 Y", "٤-٥ سنوات"], ["6-7 Y", "٦-٧ سنوات"], ["8-9 Y", "٨-٩ سنوات"]],
      [
        "https://images.unsplash.com/photo-1519238263530-99abad67b86e?w=800&q=80",
        "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&q=80"
      ]
    ],
    [
      "Girls Sweet Blossom Twirl Dress",
      "فستان بناتي منقوش بنعومة الزهور",
      "Playful twirl dress made from airy organic cotton featuring pastel blossoms and bow accents.",
      "فستان بناتي رقيق مفعم بالبهجة والنعومة مصنوع من القطن العضوي المزين بزهور الباستيل الناعمة.",
      "kids-girls",
      "new-arrivals",
      ["Kids", "Girls", "Summer", "Cotton"],
      28,
      [["Pastel Pink", "وردي باستيل", "#ffd1dc"], ["Daisy White", "أبيض زهر الليمون", "#fffaf0"]],
      [["4-5 Y", "٤-٥ سنوات"], ["6-7 Y", "٦-٧ سنوات"], ["8-9 Y", "٨-٩ سنوات"]],
      [
        "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&q=80",
        "https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=800&q=80"
      ]
    ]
  ];

  logger.info(`Formatting ${rawProducts.length} products with categories, collections, tags, images, and prices (EUR & AED)...`);

  const translationsInput: any[] = [
    ...categoryTranslations,
    ...collectionTranslations,
    ...tagTranslations
  ];

  const existingProducts = await productModuleService.listProducts({}, { select: ["id", "handle", "title", "thumbnail"], take: 500 });
  const existingHandles = new Set(existingProducts.map((p: any) => p.handle).filter(Boolean));

  // Helper function to upload image to MinIO (S3) if file service is available
  async function uploadImageToMinio(imageUrl: string, filename: string, imageIndex: number = 0): Promise<string> {
    if (!fileModuleService) return imageUrl;

    // 1. Try local bundled fashion assets first! (100% offline & Iran-safe)
    try {
      const assetFilename = `fashion-${(imageIndex % 30) + 1}.jpg`;
      const candidatePaths = [
        path.join(__dirname, "assets", "sample-fashion", assetFilename),
        path.join(process.cwd(), "src", "scripts", "assets", "sample-fashion", assetFilename),
        path.join(process.cwd(), "assets", "sample-fashion", assetFilename),
        path.join("/app/store-admin", "src", "scripts", "assets", "sample-fashion", assetFilename),
        path.join("/app", "src", "scripts", "assets", "sample-fashion", assetFilename)
      ];

      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          const buffer = fs.readFileSync(p);
          const uploaded = await fileModuleService.createFiles({
            filename,
            mimeType: "image/jpeg",
            content: buffer.toString("base64"),
            access: "public"
          });
          const finalUrl = uploaded?.url || (Array.isArray(uploaded) && uploaded[0]?.url);
          if (finalUrl) {
            logger.info(`[MinIO] Uploaded bundled ${assetFilename} as ${filename} -> ${finalUrl}`);
            return finalUrl;
          }
        }
      }
    } catch (e: any) {
      logger.warn(`Local asset upload note for ${filename}: ${e.message}`);
    }

    // 2. Fallback to fetch from external URL if local asset not found
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(imageUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = res.headers.get("content-type") || "image/jpeg";
        const uploaded = await fileModuleService.createFiles({
          filename,
          mimeType,
          content: buffer.toString("base64"),
          access: "public"
        });
        const finalUrl = uploaded?.url || (Array.isArray(uploaded) && uploaded[0]?.url);
        if (finalUrl) {
          logger.info(`[MinIO] Uploaded ${filename} -> ${finalUrl}`);
          return finalUrl;
        }
      }
    } catch (e: any) {
      logger.warn(`MinIO upload fallback for ${filename}: ${e.message}`);
    }
    return imageUrl;
  }

  const productsToCreate: any[] = [];
  let productCounter = 0;
  for (const p of rawProducts) {
    const [
      titleEn, titleAr, 
      descEn, descAr, 
      catHandle, colHandle, 
      tagsEnArr, 
      priceEur, 
      colors, sizes, 
      imagesArr
    ] = p;

    const cleanHandle = (titleEn as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (existingHandles.has(cleanHandle)) {
      continue;
    }

    const categoryId = categoryMap[catHandle];
    const parentCategoryId = parentCategoryMap[catHandle];
    const categoryIds: string[] = [];
    if (categoryId) categoryIds.push(categoryId);
    if (parentCategoryId && !categoryIds.includes(parentCategoryId)) categoryIds.push(parentCategoryId);

    const collectionId = collectionMap[colHandle];
    const tagIds = (tagsEnArr as string[]).map(t => tagValueToId[t]).filter(Boolean);

    const hasColors = (colors as any[]).length > 0;
    const hasSizes = (sizes as any[]).length > 0;

    const options: any[] = [];
    if (hasColors) options.push({ title: "Color", values: (colors as any[]).map(c => c[0]) });
    if (hasSizes) options.push({ title: "Size", values: (sizes as any[]).map(s => s[0]) });

    const priceAed = Math.round(priceEur * 4); // roughly 1 EUR ~ 4 AED

    const variants: any[] = [];
    for (const color of (colors as any[])) {
      for (const size of (sizes as any[])) {
        const variantTitle = `${size[0]} / ${color[0]}`;
        const variantTitleAr = `${size[1]} / ${color[1]}`;
        
        variants.push({
          title: variantTitle,
          manage_inventory: false,
          metadata: {
            color_code: color[2],
            title_ar: variantTitleAr,
            color_ar: color[1],
            size_ar: size[1]
          },
          options: {
            "Color": color[0],
            "Size": size[0]
          },
          prices: [
            { amount: priceEur as number, currency_code: "usd" },
            { amount: priceAed as number, currency_code: "aed" }
          ]
        });
      }
    }

    const resolvedImageUrls: { url: string }[] = [];
    for (let imgIdx = 0; imgIdx < (imagesArr as string[]).length; imgIdx++) {
      const origUrl = (imagesArr as string[])[imgIdx];
      const filename = `products/${cleanHandle}-${imgIdx + 1}.jpg`;
      const uploadedUrl = await uploadImageToMinio(origUrl, filename, productCounter);
      resolvedImageUrls.push({ url: uploadedUrl });
    }
    productCounter++;

    productsToCreate.push({
      title: titleEn as string,
      handle: cleanHandle,
      description: descEn as string,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfile.id,
      category_ids: categoryIds,
      collection_id: collectionId || undefined,
      tag_ids: tagIds,
      sales_channels: [{ id: defaultSalesChannel.id }],
      options,
      variants,
      images: resolvedImageUrls,
      thumbnail: resolvedImageUrls[0]?.url,
      metadata: {
        title_ar: titleAr,
        desc_ar: descAr
      }
    });
  }

  let createdProducts: any[] = [];
  if (productsToCreate.length > 0) {
    logger.info(`Executing createProductsWorkflow in Medusa for ${productsToCreate.length} products...`);
    const { result } = await createProductsWorkflow(container).run({
      input: { products: productsToCreate as any }
    });
    createdProducts = result;
    logger.info(`Successfully created ${createdProducts.length} products!`);
  } else {
    logger.info("All 30 sample products already exist in Medusa.");
    if (fileModuleService) {
      logger.info("Checking if existing products have external images to migrate to MinIO...");
      let migrationIdx = 0;
      for (const prod of existingProducts) {
        const hasUnsplash = prod.thumbnail && prod.thumbnail.includes("unsplash.com");
        const hasLocalHost = prod.thumbnail && (prod.thumbnail.includes("127.0.0.1") || prod.thumbnail.includes("localhost"));
        const prodDomain = process.env.DOMAIN || "yourdomain.com";
        const isServer = process.env.NODE_ENV === "production" && !prod.thumbnail?.includes(prodDomain);

        if (hasUnsplash || (isServer && hasLocalHost) || !prod.thumbnail) {
          try {
            const matchingRaw = rawProducts.find(rp => {
              const h = (rp[0] as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              return h === prod.handle;
            });
            const pIdx = matchingRaw ? rawProducts.indexOf(matchingRaw) : migrationIdx++;
            const rawImages = matchingRaw ? (matchingRaw[10] as string[]) : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80"];
            const newImages: { url: string }[] = [];
            for (let i = 0; i < rawImages.length; i++) {
              const filename = `products/${prod.handle}-${i + 1}.jpg`;
              const minioUrl = await uploadImageToMinio(rawImages[i], filename, pIdx);
              newImages.push({ url: minioUrl });
            }
            await productModuleService.updateProducts(prod.id, {
              thumbnail: newImages[0]?.url,
              images: newImages
            });
            logger.info(`[✓] Updated product ${prod.handle} images to MinIO: ${newImages[0]?.url}`);
          } catch (e: any) {
            logger.warn(`Could not update images for ${prod.handle}: ${e.message}`);
          }
        }
      }
    }
  }

  // ==========================================
  // 5. ATTACH ARABIC (ar-AE) TRANSLATIONS
  // ==========================================
  logger.info("Preparing product and variant translations for locale 'ar-AE'...");
  const prodTranslations: any[] = [];
  for (const product of createdProducts) {
    // Product Translation
    if (product.metadata?.title_ar) {
      prodTranslations.push({
        reference_id: product.id,
        reference: "product",
        locale_code: "ar-AE",
        translations: {
          title: product.metadata.title_ar,
          description: product.metadata.desc_ar
        }
      });
    }

    // Variants Translation
    if (product.variants) {
      for (const variant of product.variants) {
        if (variant.metadata?.title_ar) {
          prodTranslations.push({
            reference_id: variant.id,
            reference: "product_variant",
            locale_code: "ar-AE",
            translations: {
              title: variant.metadata.title_ar
            }
          });
        }
      }
    }
  }

  if (prodTranslations.length > 0) {
    logger.info(`Applying ${prodTranslations.length} product/variant translations to Medusa database...`);
    await createTranslationsWorkflow(container).run({
      input: {
        translations: prodTranslations
      }
    });
  }

  logger.info("=== SEEDING COMPLETED SUCCESSFULLY! ===");
  logger.info(`- 20 Categories (English & Arabic)`);
  logger.info(`- 4 Collections (English & Arabic)`);
  logger.info(`- ${allTags.length} Tags (English & Arabic)`);
  logger.info(`- 30 Products with High-Res Unsplash Images, Prices in EUR & AED, and full Arabic (ar-AE) translations!`);
}
