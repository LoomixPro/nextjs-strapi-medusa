"use client"

import React, { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { ArrowLeft, Star } from "lucide-react"
import { cn } from "@lib/utils"
import type { TestimonialItem } from "@lib/data/homepage"
import BlockHeader from "@modules/common/components/block-header"
import { useTranslations } from "next-intl"

export interface Style3Props {
  title?: string
  badge?: string
  description?: string
  headerStyle?: string
  testimonials?: TestimonialItem[]
}

const SQRT_5000 = Math.sqrt(5000)

const getStrapiMediaUrl = (url?: string) => {
  if (!url) return null
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337"
  return `${baseUrl}${url}`
}

const defaultTestimonials = [
  {
    testimonial:
      "The best solution we found in the market. Our team's speed has increased 5x.",
    authorName: "John Doe",
    by: "John Doe, CEO of TechCorp",
    imgSrc: "https://i.pravatar.cc/150?img=1",
    initial: "J",
    rating: 5,
  },
  {
    testimonial:
      "Data security was our top priority and this system has exceeded our expectations.",
    authorName: "Daniel Craig",
    by: "Daniel Craig, CTO of SecureNet",
    imgSrc: "https://i.pravatar.cc/150?img=2",
    initial: "D",
    rating: 5,
  },
  {
    testimonial:
      "Before this platform, we had a lot of issues managing orders. It's truly amazing!",
    authorName: "Sarah Jenkins",
    by: "Sarah Jenkins, Operations Manager",
    imgSrc: "https://i.pravatar.cc/150?img=3",
    initial: "S",
    rating: 5,
  },
  {
    testimonial:
      "Planning for the future of our business has become incredibly fast and accurate. Highly recommended.",
    authorName: "Mary Smith",
    by: "Mary Smith, CFO of FutureBuilders",
    imgSrc: "https://i.pravatar.cc/150?img=4",
    initial: "M",
    rating: 4,
  },
  {
    testimonial:
      "If I could give more than 5 stars, I definitely would. Unparalleled support.",
    authorName: "Amir N.",
    by: "Amir N., Creative Design Lead",
    imgSrc: "https://i.pravatar.cc/150?img=5",
    initial: "A",
    rating: 5,
  },
]

interface TestimonialCardProps {
  position: number
  testimonial: {
    tempId: number | string
    testimonial: string
    authorName: string
    by: string
    imgSrc: string | null
    initial: string
    rating: number
  }
  handleMove: (steps: number) => void
  cardSize: number
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  position,
  testimonial,
  handleMove,
  cardSize,
}) => {
  const isCenter = position === 0

  return (
    <div
      onClick={() => handleMove(position)}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-pointer border-2 p-8 transition-all duration-500 ease-in-out select-none",
        isCenter
          ? "z-10 bg-primary text-primary-foreground border-primary"
          : "z-0 bg-card text-card-foreground border-border hover:border-primary/50"
      )}
      style={{
        width: cardSize,
        height: cardSize,
        clipPath: `polygon(50px 0%, calc(100% - 50px) 0%, 100% 50px, 100% 100%, calc(100% - 50px) 100%, 50px 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%) 
          translateX(${(cardSize / 1.5) * position}px)
          translateY(${isCenter ? -65 : position % 2 ? 15 : -15}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter
          ? "0px 8px 0px 4px hsl(var(--border))"
          : "0px 0px 0px 0px transparent",
      }}
    >
      <span
        className="absolute block origin-top-right rotate-45 bg-border pointer-events-none"
        style={{
          right: -2,
          top: 48,
          width: SQRT_5000,
          height: 2,
        }}
      />

      {/* Header Row: Avatar / Initial + Star Rating */}
      <div className="flex items-center justify-between mb-4">
        {testimonial.imgSrc ? (
          <Image
            src={testimonial.imgSrc}
            alt={testimonial.authorName}
            width={48}
            height={56}
            className="h-14 w-12 bg-muted object-cover object-top"
            style={{
              boxShadow: "3px 3px 0px hsl(var(--background))",
            }}
            unoptimized
          />
        ) : (
          <div
            className={cn(
              "h-14 w-12 flex items-center justify-center font-bold text-xl border",
              isCenter
                ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
                : "bg-muted text-foreground border-border"
            )}
            style={{
              boxShadow: "3px 3px 0px hsl(var(--background))",
            }}
          >
            {testimonial.initial}
          </div>
        )}

        {/* Rating Stars */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Star
              key={idx}
              className={cn(
                "w-4 h-4",
                idx < testimonial.rating
                  ? isCenter
                    ? "text-amber-300 fill-amber-300"
                    : "text-amber-400 fill-amber-400"
                  : isCenter
                    ? "text-primary-foreground/30 fill-primary-foreground/10"
                    : "text-muted-foreground/30 fill-muted/20"
              )}
            />
          ))}
        </div>
      </div>

      {/* Testimonial Quote */}
      <h3
        className={cn(
          "text-base sm:text-xl font-medium line-clamp-4 leading-relaxed",
          isCenter ? "text-primary-foreground" : "text-foreground"
        )}
      >
        &ldquo;{testimonial.testimonial}&rdquo;
      </h3>

      {/* Author Name & Role */}
      <p
        className={cn(
          "absolute bottom-8 left-8 right-8 mt-2 text-sm italic truncate",
          isCenter ? "text-primary-foreground/80" : "text-muted-foreground"
        )}
      >
        - {testimonial.by}
      </p>
    </div>
  )
}

export default function Style3({
  title,
  badge,
  description,
  headerStyle,
  testimonials = [],
}: Style3Props) {
  const t = useTranslations("HomePage")

  const initialList = useMemo(() => {
    let rawList: Array<{
      testimonial: string
      authorName: string
      by: string
      imgSrc: string | null
      initial: string
      rating: number
    }> = []

    if (testimonials && testimonials.length > 0) {
      rawList = testimonials.map((item, index) => {
        const avatarUrl = getStrapiMediaUrl(item.avatar?.url)
        const authorName =
          item.author_name || t("showcase.customer") || "Customer"
        const firstLetter = authorName.trim().charAt(0).toUpperCase() || "U"
        const by = item.author_role
          ? `${authorName}, ${item.author_role}`
          : authorName
        const rating = item.rating ? Math.min(Math.max(item.rating, 1), 5) : 5

        return {
          testimonial: item.content,
          authorName,
          by,
          imgSrc: avatarUrl,
          initial: firstLetter,
          rating,
        }
      })
    } else {
      rawList = defaultTestimonials
    }

    // In the original stagger component, 20 items are used so that
    // the unmounted/shifted items are pushed completely off-screen (> 2000px away)
    // and never seen popping across the screen.
    let fullList: Array<{
      tempId: number | string
      testimonial: string
      authorName: string
      by: string
      imgSrc: string | null
      initial: string
      rating: number
    }> = []

    const targetLength = 20
    for (let i = 0; i < targetLength; i++) {
      const baseItem = rawList[i % rawList.length]
      fullList.push({
        ...baseItem,
        tempId: i,
      })
    }

    return fullList
  }, [testimonials, t])

  const [cardSize, setCardSize] = useState(365)
  const [testimonialsList, setTestimonialsList] = useState(initialList)

  useEffect(() => {
    setTestimonialsList(initialList)
  }, [initialList])

  const handleMove = (steps: number) => {
    const newList = [...testimonialsList]
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = newList.shift()
        if (!item) return
        newList.push({ ...item, tempId: Math.random() })
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = newList.pop()
        if (!item) return
        newList.unshift({ ...item, tempId: Math.random() })
      }
    }
    setTestimonialsList(newList)
  }

  useEffect(() => {
    const updateSize = () => {
      const { matches } = window.matchMedia("(min-width: 640px)")
      setCardSize(matches ? 365 : 290)
    }

    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [])

  const hasHeader = Boolean(title || badge || description)

  return (
    <section className="w-full py-6 overflow-hidden">
      <div className="content-container overflow-hidden">
        {hasHeader && (
          <div className="mb-6 sm:mb-8">
            <BlockHeader
              title={title}
              badge={badge}
              description={description}
              style={headerStyle || "style-1"}
            />
          </div>
        )}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: 600 }}
        >
          {/* Soft edge fade gradients for seamless overflow on both sides */}
          <div className="absolute top-0 bottom-0 left-0 w-12 sm:w-24 md:w-36 bg-gradient-to-r from-background via-background/60 to-transparent pointer-events-none z-10 transition-opacity duration-300" />
          <div className="absolute top-0 bottom-0 right-0 w-12 sm:w-24 md:w-36 bg-gradient-to-l from-background via-background/60 to-transparent pointer-events-none z-10 transition-opacity duration-300" />

          {testimonialsList.map((testimonial, index) => {
            const position =
              testimonialsList.length % 2
                ? index - (testimonialsList.length + 1) / 2
                : index - testimonialsList.length / 2

            return (
              <TestimonialCard
                key={testimonial.tempId}
                testimonial={testimonial}
                handleMove={handleMove}
                position={position}
                cardSize={cardSize}
              />
            )
          })}
          {/* Minimal Glowing Optical Pill Navigation */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center justify-center z-20">
            <div className="relative group/pill inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-card/40 backdrop-blur-xl border border-primary/20 shadow-[0_0_25px_-5px_rgba(var(--primary),0.3)] hover:border-primary/40 transition-all duration-500 select-none">
              {/* Dynamic ambient backlight */}
              <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 blur-lg opacity-70 animate-pulse pointer-events-none" />

              {/* Left interactive arrow button */}
              <button
                type="button"
                onClick={() => handleMove(-1)}
                aria-label="Previous testimonial"
                className="flex items-center gap-1 p-1 -m-1 rounded-full transition-all duration-300 text-primary hover:scale-110 active:scale-90 cursor-pointer opacity-85 hover:opacity-100 focus-visible:outline-none"
              >
                <span className="w-3 sm:w-5 h-[1.5px] rounded-full bg-gradient-to-r from-transparent to-primary shadow-[0_0_6px_currentColor]" />
                <ArrowLeft className="w-3.5 h-3.5 -ms-1 text-primary drop-shadow-[0_0_8px_currentColor] transition-transform group-hover/pill:-translate-x-0.5" />
              </button>

              {/* Center glowing optical bead */}
              <div className="relative flex items-center justify-center px-1">
                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_3px_currentColor] text-primary" />
                <span className="absolute w-4 h-4 rounded-full bg-primary/30 animate-ping" />
              </div>

              {/* Right interactive arrow button */}
              <button
                type="button"
                onClick={() => handleMove(1)}
                aria-label="Next testimonial"
                className="flex items-center gap-1 p-1 -m-1 rounded-full transition-all duration-300 text-primary hover:scale-110 active:scale-90 cursor-pointer opacity-85 hover:opacity-100 focus-visible:outline-none"
              >
                <ArrowLeft className="w-3.5 h-3.5 -me-1 rotate-180 text-primary drop-shadow-[0_0_8px_currentColor] transition-transform group-hover/pill:translate-x-0.5" />
                <span className="w-3 sm:w-5 h-[1.5px] rounded-full bg-gradient-to-l from-transparent to-primary shadow-[0_0_6px_currentColor]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
