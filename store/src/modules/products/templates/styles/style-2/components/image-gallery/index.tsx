"use client"

import { useState, useEffect, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { cn } from "@lib/utils"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { resolveVariantImages } from "@lib/util/product"

interface ImageGalleryProps {
  images: HttpTypes.StoreProductImage[]
  product?: HttpTypes.StoreProduct
}

export default function ImageGalleryStyle2({
  images,
  product,
}: ImageGalleryProps) {
  const t = useTranslations("Product.gallery")
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

  const [mainImage, setMainImage] = useState(galleryImages[0]?.url)

  useEffect(() => {
    if (galleryImages.length > 0) {
      setMainImage(galleryImages[0].url)
    }
  }, [galleryImages])

  if (!galleryImages.length) return null

  return (
    <div className="sticky top-8">
      <div className="rounded-lg overflow-hidden border border-border/50 shadow-sm mb-4 aspect-square relative bg-background">
        {mainImage && (
          <Image
            src={mainImage}
            alt={t("product_image_alt", { index: 1 })}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
      </div>
      <div className="grid grid-cols-6 gap-2">
        {galleryImages.map((img, index) => (
          <button
            key={img.id}
            onClick={() => setMainImage(img.url)}
            className={cn(
              "cursor-pointer rounded border-2 p-1 overflow-hidden transition-all relative aspect-square bg-background",
              mainImage === img.url
                ? "border-primary"
                : "border-border/50 hover:border-border"
            )}
          >
            <Image
              src={img.url}
              alt={t("thumbnail_alt", { index: index + 1 })}
              fill
              className="object-contain"
              sizes="100px"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
