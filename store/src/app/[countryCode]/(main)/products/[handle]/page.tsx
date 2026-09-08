import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listProducts, getProductReviews } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"
import { getBaseURL } from "@lib/util/env"
import { Suspense } from "react"
import SkeletonProductPage from "@/modules/common/skeletons/templates/skeleton-product-page"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions(true).then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes || countryCodes.length === 0) {
      return [{ countryCode: "default", handle: "default" }]
    }

    const promises = countryCodes.map(async (country) => {
      const { response } = await listProducts({
        countryCode: country,
        queryParams: { limit: 100, fields: "handle" },
        disableAuth: true,
      })

      return {
        country,
        products: response.products,
      }
    })

    const countryProducts = await Promise.all(promises)

    const staticParams = countryProducts
      .flatMap(
        (countryData) =>
          countryData.products?.map((product) => ({
            countryCode: countryData.country,
            handle: product.handle,
          })) || []
      )
      .filter((param) => param.handle)

    if (staticParams.length === 0) {
      return [{ countryCode: "default", handle: "default" }]
    }

    return staticParams
  } catch (error) {
    console.warn(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return [{ countryCode: "default", handle: "default" }]
  }
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string
) {
  if (!product.variants?.length) {
    return product.images
  }

  // 1. Identify the target variant (the selected one OR the first one by default)
  const targetVariant = selectedVariantId
    ? product.variants.find((v) => v.id === selectedVariantId)
    : product.variants[0]

  if (!targetVariant) {
    return product.images
  }

  // 2. If the target variant has images, display them
  if (targetVariant.images?.length) {
    const imageIdsMap = new Map(targetVariant.images.map((i) => [i.id, true]))
    return product.images!.filter((i) => imageIdsMap.has(i.id))
  }

  // 3. Final fallback: use product images
  return product.images
}

/**
 * Build a Google-compliant JSON-LD Product schema.
 * @see https://developers.google.com/search/docs/appearance/structured-data/product
 */
function buildProductJsonLd({
  product,
  images,
  countryCode,
  reviewsData,
}: {
  product: HttpTypes.StoreProduct
  images: HttpTypes.StoreProductImage[]
  countryCode: string
  reviewsData: { average_rating: number; count: number } | null
}) {
  const baseUrl = getBaseURL()

  // Collect all variant prices for AggregateOffer
  const variantPrices = (product.variants || [])
    .filter((v: any) => v.calculated_price?.calculated_amount != null)
    .map((v: any) => ({
      amount: v.calculated_price.calculated_amount as number,
      currency: (v.calculated_price.currency_code as string)?.toUpperCase(),
      inStock: (v.inventory_quantity ?? 0) > 0,
    }))

  // Determine overall availability from all variants
  const hasAnyInStock = variantPrices.some((v) => v.inStock)
  const availability = hasAnyInStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock"

  const currency = variantPrices[0]?.currency || "USD"

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    url: `${baseUrl}/${countryCode}/products/${product.handle}`,
  }

  // Description
  if (product.description) {
    jsonLd.description = product.description
  }

  // SKU — use first variant's SKU if available
  const sku = product.variants?.find((v) => v.sku)?.sku
  if (sku) {
    jsonLd.sku = sku
  }

  // Images
  const imageUrls = images?.map((i) => i.url).filter(Boolean)
  if (imageUrls?.length) {
    jsonLd.image = imageUrls
  } else if (product.thumbnail) {
    jsonLd.image = [product.thumbnail]
  }

  // Brand from collection or metadata
  const brandName =
    (product.metadata?.brand as string) || product.collection?.title
  if (brandName) {
    jsonLd.brand = {
      "@type": "Brand",
      name: brandName,
    }
  }

  // Offers — use AggregateOffer for multi-variant, Offer for single
  if (variantPrices.length > 1) {
    const prices = variantPrices.map((v) => v.amount)
    jsonLd.offers = {
      "@type": "AggregateOffer",
      priceCurrency: currency,
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: variantPrices.length,
      availability,
    }
  } else if (variantPrices.length === 1) {
    jsonLd.offers = {
      "@type": "Offer",
      priceCurrency: currency,
      price: variantPrices[0].amount,
      availability,
    }
  }

  // Aggregate Rating from review system
  if (reviewsData && reviewsData.average_rating > 0 && reviewsData.count > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewsData.average_rating,
      reviewCount: reviewsData.count,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return jsonLd
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle, countryCode } = params

  const [region, product] = await Promise.all([
    getRegion(countryCode, true),
    listProducts({
      countryCode,
      queryParams: { handle },
    }).then(({ response }) => response.products[0]),
  ])

  if (!region || !product) {
    notFound()
  }

  const baseUrl = getBaseURL()
  const title = product.title
  const description =
    product.description ||
    product.subtitle ||
    `${product.title} - Available now at our store.`
  const imageUrl = product.thumbnail || product.images?.[0]?.url
  const canonicalUrl = `${baseUrl}/${countryCode}/products/${handle}`

  return {
    title: title,
    description: description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: title,
      description: description,
      url: canonicalUrl,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: title,
            },
          ]
        : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: imageUrl ? [imageUrl] : [],
    },
  }
}

export default function ProductPage(props: Props) {
  return (
    <Suspense fallback={<SkeletonProductPage />}>
      <ProductContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  )
}

async function ProductContent(props: Props) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ])
  const { handle, countryCode } = params
  const selectedVariantId = searchParams.v_id

  const [region, pricedProduct] = await Promise.all([
    getRegion(countryCode, true),
    listProducts({
      countryCode,
      queryParams: { handle },
    }).then(({ response }) => response.products[0]),
  ])

  if (!region || !pricedProduct) {
    notFound()
  }

  const images = getImagesForVariant(pricedProduct, selectedVariantId) ?? []

  // Fetch reviews for JSON-LD aggregate rating
  let reviewsData: { average_rating: number; count: number } | null = null
  try {
    reviewsData = await getProductReviews({
      productId: pricedProduct.id,
      limit: 0,
    })
  } catch {
    // Reviews are optional for JSON-LD
  }

  const jsonLd = buildProductJsonLd({
    product: pricedProduct,
    images,
    countryCode: params.countryCode,
    reviewsData,
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
        images={images}
      />
    </>
  )
}
