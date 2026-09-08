"use server"
import { cacheTag } from "next/cache"

import { getStrapiServerUrl } from "@lib/util/server-urls"
import { getLocale } from "@lib/data/locale-actions"
import { getStrapLocale } from "./homepage"

const STRAPI_URL = getStrapiServerUrl()
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

export interface AboutHeroBlock {
  __component: "about.about-hero"
  id: number
  badge: string
  title: string
  description: string
}

export interface AboutStoryBlock {
  __component: "about.about-story"
  id: number
  title: string
  paragraphs: string
}

export interface AboutValueItem {
  id: number
  title: string
  description: string
}

export interface AboutValuesBlock {
  __component: "about.about-values"
  id: number
  title: string
  subtitle?: string
  items: AboutValueItem[]
}

export interface AboutFeatureItem {
  id: number
  title: string
  description: string
  icon_name?: string
}

export interface AboutFeaturesBlock {
  __component: "about.about-features"
  id: number
  title: string
  items: AboutFeatureItem[]
}

export interface AboutPromiseBlock {
  __component: "about.about-promise"
  id: number
  title: string
  paragraphs: string
}

export interface AboutCtaBlock {
  __component: "about.about-cta"
  id: number
  title: string
  description: string
  primary_button_text: string
  primary_button_link: string
  secondary_button_text?: string
  secondary_button_link?: string
}

export type AboutPageBlock =
  | AboutHeroBlock
  | AboutStoryBlock
  | AboutValuesBlock
  | AboutFeaturesBlock
  | AboutPromiseBlock
  | AboutCtaBlock

export interface AboutPageData {
  title: string
  subtitle?: string
  description?: string
  blocks: AboutPageBlock[]
}

export interface FAQHeroBlock {
  __component: "faq.faq-hero"
  id: number
  badge: string
  title: string
  description: string
  searchPlaceholder?: string
}

export interface FAQCategoryBlock {
  __component: "faq.faq-category"
  id: number
  anchor_id: string
  title: string
  icon: string
  questions: {
    id: number
    question: string
    answer: string
  }[]
}

export interface FAQContactCtaBlock {
  __component: "faq.faq-contact-cta"
  id: number
  icon: string
  title: string
  description: string
  button_text: string
  button_link: string
}

export type FAQPageBlock = FAQHeroBlock | FAQCategoryBlock | FAQContactCtaBlock

export interface FAQPageData {
  title: string
  description?: string
  blocks: FAQPageBlock[]
  updatedAt: string
  locale: string
}

/**
 * Fetch About Page content from Strapi CMS
 */
async function getAboutPageDataCached(
  currentLocale: string,
  strapiLocale: string
): Promise<AboutPageData | null> {
  "use cache"
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/about-page?locale=${strapiLocale}`,
      {
        headers: {
          ...(STRAPI_API_TOKEN && {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          }),
        },
      }
    )
    cacheTag(...["strapi-pages", `strapi-about-${strapiLocale}`])

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Strapi about-page fetch failed: ${response.status}`)
    }

    const { data } = await response.json()
    return data || null
  } catch (error) {
    console.error("Failed to fetch About Page data:", error)
    return null
  }
}

/**
 * Fetch FAQ Page content from Strapi CMS
 */
async function getFAQPageDataCached(
  currentLocale: string,
  strapiLocale: string
): Promise<FAQPageData | null> {
  "use cache"
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/faq-page?locale=${strapiLocale}`,
      {
        headers: {
          ...(STRAPI_API_TOKEN && {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          }),
        },
      }
    )
    cacheTag(...["strapi-pages", `strapi-faq-${strapiLocale}`])

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Strapi faq-page fetch failed: ${response.status}`)
    }

    const { data } = await response.json()
    return data || null
  } catch (error) {
    console.error("Failed to fetch FAQ Page data:", error)
    return null
  }
}

export interface ContactHeroBlock {
  __component: "contact.contact-hero"
  id: number
  badge: string
  title: string
  description?: string
}

export interface ContactCardItem {
  id: number
  icon_name: string
  title: string
  content: string
  sub_content?: string
}

export interface ContactInfoCardsBlock {
  __component: "contact.contact-info-cards"
  id: number
  cards: ContactCardItem[]
}

export interface ContactExpectationItem {
  id: number
  text: string
}

export interface ContactQuickQuestions {
  id: number
  icon_name: string
  title: string
  description: string
  button_text: string
  button_link: string
}

export interface ContactFormInfoBlock {
  __component: "contact.contact-form-info"
  id: number
  title: string
  description?: string
  expectations_title?: string
  expectations_list?: ContactExpectationItem[]
  quick_questions_card?: ContactQuickQuestions
}

export interface ContactFormSettingsBlock {
  __component: "contact.contact-form-settings"
  id: number
  privacy_text?: string
  submit_button_text: string
}

export interface ContactFaqItem {
  id: number
  question: string
}

export interface ContactFaqPreviewBlock {
  __component: "contact.contact-faq-preview"
  id: number
  title: string
  description?: string
  button_text: string
  button_link: string
  faq_items?: ContactFaqItem[]
}

export type ContactPageBlock =
  | ContactHeroBlock
  | ContactInfoCardsBlock
  | ContactFormInfoBlock
  | ContactFormSettingsBlock
  | ContactFaqPreviewBlock

export interface ContactPageData {
  title: string
  description?: string
  blocks: ContactPageBlock[]
}

/**
 * Fetch Contact Page content from Strapi CMS
 */
async function getContactPageDataCached(
  currentLocale: string,
  strapiLocale: string
): Promise<ContactPageData | null> {
  "use cache"
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/contact-page?locale=${strapiLocale}`,
      {
        headers: {
          ...(STRAPI_API_TOKEN && {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          }),
        },
      }
    )
    cacheTag(...["strapi-pages", `strapi-contact-${strapiLocale}`])

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Strapi contact-page fetch failed: ${response.status}`)
    }

    const { data } = await response.json()
    return data || null
  } catch (error) {
    console.error("Failed to fetch Contact Page data:", error)
    return null
  }
}

// --- Privacy Page Dynamic Zone Types ---

export interface PrivacyHeroBlock {
  __component: "privacy.privacy-hero"
  id: number
  badge: string
  title: string
}

export interface PrivacyCardSectionBlock {
  __component: "privacy.privacy-card-section"
  id: number
  icon: string
  title: string
  section_id: string
  content: string
}

export interface PrivacyGridCard {
  id: number
  title: string
  description: string
}

export interface PrivacyGridSectionBlock {
  __component: "privacy.privacy-grid-section"
  id: number
  icon: string
  title: string
  section_id: string
  intro_text: string
  footer_text?: string
  layout_style: "default" | "alert" | "muted"
  cards: PrivacyGridCard[]
}

export interface PrivacyTextSectionBlock {
  __component: "privacy.privacy-text-section"
  id: number
  title: string
  section_id: string
  content: string
}

export interface PrivacyContactCtaBlock {
  __component: "privacy.privacy-contact-cta"
  id: number
  icon: string
  title: string
  description: string
  button_text: string
  button_link: string
}

export type PrivacyPageBlock =
  | PrivacyHeroBlock
  | PrivacyCardSectionBlock
  | PrivacyGridSectionBlock
  | PrivacyTextSectionBlock
  | PrivacyContactCtaBlock

export interface PrivacyPageData {
  title: string
  description?: string
  blocks: PrivacyPageBlock[]
  updatedAt: string
  locale: string
}

/**
 * Fetch Privacy Policy Page content from Strapi CMS
 */
async function getPrivacyPageDataCached(
  currentLocale: string,
  strapiLocale: string
): Promise<PrivacyPageData | null> {
  "use cache"
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/privacy-page?locale=${strapiLocale}`,
      {
        headers: {
          ...(STRAPI_API_TOKEN && {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          }),
        },
      }
    )
    cacheTag(...["strapi-pages", `strapi-privacy-${strapiLocale}`])

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Strapi privacy-page fetch failed: ${response.status}`)
    }

    const { data } = await response.json()
    return data || null
  } catch (error) {
    console.error("Failed to fetch Privacy Page data:", error)
    return null
  }
}

// --- Terms Page Dynamic Zone Types ---

export interface TermsHeroBlock {
  __component: "terms.terms-hero"
  id: number
  badge: string
  title: string
}

export interface TermsTextSectionBlock {
  __component: "terms.terms-text-section"
  id: number
  icon: string
  title: string
  section_id: string
  content: string
}

export interface TermsCard {
  id: number
  title: string
  description: string
}

export interface TermsCardSectionBlock {
  __component: "terms.terms-card-section"
  id: number
  icon: string
  title: string
  section_id: string
  cards: TermsCard[]
}

export interface TermsContactCtaBlock {
  __component: "terms.terms-contact-cta"
  id: number
  icon: string
  title: string
  description: string
  button_text: string
  button_link: string
}

export type TermsPageBlock =
  | TermsHeroBlock
  | TermsTextSectionBlock
  | TermsCardSectionBlock
  | TermsContactCtaBlock

export interface TermsPageData {
  title: string
  description?: string
  blocks: TermsPageBlock[]
  updatedAt: string
  locale: string
}

/**
 * Fetch Terms & Conditions Page content from Strapi CMS
 */
async function getTermsPageDataCached(
  currentLocale: string,
  strapiLocale: string
): Promise<TermsPageData | null> {
  "use cache"
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/terms-page?locale=${strapiLocale}`,
      {
        headers: {
          ...(STRAPI_API_TOKEN && {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          }),
        },
      }
    )
    cacheTag(...["strapi-pages", `strapi-terms-${strapiLocale}`])

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Strapi terms-page fetch failed: ${response.status}`)
    }

    const { data } = await response.json()
    return data || null
  } catch (error) {
    console.error("Failed to fetch Terms Page data:", error)
    return null
  }
}

// --- Size Guide Page Dynamic Zone Types ---

export interface SizeGuideHeroBlock {
  __component: "guide.guide-hero"
  id: number
  badge: string
  title: string
  description: string
}

export interface SizeGuideImportantNoticeBlock {
  __component: "guide.guide-important-notice"
  id: number
  content: any // Rich text editor blocks
}

export interface MeasurementStep {
  id: number
  step_number: number
  title: string
  description: string
}

export interface MeasurementTip {
  id: number
  tip: string
}

export interface SizeGuideMeasurementBlock {
  __component: "guide.guide-measurement"
  id: number
  how_to_measure_title: string
  measurement_instructions_title: string
  measurement_steps: MeasurementStep[]
  measurement_tips_title: string
  measurement_tips: MeasurementTip[]
  visual_guide_title: string
  visual_guide_description: string
}

export interface SizeChart {
  id: number
  title: string
  description?: string
  image: {
    id: number
    documentId: string
    name: string
    alternativeText?: string | null
    caption?: string | null
    url: string
    width: number
    height: number
  }
  image_description?: string
}

export interface SizeCategory {
  id: number
  category_name: string
  category_value: string
  charts: SizeChart[]
}

export interface SizeGuideChartsBlock {
  __component: "guide.guide-charts"
  id: number
  size_charts_title: string
  size_categories: SizeCategory[]
}

export interface SizeGuideFAQBlock {
  __component: "guide.guide-faq"
  id: number
  faq_title: string
  faq_items: {
    id: number
    question: string
    answer: string
  }[]
}

export interface SizeGuideContactCTABlock {
  __component: "guide.guide-contact-cta"
  id: number
  title: string
  description: string
  primary_button_text: string
  primary_button_link: string
  secondary_button_text: string
  secondary_button_link: string
}

export type SizeGuidePageBlock =
  | SizeGuideHeroBlock
  | SizeGuideImportantNoticeBlock
  | SizeGuideMeasurementBlock
  | SizeGuideChartsBlock
  | SizeGuideFAQBlock
  | SizeGuideContactCTABlock

export interface SizeGuidePageData {
  title: string
  description?: string
  blocks: SizeGuidePageBlock[]
  updatedAt: string
  locale: string
}

/**
 * Fetch Size Guide Page content from Strapi CMS
 */
async function getSizeGuidePageDataCached(
  currentLocale: string,
  strapiLocale: string
): Promise<SizeGuidePageData | null> {
  "use cache"
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/size-guide-page?locale=${strapiLocale}`,
      {
        headers: {
          ...(STRAPI_API_TOKEN && {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          }),
        },
      }
    )
    cacheTag(...["strapi-pages", `strapi-size-guide-${strapiLocale}`])

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Strapi size-guide-page fetch failed: ${response.status}`)
    }

    const { data } = await response.json()
    return data || null
  } catch (error) {
    console.error("Failed to fetch Size Guide Page data:", error)
    return null
  }
}

// --- Returns Page Dynamic Zone Types ---

export interface ReturnHeroBlock {
  __component: "support.return-hero"
  id: number
  badge?: string
  title: string
  description: string
  button_text?: string
  button_link?: string
}

export interface ReturnGridCard {
  id: number
  title: string
  description: string
  icon: string
}

export interface ReturnSectionGridBlock {
  __component: "support.section-grid"
  id: number
  icon?: string
  title: string
  section_id: string
  intro_text?: string
  cards: ReturnGridCard[]
  footer_text?: string
}

export interface ReturnFaqItem {
  id: number
  question: string
  answer: string
}

export interface ReturnFAQBlock {
  __component: "support.return-faq"
  id: number
  faq_title: string
  faq_items: ReturnFaqItem[]
}

export interface ReturnContactCtaBlock {
  __component: "support.contact-cta"
  id: number
  icon?: string
  title: string
  description: string
  button_text: string
  button_link: string
  secondary_button_text?: string
  secondary_button_link?: string
}

export type ReturnPageBlock =
  | ReturnHeroBlock
  | ReturnSectionGridBlock
  | ReturnFAQBlock
  | ReturnContactCtaBlock

export interface ReturnPageData {
  title: string
  description?: string
  blocks: ReturnPageBlock[]
  updatedAt: string
  locale: string
}

/**
 * Fetch Returns Page content from Strapi CMS
 */
async function getReturnPageDataCached(
  currentLocale: string,
  strapiLocale: string
): Promise<ReturnPageData | null> {
  "use cache"
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/returns-page?locale=${strapiLocale}`,
      {
        headers: {
          ...(STRAPI_API_TOKEN && {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          }),
        },
      }
    )
    cacheTag(...["strapi-pages", `strapi-returns-${strapiLocale}`])

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Strapi returns-page fetch failed: ${response.status}`)
    }

    const { data } = await response.json()
    return data || null
  } catch (error) {
    console.error("Failed to fetch Returns Page data:", error)
    return null
  }
}

export async function getAboutPageData(): Promise<AboutPageData | null> {
  const currentLocale = (await getLocale()) || "default"
  const strapiLocale = await getStrapLocale(currentLocale)
  return getAboutPageDataCached(currentLocale, strapiLocale)
}

export async function getFAQPageData(): Promise<FAQPageData | null> {
  const currentLocale = (await getLocale()) || "default"
  const strapiLocale = await getStrapLocale(currentLocale)
  return getFAQPageDataCached(currentLocale, strapiLocale)
}

export async function getContactPageData(): Promise<ContactPageData | null> {
  const currentLocale = (await getLocale()) || "default"
  const strapiLocale = await getStrapLocale(currentLocale)
  return getContactPageDataCached(currentLocale, strapiLocale)
}

export async function getPrivacyPageData(): Promise<PrivacyPageData | null> {
  const currentLocale = (await getLocale()) || "default"
  const strapiLocale = await getStrapLocale(currentLocale)
  return getPrivacyPageDataCached(currentLocale, strapiLocale)
}

export async function getTermsPageData(): Promise<TermsPageData | null> {
  const currentLocale = (await getLocale()) || "default"
  const strapiLocale = await getStrapLocale(currentLocale)
  return getTermsPageDataCached(currentLocale, strapiLocale)
}

export async function getSizeGuidePageData(): Promise<SizeGuidePageData | null> {
  const currentLocale = (await getLocale()) || "default"
  const strapiLocale = await getStrapLocale(currentLocale)
  return getSizeGuidePageDataCached(currentLocale, strapiLocale)
}

export async function getReturnPageData(): Promise<ReturnPageData | null> {
  const currentLocale = (await getLocale()) || "default"
  const strapiLocale = await getStrapLocale(currentLocale)
  return getReturnPageDataCached(currentLocale, strapiLocale)
}
