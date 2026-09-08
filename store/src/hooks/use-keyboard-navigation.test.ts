import { renderHook, act } from "@testing-library/react"
import { useKeyboardNavigation } from "./use-keyboard-navigation"

describe("useKeyboardNavigation hook", () => {
  const mockHits = [
    { objectID: "1", id: "1", url: "https://example.com/item/1" },
    { objectID: "2", id: "2", url: "https://example.com/item/2" },
    { objectID: "3", id: "3" }, // No URL
  ] as any[]

  let originalGlobalProxy: any = null
  let mockLocationAssign: jest.Mock
  let mockOpen: jest.Mock

  beforeAll(() => {
    mockLocationAssign = jest.fn()
    mockOpen = jest.fn()
    window.open = mockOpen

    if ((window as any)._globalProxy) {
      originalGlobalProxy = (window as any)._globalProxy
      const mockedWindow = new Proxy(window, {
        get(target, property, receiver) {
          if (property === "location") {
            return {
              assign: mockLocationAssign,
            }
          }
          return Reflect.get(target, property, receiver)
        },
      })
      ;(window as any)._globalProxy = mockedWindow
    }
  })

  afterAll(() => {
    if (originalGlobalProxy) {
      ;(window as any)._globalProxy = originalGlobalProxy
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return the default initial state", () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation(mockHits, "initial-query")
    )

    expect(result.current.selectedIndex).toBe(0)
    expect(result.current.selectionOrigin).toBe("init")
  })

  it("should reset selection states when the search query changes", () => {
    const { result, rerender } = renderHook(
      ({ query }) => useKeyboardNavigation(mockHits, query),
      { initialProps: { query: "first-query" } }
    )

    // Set some index and origin
    act(() => {
      result.current.moveDown()
    })
    expect(result.current.selectedIndex).toBe(1)
    expect(result.current.selectionOrigin).toBe("keyboard")

    // Rerender with a different query
    rerender({ query: "second-query" })

    expect(result.current.selectedIndex).toBe(0)
    expect(result.current.selectionOrigin).toBe("init")
  })

  it("should increment selected index and wrap around correctly when calling moveDown", () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation(mockHits, "query")
    )

    // Start at 0 -> moveDown -> 1
    act(() => {
      result.current.moveDown()
    })
    expect(result.current.selectedIndex).toBe(1)
    expect(result.current.selectionOrigin).toBe("keyboard")

    // 1 -> moveDown -> 2
    act(() => {
      result.current.moveDown()
    })
    expect(result.current.selectedIndex).toBe(2)

    // 2 -> moveDown -> 0 (wrap around)
    act(() => {
      result.current.moveDown()
    })
    expect(result.current.selectedIndex).toBe(0)
  })

  it("should decrement selected index and wrap around correctly when calling moveUp", () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation(mockHits, "query")
    )

    // Start at 0 -> moveUp -> 2 (wrap around)
    act(() => {
      result.current.moveUp()
    })
    expect(result.current.selectedIndex).toBe(2)
    expect(result.current.selectionOrigin).toBe("keyboard")

    // 2 -> moveUp -> 1
    act(() => {
      result.current.moveUp()
    })
    expect(result.current.selectedIndex).toBe(1)

    // 1 -> moveUp -> 0
    act(() => {
      result.current.moveUp()
    })
    expect(result.current.selectedIndex).toBe(0)
  })

  it("should change selected index and set origin to pointer when calling hoverIndex", () => {
    const { result } = renderHook(() =>
      useKeyboardNavigation(mockHits, "query")
    )

    act(() => {
      result.current.hoverIndex(1)
    })
    expect(result.current.selectedIndex).toBe(1)
    expect(result.current.selectionOrigin).toBe("pointer")

    // Invalid index should be ignored
    act(() => {
      result.current.hoverIndex(-1)
    })
    expect(result.current.selectedIndex).toBe(1)

    act(() => {
      result.current.hoverIndex(5)
    })
    expect(result.current.selectedIndex).toBe(1)
  })

  describe("activateSelection", () => {
    it("should open URL in a new tab by default if it exists", () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(mockHits, "query", true)
      )
      let activated: boolean = false
      act(() => {
        activated = result.current.activateSelection()
      })

      expect(activated).toBe(true)
      expect(mockOpen).toHaveBeenCalledWith(
        "https://example.com/item/1",
        "_blank",
        "noopener,noreferrer"
      )
      expect(mockLocationAssign).not.toHaveBeenCalled()
    })

    it("should navigate in the same tab if openResultsInNewTab is false", () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(mockHits, "query", false)
      )

      let activated: boolean = false
      act(() => {
        activated = result.current.activateSelection()
      })

      expect(activated).toBe(true)
      expect(mockLocationAssign).toHaveBeenCalledWith(
        "https://example.com/item/1"
      )
      expect(mockOpen).not.toHaveBeenCalled()
    })

    it("should return false and do nothing if selected hit has no URL", () => {
      const { result } = renderHook(() =>
        useKeyboardNavigation(mockHits, "query")
      )

      // Set index to 2 (which has no URL)
      act(() => {
        result.current.hoverIndex(2)
      })

      let activated: boolean = true
      act(() => {
        activated = result.current.activateSelection()
      })

      expect(activated).toBe(false)
      expect(mockOpen).not.toHaveBeenCalled()
      expect(mockLocationAssign).not.toHaveBeenCalled()
    })
  })
})
