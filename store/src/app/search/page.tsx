import Search from "@modules/common/components/search"

export const instant = false

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-[100px] md:min-h-[400px] relative p-4">
      <Search
        indexName="algolia_podcast_sample_dataset"
        attributes={{
          primaryText: "title",
          secondaryText: "description",
          tertiaryText: "itunesAuthor",
          image: "imageUrl",
          url: "url",
        }}
      />
    </div>
  )
}
