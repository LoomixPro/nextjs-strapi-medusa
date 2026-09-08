import React from "react"
import { Calendar, Clock, ArrowLeft } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { useTranslations } from "next-intl"
import BlockHeader from "@modules/common/components/block-header"

export default function Style2({
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
    <section className="w-full overflow-hidden">
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

        {/* List of Rows */}
        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group grid grid-cols-1 md:grid-cols-12 gap-6 p-5 bg-card rounded-2xl border border-border hover:shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.15)] transition-all duration-300 ease-in-out"
            >
              {/* Cover Image */}
              <LocalizedClientLink
                href={`/blog/${post.id}`}
                className="md:col-span-4 aspect-[16/10] overflow-hidden rounded-xl relative block"
              >
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </LocalizedClientLink>

              {/* Card Body */}
              <div className="md:col-span-8 flex flex-col justify-between py-1">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {post.category}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
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

                  <LocalizedClientLink
                    href={`/blog/${post.id}`}
                    className="block hover:text-primary transition-colors"
                  >
                    <h3 className="text-lg font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                  </LocalizedClientLink>
                  <p className="text-muted-foreground text-[13px] line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                {/* Footer details */}
                <div className="pt-4 border-t border-border flex items-center justify-between mt-4 md:mt-0">
                  <div className="flex items-center gap-2.5">
                    <Image
                      src={post.author.avatar}
                      alt={post.author.name}
                      width={28}
                      height={28}
                      className="rounded-full object-cover border border-border"
                    />
                    <span className="text-xs font-semibold text-foreground">
                      {post.author.name}
                    </span>
                  </div>

                  <LocalizedClientLink
                    href={`/blog/${post.id}`}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/70 transition-colors group/link"
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
