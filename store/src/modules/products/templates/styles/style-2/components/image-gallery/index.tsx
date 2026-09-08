"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { cn } from "@lib/utils"
import { useTranslations } from "next-intl"

interface ImageGalleryProps {
  images: HttpTypes.StoreProductImage[]
}

export default function ImageGalleryStyle2({ images }: ImageGalleryProps) {
  const t = useTranslations("Product.gallery")
  const [mainImage, setMainImage] = useState(images[0]?.url)

  useEffect(() => {
    if (images.length > 0) {
      setMainImage(images[0].url)
    }
  }, [images])

  if (!images.length) return null

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
        {images.map((img, index) => (
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
