import { isEqual, pick } from "lodash"

const ADDRESS_FIELDS = [
  "first_name",
  "last_name",
  "address_1",
  "company",
  "postal_code",
  "city",
  "country_code",
  "province",
  "phone",
] as const

const normalizeAddressFields = (address: Record<string, unknown>) => {
  const picked = pick(address, ADDRESS_FIELDS)

  return {
    ...picked,
    country_code:
      typeof picked.country_code === "string"
        ? picked.country_code.toLowerCase()
        : picked.country_code,
    phone:
      typeof picked.phone === "string"
        ? picked.phone.replace(/[^0-9+]/g, "")
        : "",
  }
}

/**
 * Compares two address objects for equality based on common address fields.
 *
 * @param address1 - The first address object
 * @param address2 - The second address object
 * @returns boolean - True if addresses are equal, false otherwise
 */
export default function compareAddresses(address1: any, address2: any) {
  if (!address1 && !address2) {
    return true
  }

  if (!address1 || !address2) {
    return false
  }

  return isEqual(
    normalizeAddressFields(address1),
    normalizeAddressFields(address2)
  )
}
