import { BlogPostsBlock as BlogPostsBlockType } from "@lib/data/homepage"
import BlogPostsBlockUI from "@modules/home/components/BlogPostsBlock"

interface BlogPostsBlockProps {
  block: BlogPostsBlockType
}

export default function BlogPostsBlock({ block }: BlogPostsBlockProps) {
  return <BlogPostsBlockUI block={block} />
}
