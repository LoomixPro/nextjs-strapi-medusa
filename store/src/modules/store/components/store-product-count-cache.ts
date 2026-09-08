let cachedCount = 0
const listeners = new Set<() => void>()

export function updateStoreProductCount(count: number) {
  cachedCount = count
  listeners.forEach((listener) => listener())
}

export function getStoreProductCount() {
  return cachedCount
}

export function subscribeStoreProductCount(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  return () => listeners.delete(onStoreChange)
}
