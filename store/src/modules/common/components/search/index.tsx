"use client"

import React, { useEffect, useState } from "react"
import { Hits, InstantSearch, SearchBox } from "react-instantsearch"
import { searchClient } from "../../../../lib/config"
import Modal from "../../../common/components/modal"
import Image from "next/image"
import { Search } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { usePathname } from "next/navigation"

interface Hit {
  id: string
  title: string
  description: string
  handle: string
  thumbnail: string
  categories: {
    id: string
    name: string
    handle: string
  }[]
  tags: {
    id: string
    value: string
  }[]
}

import { useSearchBox } from "react-instantsearch"

const ConditionalHits = () => {
  const { query } = useSearchBox()

  if (!query || query.trim() === "") {
    return (
      <div className="text-center mt-10 text-gray-500">
        Type something to search for products...
      </div>
    )
  }

  return <Hits hitComponent={Hit} />
}

export default function SearchModal({
  className,
  iconSize = 22,
}: { className?: string; iconSize?: number } = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={
          className ??
          "flex items-center justify-center text-black dark:text-white h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors p-0"
        }
        aria-label="Search"
      >
        <Search size={iconSize} />
      </button>
      <Modal isOpen={isOpen} close={() => setIsOpen(false)}>
        <InstantSearch
          searchClient={searchClient}
          indexName={process.env.NEXT_PUBLIC_MEILISEARCH_INDEX_NAME}
        >
          <SearchBox className="w-full [&_input]:w-[94%] [&_input]:outline-none [&_button]:w-[3%]" />
          <ConditionalHits />
        </InstantSearch>
      </Modal>
    </>
  )
}

const Hit = ({ hit }: { hit: Hit }) => {
  return (
    <div className="flex flex-row gap-x-2 mt-4 relative">
      <Image src={hit.thumbnail} alt={hit.title} width={100} height={100} />
      <div className="flex flex-col gap-y-1">
        <h3>{hit.title}</h3>
        <p className="text-sm text-gray-500">{hit.description}</p>
      </div>
      <LocalizedClientLink
        href={`/products/${hit.handle}`}
        className="absolute right-0 top-0 w-full h-full"
        aria-label={`View Product: ${hit.title}`}
      />
    </div>
  )
}
