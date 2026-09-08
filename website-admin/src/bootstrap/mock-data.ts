export const pagesToSeed = [
  // About
  {
    uid: 'api::about-page.about-page',
    enTitle: 'About Us',
    faTitle: 'درباره ما',
    enBlocks: [
      {
        __component: 'about.about-hero',
        badge: 'Our Story',
        title: 'Crafting the Future of Commerce',
        description: 'Since 2020, we have been dedicated to providing the best online shopping experience.'
      },
      {
        __component: 'about.about-story',
        title: 'How It All Began',
        paragraphs: 'Our journey started in a small garage with a big dream. We wanted to build a platform that connects people with high-quality products. Today, we are proud to serve millions of customers worldwide.'
      },
      {
        __component: 'about.about-values',
        title: 'Our Core Values',
        subtitle: 'What drives us forward',
        items: [
          { title: 'Quality', description: 'We never compromise on the quality of our products.' },
          { title: 'Customer First', description: 'Your satisfaction is our top priority.' },
          { title: 'Innovation', description: 'We constantly seek new ways to improve.' }
        ]
      },
      {
        __component: 'about.about-features',
        title: 'Why Choose Us?',
        items: [
          { title: 'Fast Delivery', description: 'Get your orders in record time.', icon_name: 'Truck' },
          { title: 'Secure Payments', description: 'Your data is safe with us.', icon_name: 'Shield' },
          { title: '24/7 Support', description: 'We are here whenever you need us.', icon_name: 'Clock' }
        ]
      },
      {
        __component: 'about.about-promise',
        title: 'Our Promise to You',
        paragraphs: 'We promise to continuously innovate and provide the best possible experience. We stand behind our products and our service.'
      },
      {
        __component: 'about.about-cta',
        title: 'Ready to Experience the Best?',
        description: 'Join thousands of satisfied customers today.',
        primary_button_text: 'Shop Now',
        primary_button_link: '/store',
        secondary_button_text: 'Contact Us',
        secondary_button_link: '/contact'
      }
    ],
    faBlocks: [
      {
        __component: 'about.about-hero',
        badge: 'داستان ما',
        title: 'ساخت آینده تجارت الکترونیک',
        description: 'از سال ۲۰۲۰، ما متعهد به ارائه بهترین تجربه خرید آنلاین بوده‌ایم.'
      },
      {
        __component: 'about.about-story',
        title: 'همه چیز از کجا شروع شد',
        paragraphs: 'سفر ما از یک گاراژ کوچک با یک رویای بزرگ آغاز شد. ما می‌خواستیم پلتفرمی بسازیم که مردم را به محصولات با کیفیت متصل کند. امروز افتخار می‌کنیم که به میلیون‌ها مشتری در سراسر جهان خدمت می‌کنیم.'
      },
      {
        __component: 'about.about-values',
        title: 'ارزش‌های اصلی ما',
        subtitle: 'آنچه ما را به جلو می‌راند',
        items: [
          { title: 'کیفیت', description: 'ما هرگز در کیفیت محصولات خود مصالحه نمی‌کنیم.' },
          { title: 'مشتری‌مداری', description: 'رضایت شما بالاترین اولویت ماست.' },
          { title: 'نوآوری', description: 'ما دائماً به دنبال راه‌های جدید برای پیشرفت هستیم.' }
        ]
      },
      {
        __component: 'about.about-features',
        title: 'چرا ما را انتخاب کنید؟',
        items: [
          { title: 'ارسال سریع', description: 'سفارشات خود را در کمترین زمان دریافت کنید.', icon_name: 'Truck' },
          { title: 'پرداخت امن', description: 'اطلاعات شما نزد ما امن است.', icon_name: 'Shield' },
          { title: 'پشتیبانی ۲۴ ساعته', description: 'هر زمان که نیاز داشتید اینجا هستیم.', icon_name: 'Clock' }
        ]
      },
      {
        __component: 'about.about-promise',
        title: 'قول ما به شما',
        paragraphs: 'ما قول می‌دهیم که دائماً نوآوری کنیم و بهترین تجربه ممکن را ارائه دهیم. ما پشت محصولات و خدمات خود ایستاده‌ایم.'
      },
      {
        __component: 'about.about-cta',
        title: 'آماده تجربه بهترین‌ها هستید؟',
        description: 'امروز به هزاران مشتری راضی بپیوندید.',
        primary_button_text: 'خرید کنید',
        primary_button_link: '/store',
        secondary_button_text: 'تماس با ما',
        secondary_button_link: '/contact'
      }
    ]
  },
  // Contact
  {
    uid: 'api::contact-page.contact-page',
    enTitle: 'Contact Us',
    faTitle: 'تماس با ما',
    enBlocks: [
      {
        __component: 'contact.contact-hero',
        badge: 'Get in Touch',
        title: 'We are here to help',
        description: 'Have a question or feedback? We would love to hear from you.'
      },
      {
        __component: 'contact.contact-info-cards',
        cards: [
          { icon_name: 'MapPin', title: 'Visit Us', content: '123 Commerce St.', sub_content: 'New York, NY 10001' },
          { icon_name: 'Phone', title: 'Call Us', content: '+1 (555) 123-4567', sub_content: 'Mon-Fri, 9am-5pm' },
          { icon_name: 'Mail', title: 'Email Us', content: 'support@example.com', sub_content: 'We reply within 24 hours' }
        ]
      },
      {
        __component: 'contact.contact-form-info',
        title: 'Send us a message',
        description: 'Fill out the form below and our team will get back to you shortly.',
        expectations_title: 'What to expect',
        expectations_list: [
          { text: 'Fast response within 24 hours' },
          { text: 'Friendly and professional support' },
          { text: 'Expert advice on our products' }
        ],
        quick_questions_card: {
          icon_name: 'Clock',
          title: 'Quick Answers',
          description: 'Find answers to common questions in our FAQ section.',
          button_text: 'Go to FAQ',
          button_link: '/faq'
        }
      },
      {
        __component: 'contact.contact-form-settings',
        privacy_text: 'By submitting this form, you agree to our Privacy Policy.',
        submit_button_text: 'Send Message'
      },
      {
        __component: 'contact.contact-faq-preview',
        title: 'Frequently Asked Questions',
        description: 'Can\'t find what you are looking for? Check out our full FAQ.',
        button_text: 'View All FAQs',
        button_link: '/faq',
        faq_items: [
          { question: 'Do you offer free shipping?' },
          { question: 'What is your return policy?' },
          { question: 'How can I track my order?' }
        ]
      }
    ],
    faBlocks: [
      {
        __component: 'contact.contact-hero',
        badge: 'ارتباط با ما',
        title: 'ما اینجا هستیم تا کمک کنیم',
        description: 'سوالی دارید یا پیشنهادی؟ مشتاقانه منتظر شنیدن صدای شما هستیم.'
      },
      {
        __component: 'contact.contact-info-cards',
        cards: [
          { icon_name: 'MapPin', title: 'دفتر مرکزی', content: 'تهران، خیابان ولیعصر', sub_content: 'پلاک ۱۲۳، واحد ۴' },
          { icon_name: 'Phone', title: 'تماس تلفنی', content: '۰۲۱-۱۲۳۴۵۶۷۸', sub_content: 'شنبه تا چهارشنبه، ۹ صبح تا ۵ عصر' },
          { icon_name: 'Mail', title: 'ایمیل', content: 'support@example.com', sub_content: 'پاسخگویی در کمتر از ۲۴ ساعت' }
        ]
      },
      {
        __component: 'contact.contact-form-info',
        title: 'ارسال پیام به ما',
        description: 'فرم زیر را پر کنید تا تیم ما در اسرع وقت با شما تماس بگیرد.',
        expectations_title: 'چه انتظاری داشته باشید؟',
        expectations_list: [
          { text: 'پاسخگویی سریع در کمتر از ۲۴ ساعت' },
          { text: 'پشتیبانی دوستانه و حرفه‌ای' },
          { text: 'مشاوره تخصصی در مورد محصولات' }
        ],
        quick_questions_card: {
          icon_name: 'Clock',
          title: 'پاسخ‌های سریع',
          description: 'پاسخ سوالات رایج را در بخش سوالات متداول پیدا کنید.',
          button_text: 'مشاهده سوالات متداول',
          button_link: '/faq'
        }
      },
      {
        __component: 'contact.contact-form-settings',
        privacy_text: 'با ارسال این فرم، شما با قوانین حریم خصوصی ما موافقت می‌کنید.',
        submit_button_text: 'ارسال پیام'
      },
      {
        __component: 'contact.contact-faq-preview',
        title: 'سوالات متداول',
        description: 'پاسخ خود را پیدا نکردید؟ بخش کامل سوالات متداول ما را ببینید.',
        button_text: 'مشاهده همه سوالات',
        button_link: '/faq',
        faq_items: [
          { question: 'آیا ارسال رایگان دارید؟' },
          { question: 'قوانین مرجوعی شما چیست؟' },
          { question: 'چگونه سفارشم را پیگیری کنم؟' }
        ]
      }
    ]
  },
  // FAQ
  {
    uid: 'api::faq-page.faq-page',
    enTitle: 'FAQ',
    faTitle: 'سوالات متداول',
    enBlocks: [
      {
        __component: 'faq.faq-hero',
        badge: 'Support',
        title: 'Frequently Asked Questions',
        description: 'Find answers to common questions about our products, shipping, and returns.',
        searchPlaceholder: 'Search for a question...'
      },
      {
        __component: 'faq.faq-category',
        anchor_id: 'shipping',
        title: 'Shipping & Delivery',
        icon: 'Package',
        questions: [
          { question: 'How long does shipping take?', answer: 'Standard shipping takes 3-5 business days. Expedited shipping takes 1-2 business days.' },
          { question: 'Do you ship internationally?', answer: 'Yes, we ship to over 50 countries worldwide. Shipping costs apply.' },
          { question: 'How do I track my order?', answer: 'Once your order is shipped, you will receive an email with a tracking link.' }
        ]
      },
      {
        __component: 'faq.faq-category',
        anchor_id: 'returns',
        title: 'Returns & Refunds',
        icon: 'RefreshCw',
        questions: [
          { question: 'What is your return policy?', answer: 'You can return any unused item within 30 days of receipt for a full refund.' },
          { question: 'How do I request a refund?', answer: 'Visit our Returns page and enter your order number to start the process.' }
        ]
      },
      {
        __component: 'faq.faq-contact-cta',
        icon: 'MessageCircle',
        title: 'Still have questions?',
        description: 'Our support team is here to help you 24/7.',
        button_text: 'Contact Support',
        button_link: '/contact'
      }
    ],
    faBlocks: [
      {
        __component: 'faq.faq-hero',
        badge: 'پشتیبانی',
        title: 'سوالات متداول',
        description: 'پاسخ سوالات رایج درباره محصولات، ارسال و مرجوعی را اینجا پیدا کنید.',
        searchPlaceholder: 'جستجوی سوال...'
      },
      {
        __component: 'faq.faq-category',
        anchor_id: 'shipping',
        title: 'ارسال و تحویل',
        icon: 'Package',
        questions: [
          { question: 'ارسال چقدر زمان می‌برد؟', answer: 'ارسال استاندارد بین ۳ تا ۵ روز کاری و ارسال پیشتاز ۱ تا ۲ روز کاری زمان می‌برد.' },
          { question: 'آیا ارسال به شهرستان دارید؟', answer: 'بله، ما به سراسر کشور ارسال داریم. هزینه ارسال محاسبه می‌شود.' },
          { question: 'چگونه سفارشم را پیگیری کنم؟', answer: 'پس از ارسال سفارش، پیامکی حاوی کد رهگیری برای شما ارسال خواهد شد.' }
        ]
      },
      {
        __component: 'faq.faq-category',
        anchor_id: 'returns',
        title: 'مرجوعی و بازگشت وجه',
        icon: 'RefreshCw',
        questions: [
          { question: 'قوانین مرجوعی شما چیست؟', answer: 'شما می‌توانید کالاهای استفاده نشده را تا ۳۰ روز پس از دریافت، مرجوع کنید.' },
          { question: 'چگونه درخواست مرجوعی دهم؟', answer: 'به صفحه مرجوعی مراجعه کنید و با وارد کردن شماره سفارش، فرآیند را آغاز کنید.' }
        ]
      },
      {
        __component: 'faq.faq-contact-cta',
        icon: 'MessageCircle',
        title: 'هنوز سوالی دارید؟',
        description: 'تیم پشتیبانی ما ۲۴ ساعته در خدمت شماست.',
        button_text: 'تماس با پشتیبانی',
        button_link: '/contact'
      }
    ]
  },
  // Privacy
  {
    uid: 'api::privacy-page.privacy-page',
    enTitle: 'Privacy Policy',
    faTitle: 'حریم خصوصی',
    enBlocks: [
      {
        __component: 'privacy.privacy-hero',
        badge: 'Legal',
        title: 'Privacy Policy'
      },
      {
        __component: 'privacy.privacy-card-section',
        icon: 'Shield',
        title: 'Your Privacy is Our Priority',
        section_id: 'priority',
        content: 'We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.'
      },
      {
        __component: 'privacy.privacy-grid-section',
        icon: 'Lock',
        title: 'How We Protect Your Data',
        section_id: 'data-protection',
        intro_text: 'We use state-of-the-art security measures to keep your data safe.',
        layout_style: 'default',
        cards: [
          { title: 'Encryption', description: 'All data is encrypted in transit and at rest.' },
          { title: 'Access Control', description: 'Strict access controls ensure only authorized personnel can view data.' },
          { title: 'Regular Audits', description: 'We conduct regular security audits to identify and fix vulnerabilities.' }
        ]
      },
      {
        __component: 'privacy.privacy-text-section',
        section_id: 'data-collection',
        title: 'Data Collection & Usage',
        content: '<p>We collect information to provide better services to all our users. This includes basic information like your name and email address when you create an account, as well as data on how you interact with our website.</p><p>We use this data to improve our products, personalize your experience, and send you relevant updates.</p>'
      },
      {
        __component: 'privacy.privacy-contact-cta',
        icon: 'Mail',
        title: 'Privacy Concerns?',
        description: 'If you have any questions about how we handle your data, please reach out to our privacy team.',
        button_text: 'Contact Privacy Team',
        button_link: '/contact'
      }
    ],
    faBlocks: [
      {
        __component: 'privacy.privacy-hero',
        badge: 'حقوقی',
        title: 'حریم خصوصی'
      },
      {
        __component: 'privacy.privacy-card-section',
        icon: 'Shield',
        title: 'حریم خصوصی شما اولویت ماست',
        section_id: 'priority',
        content: 'ما متعهد به محافظت از اطلاعات شخصی و حق حریم خصوصی شما هستیم. اگر سوال یا نگرانی در مورد خط‌مشی ما یا نحوه برخورد ما با اطلاعات شخصی خود دارید، لطفاً با ما تماس بگیرید.'
      },
      {
        __component: 'privacy.privacy-grid-section',
        icon: 'Lock',
        title: 'چگونه از داده‌های شما محافظت می‌کنیم',
        section_id: 'data-protection',
        intro_text: 'ما از پیشرفته‌ترین اقدامات امنیتی برای ایمن نگه داشتن داده‌های شما استفاده می‌کنیم.',
        layout_style: 'default',
        cards: [
          { title: 'رمزنگاری', description: 'تمام داده‌ها در حین انتقال و در زمان ذخیره‌سازی رمزنگاری می‌شوند.' },
          { title: 'کنترل دسترسی', description: 'کنترل‌های دقیق دسترسی تضمین می‌کند که فقط پرسنل مجاز می‌توانند داده‌ها را مشاهده کنند.' },
          { title: 'ممیزی‌های دوره‌ای', description: 'ما برای شناسایی و رفع آسیب‌پذیری‌ها، ممیزی‌های امنیتی دوره‌ای انجام می‌دهیم.' }
        ]
      },
      {
        __component: 'privacy.privacy-text-section',
        section_id: 'data-collection',
        title: 'جمع‌آوری و استفاده از داده‌ها',
        content: '<p>ما برای ارائه خدمات بهتر به کاربران، اطلاعاتی مانند نام و آدرس ایمیل شما را در هنگام ثبت‌نام جمع‌آوری می‌کنیم. همچنین داده‌هایی در مورد نحوه تعامل شما با وب‌سایت ما ثبت می‌شود.</p><p>ما از این داده‌ها برای بهبود محصولاتمان، شخصی‌سازی تجربه شما و ارسال به‌روزرسانی‌های مرتبط استفاده می‌کنیم.</p>'
      },
      {
        __component: 'privacy.privacy-contact-cta',
        icon: 'Mail',
        title: 'نگرانی درباره حریم خصوصی؟',
        description: 'اگر سوالی در مورد نحوه مدیریت داده‌های خود دارید، لطفاً با تیم حریم خصوصی ما تماس بگیرید.',
        button_text: 'تماس با تیم حریم خصوصی',
        button_link: '/contact'
      }
    ]
  },
  // Returns
  {
    uid: 'api::returns-page.returns-page',
    enTitle: 'Returns & Exchanges',
    faTitle: 'شرایط مرجوعی',
    enBlocks: [
      {
        __component: 'support.return-hero',
        badge: 'Returns',
        title: 'Returns & Exchanges',
        description: 'Not totally satisfied? We accept returns within 30 days of purchase.',
        button_text: 'Start a Return',
        button_link: '/contact'
      },
      {
        __component: 'support.section-grid',
        icon: 'RefreshCw',
        title: 'How It Works',
        section_id: 'process',
        intro_text: 'Returning an item is quick and easy. Just follow these steps:',
        cards: [
          { icon: 'FileText', title: '1. Request Return', description: 'Log into your account and select the items you want to return.' },
          { icon: 'Package', title: '2. Pack Items', description: 'Pack the items securely in their original packaging.' },
          { icon: 'Truck', title: '3. Ship It Back', description: 'Drop off the package at any authorized shipping center.' }
        ]
      },
      {
        __component: 'support.return-faq',
        faq_title: 'Return Policy Details',
        faq_items: [
          { question: 'What is the return window?', answer: 'You have 30 days from the delivery date to return your items.' },
          { question: 'Are returns free?', answer: 'Yes, we provide a free prepaid return label for all domestic orders.' },
          { question: 'How long does a refund take?', answer: 'Refunds are processed within 5-7 business days after we receive your item.' }
        ]
      },
      {
        __component: 'support.contact-cta',
        icon: 'Mail',
        title: 'Need Help with a Return?',
        description: 'Our customer support team can assist you with your return process.',
        button_text: 'Contact Support',
        button_link: '/contact',
        secondary_button_text: 'Read Full Policy',
        secondary_button_link: '/terms'
      }
    ],
    faBlocks: [
      {
        __component: 'support.return-hero',
        badge: 'مرجوعی',
        title: 'شرایط مرجوعی و تعویض',
        description: 'کاملاً راضی نیستید؟ ما تا ۳۰ روز پس از خرید، کالای شما را پس می‌گیریم.',
        button_text: 'درخواست مرجوعی',
        button_link: '/contact'
      },
      {
        __component: 'support.section-grid',
        icon: 'RefreshCw',
        title: 'چگونه کار می‌کند',
        section_id: 'process',
        intro_text: 'مرجوع کردن یک کالا سریع و آسان است. فقط این مراحل را دنبال کنید:',
        cards: [
          { icon: 'FileText', title: '۱. ثبت درخواست', description: 'وارد حساب کاربری خود شوید و کالاهایی که می‌خواهید مرجوع کنید را انتخاب کنید.' },
          { icon: 'Package', title: '۲. بسته‌بندی کالا', description: 'کالاها را به طور ایمن در بسته‌بندی اصلی خود قرار دهید.' },
          { icon: 'Truck', title: '۳. ارسال کالا', description: 'بسته را به یکی از مراکز پستی مجاز تحویل دهید.' }
        ]
      },
      {
        __component: 'support.return-faq',
        faq_title: 'جزئیات قوانین مرجوعی',
        faq_items: [
          { question: 'مهلت مرجوعی چقدر است؟', answer: 'شما تا ۳۰ روز پس از دریافت کالا فرصت دارید آن را مرجوع کنید.' },
          { question: 'آیا هزینه مرجوعی رایگان است؟', answer: 'بله، هزینه ارسال برای مرجوع کردن کالا کاملاً به عهده ماست.' },
          { question: 'بازگشت وجه چقدر طول می‌کشد؟', answer: 'بازگشت وجه بین ۵ تا ۷ روز کاری پس از دریافت کالا توسط ما انجام می‌شود.' }
        ]
      },
      {
        __component: 'support.contact-cta',
        icon: 'Mail',
        title: 'برای مرجوعی نیاز به کمک دارید؟',
        description: 'تیم پشتیبانی ما می‌تواند شما را در فرآیند مرجوعی راهنمایی کند.',
        button_text: 'تماس با پشتیبانی',
        button_link: '/contact',
        secondary_button_text: 'مطالعه کامل قوانین',
        secondary_button_link: '/terms'
      }
    ]
  },
  // Size Guide
  {
    uid: 'api::size-guide-page.size-guide-page',
    enTitle: 'Size Guide',
    faTitle: 'راهنمای سایز',
    enBlocks: [
      {
        __component: 'guide.guide-hero',
        badge: 'Fit Guide',
        title: 'Find Your Perfect Fit',
        description: 'Use our comprehensive size guide to ensure your items fit exactly how you want them to.'
      },
      {
        __component: 'guide.guide-measurement',
        how_to_measure_title: 'How to Measure',
        measurement_instructions_title: 'Step-by-Step Instructions',
        measurement_steps: [
          { step_number: 1, title: 'Chest', description: 'Measure around the fullest part of your chest, keeping the tape horizontal.' },
          { step_number: 2, title: 'Waist', description: 'Measure around the narrowest part of your waist, where your body bends side to side.' },
          { step_number: 3, title: 'Hips', description: 'Measure around the fullest part of your hips, keeping the tape horizontal.' }
        ],
        measurement_tips_title: 'Tips for Accuracy',
        measurement_tips: [
          { tip: 'Use a flexible measuring tape.' },
          { tip: 'Measure directly over your undergarments, not over thick clothing.' },
          { tip: 'Keep the tape comfortably snug, but not tight.' }
        ],
        visual_guide_title: 'Measurement Guide',
        visual_guide_description: 'Follow these visual cues to measure accurately.'
      },
      {
        __component: 'guide.guide-charts',
        size_charts_title: 'Size Charts',
        size_categories: [
          { category_name: 'Men', category_value: 'men', charts: [] },
          { category_name: 'Women', category_value: 'women', charts: [] },
          { category_name: 'Kids', category_value: 'kids', charts: [] }
        ]
      },
      {
        __component: 'guide.guide-faq',
        faq_title: 'Sizing Questions',
        faq_items: [
          { question: 'What if I am between sizes?', answer: 'We recommend sizing up for a looser fit, or sizing down for a tighter fit.' },
          { question: 'Do your sizes run true to size?', answer: 'Yes, our products generally run true to size according to standard US sizing.' }
        ]
      },
      {
        __component: 'guide.guide-contact-cta',
        title: 'Need Sizing Advice?',
        description: 'Our stylists are here to help you find your perfect fit.',
        primary_button_text: 'Contact Stylist',
        primary_button_link: '/contact',
        secondary_button_text: 'View FAQ',
        secondary_button_link: '/faq'
      }
    ],
    faBlocks: [
      {
        __component: 'guide.guide-hero',
        badge: 'راهنمای سایز',
        title: 'سایز مناسب خود را پیدا کنید',
        description: 'از راهنمای جامع سایز ما استفاده کنید تا مطمئن شوید لباس شما دقیقاً همان‌طور که می‌خواهید اندازه است.'
      },
      {
        __component: 'guide.guide-measurement',
        how_to_measure_title: 'نحوه اندازه‌گیری',
        measurement_instructions_title: 'دستورالعمل‌های مرحله به مرحله',
        measurement_steps: [
          { step_number: 1, title: 'قفسه سینه', description: 'متر را به صورت افقی دور پهن‌ترین قسمت قفسه سینه خود قرار دهید.' },
          { step_number: 2, title: 'کمر', description: 'متر را دور باریک‌ترین قسمت کمر خود قرار دهید.' },
          { step_number: 3, title: 'باسن', description: 'متر را به صورت افقی دور پهن‌ترین قسمت باسن خود قرار دهید.' }
        ],
        measurement_tips_title: 'نکاتی برای دقت بیشتر',
        measurement_tips: [
          { tip: 'از یک متر منعطف استفاده کنید.' },
          { tip: 'مستقیماً از روی لباس زیر اندازه بگیرید، نه از روی لباس‌های ضخیم.' },
          { tip: 'متر را به راحتی دور بدن نگه دارید و زیاد سفت نکنید.' }
        ],
        visual_guide_title: 'راهنمای تصویری',
        visual_guide_description: 'برای اندازه‌گیری دقیق، این نشانه‌های تصویری را دنبال کنید.'
      },
      {
        __component: 'guide.guide-charts',
        size_charts_title: 'جداول سایز',
        size_categories: [
          { category_name: 'مردانه', category_value: 'men', charts: [] },
          { category_name: 'زنانه', category_value: 'women', charts: [] },
          { category_name: 'بچه‌گانه', category_value: 'kids', charts: [] }
        ]
      },
      {
        __component: 'guide.guide-faq',
        faq_title: 'سوالات مربوط به سایز',
        faq_items: [
          { question: 'اگر بین دو سایز باشم چه کار کنم؟', answer: 'توصیه می‌کنیم برای تن‌خور آزادتر، سایز بزرگتر و برای تن‌خور جذب‌تر، سایز کوچکتر را انتخاب کنید.' },
          { question: 'آیا سایزهای شما استاندارد هستند؟', answer: 'بله، محصولات ما به طور کلی با سایزهای استاندارد مطابقت دارند.' }
        ]
      },
      {
        __component: 'guide.guide-contact-cta',
        title: 'نیاز به مشاوره سایز دارید؟',
        description: 'متخصصان مد ما اینجا هستند تا به شما در پیدا کردن سایز مناسب کمک کنند.',
        primary_button_text: 'تماس با مشاور',
        primary_button_link: '/contact',
        secondary_button_text: 'مشاهده سوالات متداول',
        secondary_button_link: '/faq'
      }
    ]
  },
  // Terms
  {
    uid: 'api::terms-page.terms-page',
    enTitle: 'Terms & Conditions',
    faTitle: 'شرایط و قوانین',
    enBlocks: [
      {
        __component: 'terms.terms-hero',
        badge: 'Legal',
        title: 'Terms & Conditions'
      },
      {
        __component: 'terms.terms-text-section',
        section_id: 'general',
        icon: 'FileText',
        title: 'General Terms',
        content: '<p>By using our website, you agree to these terms and conditions. Please read them carefully. If you do not agree with any part of these terms, you may not use our services.</p>'
      },
      {
        __component: 'terms.terms-card-section',
        section_id: 'key-points',
        icon: 'CheckCircle',
        title: 'Key Takeaways',
        cards: [
          { title: 'Account Security', description: 'You are responsible for maintaining the confidentiality of your account password.' },
          { title: 'Intellectual Property', description: 'All content on this site is the property of our company.' },
          { title: 'Limitation of Liability', description: 'We are not liable for any indirect or consequential damages arising from the use of our site.' }
        ]
      },
      {
        __component: 'terms.terms-contact-cta',
        icon: 'Mail',
        title: 'Questions about our Terms?',
        description: 'If you have any questions or concerns, please let us know.',
        button_text: 'Contact Legal',
        button_link: '/contact'
      }
    ],
    faBlocks: [
      {
        __component: 'terms.terms-hero',
        badge: 'حقوقی',
        title: 'شرایط و قوانین'
      },
      {
        __component: 'terms.terms-text-section',
        section_id: 'general',
        icon: 'FileText',
        title: 'قوانین عمومی',
        content: '<p>با استفاده از وب‌سایت ما، شما با این شرایط و قوانین موافقت می‌کنید. لطفاً آنها را با دقت مطالعه کنید. اگر با هر بخشی از این شرایط موافق نیستید، نمی‌توانید از خدمات ما استفاده کنید.</p>'
      },
      {
        __component: 'terms.terms-card-section',
        section_id: 'key-points',
        icon: 'CheckCircle',
        title: 'نکات کلیدی',
        cards: [
          { title: 'امنیت حساب کاربری', description: 'شما مسئول حفظ محرمانگی رمز عبور حساب کاربری خود هستید.' },
          { title: 'مالکیت معنوی', description: 'تمامی محتوای این سایت متعلق به شرکت ما است.' },
          { title: 'محدودیت مسئولیت', description: 'ما در قبال هیچ‌گونه خسارت غیرمستقیم ناشی از استفاده از سایت مسئولیتی نداریم.' }
        ]
      },
      {
        __component: 'terms.terms-contact-cta',
        icon: 'Mail',
        title: 'سوالی درباره قوانین دارید؟',
        description: 'اگر سوال یا نگرانی دارید، لطفاً با ما در میان بگذارید.',
        button_text: 'تماس با بخش حقوقی',
        button_link: '/contact'
      }
    ]
  }
];
