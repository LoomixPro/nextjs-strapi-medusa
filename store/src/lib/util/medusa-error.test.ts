import medusaError from "./medusa-error"

describe("medusaError", () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it("should throw an error with capitalized response message and log details when error.response exists", () => {
    const error = {
      response: {
        data: { message: "product not found" },
        status: 404,
        headers: { "content-type": "application/json" },
      },
      config: {
        url: "/store/products/123",
        baseURL: "http://localhost:9000",
      },
    }

    expect(() => medusaError(error)).toThrow("Product not found.")
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Resource:",
      "http://localhost:9000/store/products/123"
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith("Response data:", {
      message: "product not found",
    })
    expect(consoleErrorSpy).toHaveBeenCalledWith("Status code:", 404)
    expect(consoleErrorSpy).toHaveBeenCalledWith("Headers:", {
      "content-type": "application/json",
    })
  })

  it("should handle non-object response data as message", () => {
    const error = {
      response: {
        data: "something went wrong",
        status: 500,
        headers: {},
      },
      config: {
        url: "/store/carts",
        baseURL: "http://localhost:9000",
      },
    }

    expect(() => medusaError(error)).toThrow("Something went wrong.")
  })

  it("should throw a TypeError if error.config is missing when error.response exists", () => {
    const error = {
      response: {
        data: "some error",
        status: 500,
        headers: {},
      },
    }

    // Since error.config is undefined, accessing error.config.url will throw a TypeError in production.
    // Let's assert this behavior is documented.
    expect(() => medusaError(error)).toThrow(TypeError)
  })

  it("should throw 'No response received' when only error.request exists", () => {
    const error = {
      request: "XMLHttpRequest",
    }

    expect(() => medusaError(error)).toThrow(
      "No response received: XMLHttpRequest"
    )
  })

  it("should throw 'Error setting up the request' for generic errors", () => {
    const error = {
      message: "Network Error",
    }

    expect(() => medusaError(error)).toThrow(
      "Error setting up the request: Network Error"
    )
  })

  it("should always throw (return type is never)", () => {
    const error = { message: "test" }
    expect(() => medusaError(error)).toThrow()
  })
})
