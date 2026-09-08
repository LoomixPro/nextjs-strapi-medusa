"use client"

import React from "react"
import {
  Twitter,
  Github,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
  Phone,
} from "lucide-react"
import type {
  StorefrontSettings,
  SocialPlatform,
  SocialLink,
} from "@lib/data/strapi-settings"

export type FooterProps = {
  settings?: StorefrontSettings
  footerNavigation?: any[]
  locale?: string | null
}

export type FooterStyleComponentProps = {
  brandName: string
  description: string
  copyright: string
  activeSocialLinks: SocialLink[]
  logoLight?: any
  logoDark?: any
  logo?: any
  footerNavigation?: any[]
}

// Platform → Lucide icon mapping
export const SOCIAL_ICONS: Partial<Record<SocialPlatform, React.ReactNode>> = {
  twitter: <Twitter className="w-5 h-5 text-white" />,
  github: <Github className="w-5 h-5 text-white" />,
  linkedin: <Linkedin className="w-5 h-5 text-white" />,
  facebook: <Facebook className="w-5 h-5 text-white" />,
  instagram: <Instagram className="w-5 h-5 text-white" />,
  youtube: <Youtube className="w-5 h-5 text-white" />,
  telegram: <MessageCircle className="w-5 h-5 text-white" />,
  whatsapp: <Phone className="w-5 h-5 text-white" />,
}
