"use client"

import { useState, useEffect, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import { Container } from "@medusajs/ui"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { resolveVariantImages } from "@lib/util/product"

interface ImageGalleryProps {
  images: HttpTypes.StoreProductImage[]
  product?: HttpTypes.StoreProduct
}

const ImageGallery = ({ images, product }: ImageGalleryProps) => {
  const searchParams = useSearchParams()
  const [activeVariantId, setActiveVariantId] = useState<string | null>(() =>
    searchParams.get("v_id")
  )

  useEffect(() => {
    const urlVId = searchParams.get("v_id")
    if (urlVId) {
      setActiveVariantId(urlVId)
    }
  }, [searchParams])

  useEffect(() => {
    const handleVariantChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ variantId: string }>
      if (customEvent.detail?.variantId) {
        setActiveVariantId(customEvent.detail.variantId)
      }
    }

    window.addEventListener("product:variant-change", handleVariantChange)
    return () => {
      window.removeEventListener("product:variant-change", handleVariantChange)
    }
  }, [])

  const galleryImages = useMemo(() => {
    return resolveVariantImages(product, activeVariantId, images)
  }, [product, activeVariantId, images])

  return (
    <div className="flex items-start relative">
      <div className="flex flex-col flex-1 small:mx-16 gap-y-4">
        {galleryImages.map((image, index) => {
          return (
            <Container
              key={image.id}
              className="relative aspect-[29/34] w-full overflow-hidden bg-ui-bg-subtle"
              id={image.id}
            >
              {!!image.url && (
                <Image
                  src={image.url}
                  priority={index <= 2 ? true : false}
                  className="absolute inset-0 rounded-rounded"
                  alt={`Product image ${String(index + 1)}`}
                  fill
                  sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
                  style={{
                    objectFit: "cover",
                  }}
                />
              )}
            </Container>
          )
        })}
      </div>
    </div>
  )
}

export default ImageGallery
