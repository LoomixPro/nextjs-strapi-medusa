import React from "react"
import { Github, Twitter, Linkedin, Facebook } from "lucide-react"

export const SOCIAL_LINKS = [
  {
    href: "#",
    icon: <Twitter className="w-5 h-5 text-white" />,
  },
  {
    href: "#",
    icon: <Github className="w-5 h-5 text-white" />,
  },
  {
    href: "#",
    icon: <Linkedin className="w-5 h-5 text-white" />,
  },
  {
    href: "#",
    icon: <Facebook className="w-5 h-5 text-white" />,
  },
]

export const FOOTER_SECTIONS = {
  product: {
    title: "shop_title",
    links: [
      { label: "store", href: "/store" },
      { label: "cart", href: "/cart" },
      { label: "account", href: "/account" },
    ],
  },
  company: {
    title: "company_title",
    links: [
      { label: "about_us", href: "/about" },
      { label: "contact", href: "/contact" },
      { label: "faq", href: "/faq" },
    ],
  },
  legal: {
    title: "legal_title",
    links: [
      { label: "privacy_policy", href: "/privacy" },
      { label: "terms_of_service", href: "/terms" },
      { label: "size_guide", href: "/size-guide" },
      { label: "returns", href: "/returns" },
    ],
  },
}
