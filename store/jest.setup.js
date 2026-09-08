import "@testing-library/jest-dom"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: jest.fn(),
  notFound: jest.fn(),
}))

jest.mock("@next/third-parties/google", () => ({
  sendGTMEvent: jest.fn(),
  GoogleTagManager: () => null,
}))

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
  cacheTag: jest.fn(),
}))

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn().mockResolvedValue((key) => key),
  getLocale: jest.fn().mockResolvedValue("default"),
  getMessages: jest.fn().mockResolvedValue({}),
}))
