"use client"

import React from "react"
import { Calendar, Clock, ArrowLeft } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { useTranslations } from "next-intl"
import BlockHeader from "@modules/common/components/block-header"

/**
 * Guide for creating a new Blog Block style
 *
 * This component acts as a UI block to display a list of recent or featured blog posts
 * (typically on the homepage or landing pages).
 * If you intend to create a new style (e.g., style-3), you must consider the following:
 *
 * 1. Received Data (Props):
 *    - `title`: The main heading for the blog block (e.g., "Latest News").
 *    - `subtitle`: A descriptive subtitle displayed under or above the main heading.
 *    - `posts`: An array of blog post objects. Each post usually contains an `id`, `title`,
 *      `summary`/`excerpt`, `publishedAt`, `readTime`, `coverImage`, and `slug`.
 *
 * 2. Component Structure:
 *    - Header section: Renders the `title` and `subtitle`.
 *    - Posts Grid/List: Iterates over the `posts` array and renders individual post cards.
 *
 * 3. Handling Dates and Locales:
 *    - You might need to format dates (e.g., using `Intl.DateTimeFormat` or a library like `date-fns`)
 *      depending on the locale. The current style uses Persian (fa-IR) formatting as an example.
 *
 * 4. Final Output (Return):
 *    Your component should return a JSX section containing the stylized blog posts layout. Ensure
 *    that you use standard responsive design classes (e.g., `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
 *    so the block integrates cleanly into any page container.
 */
export default function Style1({
  title,
  badge,
  description,
  headerStyle,
  posts,
}: BlogBlockProps) {
  const t = useTranslations("Blog")
  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  const hasHeader = Boolean(title || badge || description)

  return (
    <section className="bg-transparent text-ui-fg-base w-full overflow-hidden">
      <div className="content-container">
        {hasHeader && (
          <BlockHeader
            title={title}
            badge={badge}
            description={description}
            linkText={t("viewAll")}
            linkHref="/blog"
            style={headerStyle || "style-1"}
          />
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col bg-card rounded-[24px] border border-border overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1.5 transition-all duration-500 ease-out"
            >
              {/* Cover Image */}
              <LocalizedClientLink
                href={`/blog/${post.id}`}
                className="aspect-[16/10] overflow-hidden relative block"
              >
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 end-4 bg-secondary/90 backdrop-blur-sm text-secondary-foreground font-bold text-[10px] px-3 py-1 rounded-full border border-border shadow-sm uppercase tracking-wider">
                  {post.category}
                </span>
              </LocalizedClientLink>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <LocalizedClientLink
                    href={`/blog/${post.id}`}
                    className="block"
                  >
                    <h3 className="text-lg font-bold leading-snug line-clamp-2 text-card-foreground group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                  </LocalizedClientLink>
                  <p className="text-muted-foreground text-[13px] line-clamp-3 leading-relaxed font-light">
                    {post.excerpt}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Image
                      src={post.author.avatar}
                      alt={post.author.name}
                      width={32}
                      height={32}
                      className="rounded-full object-cover border border-border"
                    />
                    <div>
                      <p className="text-xs font-semibold text-card-foreground/90">
                        {post.author.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/80 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {formatDate(post.publishedAt)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  <LocalizedClientLink
                    href={`/blog/${post.id}`}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:opacity-80 transition-colors group/link"
                  >
                    <span>{t("readMore")}</span>
                    <ArrowLeft
                      size={14}
                      className="rtl:rotate-0 ltr:rotate-180 rtl:group-hover/link:-translate-x-1 ltr:group-hover/link:translate-x-1 transition-transform"
                    />
                  </LocalizedClientLink>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
