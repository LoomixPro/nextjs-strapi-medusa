import React from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations, getLocale } from "next-intl/server"
import Image from "next/image"
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  getBlogPostById,
  getBlogPosts,
  getBlogCategories,
} from "@lib/data/blog"
import {
  AdPromoBox,
  BlogVideoPlayer,
} from "@modules/blog/components/blog-detail-client"
import { getBaseURL } from "@lib/util/env"
import { cn } from "@lib/utils"
import { Suspense } from "react"
import SkeletonBlogPost from "@/modules/common/skeletons/templates/skeleton-blog-post"
import { isRtlLocale } from "@lib/util/is-rtl"

interface PageProps {
  params: Promise<{ countryCode: string; id: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id, countryCode } = await props.params
  const post = await getBlogPostById(id)
  if (!post) return {}

  const baseUrl = getBaseURL()
  const canonicalUrl = `${baseUrl}/${countryCode}/blog/${id}`

  return {
    title: `${post.title}`,
    description: post.excerpt,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: canonicalUrl,
      images: post.coverImage
        ? [{ url: post.coverImage, alt: post.title }]
        : [],
      type: "article",
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [post.coverImage] : [],
    },
  }
}

export default function BlogPostDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<SkeletonBlogPost />}>
      <BlogPostDetailContent params={props.params} />
    </Suspense>
  )
}

async function BlogPostDetailContent(props: PageProps) {
  const { countryCode, id } = await props.params
  const [t, locale] = await Promise.all([getTranslations("Blog"), getLocale()])
  const isRtl = isRtlLocale(locale || countryCode)

  // Fetch individual article from Strapi CMS
  const post = await getBlogPostById(id)
  if (!post) {
    return notFound()
  }

  const baseUrl = getBaseURL()
  const articleUrl = `${baseUrl}/${countryCode}/blog/${post.id}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? [post.coverImage] : [],
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author?.name || "Editorial Team",
    },
    publisher: {
      "@type": "Organization",
      name: "LuxuryShop",
      url: baseUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
  }

  // Map category code to display name based on current layout language
  const categories = await getBlogCategories()
  const categoryDisplayName =
    categories.find((c) => c.id === post.category)?.name || post.category

  // Fetch all posts to determine related reads
  const allPosts = await getBlogPosts()
  const relatedPosts = allPosts.filter((p) => p.id !== post.id).slice(0, 2)

  // Dynamically format ISO publishedAt timestamp to local calendar dates
  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat(isRtl ? "fa-IR" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article
        id={`blog-post-${post.id}`}
        className="min-h-screen bg-background pt-24 md:pt-32 pb-10 md:pb-16"
      >
        <div className="max-w-[850px] mx-auto px-4 sm:px-6">
          {/* Back Link Breadcrumb */}
          <div className="mb-6">
            <LocalizedClientLink
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
            >
              {isRtl ? (
                <>
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                  <span>{t("backToBlog")}</span>
                </>
              ) : (
                <>
                  <ArrowLeft
                    size={16}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                  <span>{t("backToBlog")}</span>
                </>
              )}
            </LocalizedClientLink>
          </div>

          {/* Article Header */}
          <header className="space-y-6 mb-10 text-start">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
              {categoryDisplayName}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
              {post.title}
            </h1>

            {/* Author Meta */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-y border-border/60 py-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover border border-border"
                />
                <div>
                  <p className="font-bold text-foreground">
                    {post.author.name}
                  </p>
                  <p className="text-xs">{t("journal_author")}</p>
                </div>
              </div>

              <div
                className={cn(
                  "hidden sm:block h-6 w-px bg-border",
                  isRtl ? "mr-4" : "ml-4"
                )}
              />

              <div className="flex items-center gap-1.5">
                <Calendar size={16} />
                <span>{formatDate(post.publishedAt)}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock size={16} />
                <span>{t("readTime", { time: post.readTime })}</span>
              </div>
            </div>
          </header>

          {/* Article Cover Image */}
          <div className="mb-10 aspect-[16/9] overflow-hidden rounded-[28px] shadow-lg border border-border/40 relative">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          </div>

          {/* Article Blocks Loop */}
          <section className="prose prose-lg dark:prose-invert max-w-none mb-16 text-start">
            {post.blocks.map((block: BlogPostBlock, idx: number) => {
              switch (block.type) {
                case "heading":
                  return (
                    <h2
                      key={idx}
                      className="text-2xl sm:text-3xl font-black text-foreground mt-8 mb-4 tracking-tight border-r-4 border-primary pr-3 leading-snug"
                      style={{ direction: isRtl ? "rtl" : "ltr" }}
                    >
                      {block.title}
                    </h2>
                  )

                case "text":
                  return (
                    <p
                      key={idx}
                      className="text-foreground/80 dark:text-foreground/90 leading-relaxed text-base sm:text-lg mb-6 whitespace-pre-line font-normal"
                      style={{ direction: isRtl ? "rtl" : "ltr" }}
                    >
                      {block.content}
                    </p>
                  )

                case "image":
                  if (!block.imageUrl) return null
                  return (
                    <figure key={idx} className="my-8 space-y-2 text-center">
                      <Image
                        src={block.imageUrl}
                        alt={block.imageAlt || "Article Image"}
                        width={1200}
                        height={800}
                        className="rounded-2xl max-h-[450px] w-full object-cover shadow-md"
                      />
                      {block.caption && (
                        <figcaption className="text-xs text-muted-foreground font-medium italic">
                          {block.caption}
                        </figcaption>
                      )}
                    </figure>
                  )

                case "image-text-split":
                  if (!block.imageUrl) return null
                  const isLeft = block.align === "left"
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "my-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center rounded-3xl border border-border/40 bg-muted/10 p-5 md:p-6",
                        isLeft ? "md:flex-row-reverse" : ""
                      )}
                      style={{ direction: isRtl ? "rtl" : "ltr" }}
                    >
                      <div
                        className={cn(
                          "space-y-3",
                          isLeft ? "md:order-2" : "md:order-1"
                        )}
                      >
                        <h3 className="text-xl font-bold text-foreground">
                          {block.title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {block.content}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "overflow-hidden rounded-2xl aspect-[4/3] shadow-inner relative",
                          isLeft ? "md:order-1" : "md:order-2"
                        )}
                      >
                        <Image
                          src={block.imageUrl}
                          alt={block.imageAlt || "Split image"}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )

                case "video":
                  return (
                    <BlogVideoPlayer
                      key={idx}
                      videoUrl={block.videoUrl || ""}
                      posterUrl={block.imageUrl}
                      altText={block.imageAlt}
                    />
                  )

                case "ad":
                  return (
                    <AdPromoBox
                      key={idx}
                      title={block.title || ""}
                      content={block.content || ""}
                      code={block.adCode}
                      link={block.adLink}
                      buttonText={block.adButtonText || t("explore_products")}
                      sponsoredText={t("sponsored_badge")}
                      isRtl={isRtl}
                    />
                  )

                default:
                  return null
              }
            })}
          </section>

          {/* Related Reads Section */}
          {relatedPosts.length > 0 && (
            <footer className="pt-12 border-t border-border">
              <h3 className="text-xl font-extrabold text-foreground mb-8 text-start">
                {t("relatedTitle")}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {relatedPosts.map((rPost) => (
                  <LocalizedClientLink
                    key={rPost.id}
                    href={`/blog/${rPost.id}`}
                    className="flex gap-4 p-4 rounded-2xl border border-border/80 bg-card hover:shadow-md transition-shadow group text-start"
                  >
                    <div className="w-24 h-24 shrink-0 overflow-hidden rounded-xl bg-muted relative">
                      <Image
                        src={rPost.coverImage}
                        alt={rPost.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex flex-col justify-between py-1">
                      <h4 className="text-sm font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {rPost.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(rPost.publishedAt)}
                      </span>
                    </div>
                  </LocalizedClientLink>
                ))}
              </div>
            </footer>
          )}
        </div>
      </article>
    </>
  )
}
