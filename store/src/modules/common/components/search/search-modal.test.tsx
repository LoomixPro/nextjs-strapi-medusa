import { render, screen, fireEvent } from "@testing-library/react"
import SearchModal from "./index"

// Mock lucide icons
jest.mock("lucide-react", () => ({
  Search: () => <svg data-testid="search-icon" />,
}))

// Mock next utilities
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}))

jest.mock("next/image", () => {
  return function MockNextImage(props: {
    alt?: string
    [key: string]: unknown
  }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={props.alt ?? ""} {...props} />
  }
})

jest.mock("next/link", () => {
  return function MockNextLink({
    children,
    ...props
  }: {
    children: React.ReactNode
    [key: string]: unknown
  }) {
    return <a {...props}>{children}</a>
  }
})

// Mock configuration
jest.mock("../../../../lib/config", () => ({
  searchClient: {},
}))

// Mock UI Modal
jest.mock("../../../common/components/modal", () => {
  return function MockModal({
    isOpen,
    children,
  }: {
    isOpen: boolean
    children: React.ReactNode
  }) {
    if (!isOpen) return null
    return <div data-testid="mock-modal">{children}</div>
  }
})

// Mock React InstantSearch completely so we don't need Algolia/Meilisearch server connection
jest.mock("react-instantsearch", () => {
  return {
    InstantSearch: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="instant-search">{children}</div>
    ),
    SearchBox: () => (
      <input data-testid="search-box-input" placeholder="Search..." />
    ),
    Hits: () => <div data-testid="search-hits">Results</div>,
    useSearchBox: () => ({ query: "test query" }), // Simulate user typing
  }
})

describe("SearchModal Component", () => {
  it("should not display modal initially", () => {
    render(<SearchModal />)
    expect(screen.queryByTestId("mock-modal")).not.toBeInTheDocument()
  })

  it("should open modal when search icon is clicked and render instantsearch", () => {
    render(<SearchModal />)

    const btn = screen.getByRole("button", { name: "Search" })
    fireEvent.click(btn)

    expect(screen.getByTestId("mock-modal")).toBeInTheDocument()
    expect(screen.getByTestId("instant-search")).toBeInTheDocument()
    expect(screen.getByTestId("search-box-input")).toBeInTheDocument()
    expect(screen.getByTestId("search-hits")).toBeInTheDocument()
  })
})
