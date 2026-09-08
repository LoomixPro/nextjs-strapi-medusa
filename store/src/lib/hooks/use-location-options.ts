"use client"

import { useEffect, useState } from "react"
import { isIranFeaturesEnabled } from "@lib/util/storefront-settings"

type LocationOption = { value: string; label: string }

async function getIranProvinces(): Promise<LocationOption[]> {
  if (!isIranFeaturesEnabled) {
    return []
  }
  const iranCityModule = await import("iran-city")
  const iranCity = iranCityModule.default || iranCityModule
  return iranCity.allProvinces().map((state: { name: string }) => ({
    value: state.name,
    label: state.name,
  }))
}

async function getIranCities(stateCode: string): Promise<LocationOption[]> {
  if (!isIranFeaturesEnabled) {
    return []
  }
  const iranCityModule = await import("iran-city")
  const iranCity = iranCityModule.default || iranCityModule
  const province = iranCity
    .allProvinces()
    .find((p: { name: string }) => p.name === stateCode)

  if (!province) {
    return []
  }

  return iranCity
    .citiesOfProvince(province.id)
    .map((city: { name: string }) => ({
      value: city.name,
      label: city.name,
    }))
}

async function loadProvincesForCountry(
  countryCode: string
): Promise<LocationOption[]> {
  const { State } = await import("country-state-city")
  return State.getStatesOfCountry(countryCode.toUpperCase()).map((state) => ({
    value: state.isoCode,
    label: state.name,
  }))
}

async function loadCitiesForState(
  countryCode: string,
  stateCode: string
): Promise<LocationOption[]> {
  const { City } = await import("country-state-city")
  return City.getCitiesOfState(countryCode.toUpperCase(), stateCode).map(
    (city) => ({
      value: city.name,
      label: city.name,
    })
  )
}

export function useProvinceOptions(countryCode?: string) {
  const [options, setOptions] = useState<LocationOption[]>([])

  useEffect(() => {
    if (!countryCode) {
      setOptions([])
      return
    }

    let cancelled = false

    if (isIranFeaturesEnabled && countryCode.toLowerCase() === "ir") {
      getIranProvinces().then((provinces) => {
        if (!cancelled) {
          setOptions(provinces)
        }
      })
      return () => {
        cancelled = true
      }
    }

    loadProvincesForCountry(countryCode).then((provinces) => {
      if (!cancelled) {
        setOptions(provinces)
      }
    })

    return () => {
      cancelled = true
    }
  }, [countryCode])

  return options
}

export function useCityOptions(countryCode?: string, stateCode?: string) {
  const [options, setOptions] = useState<LocationOption[]>([])

  useEffect(() => {
    if (!countryCode || !stateCode) {
      setOptions([])
      return
    }

    let cancelled = false

    if (isIranFeaturesEnabled && countryCode.toLowerCase() === "ir") {
      getIranCities(stateCode).then((cities) => {
        if (!cancelled) {
          setOptions(cities)
        }
      })
      return () => {
        cancelled = true
      }
    }

    loadCitiesForState(countryCode, stateCode).then((cities) => {
      if (!cancelled) {
        setOptions(cities)
      }
    })

    return () => {
      cancelled = true
    }
  }, [countryCode, stateCode])

  return options
}
