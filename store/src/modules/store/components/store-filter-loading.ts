type Listener = () => void

let isFiltering = false
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((listener) => listener())
}

export function startStoreFilterLoading() {
  if (isFiltering) {
    return
  }

  isFiltering = true
  notify()
}

export function endStoreFilterLoading() {
  if (!isFiltering) {
    return
  }

  isFiltering = false
  notify()
}

export function getStoreFilterLoading() {
  return isFiltering
}

export function subscribeStoreFilterLoading(onStoreChange: Listener) {
  listeners.add(onStoreChange)
  return () => listeners.delete(onStoreChange)
}

export function navigateWithStoreLoading(
  router: { push: (href: string, options?: { scroll?: boolean }) => void },
  url: string
) {
  startStoreFilterLoading()
  router.push(url, { scroll: false })
}
