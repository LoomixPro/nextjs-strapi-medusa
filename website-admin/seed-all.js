const { createStrapi } = require('@strapi/strapi');
const path = require('path');

async function seedAll() {
  console.log('=======================================================');
  console.log('   Strapi All-In-One Automated Seeding Script');
  console.log('=======================================================\n');

  const appContext = await createStrapi({
    appDir: __dirname,
    distDir: path.join(__dirname, 'dist')
  }).load();

  // ----------------------------------------------------
  // STEP 1: Ensure required i18n Locales (en-US & ar-AE only)
  // ----------------------------------------------------
  console.log('>>> 1. Ensuring required i18n Locales in Strapi...');
  const i18nPlugin = appContext.plugin('i18n');
  const localeService = i18nPlugin ? i18nPlugin.service('locales') : null;

  const defaultLocaleCode = 'en-US';
  const localesToEnsure = [
    { code: 'en-US', name: 'English (United States) (en-US)' },
    { code: 'ar-AE', name: 'Arabic (United Arab Emirates) (ar-AE)' },
  ];

  if (localeService) {
    let allLocales = await localeService.find();
    let existingCodes = (allLocales || []).map(l => l.code);

    for (const target of localesToEnsure) {
      if (!existingCodes.includes(target.code)) {
        try {
          if (typeof localeService.create === 'function') {
            await localeService.create({
              name: target.name,
              code: target.code,
              isDefault: target.code === defaultLocaleCode,
            });
            console.log(`    [+] Created locale: ${target.name} (${target.code})`);
          } else {
            await appContext.db.query('plugin::i18n.locale').create({
              data: {
                name: target.name,
                code: target.code,
                isDefault: target.code === defaultLocaleCode,
              }
            });
            console.log(`    [+] Created locale via DB: ${target.name} (${target.code})`);
          }
        } catch (err) {
          console.warn(`    [!] Notice creating locale ${target.code}:`, err.message);
        }
      } else {
        console.log(`    [✓] Locale already exists: ${target.code}`);
      }
    }

    // Set en-US as default
    try {
      if (typeof localeService.setDefaultLocale === 'function') {
        await localeService.setDefaultLocale({ code: defaultLocaleCode });
        console.log(`    [✓] Default locale set to ${defaultLocaleCode} via service`);
      }
      if (typeof appContext.store === 'function') {
        await appContext.store({ type: 'plugin', name: 'i18n', key: 'default_locale' }).set({ value: defaultLocaleCode });
      }
    } catch (e) {
      console.warn('    [!] Note setting default locale:', e.message);
    }

    // Delete 'en' and any other non-required locales from Strapi
    try {
      const extraLocales = await appContext.db.query('plugin::i18n.locale').findMany({
        where: {
          code: { $notIn: ['en-US', 'ar-AE'] }
        }
      });
      for (const extra of extraLocales) {
        if (typeof localeService.delete === 'function') {
          await localeService.delete({ id: extra.id });
        } else {
          await appContext.db.query('plugin::i18n.locale').delete({
            where: { id: extra.id }
          });
        }
        console.log(`    [-] Removed unused locale: ${extra.name} (${extra.code})`);
      }
    } catch (e) {
      console.warn('    [!] Note removing extra locales:', e.message);
    }

    const currentDefault = typeof localeService.getDefaultLocale === 'function' 
      ? await localeService.getDefaultLocale() 
      : defaultLocaleCode;
    allLocales = await localeService.find();
    console.log(`    [i] Active Locales in Strapi (Default: ${currentDefault}):`, (allLocales || []).map(l => `${l.name} (${l.code})`).join(', '));
  } else {
    console.warn('    [!] i18n plugin not available on Strapi instance.');
  }

  // Helper for localized documents creation & publishing
  async function createAndPublishLocalized(uid, enData, arData) {
    const enDoc = await appContext.documents(uid).create({
      locale: 'en-US',
      status: 'published',
      data: enData
    });

    try {
      await appContext.documents(uid).update({
        documentId: enDoc.documentId,
        locale: 'ar-AE',
        data: arData
      });
    } catch (e) {
      console.warn(`    [!] Note updating ar-AE for ${uid}:`, e.message);
    }

    if (typeof appContext.documents(uid).publish === 'function') {
      try {
        await appContext.documents(uid).publish({
          documentId: enDoc.documentId,
          locale: 'en-US'
        });
      } catch (e) {}
      try {
        await appContext.documents(uid).publish({
          documentId: enDoc.documentId,
          locale: 'ar-AE'
        });
      } catch (e) {}
    }

    return enDoc;
  }

  // ----------------------------------------------------
  // STEP 2: Storefront Settings
  // ----------------------------------------------------
  console.log('\n>>> 2. Seeding Storefront Settings...');
  let existingSetting = await appContext.documents('api::storefront-setting.storefront-setting').findFirst();
  const defaultSettingsData = {
    siteName: 'Loomix',
    siteDescription: 'Discover timeless collections and premium fashion essentials with Loomix Commerce.',
    isRtl: false,
    returnDeadlineDays: 14,
    allowIndexing: true,
    modules: [
      {
        __component: 'settings.background-settings',
        style: 'grid',
        opacityLight: 40,
        opacityDark: 30
      }
    ]
  };

  if (!existingSetting) {
    existingSetting = await appContext.documents('api::storefront-setting.storefront-setting').create({
      status: 'published',
      data: defaultSettingsData
    });
    console.log('    [+] Created storefront settings:', existingSetting.documentId);
  } else {
    await appContext.documents('api::storefront-setting.storefront-setting').update({
      documentId: existingSetting.documentId,
      data: defaultSettingsData
    });
    console.log('    [✓] Updated storefront settings with background: grid ->', existingSetting.documentId);
  }

  if (typeof appContext.documents('api::storefront-setting.storefront-setting').publish === 'function') {
    try {
      await appContext.documents('api::storefront-setting.storefront-setting').publish({ documentId: existingSetting.documentId });
    } catch (e) {}
  }

  // ----------------------------------------------------
  // STEP 3: Static Pages (About, Contact, FAQ, Terms, Privacy, Returns, Size Guide)
  // ----------------------------------------------------
  console.log('\n>>> 3. Seeding Static Pages (en-US & ar-AE)...');
  const pages = [
    {
      uid: 'api::about-page.about-page',
      name: 'About Page',
      enData: {
        title: 'About Us',
        blocks: [
          {
            __component: 'about.about-hero',
            badge: 'Our Story',
            title: 'Crafting the Future of Contemporary Fashion',
            description: 'Dedicated to providing an unparalleled luxury shopping experience since 2020.'
          },
          {
            __component: 'about.about-story',
            title: 'Our Heritage & Vision',
            paragraphs: 'Founded with a passion for timeless aesthetics and modern craftsmanship, our curated collections connect style enthusiasts worldwide with authentic, high-quality fashion.'
          },
          {
            __component: 'about.about-values',
            title: 'Our Core Values',
            subtitle: 'What drives our design philosophy',
            items: [
              { title: 'Artisan Quality', description: 'Uncompromising attention to materials and craftsmanship.' },
              { title: 'Client Centricity', description: 'Your delight and seamless experience are our top priority.' },
              { title: 'Sustainable Innovation', description: 'Thoughtfully designed garments made to last generations.' }
            ]
          },
          {
            __component: 'about.about-cta',
            title: 'Discover Our Curated Collection',
            description: 'Explore the latest arrivals designed for the discerning individual.',
            primary_button_text: 'Shop Collection',
            primary_button_link: '/store',
            secondary_button_text: 'Contact Us',
            secondary_button_link: '/contact'
          }
        ]
      },
      arData: {
        title: 'من نحن',
        blocks: [
          {
            __component: 'about.about-hero',
            badge: 'قصتنا',
            title: 'صياغة مستقبل الأزياء المعاصرة والأناقة الفاخرة',
            description: 'ملتزمون بتقديم تجربة تسوق استثنائية تجمع بين الفخامة والراحة منذ عام 2020.'
          },
          {
            __component: 'about.about-story',
            title: 'رؤيتنا وتراثنا',
            paragraphs: 'انطلقنا بشغف نحو الأناقة الخالدة والحرفية العالية لتقديم تشكيلات مميزة تلهم عشاق الموضة حول العالم.'
          },
          {
            __component: 'about.about-values',
            title: 'قيمنا الأساسية',
            subtitle: 'المبادئ التي تقود فلسفة التصميم لدينا',
            items: [
              { title: 'جودة استثنائية', description: 'اهتمام فائق بالخامات وتفاصيل الحياكة الدقيقة.' },
              { title: 'الاهتمام بالعميل', description: 'سعادتك وتجربتك السلسة هي أولويتنا الدائمة.' },
              { title: 'استدامة وابتكار', description: 'تصاميم متينة صنعت لتدوم لأجيال قادمة.' }
            ]
          },
          {
            __component: 'about.about-cta',
            title: 'اكتشف مجموعتنا المختارة',
            description: 'تصفح أحدث الصيحات والتصاميم الراقية المصنوعة خصيصاً لك.',
            primary_button_text: 'تسوق التشكيلة',
            primary_button_link: '/store',
            secondary_button_text: 'تواصل معنا',
            secondary_button_link: '/contact'
          }
        ]
      }
    },
    {
      uid: 'api::contact-page.contact-page',
      name: 'Contact Page',
      enData: {
        title: 'Contact Us',
        badge: 'Get in Touch',
        description: 'Our client advisory team is available 24/7 to assist with inquiries, styling advice, or orders.',
        email: 'concierge@luxuryfashion.com',
        phone: '+971 4 123 4567',
        address: 'Downtown Fashion District, Dubai, UAE',
        working_hours: 'Monday – Sunday: 9:00 AM – 10:00 PM GST'
      },
      arData: {
        title: 'تواصل معنا',
        badge: 'خدمة العملاء',
        description: 'فريق مستشاري الأناقة متواجد على مدار الساعة لمساعدتك في أي استفسار أو طلب خاص.',
        email: 'concierge@luxuryfashion.com',
        phone: '+971 4 123 4567',
        address: 'حي دبي للتصميم والأزياء، دبي، الإمارات العربية المتحدة',
        working_hours: 'طوال أيام الأسبوع: من ٩:٠٠ صباحاً حتى ١٠:٠٠ مساءً بتوقيت الخليج'
      }
    },
    {
      uid: 'api::faq-page.faq-page',
      name: 'FAQ Page',
      enData: {
        title: 'Frequently Asked Questions',
        badge: 'Help & Support',
        description: 'Quick answers regarding orders, global shipping, returns, and payments.',
        items: [
          { question: 'What are the international shipping times?', answer: 'Express deliveries typically arrive in 2-4 business days with end-to-end tracking.' },
          { question: 'What is your return policy?', answer: 'We provide complimentary returns within 14 days of delivery for all unworn items.' },
          { question: 'Which payment methods do you accept?', answer: 'We accept Visa, Mastercard, American Express, Apple Pay, and Cash on Delivery in select countries.' }
        ]
      },
      arData: {
        title: 'الأسئلة الشائعة',
        badge: 'المساعدة والدعم',
        description: 'إجابات سريعة وواضحة حول الطلبات، الشحن الدولي، الاستبدال وطرق الدفع.',
        items: [
          { question: 'ما هي مدة التوصيل والشحن الدولي؟', answer: 'يستغرق الشحن السريع ما بين ٢ إلى ٤ أيام عمل مع رقم تتبع فوري للشحنة.' },
          { question: 'ما هي سياسة الإرجاع والاستبدال؟', answer: 'نوفر خدمة إرجاع واستبدال مجانية خلال ١٤ يوماً من استلام الطلب لجميع المنتجات بحالتها الأصلية.' },
          { question: 'ما هي طرق الدفع المتاحة؟', answer: 'نقبل بطاقات فيزا، ماستركارد، أمريكان إكسبريس، آبل باي، والدفع عند الاستلام في دول محددة.' }
        ]
      }
    },
    {
      uid: 'api::privacy-page.privacy-page',
      name: 'Privacy Policy',
      enData: {
        title: 'Privacy Policy',
        lastUpdated: 'August 2026',
        content: 'We respect your privacy and are committed to protecting your personal data with enterprise-grade encryption.'
      },
      arData: {
        title: 'سياسة الخصوصية',
        lastUpdated: 'أغسطس 2026',
        content: 'نحن نقدر خصوصيتك ونلتزم بحماية بياناتك الشخصية بأعلى معايير الأمان والتشفير العالمية.'
      }
    },
    {
      uid: 'api::terms-page.terms-page',
      name: 'Terms of Service',
      enData: {
        title: 'Terms & Conditions',
        lastUpdated: 'August 2026',
        content: 'By accessing or using our services, you agree to be bound by these Terms of Service.'
      },
      arData: {
        title: 'الشروط والأحكام',
        lastUpdated: 'أغسطس 2026',
        content: 'باستخدامك لموقعنا وخدماتنا، فإنك توافق على الالتزام بجميع بنود الشروط والأحكام المنصوص عليها.'
      }
    },
    {
      uid: 'api::returns-page.returns-page',
      name: 'Return Policy',
      enData: {
        title: 'Returns & Exchanges',
        lastUpdated: 'August 2026',
        content: 'Enjoy stress-free 14-day returns with complimentary doorstep pickup.'
      },
      arData: {
        title: 'سياسة الإرجاع والاستبدال',
        lastUpdated: 'أغسطس 2026',
        content: 'استمتع بتجربة إرجاع واستبدال سهلة ومجانية خلال ١٤ يوماً مع استلام الشحنة من باب منزلك.'
      }
    },
    {
      uid: 'api::size-guide-page.size-guide-page',
      name: 'Size Guide Page',
      enData: {
        title: 'Size & Fit Guide',
        badge: 'Accurate Measurements',
        description: 'Find your perfect fit with our comprehensive international size charts.',
        content: 'Please refer to the measurement charts for men, women, and footwear.'
      },
      arData: {
        title: 'دليل المقاسات والقياس',
        badge: 'قياسات دقيقة',
        description: 'اعثر على مقاسك المثالي بدقة من خلال جداول القياسات العالمية المعتمدة.',
        content: 'يرجى مراجعة جداول القياسات للرجال والنساء والأحذية قبل إتمام الطلب.'
      }
    }
  ];

  for (const p of pages) {
    const existing = await appContext.documents(p.uid).findFirst({ locale: 'en-US' });
    if (!existing) {
      const doc = await createAndPublishLocalized(p.uid, p.enData, p.arData);
      console.log(`    [+] Created ${p.name}: ${doc.documentId}`);
    } else {
      console.log(`    [✓] ${p.name} exists: ${existing.documentId}`);
    }
  }

  // ----------------------------------------------------
  // STEP 4: Blog Authors, Categories & Posts
  // ----------------------------------------------------
  console.log('\n>>> 4. Seeding Blog Content (en-US & ar-AE)...');
  let authorEn = await appContext.documents('api::blog-author.blog-author').findFirst({ locale: 'en-US' });
  if (!authorEn) {
    authorEn = await appContext.documents('api::blog-author.blog-author').create({
      locale: 'en-US',
      status: 'published',
      data: {
        name: 'Alexander Reed',
        bio: 'Senior Fashion Director & Style Consultant specializing in contemporary luxury tailoring.'
      }
    });
    console.log('    [+] Created Blog Author (en-US):', authorEn.documentId);
  }

  let authorAr = await appContext.documents('api::blog-author.blog-author').findFirst({ locale: 'ar-AE' });
  if (!authorAr) {
    authorAr = await appContext.documents('api::blog-author.blog-author').create({
      locale: 'ar-AE',
      status: 'published',
      data: {
        name: 'ألكسندر ريد',
        bio: 'مستشار ومصمم أزياء متخصص في الأناقة المعاصرة والأزياء الفاخرة.'
      }
    });
    console.log('    [+] Created Blog Author (ar-AE):', authorAr.documentId);
  }

  let categoryEn = await appContext.documents('api::blog-category.blog-category').findFirst({ locale: 'en-US' });
  if (!categoryEn) {
    categoryEn = await appContext.documents('api::blog-category.blog-category').create({
      locale: 'en-US',
      status: 'published',
      data: {
        name: 'Fashion & Style Trends',
        slug: 'fashion-style-trends'
      }
    });
    console.log('    [+] Created Blog Category (en-US):', categoryEn.documentId);
  }

  let categoryAr = await appContext.documents('api::blog-category.blog-category').findFirst({ locale: 'ar-AE' });
  if (!categoryAr) {
    categoryAr = await appContext.documents('api::blog-category.blog-category').create({
      locale: 'ar-AE',
      status: 'published',
      data: {
        name: 'صيحات الموضة والأناقة',
        slug: 'fashion-style-trends'
      }
    });
    console.log('    [+] Created Blog Category (ar-AE):', categoryAr.documentId);
  }

  // Seed 3 sample blog posts (en-US & ar-AE)
  const blogPostsToSeed = [
    {
      enData: {
        title: 'The Art of Modern Minimalist Styling',
        slug: 'art-of-modern-minimalist-styling',
        excerpt: 'How to build a versatile luxury capsule wardrobe with essential tailored pieces.',
        content: 'Minimalism is not about having less, it is about making room for what truly matters in quality and design. A curated wardrobe allows for effortless daily style without compromise.',
        reading_time: 5,
        author: authorEn.id,
        category: categoryEn.id
      },
      arData: {
        title: 'فن التنسيق العصري البسيط والمبهر',
        slug: 'art-of-modern-minimalist-styling',
        excerpt: 'كيف تبني خزانة ملابس فاخرة ومتكاملة بقطع أساسية تدوم وتناسب كافة الأوقات.',
        content: 'الأناقة البسيطة لا تعني القليل، بل تعني التركيز على الجودة الفائقة والتفاصيل المتقنة. خزانة الملابس المختارة بعناية تمنحك إطلالة راقية في كل يوم.',
        reading_time: 5,
        author: authorAr.id,
        category: categoryAr.id
      }
    },
    {
      enData: {
        title: 'Seasonal Color Palettes & Texture Layering',
        slug: 'seasonal-color-palettes-texture-layering',
        excerpt: 'Master the subtle art of combining rich fabrics, earth tones, and timeless accessories.',
        content: 'Layering is the cornerstone of sophisticated dressing. Combining silk, lightweight wool, and refined accessories creates depth and visual harmony for any occasion.',
        reading_time: 4,
        author: authorEn.id,
        category: categoryEn.id
      },
      arData: {
        title: 'تناغم الألوان وتنسيق الخامات لموسم متألق',
        slug: 'seasonal-color-palettes-texture-layering',
        excerpt: 'أسرار دمج الأقمشة الفاخرة والألوان الترابية مع الإكسسوارات الأنيقة.',
        content: 'تنسيق الطبقات هو سر الإطلالة المتقنة. المزج بين الحرير والصوف الخفيف مع الإكسسوارات الفاخرة يمنحك حضوراً جذاباً ومتفرداً في جميع المناسبات.',
        reading_time: 4,
        author: authorAr.id,
        category: categoryAr.id
      }
    },
    {
      enData: {
        title: 'Sustainable Luxury: Caring for High-End Garments',
        slug: 'sustainable-luxury-caring-for-high-end-garments',
        excerpt: 'Essential preservation tips to maintain the longevity and luster of your favorite designer items.',
        content: 'True luxury is designed to endure. By following proper garment care practices, you preserve the craftsmanship, silhouette, and tactile beauty of each investment piece for years to come.',
        reading_time: 6,
        author: authorEn.id,
        category: categoryEn.id
      },
      arData: {
        title: 'الفخامة المستدامة: العناية بالملابس والقطع الفاخرة',
        slug: 'sustainable-luxury-caring-for-high-end-garments',
        excerpt: 'نصائح ذهبية للحفاظ على جودة وأناقة قطعك المفضلة لتدوم طويلاً.',
        content: 'الفخامة الحقيقية تدوم لسنوات. من خلال العناية الصحيحة بالأقمشة والجلود، تحافظ على بريق وجودة كل قطعة استثمارية في خزانتك لتبقى دائماً كالجديدة.',
        reading_time: 6,
        author: authorAr.id,
        category: categoryAr.id
      }
    }
  ];

  for (const post of blogPostsToSeed) {
    const existing = await appContext.documents('api::blog-post.blog-post').findFirst({
      filters: { slug: post.enData.slug },
      locale: 'en-US'
    });
    if (!existing) {
      const createdPost = await createAndPublishLocalized('api::blog-post.blog-post', post.enData, post.arData);
      console.log(`    [+] Created Blog Post: ${post.enData.title} (${createdPost.documentId})`);
    } else {
      console.log(`    [✓] Blog Post exists: ${post.enData.title}`);
    }
  }

  // ----------------------------------------------------
  // STEP 5: Homepage Sections & Layout (5 Blocks)
  // ----------------------------------------------------
  console.log('\n>>> 5. Seeding Homepage Sections & Layout (en-US & ar-AE)...');
  const mediaFiles = await appContext.documents('plugin::upload.file').findMany();
  const getMediaId = (index) => mediaFiles[index % mediaFiles.length]?.id;

  const strapiProducts = await appContext.documents('api::product.product').findMany({ locale: 'en-US', limit: 4 });
  const productIds = strapiProducts.map(p => p.id);

  const categories = await appContext.documents('api::category.category').findMany({ locale: 'en-US' });
  const collections = await appContext.documents('api::collection.collection').findMany({ locale: 'en-US' });

  // 5.1 Hero Section (style-2)
  let heroDoc = await appContext.documents('api::hp-section-hero.hp-section-hero').findFirst({ locale: 'en-US' });
  const heroHighlightsEn = [
    { text: 'Free Express Shipping', color: 'emerald', icon_name: 'truck' },
    { text: 'Authentic Luxury Guarantee', color: 'primary', icon_name: 'shield-check' },
    { text: '30-Day Easy Returns', color: 'amber', icon_name: 'rotate-ccw' }
  ];
  const heroHighlightsAr = [
    { text: 'شحن سريع مجاني', color: 'emerald', icon_name: 'truck' },
    { text: 'ضمان الجودة والأصالة', color: 'primary', icon_name: 'shield-check' },
    { text: 'استرجاع سهل خلال ۳۰ يوماً', color: 'amber', icon_name: 'rotate-ccw' }
  ];

  if (!heroDoc) {
    heroDoc = await createAndPublishLocalized(
      'api::hp-section-hero.hp-section-hero',
      {
        adminDisplayTitle: 'Main Hero Banner',
        title: 'Elevate Your Signature Style',
        badge: 'New Season 2026',
        description: 'Discover the latest runway collections and contemporary luxury essentials crafted for effortless elegance.',
        buttonText: 'Shop New Arrivals',
        buttonLink: '/store',
        style: 'style-2',
        mainImages: [getMediaId(0), getMediaId(1)].filter(Boolean),
        sideImages: [getMediaId(0), getMediaId(1), getMediaId(2), getMediaId(3)].filter(Boolean),
        highlights: heroHighlightsEn,
        products: productIds
      },
      {
        adminDisplayTitle: 'Main Hero Banner',
        title: 'ارتقِ بأسلوبك الاستثنائي',
        badge: 'موسم جديد 2026',
        description: 'اكتشف أحدث تشكيلات الأزياء المعاصرة والقطع الفاخرة المصممة لتمنحك إطلالة فريدة ومتميزة.',
        buttonText: 'تسوق أحدث القطع',
        buttonLink: '/store',
        style: 'style-2',
        mainImages: [getMediaId(0), getMediaId(1)].filter(Boolean),
        sideImages: [getMediaId(0), getMediaId(1), getMediaId(2), getMediaId(3)].filter(Boolean),
        highlights: heroHighlightsAr,
        products: productIds
      }
    );
    console.log('    [+] Created Hero section (Style-2):', heroDoc.documentId);
  }

  // 5.2 Category & Collection Showcase
  const cat1 = categories[0];
  const cat2 = categories[4] || categories[1];
  const col1 = collections[0];
  const col2 = collections[1];

  let catColDoc = await appContext.documents('api::hp-section-category-collection.hp-section-category-collection').findFirst({ locale: 'en-US' });
  const categoryItemsEn = [
    ...(cat1 ? [{
      __component: 'category-collection.category-item',
      category: cat1.id,
      title: cat1.name || 'Trending Categories',
      description: cat1.description || 'Explore our most popular styles'
    }] : []),
    ...(cat2 ? [{
      __component: 'category-collection.category-item',
      category: cat2.id,
      title: cat2.name || 'Luxury Collections',
      description: cat2.description || 'Curated essentials for every occasion'
    }] : []),
    ...(col1 ? [{
      __component: 'category-collection.collection-item',
      collection: col1.id,
      title: col1.title || 'Seasonal Selection',
      description: 'Exclusive seasonal drops'
    }] : []),
    ...(col2 ? [{
      __component: 'category-collection.collection-item',
      collection: col2.id,
      title: col2.title || 'Special Edit',
      description: 'Handcrafted signature pieces'
    }] : []),
  ];

  const categoryItemsAr = [
    ...(cat1 ? [{
      __component: 'category-collection.category-item',
      category: cat1.id,
      title: 'التصنيفات الأكثر رواجاً',
      description: 'استكشف أشهر الصيحات والتصاميم الراقية'
    }] : []),
    ...(cat2 ? [{
      __component: 'category-collection.category-item',
      category: cat2.id,
      title: 'مجموعات فاخرة',
      description: 'قطع أساسية مختارة بعناية لكل مناسبة'
    }] : []),
    ...(col1 ? [{
      __component: 'category-collection.collection-item',
      collection: col1.id,
      title: 'تشكيلة الموسم',
      description: 'إصدارات وتصاميم حصرية ومميزة'
    }] : []),
    ...(col2 ? [{
      __component: 'category-collection.collection-item',
      collection: col2.id,
      title: 'إصدارات خاصة',
      description: 'قطع مميزة تجمع بين الفخامة والراحة'
    }] : []),
  ];

  if (!catColDoc) {
    catColDoc = await createAndPublishLocalized(
      'api::hp-section-category-collection.hp-section-category-collection',
      {
        adminDisplayTitle: 'Category & Collection Showcase',
        title: 'Curated Categories & Collections',
        badge: 'Explore Showcase',
        description: 'Browse our signature selections designed to elevate your everyday luxury look.',
        linkUrl: '/categories',
        textLink: 'View All Categories',
        style: 'style-1',
        headerStyle: 'style-1',
        items: categoryItemsEn
      },
      {
        adminDisplayTitle: 'Category & Collection Showcase',
        title: 'التصنيفات والمجموعات المختارة',
        badge: 'استكشف التشكيلات',
        description: 'تصفح أحدث التشكيلات المصممة خصيصاً لتلائم ذوقك الرفيع وأسلوبك العصري.',
        linkUrl: '/categories',
        textLink: 'عرض جميع التصنيفات',
        style: 'style-1',
        headerStyle: 'style-1',
        items: categoryItemsAr
      }
    );
    console.log('    [+] Created Category-Collection section:', catColDoc.documentId);
  } else if (categoryItemsEn.length > 0) {
    try {
      await appContext.documents('api::hp-section-category-collection.hp-section-category-collection').update({
        documentId: catColDoc.documentId,
        locale: 'en-US',
        data: { items: categoryItemsEn }
      });
      await appContext.documents('api::hp-section-category-collection.hp-section-category-collection').update({
        documentId: catColDoc.documentId,
        locale: 'ar-AE',
        data: { items: categoryItemsAr }
      });
      await appContext.documents('api::hp-section-category-collection.hp-section-category-collection').publish({ documentId: catColDoc.documentId, locale: 'en-US' });
      await appContext.documents('api::hp-section-category-collection.hp-section-category-collection').publish({ documentId: catColDoc.documentId, locale: 'ar-AE' });
      console.log('    [+] Updated Category-Collection items in Strapi');
    } catch (e) {
      console.warn('    [!] Note updating Category-Collection items:', e.message);
    }
  }

  // 5.3 Scroll Product Stage (style-1)
  let scrollDoc = await appContext.documents('api::hp-section-scroll-product.hp-section-scroll-product').findFirst({ locale: 'en-US' });
  if (!scrollDoc) {
    scrollDoc = await createAndPublishLocalized(
      'api::hp-section-scroll-product.hp-section-scroll-product',
      {
        adminDisplayTitle: 'Trending Scroll Stage',
        title: 'Curated Spotlight',
        badge: 'Trending Now',
        description: 'Explore our handpicked selection of top premium pieces for this season.',
        buttonText: 'View Collection',
        buttonLink: '/store',
        style: 'style-1',
        headerStyle: 'style-1',
        cardStyle: 'card-2',
        products: productIds,
        image: getMediaId(0) || null
      },
      {
        adminDisplayTitle: 'Trending Scroll Stage',
        title: 'تشكيلة مختارة بعناية',
        badge: 'الأكثر رواجاً',
        description: 'تصفح أحدث وأرقى القطع المختارة بعناية لتناسب أسلوبك العصري هذا الموسم.',
        buttonText: 'عرض التشكيلة',
        buttonLink: '/store',
        style: 'style-1',
        headerStyle: 'style-1',
        cardStyle: 'card-2',
        products: productIds,
        image: getMediaId(0) || null
      }
    );
    console.log('    [+] Created Scroll-Product section (Style-1):', scrollDoc.documentId);
  } else if (productIds.length > 0) {
    try {
      await appContext.documents('api::hp-section-scroll-product.hp-section-scroll-product').update({
        documentId: scrollDoc.documentId,
        locale: 'en-US',
        data: { products: productIds }
      });
      await appContext.documents('api::hp-section-scroll-product.hp-section-scroll-product').update({
        documentId: scrollDoc.documentId,
        locale: 'ar-AE',
        data: { products: productIds }
      });
      await appContext.documents('api::hp-section-scroll-product.hp-section-scroll-product').publish({ documentId: scrollDoc.documentId, locale: 'en-US' });
      await appContext.documents('api::hp-section-scroll-product.hp-section-scroll-product').publish({ documentId: scrollDoc.documentId, locale: 'ar-AE' });
      console.log('    [+] Linked products to Scroll-Product section:', productIds.length);
    } catch (e) {
      console.warn('    [!] Note updating scroll products:', e.message);
    }
  }

  // 5.4 Showcase 1 (Featured Collection)
  let sc1 = await appContext.documents('api::hp-section-showcase.hp-section-showcase').findFirst({ filters: { adminDisplayTitle: 'Featured Collection' }, locale: 'en-US' });
  if (!sc1) {
    sc1 = await createAndPublishLocalized(
      'api::hp-section-showcase.hp-section-showcase',
      {
        adminDisplayTitle: 'Featured Collection',
        title: 'Featured Collection',
        badge: 'Curated For You',
        description: 'Explore our handpicked selection of top premium pieces for this season.',
        source: 'all',
        style: 'style-1',
        headerStyle: 'style-1',
        cardStyle: 'card-1',
        productCount: 8
      },
      {
        adminDisplayTitle: 'Featured Collection',
        title: 'المجموعة المميزة',
        badge: 'مختارة خصيصاً لك',
        description: 'استكشف تشكيلتنا المختارة بعناية من أرقى المنتجات المصممة لهذا الموسم.',
        source: 'all',
        style: 'style-1',
        headerStyle: 'style-1',
        cardStyle: 'card-1',
        productCount: 8
      }
    );
    console.log('    [+] Created Showcase 1:', sc1.documentId);
  }

  // 5.5 Testimonials (Style-3)
  let feat = await appContext.documents('api::hp-section-feature.hp-section-feature').findFirst({ locale: 'en-US' });
  if (!feat) {
    feat = await createAndPublishLocalized(
      'api::hp-section-feature.hp-section-feature',
      {
        adminDisplayTitle: 'Customer Testimonials',
        title: 'Loved By Discerning Shoppers',
        badge: 'Client Testimonials',
        description: 'Real stories and reviews from customers who trust our craftsmanship.',
        contentType: 'testimonials',
        headerStyle: 'style-1',
        style: 'style-3',
        testimonials: [
          {
            author_name: 'Sarah Mitchell',
            author_role: 'Verified Buyer · London',
            content: 'The quality of the stitching and materials is extraordinary. Delivery was remarkably fast and the unboxing experience was pure luxury.',
            rating: 5,
            avatar: getMediaId(9) || null
          },
          {
            author_name: 'David Chen',
            author_role: 'Creative Director · New York',
            content: 'Flawless minimalist design and true-to-size fit. These pieces have become the absolute backbone of my daily work wardrobe.',
            rating: 5,
            avatar: getMediaId(10) || null
          },
          {
            author_name: 'Elena Rostova',
            author_role: 'Architect · Dubai',
            content: 'Exceptional attention to detail. Returning an exchange item was seamless, and customer support was polite and instant.',
            rating: 5,
            avatar: getMediaId(11) || null
          },
          {
            author_name: 'Marcus Vance',
            author_role: 'Tech Founder · San Francisco',
            content: 'Premium feel without unreasonable markups. The sunglasses and leather duffle bag are easily the best purchases I made this year.',
            rating: 5,
            avatar: getMediaId(12) || null
          }
        ]
      },
      {
        adminDisplayTitle: 'Customer Testimonials',
        title: 'تجارب وآراء عملائنا المميزين',
        badge: 'تقييمات حقيقية',
        description: 'قصص حقيقية من متسوقينا الذين يثقون بجودة تصاميمنا ودقة خاماتنا.',
        contentType: 'testimonials',
        headerStyle: 'style-1',
        style: 'style-3',
        testimonials: [
          {
            author_name: 'سارة أحمد',
            author_role: 'عميلة معتمدة · دبي',
            content: 'جودة الخامات والتفاصيل مذهلة للغاية، والتوصيل كان سريعاً وتجربة الاستلام والتغليف كانت في قمة الرقي والفخامة.',
            rating: 5,
            avatar: getMediaId(9) || null
          },
          {
            author_name: 'محمد العلي',
            author_role: 'مدير تنفيذي · الرياض',
            content: 'التصاميم العصرية والمقاسات دقيقة ومریحة جداً. أصبحت هذه التشكيلة خياري الأول لإطلالات العمل اليومية.',
            rating: 5,
            avatar: getMediaId(10) || null
          },
          {
            author_name: 'نورة المهيري',
            author_role: 'مهندسة ديكور · أبوظبي',
            content: 'اهتمام فائق بأدق التفاصيل وخدمة عملاء راقية وسريعة الاستجابة. الاستبدال كان في غاية السلاسة والاحترافية.',
            rating: 5,
            avatar: getMediaId(11) || null
          },
          {
            author_name: 'خالد المنصوري',
            author_role: 'رائد أعمال · الدوحة',
            content: 'أفخر أنواع الجلود والأقمشة بدون مبالغة في الأسعار. الحقائب والساعات الجلدية من أفضل القطع التي اقتنيتها هذا العام.',
            rating: 5,
            avatar: getMediaId(12) || null
          }
        ]
      }
    );
    console.log('    [+] Created Testimonials (Style-3):', feat.documentId);
  }

  // 5.6 Showcase 2 (Best Sellers)
  let sc2 = await appContext.documents('api::hp-section-showcase.hp-section-showcase').findFirst({ filters: { adminDisplayTitle: 'Best Sellers' }, locale: 'en-US' });
  if (!sc2) {
    sc2 = await createAndPublishLocalized(
      'api::hp-section-showcase.hp-section-showcase',
      {
        adminDisplayTitle: 'Best Sellers',
        title: 'Most Popular Picks',
        badge: 'Customer Favorites',
        description: 'The most coveted designs loved and reviewed by our community.',
        source: 'all',
        style: 'style-2',
        headerStyle: 'style-2',
        cardStyle: 'card-2',
        productCount: 6
      },
      {
        adminDisplayTitle: 'Best Sellers',
        title: 'المنتجات الأكثر طلباً',
        badge: 'المفضلة لدى العملاء',
        description: 'أرقى التصاميم وأكثرها طلباً وتقييماً من قبل متسوقينا.',
        source: 'all',
        style: 'style-2',
        headerStyle: 'style-2',
        cardStyle: 'card-2',
        productCount: 6
      }
    );
    console.log('    [+] Created Showcase 2:', sc2.documentId);
  }

  // 5.7 Blog Section
  let blog = await appContext.documents('api::hp-section-blog.hp-section-blog').findFirst({ locale: 'en-US' });
  if (!blog) {
    blog = await createAndPublishLocalized(
      'api::hp-section-blog.hp-section-blog',
      {
        adminDisplayTitle: 'Homepage Journal',
        title: 'From Our Journal',
        badge: 'Style & Trends',
        description: 'Read the latest styling guides, runway trends, and timeless wardrobe advice.',
        source: 'latest',
        postCount: 3,
        style: 'style-1',
        headerStyle: 'style-1'
      },
      {
        adminDisplayTitle: 'Homepage Journal',
        title: 'من مجلتنا',
        badge: 'أناقة وإلهام',
        description: 'اطلع على أحدث صيحات الموضة، نصائح التنسيق الحصرية، وأسرار الأناقة العصرية.',
        source: 'latest',
        postCount: 3,
        style: 'style-1',
        headerStyle: 'style-1'
      }
    );
    console.log('    [+] Created Blog Section:', blog.documentId);
  }

  // 5.8 Ensure Homepage Document has all Blocks
  let hp = await appContext.documents('api::homepage.homepage').findFirst({ locale: 'en-US' });
  const allHomepageBlocks = [
    ...(heroDoc ? [{
      __component: 'ui.hero-block',
      adminTitle: heroDoc.adminDisplayTitle || 'Main Hero Banner',
      section: heroDoc.documentId
    }] : []),
    ...(scrollDoc ? [{
      __component: 'ui.product-scroll-block',
      adminTitle: scrollDoc.adminDisplayTitle || 'Trending Scroll Stage',
      section: scrollDoc.documentId
    }] : []),
    {
      __component: 'ui.product-showcase-block',
      adminTitle: sc1.adminDisplayTitle || 'Featured Collection',
      showcase: sc1.documentId
    },
    ...(catColDoc ? [{
      __component: 'ui.category-collection-block',
      adminTitle: catColDoc.adminDisplayTitle || 'Category & Collection Showcase',
      section: catColDoc.documentId
    }] : []),
    {
      __component: 'ui.product-showcase-block',
      adminTitle: sc2.adminDisplayTitle || 'Best Sellers',
      showcase: sc2.documentId
    },
    {
      __component: 'ui.blog-posts-block',
      adminTitle: blog.adminDisplayTitle || 'Homepage Journal',
      blog_section: blog.documentId
    },
    {
      __component: 'ui.features-block',
      adminTitle: feat.adminDisplayTitle || 'Customer Testimonials',
      features_section: feat.documentId
    }
  ];

  if (!hp) {
    hp = await appContext.documents('api::homepage.homepage').create({
      locale: 'en-US',
      status: 'published',
      data: { blocks: allHomepageBlocks }
    });
  } else {
    await appContext.documents('api::homepage.homepage').update({
      documentId: hp.documentId,
      locale: 'en-US',
      data: { blocks: allHomepageBlocks }
    });
  }

  await appContext.documents('api::homepage.homepage').update({
    documentId: hp.documentId,
    locale: 'ar-AE',
    data: { blocks: allHomepageBlocks }
  });

  await appContext.documents('api::homepage.homepage').publish({ documentId: hp.documentId, locale: 'en-US' });
  await appContext.documents('api::homepage.homepage').publish({ documentId: hp.documentId, locale: 'ar-AE' });
  console.log('    [+] Published Homepage with all blocks for en-US & ar-AE:', hp.documentId);

  // ----------------------------------------------------
  // STEP 6: Ensure Strapi Webhooks for Next.js ISR Revalidation
  // ----------------------------------------------------
  console.log('\n>>> 6. Ensuring Webhooks in Strapi for Next.js ISR Revalidation...');
  const storefrontUrl = process.env.STOREFRONT_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://storefront:8000';
  const revalidateSecret = process.env.REVALIDATE_SECRET || '';

  const webhooksToCreate = [
    {
      name: 'home-page',
      url: `${storefrontUrl}/api/revalidate/home-page`,
      headers: { 'x-strapi-secret': revalidateSecret },
      events: ['entry.delete', 'entry.publish', 'entry.unpublish'],
      isEnabled: true
    },
    {
      name: 'settings',
      url: `${storefrontUrl}/api/revalidate/strapi-settings`,
      headers: { 'x-strapi-secret': revalidateSecret },
      events: ['entry.delete', 'entry.publish', 'entry.unpublish'],
      isEnabled: true
    },
    {
      name: 'blog',
      url: `${storefrontUrl}/api/revalidate/blog`,
      headers: { 'x-strapi-secret': revalidateSecret },
      events: ['entry.delete', 'entry.publish', 'entry.unpublish'],
      isEnabled: true
    },
    {
      name: 'pages',
      url: `${storefrontUrl}/api/revalidate`,
      headers: { 'x-strapi-secret': revalidateSecret },
      events: ['entry.delete', 'entry.publish', 'entry.unpublish'],
      isEnabled: true
    },
    {
      name: 'menu',
      url: `${storefrontUrl}/api/revalidate/menu`,
      headers: { 'x-strapi-secret': revalidateSecret },
      events: ['entry.delete', 'entry.publish', 'entry.unpublish'],
      isEnabled: false
    }
  ];

  try {
    const webhookStore = appContext.webhookStore;
    if (webhookStore && typeof webhookStore.findWebhooks === 'function') {
      const existingWebhooks = (await webhookStore.findWebhooks()) || [];
      for (const wh of webhooksToCreate) {
        const found = existingWebhooks.find(e => e.name === wh.name || e.url === wh.url);
        if (!found) {
          await webhookStore.createWebhook(wh);
          console.log(`    [+] Created Webhook: ${wh.name} -> ${wh.url}`);
        } else {
          await webhookStore.updateWebhook(found.id, wh);
          console.log(`    [✓] Updated Webhook: ${wh.name} -> ${wh.url}`);
        }
      }
    } else {
      for (const wh of webhooksToCreate) {
        const found = await appContext.db.query('strapi::webhook').findOne({
          where: { name: wh.name }
        });
        if (!found) {
          await appContext.db.query('strapi::webhook').create({ data: wh });
          console.log(`    [+] Created Webhook via DB: ${wh.name}`);
        } else {
          await appContext.db.query('strapi::webhook').update({
            where: { id: found.id },
            data: wh
          });
          console.log(`    [✓] Updated Webhook via DB: ${wh.name}`);
        }
      }
    }
  } catch (err) {
    console.warn('    [!] Webhook setup notice:', err.message);
  }

  // ----------------------------------------------------
  // STEP 7: Ensure Field Descriptions in Content-Manager Layouts
  // ----------------------------------------------------
  console.log('\n>>> 7. Synchronizing Field Descriptions in Strapi Admin Layouts...');
  try {
    for (const uid of Object.keys(appContext.contentTypes || {})) {
      if (!uid.startsWith('api::')) continue;
      const contentType = appContext.contentType(uid);
      if (!contentType || !contentType.attributes) continue;

      const storeKey = `configuration_content_types::${uid}`;
      let conf = null;
      try {
        conf = await appContext.store({ type: 'plugin', name: 'content_manager', key: storeKey }).get();
      } catch (e) {}

      if (conf && conf.metas) {
        let changed = false;
        for (const [attrName, attrSchema] of Object.entries(contentType.attributes)) {
          const desc = attrSchema?.description;
          if (desc && conf.metas[attrName]?.edit) {
            if (conf.metas[attrName].edit.description !== desc) {
              conf.metas[attrName].edit.description = desc;
              changed = true;
            }
          }
        }
        if (changed) {
          await appContext.store({ type: 'plugin', name: 'content_manager', key: storeKey }).set({ value: conf });
          console.log(`    [+] Synced field descriptions: ${uid}`);
        }
      }
    }

    for (const uid of Object.keys(appContext.components || {})) {
      const comp = appContext.components[uid];
      if (!comp || !comp.attributes) continue;

      const storeKey = `configuration_components::${uid}`;
      let conf = null;
      try {
        conf = await appContext.store({ type: 'plugin', name: 'content_manager', key: storeKey }).get();
      } catch (e) {}

      if (conf) {
        let changed = false;

        if (uid.startsWith('settings.')) {
          if (conf.settings?.mainField !== '') {
            if (!conf.settings) conf.settings = {};
            conf.settings.mainField = '';
            changed = true;
          }
        }

        if (conf.metas) {
          for (const [attrName, attrSchema] of Object.entries(comp.attributes)) {
            const desc = attrSchema?.description;
            if (desc && conf.metas[attrName]?.edit) {
              if (conf.metas[attrName].edit.description !== desc) {
                conf.metas[attrName].edit.description = desc;
                changed = true;
              }
            }
          }
        }
        if (changed) {
          await appContext.store({ type: 'plugin', name: 'content_manager', key: storeKey }).set({ value: conf });
        }
      }
    }
  } catch (err) {
    console.warn('    [!] Field description sync notice:', err.message);
  }

  console.log('\n=======================================================');
  console.log('   🎉 STRAPI ALL-IN-ONE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('=======================================================');

  try {
    await appContext.destroy();
  } catch (e) {}

  setTimeout(() => {
    process.exit(0);
  }, 100);
}

seedAll().catch(err => {
  console.error('\n[❌] Fatal Error during Strapi seedAll:', err);
  process.exit(1);
});
