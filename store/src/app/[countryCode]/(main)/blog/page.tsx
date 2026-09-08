import { getTranslations, getLocale } from "next-intl/server"
import { getBlogPosts, getBlogCategories } from "@lib/data/blog"
import { getUmamiViewMap } from "@lib/data/umami-views"
import BlogClientView from "@modules/blog/components/blog-client-views"
import { Suspense } from "react"
import SkeletonBlogPage from "@/modules/common/skeletons/templates/skeleton-blog-page"
import { isRtlLocale } from "@lib/util/is-rtl"

interface PageProps {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const t = await getTranslations("Pages")
  const defaultTitle = t("blog_title")
  const defaultDesc = t("blog_desc")

  return {
    title: defaultTitle,
    description: defaultDesc,
  }
}

export default function BlogPage(props: PageProps) {
  return (
    <Suspense fallback={<SkeletonBlogPage />}>
      <BlogContent params={props.params} />
    </Suspense>
  )
}

async function BlogContent(props: PageProps) {
  const { countryCode } = await props.params
  const locale = await getLocale()

  const [t, posts, fetchedCategories, viewMap] = await Promise.all([
    getTranslations("Blog"),
    getBlogPosts(),
    getBlogCategories(),
    getUmamiViewMap(),
  ])

  const isRtl = isRtlLocale(locale || countryCode)

  // Add "All" category at the beginning
  const categories = [
    { id: "all", name: t("all_topics") },
    ...fetchedCategories,
  ]

  // Attach views to posts
  const postsWithViews = posts.map((post) => ({
    ...post,
    views: viewMap[post.id] || 0,
  }))

  const translations = {
    title: t("title"),
    subtitle: t("subtitle"),
    featured: t("featured"),
    readTime: t("readTime", { time: "{time}" }),
    readMore: t("readMore"),
    topicsTitle: t("topicsTitle"),
    noPosts: t("noPosts"),
  }

  return (
    <main id="blog-main-container" className="min-h-screen bg-background">
      <BlogClientView
        posts={postsWithViews}
        categories={categories}
        isRtl={isRtl}
        translations={translations}
      />
    </main>
  )
}
