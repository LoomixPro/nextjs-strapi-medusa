"use client"

import React, { useState, useTransition } from "react"
import Image from "next/image"
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Eye,
} from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { cn } from "@lib/utils"
import { useTranslations } from "next-intl"

interface BlogClientViewProps {
  posts: BlogPost[]
  categories: { id: string; name: string }[]
  isRtl: boolean
  translations: {
    title: string
    subtitle: string
    featured: string
    readTime: string
    readMore: string
    topicsTitle: string
    noPosts: string
  }
}

export default function BlogClientView({
  posts,
  categories,
  isRtl,
  translations,
}: BlogClientViewProps) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [, startTransition] = useTransition()
  const t = useTranslations("Blog")

  // Find the featured post
  const featuredPost = posts.find((p) => p.featured)

  // Normal posts (non-featured or all if we're filtering)
  const regularPosts = posts.filter((p) => {
    const matchesCategory =
      activeCategory === "all" || p.category === activeCategory
    const matchesSearch =
      searchQuery === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(searchQuery.toLowerCase())

    const isFeaturedShown =
      featuredPost && activeCategory === "all" && searchQuery === ""
    const isExcluded = isFeaturedShown && p.id === featuredPost.id

    return matchesCategory && matchesSearch && !isExcluded
  })

  const handleCategoryChange = (categoryId: string) => {
    startTransition(() => {
      setActiveCategory(categoryId)
    })
  }

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
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-34">
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-6 md:mb-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase">
          <Sparkles size={12} className="animate-pulse" />
          <span>{t("journal_blog")}</span>
        </div>
      </div>

      {/* Toolbar: Categories & Search */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between border-b border-border pb-8 mb-12">
        {/* Categories list */}
        <div className="w-full md:w-auto max-w-full overflow-hidden">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 text-start md:text-start px-1 md:px-0">
            {translations.topicsTitle}
          </p>
          <div className="flex overflow-x-auto md:flex-wrap gap-2 md:gap-2.5 pb-3 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 justify-start [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={cn(
                    "whitespace-nowrap flex-shrink-0 px-4 py-2 md:px-4 md:py-2 rounded-full text-sm font-medium transition-all duration-300 border",
                    isActive
                      ? "bg-foreground text-background border-foreground shadow-md md:scale-105"
                      : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/30 border-border"
                  )}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <span
            className={cn(
              "absolute inset-y-0 flex items-center text-muted-foreground pointer-events-none",
              isRtl ? "right-4" : "left-4"
            )}
          >
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder={t("search_articles")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full h-11 bg-muted/30 hover:bg-muted/50 focus:bg-background rounded-full border border-border focus:border-foreground outline-none text-sm transition-all shadow-inner",
              isRtl ? "pr-11 pl-4 text-right" : "pl-11 pr-4 text-left"
            )}
          />
        </div>
      </div>

      {/* Featured Post - Only show when no category filter is active & search is empty */}
      {featuredPost && activeCategory === "all" && searchQuery === "" && (
        <div className="mb-16 group">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-card/65 rounded-[32px] border border-border/80 p-6 md:p-8 hover:shadow-2xl transition-all duration-500 hover:border-foreground/25">
            {/* Image container */}
            <div className="lg:col-span-7 aspect-[16/9] w-full overflow-hidden rounded-[24px] relative shadow-md">
              <Image
                src={featuredPost.coverImage}
                alt={featuredPost.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div
                className={cn(
                  "absolute top-4 bg-foreground text-background font-bold text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5",
                  isRtl ? "right-4" : "left-4"
                )}
              >
                <Sparkles size={12} className="text-yellow-400" />
                <span>{translations.featured}</span>
              </div>
            </div>

            {/* Info container */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary">
                  {categories.find((c) => c.id === featuredPost.category)
                    ?.name || featuredPost.category}
                </span>

                <LocalizedClientLink
                  href={`/blog/${featuredPost.id}`}
                  className="block group-hover:text-primary transition-colors"
                >
                  <h2 className="text-2xl md:text-3xl font-extrabold leading-tight text-foreground">
                    {featuredPost.title}
                  </h2>
                </LocalizedClientLink>

                <p className="text-muted-foreground text-sm md:text-base leading-relaxed font-normal">
                  {featuredPost.excerpt}
                </p>
              </div>

              {/* Author & Footer info */}
              <div className="flex items-center justify-between pt-6 border-t border-border/60">
                <div className="flex items-center gap-3">
                  <Image
                    src={featuredPost.author.avatar}
                    alt={featuredPost.author.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover border border-border"
                  />
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {featuredPost.author.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(featuredPost.publishedAt)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {translations.readTime.replace(
                          "{time}",
                          featuredPost.readTime
                        )}
                      </span>
                      {featuredPost.views !== undefined && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye size={12} />
                            {featuredPost.views.toLocaleString(
                              isRtl ? "fa-IR" : "en-US"
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <LocalizedClientLink
                  href={`/blog/${featuredPost.id}`}
                  className="flex items-center gap-1.5 text-sm font-bold text-foreground hover:text-primary transition-colors"
                >
                  <span>{translations.readMore}</span>
                  {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </LocalizedClientLink>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      {regularPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {regularPosts.map((post) => (
            <article
              key={post.id}
              className="flex flex-col bg-card rounded-[28px] border border-border/80 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-foreground/15 group"
            >
              {/* Cover Image */}
              <LocalizedClientLink
                href={`/blog/${post.id}`}
                className="aspect-[16/10] overflow-hidden relative block shadow-inner"
              >
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span
                  className={cn(
                    "absolute top-4 bg-background/80 backdrop-blur-md text-foreground font-semibold text-[10px] px-2.5 py-1 rounded-full border border-border shadow-md uppercase tracking-wider",
                    isRtl ? "right-4" : "left-4"
                  )}
                >
                  {categories.find((c) => c.id === post.category)?.name ||
                    post.category}
                </span>
              </LocalizedClientLink>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <LocalizedClientLink
                    href={`/blog/${post.id}`}
                    className="block group-hover:text-primary transition-colors"
                  >
                    <h3 className="text-lg md:text-xl font-bold leading-snug line-clamp-2 text-foreground">
                      {post.title}
                    </h3>
                  </LocalizedClientLink>
                  <p className="text-muted-foreground text-xs md:text-sm line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Image
                      src={post.author.avatar}
                      alt={post.author.name}
                      width={32}
                      height={32}
                      className="rounded-full object-cover border border-border"
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {post.author.name}
                      </p>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span>{formatDate(post.publishedAt)}</span>
                        {post.views !== undefined && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Eye size={10} />
                              {post.views.toLocaleString(
                                isRtl ? "fa-IR" : "en-US"
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <LocalizedClientLink
                    href={`/blog/${post.id}`}
                    className="flex items-center gap-1 text-xs font-bold text-foreground group-hover:text-primary transition-colors"
                  >
                    <span>{translations.readMore}</span>
                    {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                  </LocalizedClientLink>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/10 border border-dashed border-border rounded-3xl max-w-lg mx-auto">
          <p className="text-muted-foreground font-semibold text-base mb-2">
            {translations.noPosts}
          </p>
        </div>
      )}
    </div>
  )
}
