import type { Schema, Struct } from '@strapi/strapi';

export interface AboutAboutCta extends Struct.ComponentSchema {
  collectionName: 'components_about_about_ctas';
  info: {
    description: 'Call to action section of the About page';
    displayName: 'About CTA';
    icon: 'cursor';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    primary_button_link: Schema.Attribute.String & Schema.Attribute.Required;
    primary_button_text: Schema.Attribute.String & Schema.Attribute.Required;
    secondary_button_link: Schema.Attribute.String;
    secondary_button_text: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AboutAboutFeatureItem extends Struct.ComponentSchema {
  collectionName: 'components_about_about_feature_items';
  info: {
    displayName: 'About Feature Item';
    icon: 'star';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    icon_name: Schema.Attribute.Enumeration<
      ['Sparkles', 'Target', 'Heart', 'Truck', 'Shield', 'Clock']
    > &
      Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AboutAboutFeatures extends Struct.ComponentSchema {
  collectionName: 'components_about_about_features';
  info: {
    description: 'Features section of the About page';
    displayName: 'About Features';
    icon: 'bulletList';
  };
  attributes: {
    items: Schema.Attribute.Component<'about.about-feature-item', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AboutAboutHero extends Struct.ComponentSchema {
  collectionName: 'components_about_about_heroes';
  info: {
    description: 'Hero section of the About page';
    displayName: 'About Hero';
    icon: 'landscape';
  };
  attributes: {
    badge: Schema.Attribute.String & Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AboutAboutPromise extends Struct.ComponentSchema {
  collectionName: 'components_about_about_promises';
  info: {
    description: 'Promise section of the About page';
    displayName: 'About Promise';
    icon: 'write';
  };
  attributes: {
    paragraphs: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AboutAboutStory extends Struct.ComponentSchema {
  collectionName: 'components_about_about_stories';
  info: {
    description: 'Story section of the About page';
    displayName: 'About Story';
    icon: 'book';
  };
  attributes: {
    paragraphs: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AboutAboutValueItem extends Struct.ComponentSchema {
  collectionName: 'components_about_about_value_items';
  info: {
    displayName: 'About Value Item';
    icon: 'bulletList';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AboutAboutValues extends Struct.ComponentSchema {
  collectionName: 'components_about_about_values';
  info: {
    description: 'Values section of the About page';
    displayName: 'About Values';
    icon: 'heart';
  };
  attributes: {
    items: Schema.Attribute.Component<'about.about-value-item', true>;
    subtitle: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlogAd extends Struct.ComponentSchema {
  collectionName: 'components_blog_ads';
  info: {
    description: 'Store promotion banner for blog posts';
    displayName: 'Shop Ad';
    icon: 'shopping-bag';
  };
  attributes: {
    adButtonText: Schema.Attribute.String;
    adCode: Schema.Attribute.String;
    adLink: Schema.Attribute.String;
    content: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlogHeading extends Struct.ComponentSchema {
  collectionName: 'components_blog_headings';
  info: {
    description: 'Section header for blog posts';
    displayName: 'Heading';
    icon: 'heading';
  };
  attributes: {
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlogImage extends Struct.ComponentSchema {
  collectionName: 'components_blog_images';
  info: {
    description: 'Image with optional caption for blog posts';
    displayName: 'Image';
    icon: 'picture';
  };
  attributes: {
    caption: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
  };
}

export interface BlogImageTextSplit extends Struct.ComponentSchema {
  collectionName: 'components_blog_image_text_splits';
  info: {
    description: 'Side by side image and text component';
    displayName: 'Image Text Split';
    icon: 'landscape';
  };
  attributes: {
    align: Schema.Attribute.Enumeration<['left', 'right']> &
      Schema.Attribute.DefaultTo<'right'>;
    content: Schema.Attribute.Text & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface BlogText extends Struct.ComponentSchema {
  collectionName: 'components_blog_texts';
  info: {
    description: 'Text paragraph for blog posts';
    displayName: 'Text';
    icon: 'align-justify';
  };
  attributes: {
    content: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface BlogVideo extends Struct.ComponentSchema {
  collectionName: 'components_blog_videos';
  info: {
    description: 'Video element for blog posts';
    displayName: 'Video';
    icon: 'slideshow';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    imageAlt: Schema.Attribute.String;
    videoUrl: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface CategoryCollectionCategoryItem extends Struct.ComponentSchema {
  collectionName: 'components_category_collection_category_items';
  info: {
    description: 'A category item for the Category/Collection showcase';
    displayName: 'Category Item';
    icon: 'folder';
  };
  attributes: {
    category: Schema.Attribute.Relation<'oneToOne', 'api::category.category'>;
    description: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    image: Schema.Attribute.Media<'images', true>;
    link: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    title: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface CategoryCollectionCollectionItem
  extends Struct.ComponentSchema {
  collectionName: 'components_category_collection_collection_items';
  info: {
    description: 'A collection item for the Category/Collection showcase';
    displayName: 'Collection Item';
    icon: 'folder';
  };
  attributes: {
    collection: Schema.Attribute.Relation<
      'oneToOne',
      'api::collection.collection'
    >;
    description: Schema.Attribute.Text &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    image: Schema.Attribute.Media<'images', true>;
    link: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    title: Schema.Attribute.String &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface ContactContactCard extends Struct.ComponentSchema {
  collectionName: 'components_contact_contact_cards';
  info: {
    displayName: 'Contact Card';
    icon: 'comment';
  };
  attributes: {
    content: Schema.Attribute.String & Schema.Attribute.Required;
    icon_name: Schema.Attribute.Enumeration<
      ['Mail', 'Phone', 'MapPin', 'MessageSquare']
    >;
    sub_content: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ContactContactExpectationItem extends Struct.ComponentSchema {
  collectionName: 'components_contact_contact_expectation_items';
  info: {
    displayName: 'Contact Expectation Item';
    icon: 'check';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ContactContactFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_contact_contact_faq_items';
  info: {
    displayName: 'Contact FAQ Item';
    icon: 'question';
  };
  attributes: {
    question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ContactContactFaqPreview extends Struct.ComponentSchema {
  collectionName: 'components_contact_contact_faq_previews';
  info: {
    displayName: 'Contact FAQ Preview';
    icon: 'bulletList';
  };
  attributes: {
    button_link: Schema.Attribute.String & Schema.Attribute.Required;
    button_text: Schema.Attribute.String & Schema.Attribute.Required;
    description: Schema.Attribute.Text;
    faq_items: Schema.Attribute.Component<'contact.contact-faq-item', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ContactContactFormInfo extends Struct.ComponentSchema {
  collectionName: 'components_contact_contact_form_infos';
  info: {
    displayName: 'Contact Form Info';
    icon: 'layer';
  };
  attributes: {
    description: Schema.Attribute.Text;
    expectations_list: Schema.Attribute.Component<
      'contact.contact-expectation-item',
      true
    >;
    expectations_title: Schema.Attribute.String;
    quick_questions_card: Schema.Attribute.Component<
      'contact.contact-quick-questions',
      false
    >;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ContactContactFormSettings extends Struct.ComponentSchema {
  collectionName: 'components_contact_contact_form_settings';
  info: {
    displayName: 'Contact Form Settings';
    icon: 'cog';
  };
  attributes: {
    privacy_text: Schema.Attribute.String;
    submit_button_text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ContactContactHero extends Struct.ComponentSchema {
  collectionName: 'components_contact_contact_heroes';
  info: {
    displayName: 'Contact Hero';
    icon: 'home';
  };
  attributes: {
    badge: Schema.Attribute.String & Schema.Attribute.Required;
    description: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ContactContactInfoCards extends Struct.ComponentSchema {
  collectionName: 'components_contact_contact_info_cards';
  info: {
    displayName: 'Contact Info Cards';
    icon: 'bulletList';
  };
  attributes: {
    cards: Schema.Attribute.Component<'contact.contact-card', true>;
  };
}

export interface ContactContactQuickQuestions extends Struct.ComponentSchema {
  collectionName: 'components_contact_contact_quick_questions';
  info: {
    displayName: 'Contact Quick Questions';
    icon: 'question';
  };
  attributes: {
    button_link: Schema.Attribute.String & Schema.Attribute.Required;
    button_text: Schema.Attribute.String & Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    icon_name: Schema.Attribute.Enumeration<['Clock']>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface FaqFaqCategory extends Struct.ComponentSchema {
  collectionName: 'components_faq_faq_categories';
  info: {
    description: 'Category group containing multiple FAQ questions';
    displayName: 'FAQ Category';
    icon: 'folder';
  };
  attributes: {
    anchor_id: Schema.Attribute.String & Schema.Attribute.Required;
    icon: Schema.Attribute.Enumeration<
      [
        'ShoppingBag',
        'Package',
        'RefreshCw',
        'User',
        'Mail',
        'Phone',
        'MessageCircle',
        'HelpCircle',
      ]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'HelpCircle'>;
    questions: Schema.Attribute.Component<'ui.faq-item', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface FaqFaqContactCta extends Struct.ComponentSchema {
  collectionName: 'components_faq_faq_contact_ctas';
  info: {
    displayName: 'FAQ Contact CTA';
    icon: 'discuss';
  };
  attributes: {
    button_link: Schema.Attribute.String & Schema.Attribute.Required;
    button_text: Schema.Attribute.String & Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    icon: Schema.Attribute.Enumeration<
      [
        'ShoppingBag',
        'Package',
        'RefreshCw',
        'User',
        'Mail',
        'Phone',
        'MessageCircle',
        'HelpCircle',
      ]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'HelpCircle'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface FaqFaqHero extends Struct.ComponentSchema {
  collectionName: 'components_faq_faq_heroes';
  info: {
    description: 'Hero section of the FAQ page';
    displayName: 'FAQ Hero';
    icon: 'landscape';
  };
  attributes: {
    badge: Schema.Attribute.String & Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    searchPlaceholder: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface GuideGuideCharts extends Struct.ComponentSchema {
  collectionName: 'components_guide_guide_charts';
  info: {
    description: 'Section containing size charts tabs and categories';
    displayName: 'Guide Charts Section';
    icon: 'grid';
  };
  attributes: {
    size_categories: Schema.Attribute.Component<'guide.size-category', true>;
    size_charts_title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface GuideGuideContactCta extends Struct.ComponentSchema {
  collectionName: 'components_guide_guide_contact_ctas';
  info: {
    description: 'Call-to-action block for user support on sizing guide page';
    displayName: 'Guide Contact CTA';
    icon: 'discuss';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    primary_button_link: Schema.Attribute.String & Schema.Attribute.Required;
    primary_button_text: Schema.Attribute.String & Schema.Attribute.Required;
    secondary_button_link: Schema.Attribute.String & Schema.Attribute.Required;
    secondary_button_text: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface GuideGuideFaq extends Struct.ComponentSchema {
  collectionName: 'components_guide_guide_faqs';
  info: {
    description: 'Accordion list of FAQs specifically for sizes and fits';
    displayName: 'Guide FAQ Section';
    icon: 'question';
  };
  attributes: {
    faq_items: Schema.Attribute.Component<'ui.faq-item', true>;
    faq_title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface GuideGuideHero extends Struct.ComponentSchema {
  collectionName: 'components_guide_guide_heroes';
  info: {
    description: 'Hero section of the Size Guide';
    displayName: 'Guide Hero';
    icon: 'landscape';
  };
  attributes: {
    badge: Schema.Attribute.String & Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface GuideGuideImportantNotice extends Struct.ComponentSchema {
  collectionName: 'components_guide_guide_important_notices';
  info: {
    displayName: 'Guide Important Notice';
    icon: 'information';
  };
  attributes: {
    content: Schema.Attribute.Blocks & Schema.Attribute.Required;
  };
}

export interface GuideGuideMeasurement extends Struct.ComponentSchema {
  collectionName: 'components_guide_guide_measurements';
  info: {
    description: 'Section containing steps and tips on how to measure';
    displayName: 'Guide Measurement Instructions';
    icon: 'ruler';
  };
  attributes: {
    how_to_measure_title: Schema.Attribute.String & Schema.Attribute.Required;
    measurement_instructions_title: Schema.Attribute.String &
      Schema.Attribute.Required;
    measurement_steps: Schema.Attribute.Component<
      'guide.measurement-step',
      true
    >;
    measurement_tips: Schema.Attribute.Component<'guide.measurement-tip', true>;
    measurement_tips_title: Schema.Attribute.String & Schema.Attribute.Required;
    visual_guide_description: Schema.Attribute.Text & Schema.Attribute.Required;
    visual_guide_title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface GuideMeasurementStep extends Struct.ComponentSchema {
  collectionName: 'components_guide_measurement_steps';
  info: {
    displayName: 'Measurement Step';
    icon: 'bulletList';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    step_number: Schema.Attribute.Integer & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface GuideMeasurementTip extends Struct.ComponentSchema {
  collectionName: 'components_guide_measurement_tips';
  info: {
    displayName: 'Measurement Tip';
    icon: 'lightbulb';
  };
  attributes: {
    tip: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface GuideSizeCategory extends Struct.ComponentSchema {
  collectionName: 'components_guide_size_categories';
  info: {
    description: 'Category tabs containing lists of size charts';
    displayName: 'Size Category';
    icon: 'folder';
  };
  attributes: {
    category_name: Schema.Attribute.String & Schema.Attribute.Required;
    category_value: Schema.Attribute.String & Schema.Attribute.Required;
    charts: Schema.Attribute.Component<'guide.size-chart', true>;
  };
}

export interface GuideSizeChart extends Struct.ComponentSchema {
  collectionName: 'components_guide_size_charts';
  info: {
    description: 'A single size chart with title, description, and table image';
    displayName: 'Size Chart';
    icon: 'th';
  };
  attributes: {
    description: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    image_description: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PrivacyPrivacyCardSection extends Struct.ComponentSchema {
  collectionName: 'components_privacy_privacy_card_sections';
  info: {
    description: 'Simple card-styled content section for Privacy Policy';
    displayName: 'Privacy Card Section';
    icon: 'file';
  };
  attributes: {
    content: Schema.Attribute.Text & Schema.Attribute.Required;
    icon: Schema.Attribute.Enumeration<
      [
        'Shield',
        'Lock',
        'Eye',
        'UserCheck',
        'Mail',
        'Cookie',
        'Globe',
        'FileText',
      ]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'FileText'>;
    section_id: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PrivacyPrivacyContactCta extends Struct.ComponentSchema {
  collectionName: 'components_privacy_privacy_contact_ctas';
  info: {
    displayName: 'Privacy Contact CTA';
    icon: 'discuss';
  };
  attributes: {
    button_link: Schema.Attribute.String & Schema.Attribute.Required;
    button_text: Schema.Attribute.String & Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    icon: Schema.Attribute.Enumeration<
      [
        'Shield',
        'Lock',
        'Eye',
        'UserCheck',
        'Mail',
        'Cookie',
        'Globe',
        'FileText',
      ]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Mail'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PrivacyPrivacyGridCard extends Struct.ComponentSchema {
  collectionName: 'components_privacy_privacy_grid_cards';
  info: {
    displayName: 'Privacy Grid Card';
    icon: 'bulletList';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PrivacyPrivacyGridSection extends Struct.ComponentSchema {
  collectionName: 'components_privacy_privacy_grid_sections';
  info: {
    description: 'Grid of info cards with header and custom styled footer';
    displayName: 'Privacy Grid Section';
    icon: 'dashboard';
  };
  attributes: {
    cards: Schema.Attribute.Component<'privacy.privacy-grid-card', true>;
    footer_text: Schema.Attribute.Text;
    icon: Schema.Attribute.Enumeration<
      [
        'Shield',
        'Lock',
        'Eye',
        'UserCheck',
        'Mail',
        'Cookie',
        'Globe',
        'FileText',
      ]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'FileText'>;
    intro_text: Schema.Attribute.Text & Schema.Attribute.Required;
    layout_style: Schema.Attribute.Enumeration<['default', 'alert', 'muted']> &
      Schema.Attribute.DefaultTo<'default'>;
    section_id: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PrivacyPrivacyHero extends Struct.ComponentSchema {
  collectionName: 'components_privacy_privacy_heroes';
  info: {
    description: 'Hero section of the Privacy page';
    displayName: 'Privacy Hero';
    icon: 'landscape';
  };
  attributes: {
    badge: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PrivacyPrivacyTextSection extends Struct.ComponentSchema {
  collectionName: 'components_privacy_privacy_text_sections';
  info: {
    displayName: 'Privacy Text Section';
    icon: 'write';
  };
  attributes: {
    content: Schema.Attribute.Text & Schema.Attribute.Required;
    section_id: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SettingsBackgroundSettings extends Struct.ComponentSchema {
  collectionName: 'components_settings_background_settings';
  info: {
    description: 'Global background style configuration';
    displayName: 'Background Settings';
    icon: 'image';
  };
  attributes: {
    opacityDark: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<30>;
    opacityLight: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<40>;
    style: Schema.Attribute.Enumeration<['silk', 'grid', 'solid', 'none']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'grid'>;
  };
}

export interface SettingsBottomNavBarSettings extends Struct.ComponentSchema {
  collectionName: 'components_settings_bottom_nav_bar_settings';
  info: {
    description: 'Configuration for the mobile bottom navigation bar';
    displayName: 'Bottom Nav Bar Settings';
    icon: 'layout';
  };
  attributes: {
    style: Schema.Attribute.String & Schema.Attribute.DefaultTo<'style-1'>;
  };
}

export interface SettingsButtonSettings extends Struct.ComponentSchema {
  collectionName: 'components_settings_button_settings';
  info: {
    description: 'Configuration for the global button style';
    displayName: 'Button Settings';
    icon: 'cog';
  };
  attributes: {
    style: Schema.Attribute.String & Schema.Attribute.DefaultTo<'style-1'>;
  };
}

export interface SettingsCartPageSettings extends Struct.ComponentSchema {
  collectionName: 'components_settings_cart_page_settings';
  info: {
    description: '';
    displayName: 'Cart Page Settings';
    icon: 'shopping-cart';
  };
  attributes: {
    template: Schema.Attribute.String & Schema.Attribute.DefaultTo<'style-1'>;
    topBannerText: Schema.Attribute.String;
  };
}

export interface SettingsCheckoutPageSettings extends Struct.ComponentSchema {
  collectionName: 'components_settings_checkout_page_settings';
  info: {
    description: '';
    displayName: 'Checkout Page Settings';
    icon: 'layout';
  };
  attributes: {
    template: Schema.Attribute.String & Schema.Attribute.DefaultTo<'style-1'>;
  };
}

export interface SettingsFooterSettings extends Struct.ComponentSchema {
  collectionName: 'components_settings_footer_settings';
  info: {
    description: 'Footer configuration including logo, descriptions, copyrights, and social links';
    displayName: 'Footer Settings';
    icon: 'layout';
  };
  attributes: {
    footerStyle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'style-1'>;
    logoDark: Schema.Attribute.Component<'settings.logo-config', false>;
    logoLight: Schema.Attribute.Component<'settings.logo-config', false>;
    socialLinks: Schema.Attribute.Component<'settings.social-link', true>;
    translations: Schema.Attribute.Component<
      'settings.footer-translation',
      true
    >;
  };
}

export interface SettingsFooterTranslation extends Struct.ComponentSchema {
  collectionName: 'components_settings_footer_translations';
  info: {
    description: 'Localized content for footer description and copyright';
    displayName: 'Footer Translation';
    icon: 'globe';
  };
  attributes: {
    copyright: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    language: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SettingsHeaderSettings extends Struct.ComponentSchema {
  collectionName: 'components_settings_header_settings';
  info: {
    description: 'Header configuration including style and logos';
    displayName: 'Header Settings';
    icon: 'layout';
  };
  attributes: {
    headerStyle: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'style-1'>;
    logoDark: Schema.Attribute.Component<'settings.logo-config', false>;
    logoLight: Schema.Attribute.Component<'settings.logo-config', false>;
  };
}

export interface SettingsLoginPageSettings extends Struct.ComponentSchema {
  collectionName: 'components_settings_login_page_settings';
  info: {
    description: '';
    displayName: 'Login Page Settings';
    icon: 'lock';
  };
  attributes: {
    images: Schema.Attribute.Media<'images', true>;
    loginMethods: Schema.Attribute.Enumeration<['email', 'phone', 'both']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'email'>;
    template: Schema.Attribute.String & Schema.Attribute.DefaultTo<'style-1'>;
  };
}

export interface SettingsLogoConfig extends Struct.ComponentSchema {
  collectionName: 'components_settings_logo_configs';
  info: {
    description: 'Logo configuration supporting both image and text';
    displayName: 'Logo Config';
    icon: 'picture';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    text: Schema.Attribute.String;
    type: Schema.Attribute.Enumeration<['image', 'text']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'image'>;
  };
}

export interface SettingsOrderPageSettings extends Struct.ComponentSchema {
  collectionName: 'components_settings_order_page_settings';
  info: {
    description: 'Settings for the order completed and order details pages';
    displayName: 'Order Page Settings';
    icon: 'shopping-cart';
  };
  attributes: {
    template: Schema.Attribute.String & Schema.Attribute.DefaultTo<'style-1'>;
  };
}

export interface SettingsProductCardSelection extends Struct.ComponentSchema {
  collectionName: 'components_settings_product_card_selections';
  info: {
    description: '';
    displayName: 'Product Card Selection';
    icon: 'layout';
  };
  attributes: {
    categoryCardType: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'card-1'>;
    collectionCardType: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'card-1'>;
    storeCardType: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'card-1'>;
  };
}

export interface SettingsProductPageSettings extends Struct.ComponentSchema {
  collectionName: 'components_settings_product_page_settings';
  info: {
    description: '';
    displayName: 'Product Page Settings';
    icon: 'layout';
  };
  attributes: {
    template: Schema.Attribute.String & Schema.Attribute.DefaultTo<'style-1'>;
  };
}

export interface SettingsProfilePageSettings extends Struct.ComponentSchema {
  collectionName: 'components_settings_profile_page_settings';
  info: {
    description: '';
    displayName: 'Profile Page Settings';
    icon: 'user';
  };
  attributes: {
    template: Schema.Attribute.String & Schema.Attribute.DefaultTo<'style-1'>;
  };
}

export interface SettingsSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_settings_social_links';
  info: {
    description: 'Social media links configuration with URL and toggle status';
    displayName: 'Social Link';
    icon: 'link';
  };
  attributes: {
    enabled: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    platform: Schema.Attribute.Enumeration<
      [
        'twitter',
        'github',
        'linkedin',
        'facebook',
        'instagram',
        'youtube',
        'telegram',
        'whatsapp',
      ]
    > &
      Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SettingsStorePageSettings extends Struct.ComponentSchema {
  collectionName: 'components_settings_store_page_settings';
  info: {
    description: 'Settings for the store listing page';
    displayName: 'Store Page Settings';
    icon: 'shopping-cart';
  };
  attributes: {
    description: Schema.Attribute.Text;
    template: Schema.Attribute.String & Schema.Attribute.DefaultTo<'style-1'>;
    title: Schema.Attribute.String;
  };
}

export interface SettingsThemeSettings extends Struct.ComponentSchema {
  collectionName: 'components_settings_theme_settings';
  info: {
    description: 'Configuration for the theme palettes';
    displayName: 'Theme Settings';
    icon: 'paint-brush';
  };
  attributes: {
    darkPalette: Schema.Attribute.Enumeration<
      ['default', 'volcanic', 'golden']
    > &
      Schema.Attribute.DefaultTo<'default'>;
    lightPalette: Schema.Attribute.Enumeration<
      ['default', 'arctic', 'futuristic', 'emerald']
    > &
      Schema.Attribute.DefaultTo<'default'>;
  };
}

export interface SettingsTranslationFile extends Struct.ComponentSchema {
  collectionName: 'components_settings_translation_files';
  info: {
    description: 'A single translation file for a specific language';
    displayName: 'Translation File';
    icon: 'globe';
  };
  attributes: {
    file: Schema.Attribute.Media<'files'> & Schema.Attribute.Required;
    language: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SettingsTranslationItem extends Struct.ComponentSchema {
  collectionName: 'components_settings_translation_items';
  info: {
    description: '';
    displayName: 'Translation Item';
    icon: 'bulletList';
  };
  attributes: {
    language: Schema.Attribute.Enumeration<['default', 'en-US']>;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ShowcaseAllItems extends Struct.ComponentSchema {
  collectionName: 'components_showcase_all_items';
  info: {
    description: 'Display items from all products';
    displayName: 'All Items Source';
    icon: 'bulletList';
  };
  attributes: {
    filterBy: Schema.Attribute.Enumeration<['most_visited', 'discounted']>;
  };
}

export interface ShowcaseCampaign extends Struct.ComponentSchema {
  collectionName: 'components_showcase_campaigns';
  info: {
    description: 'Select a custom campaign';
    displayName: 'Campaign Source';
    icon: 'star';
  };
  attributes: {
    campaign: Schema.Attribute.Relation<'oneToOne', 'api::campaign.campaign'>;
  };
}

export interface ShowcaseCategory extends Struct.ComponentSchema {
  collectionName: 'components_showcase_categories';
  info: {
    description: 'Select a specific Medusa category';
    displayName: 'Category Source';
    icon: 'folder';
  };
  attributes: {
    category: Schema.Attribute.Relation<'oneToOne', 'api::category.category'>;
    filterBy: Schema.Attribute.Enumeration<['most_visited', 'discounted']>;
  };
}

export interface ShowcaseCollection extends Struct.ComponentSchema {
  collectionName: 'components_showcase_collections';
  info: {
    description: 'Select a specific Medusa collection';
    displayName: 'Collection Source';
    icon: 'apps';
  };
  attributes: {
    collection: Schema.Attribute.Relation<
      'oneToOne',
      'api::collection.collection'
    >;
    filterBy: Schema.Attribute.Enumeration<['most_visited', 'discounted']>;
  };
}

export interface ShowcaseCustom extends Struct.ComponentSchema {
  collectionName: 'components_showcase_customs';
  info: {
    description: 'Manually select specific products';
    displayName: 'Custom Products';
    icon: 'shoppingCart';
  };
  attributes: {
    products: Schema.Attribute.Relation<'oneToMany', 'api::product.product'>;
  };
}

export interface SupportContactCta extends Struct.ComponentSchema {
  collectionName: 'components_support_contact_ctas';
  info: {
    displayName: 'Return Contact CTA';
    icon: 'mail';
  };
  attributes: {
    button_link: Schema.Attribute.String & Schema.Attribute.Required;
    button_text: Schema.Attribute.String & Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    icon: Schema.Attribute.Enumeration<
      [
        'Clock',
        'Truck',
        'DollarSign',
        'RefreshCw',
        'FileText',
        'CheckCircle2',
        'Package',
        'XCircle',
        'AlertCircle',
        'Mail',
      ]
    > &
      Schema.Attribute.DefaultTo<'Mail'>;
    secondary_button_link: Schema.Attribute.String;
    secondary_button_text: Schema.Attribute.String;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SupportGridCard extends Struct.ComponentSchema {
  collectionName: 'components_support_grid_cards';
  info: {
    displayName: 'Grid Card';
    icon: 'grid';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    icon: Schema.Attribute.Enumeration<
      [
        'Clock',
        'Truck',
        'DollarSign',
        'RefreshCw',
        'FileText',
        'CheckCircle2',
        'Package',
        'XCircle',
        'AlertCircle',
        'Mail',
      ]
    > &
      Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SupportNavigationItem extends Struct.ComponentSchema {
  collectionName: 'components_support_navigation_items';
  info: {
    displayName: 'Navigation Item';
    icon: 'bulletList';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    target_section: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SupportReturnFaq extends Struct.ComponentSchema {
  collectionName: 'components_support_return_faqs';
  info: {
    description: 'Accordion list of FAQs specifically for returns and refunds';
    displayName: 'Return FAQ Section';
    icon: 'question';
  };
  attributes: {
    faq_items: Schema.Attribute.Component<'ui.faq-item', true>;
    faq_title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SupportReturnHero extends Struct.ComponentSchema {
  collectionName: 'components_support_return_heroes';
  info: {
    displayName: 'Return Hero';
    icon: 'landscape';
  };
  attributes: {
    badge: Schema.Attribute.String;
    button_link: Schema.Attribute.String;
    button_text: Schema.Attribute.String;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SupportSectionGrid extends Struct.ComponentSchema {
  collectionName: 'components_support_section_grids';
  info: {
    displayName: 'Section Grid';
    icon: 'grid';
  };
  attributes: {
    cards: Schema.Attribute.Component<'support.grid-card', true>;
    footer_text: Schema.Attribute.Text;
    icon: Schema.Attribute.Enumeration<
      [
        'Clock',
        'Truck',
        'DollarSign',
        'RefreshCw',
        'FileText',
        'CheckCircle2',
        'Package',
        'XCircle',
        'AlertCircle',
        'Mail',
      ]
    >;
    intro_text: Schema.Attribute.Text;
    section_id: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface TermsTermsCard extends Struct.ComponentSchema {
  collectionName: 'components_terms_terms_cards';
  info: {
    displayName: 'Terms Card';
    icon: 'bulletList';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface TermsTermsCardSection extends Struct.ComponentSchema {
  collectionName: 'components_terms_terms_card_sections';
  info: {
    description: 'Section containing cards for terms page';
    displayName: 'Terms Card Section';
    icon: 'file';
  };
  attributes: {
    cards: Schema.Attribute.Component<'terms.terms-card', true>;
    icon: Schema.Attribute.Enumeration<
      [
        'FileText',
        'ShoppingBag',
        'CreditCard',
        'Package',
        'RefreshCw',
        'Shield',
        'Scale',
        'AlertCircle',
        'CheckCircle',
        'Mail',
      ]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'FileText'>;
    section_id: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface TermsTermsContactCta extends Struct.ComponentSchema {
  collectionName: 'components_terms_terms_contact_ctas';
  info: {
    displayName: 'Terms Contact CTA';
    icon: 'discuss';
  };
  attributes: {
    button_link: Schema.Attribute.String & Schema.Attribute.Required;
    button_text: Schema.Attribute.String & Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    icon: Schema.Attribute.Enumeration<
      [
        'FileText',
        'ShoppingBag',
        'CreditCard',
        'Package',
        'RefreshCw',
        'Shield',
        'Scale',
        'AlertCircle',
        'CheckCircle',
        'Mail',
      ]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Mail'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface TermsTermsHero extends Struct.ComponentSchema {
  collectionName: 'components_terms_terms_heroes';
  info: {
    description: 'Hero section of the Terms page';
    displayName: 'Terms Hero';
    icon: 'landscape';
  };
  attributes: {
    badge: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface TermsTermsTextSection extends Struct.ComponentSchema {
  collectionName: 'components_terms_terms_text_sections';
  info: {
    displayName: 'Terms Text Section';
    icon: 'write';
  };
  attributes: {
    content: Schema.Attribute.Text & Schema.Attribute.Required;
    icon: Schema.Attribute.Enumeration<
      [
        'FileText',
        'ShoppingBag',
        'CreditCard',
        'Package',
        'RefreshCw',
        'Shield',
        'Scale',
        'AlertCircle',
        'CheckCircle',
        'Mail',
      ]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'FileText'>;
    section_id: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface UiBlogPostsBlock extends Struct.ComponentSchema {
  collectionName: 'components_ui_blog_posts_blocks';
  info: {
    description: 'A block to display blog posts on the page based on latest, views, or manual selection.';
    displayName: 'Blog Posts Block';
    icon: 'bulletList';
  };
  attributes: {
    adminTitle: Schema.Attribute.String;
    blog_section: Schema.Attribute.Relation<
      'oneToOne',
      'api::hp-section-blog.hp-section-blog'
    >;
  };
}

export interface UiCategoryCollectionBlock extends Struct.ComponentSchema {
  collectionName: 'components_ui_category_collection_blocks';
  info: {
    description: 'A block to display a Category and Collection Showcase on the page';
    displayName: 'Category Collection Showcase Block';
    icon: 'apps';
  };
  attributes: {
    adminTitle: Schema.Attribute.String;
    section: Schema.Attribute.Relation<
      'oneToOne',
      'api::hp-section-category-collection.hp-section-category-collection'
    >;
  };
}

export interface UiFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_ui_faq_items';
  info: {
    description: 'A single Question & Answer item for the FAQ list';
    displayName: 'FAQ Item';
    icon: 'question';
  };
  attributes: {
    answer: Schema.Attribute.Text & Schema.Attribute.Required;
    question: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface UiFeatureItem extends Struct.ComponentSchema {
  collectionName: 'components_ui_feature_items';
  info: {
    description: 'An individual feature or benefit with an icon, title, and description.';
    displayName: 'Feature Item';
    icon: 'star';
  };
  attributes: {
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.Media<'images'>;
    icon_name: Schema.Attribute.Enumeration<
      [
        'truck',
        'shield-check',
        'rotate-ccw',
        'headset',
        'credit-card',
        'award',
        'percent',
        'zap',
      ]
    >;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface UiFeaturesBlock extends Struct.ComponentSchema {
  collectionName: 'components_ui_features_blocks';
  info: {
    description: 'A block to display features or customer testimonials on the page';
    displayName: 'Features & Testimonials Block';
    icon: 'bulletList';
  };
  attributes: {
    adminTitle: Schema.Attribute.String;
    features_section: Schema.Attribute.Relation<
      'oneToOne',
      'api::hp-section-feature.hp-section-feature'
    >;
  };
}

export interface UiHeroBlock extends Struct.ComponentSchema {
  collectionName: 'components_ui_hero_blocks';
  info: {
    description: 'Standalone hero banner block with images, title, and CTA.';
    displayName: 'Hero Block';
    icon: 'picture';
  };
  attributes: {
    adminTitle: Schema.Attribute.String;
    section: Schema.Attribute.Relation<
      'oneToOne',
      'api::hp-section-hero.hp-section-hero'
    >;
  };
}

export interface UiHeroHighlight extends Struct.ComponentSchema {
  collectionName: 'components_ui_hero_highlights';
  info: {
    description: 'Trust badge or highlight point displayed under hero CTA button';
    displayName: 'Hero Highlight';
    icon: 'bulletList';
  };
  attributes: {
    color: Schema.Attribute.Enumeration<
      ['emerald', 'primary', 'amber', 'blue', 'purple', 'rose']
    > &
      Schema.Attribute.DefaultTo<'emerald'>;
    icon_name: Schema.Attribute.Enumeration<
      [
        'shield-check',
        'truck',
        'rotate-ccw',
        'headset',
        'credit-card',
        'award',
        'percent',
        'zap',
        'dot',
      ]
    > &
      Schema.Attribute.DefaultTo<'dot'>;
    text: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
  };
}

export interface UiProductScrollBlock extends Struct.ComponentSchema {
  collectionName: 'components_ui_product_scroll_blocks';
  info: {
    description: 'Standalone block for displaying a horizontally scrollable product list.';
    displayName: 'Product Scroll Block';
    icon: 'grid';
  };
  attributes: {
    adminTitle: Schema.Attribute.String;
    section: Schema.Attribute.Relation<
      'oneToOne',
      'api::hp-section-scroll-product.hp-section-scroll-product'
    >;
  };
}

export interface UiProductShowcaseBlock extends Struct.ComponentSchema {
  collectionName: 'components_ui_product_showcase_blocks';
  info: {
    description: 'A block to display a Product Showcase on the page';
    displayName: 'Product Showcase Block';
    icon: 'apps';
  };
  attributes: {
    adminTitle: Schema.Attribute.String;
    showcase: Schema.Attribute.Relation<
      'oneToOne',
      'api::hp-section-showcase.hp-section-showcase'
    >;
  };
}

export interface UiTestimonialItem extends Struct.ComponentSchema {
  collectionName: 'components_ui_testimonial_items';
  info: {
    description: 'A customer review / testimonial item with rating, avatar, and quote.';
    displayName: 'Testimonial Item';
    icon: 'emotionHappy';
  };
  attributes: {
    author_name: Schema.Attribute.String & Schema.Attribute.Required;
    author_role: Schema.Attribute.String;
    avatar: Schema.Attribute.Media<'images'>;
    content: Schema.Attribute.Text & Schema.Attribute.Required;
    rating: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 5;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<5>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'about.about-cta': AboutAboutCta;
      'about.about-feature-item': AboutAboutFeatureItem;
      'about.about-features': AboutAboutFeatures;
      'about.about-hero': AboutAboutHero;
      'about.about-promise': AboutAboutPromise;
      'about.about-story': AboutAboutStory;
      'about.about-value-item': AboutAboutValueItem;
      'about.about-values': AboutAboutValues;
      'blog.ad': BlogAd;
      'blog.heading': BlogHeading;
      'blog.image': BlogImage;
      'blog.image-text-split': BlogImageTextSplit;
      'blog.text': BlogText;
      'blog.video': BlogVideo;
      'category-collection.category-item': CategoryCollectionCategoryItem;
      'category-collection.collection-item': CategoryCollectionCollectionItem;
      'contact.contact-card': ContactContactCard;
      'contact.contact-expectation-item': ContactContactExpectationItem;
      'contact.contact-faq-item': ContactContactFaqItem;
      'contact.contact-faq-preview': ContactContactFaqPreview;
      'contact.contact-form-info': ContactContactFormInfo;
      'contact.contact-form-settings': ContactContactFormSettings;
      'contact.contact-hero': ContactContactHero;
      'contact.contact-info-cards': ContactContactInfoCards;
      'contact.contact-quick-questions': ContactContactQuickQuestions;
      'faq.faq-category': FaqFaqCategory;
      'faq.faq-contact-cta': FaqFaqContactCta;
      'faq.faq-hero': FaqFaqHero;
      'guide.guide-charts': GuideGuideCharts;
      'guide.guide-contact-cta': GuideGuideContactCta;
      'guide.guide-faq': GuideGuideFaq;
      'guide.guide-hero': GuideGuideHero;
      'guide.guide-important-notice': GuideGuideImportantNotice;
      'guide.guide-measurement': GuideGuideMeasurement;
      'guide.measurement-step': GuideMeasurementStep;
      'guide.measurement-tip': GuideMeasurementTip;
      'guide.size-category': GuideSizeCategory;
      'guide.size-chart': GuideSizeChart;
      'privacy.privacy-card-section': PrivacyPrivacyCardSection;
      'privacy.privacy-contact-cta': PrivacyPrivacyContactCta;
      'privacy.privacy-grid-card': PrivacyPrivacyGridCard;
      'privacy.privacy-grid-section': PrivacyPrivacyGridSection;
      'privacy.privacy-hero': PrivacyPrivacyHero;
      'privacy.privacy-text-section': PrivacyPrivacyTextSection;
      'settings.background-settings': SettingsBackgroundSettings;
      'settings.bottom-nav-bar-settings': SettingsBottomNavBarSettings;
      'settings.button-settings': SettingsButtonSettings;
      'settings.cart-page-settings': SettingsCartPageSettings;
      'settings.checkout-page-settings': SettingsCheckoutPageSettings;
      'settings.footer-settings': SettingsFooterSettings;
      'settings.footer-translation': SettingsFooterTranslation;
      'settings.header-settings': SettingsHeaderSettings;
      'settings.login-page-settings': SettingsLoginPageSettings;
      'settings.logo-config': SettingsLogoConfig;
      'settings.order-page-settings': SettingsOrderPageSettings;
      'settings.product-card-selection': SettingsProductCardSelection;
      'settings.product-page-settings': SettingsProductPageSettings;
      'settings.profile-page-settings': SettingsProfilePageSettings;
      'settings.social-link': SettingsSocialLink;
      'settings.store-page-settings': SettingsStorePageSettings;
      'settings.theme-settings': SettingsThemeSettings;
      'settings.translation-file': SettingsTranslationFile;
      'settings.translation-item': SettingsTranslationItem;
      'showcase.all-items': ShowcaseAllItems;
      'showcase.campaign': ShowcaseCampaign;
      'showcase.category': ShowcaseCategory;
      'showcase.collection': ShowcaseCollection;
      'showcase.custom': ShowcaseCustom;
      'support.contact-cta': SupportContactCta;
      'support.grid-card': SupportGridCard;
      'support.navigation-item': SupportNavigationItem;
      'support.return-faq': SupportReturnFaq;
      'support.return-hero': SupportReturnHero;
      'support.section-grid': SupportSectionGrid;
      'terms.terms-card': TermsTermsCard;
      'terms.terms-card-section': TermsTermsCardSection;
      'terms.terms-contact-cta': TermsTermsContactCta;
      'terms.terms-hero': TermsTermsHero;
      'terms.terms-text-section': TermsTermsTextSection;
      'ui.blog-posts-block': UiBlogPostsBlock;
      'ui.category-collection-block': UiCategoryCollectionBlock;
      'ui.faq-item': UiFaqItem;
      'ui.feature-item': UiFeatureItem;
      'ui.features-block': UiFeaturesBlock;
      'ui.hero-block': UiHeroBlock;
      'ui.hero-highlight': UiHeroHighlight;
      'ui.product-scroll-block': UiProductScrollBlock;
      'ui.product-showcase-block': UiProductShowcaseBlock;
      'ui.testimonial-item': UiTestimonialItem;
    }
  }
}
