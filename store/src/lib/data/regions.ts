"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { withMedusaFallback } from "@lib/util/medusa-fetch"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

export const listRegions = async (isStatic = false) => {
  const next = {
    ...(isStatic ? { tags: ["regions"] } : await getCacheOptions("regions")),
    revalidate: 3600,
  }

  return withMedusaFallback(
    () =>
      sdk.client
        .fetch<{ regions: HttpTypes.StoreRegion[] }>(`/store/regions`, {
          method: "GET",
          next,
          cache: "force-cache",
        })
        .then(({ regions }) => regions),
    undefined,
    "listRegions"
  ).catch(medusaError)
}

export const retrieveRegion = async (id: string, isStatic = false) => {
  const next = {
    ...(isStatic
      ? { tags: [["regions", id].join("-")] }
      : await getCacheOptions(["regions", id].join("-"))),
    revalidate: 3600,
  }

  return withMedusaFallback(
    () =>
      sdk.client
        .fetch<{ region: HttpTypes.StoreRegion }>(`/store/regions/${id}`, {
          method: "GET",
          next,
          cache: "force-cache",
        })
        .then(({ region }) => region),
    undefined,
    `retrieveRegion(${id})`
  ).catch(medusaError)
}

const regionMap = new Map<string, HttpTypes.StoreRegion>()

export const getRegion = async (countryCode: string, isStatic = false) => {
  try {
    if (regionMap.has(countryCode)) {
      return regionMap.get(countryCode)
    }

    const regions = await listRegions(isStatic)

    if (!regions) {
      return null
    }

    regions.forEach((region) => {
      region.countries?.forEach((c) => {
        regionMap.set(c?.iso_2 ?? "", region)
      })
    })

    const region = countryCode
      ? regionMap.get(countryCode)
      : regionMap.get("us")

    return region
  } catch {
    return null
  }
}
