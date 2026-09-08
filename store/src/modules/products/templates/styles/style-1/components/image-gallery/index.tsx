"use client"

import { useEffect, useState, memo } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@modules/common/components/shadcn/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@modules/common/components/shadcn/carousel"
import { cn } from "@lib/utils"
import { useImageZoom } from "@lib/hooks/use-image-zoom"
import { HttpTypes } from "@medusajs/types"

interface ImageGalleryV2Props {
  images:
    HttpTypes.StoreProductImage[] | HttpTypes.StoreProductVariant["images"]
}

const Controls = ({
  zoomIn,
  zoomOut,
  reset,
  scale,
}: {
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  scale: number
}) => (
  <div className="absolute bottom-4 right-4 flex gap-2 z-20 bg-black/50 backdrop-blur-sm rounded-lg p-1.5">
    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation()
        zoomIn()
      }}
      className="h-7 w-7 p-0 text-white hover:bg-white/20"
      disabled={scale >= 4}
    >
      <ZoomIn className="h-4 w-4" />
    </Button>

    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation()
        zoomOut()
      }}
      className="h-7 w-7 p-0 text-white hover:bg-white/20"
      disabled={scale <= 1}
    >
      <ZoomOut className="h-4 w-4" />
    </Button>

    <Button
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation()
        reset()
      }}
      className="h-7 w-7 p-0 text-white hover:bg-white/20"
      disabled={scale === 1}
    >
      <span className="text-[10px] font-bold">1:1</span>
    </Button>
  </div>
)

// Cache of already-loaded image URLs to prevent blur re-appearing on re-render/resize
const loadedUrls = new Set<string>()

function ZoomableImage({
  url,
  alt,
  index: _index,
  priority = false,
  isActive,
}: {
  url: string
  alt: string
  index: number
  priority?: boolean
  isActive: boolean
}) {
  const [loaded, setLoaded] = useState(() => loadedUrls.has(url))
  const [prevUrl, setPrevUrl] = useState(url)

  // When URL changes, check if already loaded from cache
  if (url !== prevUrl) {
    setPrevUrl(url)
    setLoaded(loadedUrls.has(url))
  }

  const handleLoad = () => {
    loadedUrls.add(url)
    setLoaded(true)
  }

  const { scale, position, containerRef, handlers, controls } =
    useImageZoom(isActive)

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-ui-bg-subtle"
    >
      <div
        {...handlers}
        className="relative w-full h-full cursor-grab active:cursor-grabbing select-none"
        style={{
          transform: `scale(${String(scale)}) translate(${String(
            position.x / scale
          )}px, ${String(position.y / scale)}px)`,
          transition: scale === 1 ? "transform 0.3s ease" : "none",
        }}
      >
        <Image
          alt={alt}
          src={url}
          fill
          priority={priority}
          draggable={false}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={cn(
            "object-contain transition-[filter] duration-700 ease-in-out bg-ui-bg-subtle",
            !loaded ? "blur-2xl" : "blur-0"
          )}
          onLoad={handleLoad}
        />
      </div>
      <Controls {...controls} scale={scale} />
    </div>
  )
}

function ImageGalleryV2({ images = [] }: ImageGalleryV2Props) {
  const [prevImages, setPrevImages] = useState(images)
  const [activeTab, setActiveTab] = useState(0)
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const t = useTranslations("Product.gallery")

  // Synchronous reset when images set changes to prevent double-render flicker
  if (images !== prevImages) {
    setPrevImages(images)
    setActiveTab(0)
    setCurrent(0)
    api?.scrollTo(0)
  }

  useEffect(() => {
    if (!api) return
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  if (!images?.length) {
    return (
      <div className="flex items-center justify-center aspect-[29/34] w-full bg-ui-bg-subtle rounded-rounded">
        <p className="text-ui-fg-muted">{t("no_images")}</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Desktop Gallery */}
      <div className="hidden md:flex gap-4">
        {/* Thumbnails */}
        <div className="flex flex-col h-[600px] w-20 gap-2 overflow-y-auto scrollbar-hide flex-shrink-0">
          {images.map((image, index) => (
            <button
              key={image.id || index}
              onClick={() => setActiveTab(index)}
              className={cn(
                "w-full aspect-[3/4] p-1 rounded-md border transition-all overflow-hidden bg-ui-bg-subtle",
                activeTab === index
                  ? "border-ui-border-strong shadow-sm"
                  : "border-transparent hover:border-ui-border-base"
              )}
            >
              <div className="relative w-full h-full">
                <Image
                  src={image.url || ""}
                  fill
                  sizes="80px"
                  className="object-cover"
                  alt={t("thumbnail_alt", { index: index + 1 })}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Main Image */}
        <div className="flex-1 aspect-[3/4] relative bg-ui-bg-subtle rounded-rounded overflow-hidden shadow-sm border border-ui-border-base">
          <ZoomableImage
            url={images[activeTab]?.url || ""}
            alt={t("product_image_alt", { index: activeTab + 1 })}
            index={activeTab}
            priority
            isActive={true}
          />
        </div>
      </div>

      {/* Mobile Gallery (Carousel) */}
      <div className="md:hidden flex flex-col pt-2">
        <Carousel
          setApi={setApi}
          opts={{ align: "start", loop: true }}
          className="w-full"
        >
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={image.id || index}>
                <div className="aspect-[4/5] relative bg-ui-bg-subtle overflow-hidden">
                  <ZoomableImage
                    url={image.url || ""}
                    alt={t("product_image_alt", { index: index + 1 })}
                    index={index}
                    priority={index === 0}
                    isActive={current === index}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Indicators */}
        <div className="flex justify-center gap-1.5 mt-4 pb-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                current === index
                  ? "w-6 bg-ui-fg-base"
                  : "w-1.5 bg-ui-bg-strong hover:bg-ui-fg-muted"
              )}
              aria-label={t("go_to_image", { index: index + 1 })}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(ImageGalleryV2)
