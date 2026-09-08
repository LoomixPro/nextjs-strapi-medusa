"use client"

import React, { useMemo } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { cn } from "@lib/utils"
import type { TestimonialItem } from "@lib/data/homepage"
import BlockHeader from "@modules/common/components/block-header"
import { useTranslations } from "next-intl"

export interface Style4Props {
  title?: string
  badge?: string
  description?: string
  headerStyle?: string
  testimonials?: TestimonialItem[]
}

interface TestimonialData {
  text: string
  image: string | null
  name: string
  role?: string
  initial: string
}

const getStrapiMediaUrl = (url?: string) => {
  if (!url) return null
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337"
  return `${baseUrl}${url}`
}

const defaultTestimonials = [
  {
    text: "The best solution we found in the market. Our team's speed has increased 5x.",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    name: "John Doe",
    role: "CEO of TechCorp",
  },
  {
    text: "Data security was our top priority and this system has exceeded our expectations.",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Daniel Craig",
    role: "CTO of SecureNet",
  },
  {
    text: "Before this platform, we had a lot of issues managing orders. It's truly amazing!",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Sarah Jenkins",
    role: "Operations Manager",
  },
  {
    text: "Planning for the future of our business has become incredibly fast and accurate. Highly recommended.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Omar Richards",
    role: "Chief Executive Officer",
  },
  {
    text: "If I could give more than 5 stars, I definitely would. Unparalleled support.",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Mary Smith",
    role: "CFO of FutureBuilders",
  },
  {
    text: "Fast implementation and a very user-friendly interface made training the team super easy.",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Elmira Hudson",
    role: "Data Analyst",
  },
  {
    text: "With strong support and incredible features, our work efficiency has increased significantly.",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Farhad S.",
    role: "Marketing Manager",
  },
  {
    text: "The best shopping experience we've had. The responsiveness and dedicated solutions are outstanding.",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Sana S.",
    role: "Sales Manager",
  },
  {
    text: "Our online sales volume and conversion rate grew dramatically after using this platform.",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
    name: "Hassan Ali",
    role: "E-commerce Manager",
  },
]

const TestimonialsColumn = (props: {
  className?: string
  testimonials: TestimonialData[]
  duration?: number
}) => {
  return (
    <div className={props.className}>
      <motion.ul
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-transparent transition-colors duration-300 list-none m-0 p-0"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(
                ({ text, image, name, role, initial }, i) => (
                  <motion.li
                    key={`${index}-${i}`}
                    aria-hidden={index === 1 ? "true" : "false"}
                    tabIndex={index === 1 ? -1 : 0}
                    whileHover={{
                      scale: 1.03,
                      y: -8,
                      boxShadow:
                        "0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      },
                    }}
                    whileFocus={{
                      scale: 1.03,
                      y: -8,
                      boxShadow:
                        "0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 17,
                      },
                    }}
                    className="p-8 sm:p-10 rounded-3xl border border-border shadow-lg shadow-black/5 max-w-xs w-full bg-card transition-all duration-300 cursor-default select-none group focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <blockquote className="m-0 p-0">
                      <p className="text-muted-foreground leading-relaxed font-normal text-sm sm:text-base m-0 transition-colors duration-300">
                        &ldquo;{text}&rdquo;
                      </p>
                      <footer className="flex items-center gap-3 mt-6">
                        {image ? (
                          <Image
                            width={40}
                            height={40}
                            src={image}
                            alt={`Avatar of ${name}`}
                            className="h-10 w-10 rounded-full object-cover ring-2 ring-border group-hover:ring-primary/40 transition-all duration-300 ease-in-out"
                            unoptimized
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm ring-2 ring-border group-hover:ring-primary/40 transition-all duration-300">
                            {initial}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <cite className="font-semibold not-italic tracking-tight leading-5 text-card-foreground transition-colors duration-300 truncate">
                            {name}
                          </cite>
                          {role && (
                            <span className="text-xs leading-5 tracking-tight text-muted-foreground mt-0.5 transition-colors duration-300 truncate">
                              {role}
                            </span>
                          )}
                        </div>
                      </footer>
                    </blockquote>
                  </motion.li>
                )
              )}
            </React.Fragment>
          )),
        ]}
      </motion.ul>
    </div>
  )
}

export default function Style4({
  title,
  badge,
  description,
  headerStyle,
  testimonials = [],
}: Style4Props) {
  const t = useTranslations("HomePage")

  const formattedTestimonials = useMemo(() => {
    let list: TestimonialData[] = []
    if (testimonials && testimonials.length > 0) {
      list = testimonials.map((item) => {
        const avatarUrl = getStrapiMediaUrl(item.avatar?.url)
        const name = item.author_name || t("showcase.customer") || "Customer"
        const initial = name.trim().charAt(0).toUpperCase() || "U"
        return {
          text: item.content,
          image: avatarUrl,
          name,
          role: item.author_role,
          initial,
        }
      })
    } else {
      list = defaultTestimonials.map((item) => ({
        ...item,
        initial: item.name.trim().charAt(0).toUpperCase() || "U",
      }))
    }

    const filledList: TestimonialData[] = []
    while (filledList.length < 9) {
      filledList.push(...list)
    }
    return filledList
  }, [testimonials, t])

  const firstColumn = formattedTestimonials.slice(0, 3)
  const secondColumn = formattedTestimonials.slice(3, 6)
  const thirdColumn = formattedTestimonials.slice(6, 9)

  const hasHeader = Boolean(title || badge || description)

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="w-full py-12 relative overflow-hidden bg-transparent"
    >
      <div className="content-container px-4 z-10 mx-auto">
        <div className="max-w-5xl mx-auto">
          {hasHeader && (
            <div className="mb-12">
              <BlockHeader
                title={title}
                badge={badge}
                description={description}
                style={headerStyle || "style-1"}
              />
            </div>
          )}

          <div
            className="flex justify-center gap-6 mt-6 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] max-h-[740px] overflow-hidden"
            role="region"
            aria-label="Scrolling Testimonials"
          >
            <TestimonialsColumn testimonials={firstColumn} duration={15} />
            <TestimonialsColumn
              testimonials={secondColumn}
              className="hidden md:block"
              duration={19}
            />
            <TestimonialsColumn
              testimonials={thirdColumn}
              className="hidden lg:block"
              duration={17}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
