import { isEmpty, isObject, isArray } from "./isEmpty"

describe("isEmpty utility", () => {
  describe("isEmpty", () => {
    it("should return true for null", () => {
      expect(isEmpty(null)).toBe(true)
    })

    it("should return true for undefined", () => {
      expect(isEmpty(undefined)).toBe(true)
    })

    it("should return true for empty string", () => {
      expect(isEmpty("")).toBe(true)
    })

    it("should return true for whitespace-only string", () => {
      expect(isEmpty("   ")).toBe(true)
      expect(isEmpty("\t\n")).toBe(true)
    })

    it("should return true for empty array", () => {
      expect(isEmpty([])).toBe(true)
    })

    it("should return true for empty object", () => {
      expect(isEmpty({})).toBe(true)
    })

    it("should return false for non-empty string", () => {
      expect(isEmpty("hello")).toBe(false)
    })

    it("should return false for non-empty array", () => {
      expect(isEmpty([1, 2, 3])).toBe(false)
    })

    it("should return false for non-empty object", () => {
      expect(isEmpty({ key: "value" })).toBe(false)
    })

    it("should return false for number 0", () => {
      expect(isEmpty(0)).toBe(false)
    })

    it("should return false for boolean false", () => {
      expect(isEmpty(false)).toBe(false)
    })

    it("should return false for number", () => {
      expect(isEmpty(42)).toBe(false)
    })

    it("should return false for floating point numbers, NaN, and Infinity/ -Infinity", () => {
      expect(isEmpty(3.14)).toBe(false)
      expect(isEmpty(NaN)).toBe(false)
      expect(isEmpty(Infinity)).toBe(false)
      expect(isEmpty(-Infinity)).toBe(false)
    })

    it("should return true for built-in objects with no own enumerable keys (like Date, empty/non-empty Map, empty/non-empty Set, function, RegExp)", () => {
      expect(isEmpty(new Date())).toBe(true)
      expect(isEmpty(new Map())).toBe(true)
      expect(isEmpty(new Map([["a", 1]]))).toBe(true)
      expect(isEmpty(new Set())).toBe(true)
      expect(isEmpty(new Set([1]))).toBe(true)
      expect(isEmpty(() => {})).toBe(true)
      expect(isEmpty(/abc/)).toBe(true)
    })

    it("should return false for Symbols", () => {
      expect(isEmpty(Symbol("test"))).toBe(false)
    })
  })

  describe("isObject", () => {
    it("should return true for plain objects", () => {
      expect(isObject({})).toBe(true)
      expect(isObject({ a: 1 })).toBe(true)
    })

    it("should return true for arrays (arrays are objects)", () => {
      expect(isObject([])).toBe(true)
    })

    it("should return false for primitives", () => {
      expect(isObject(null)).toBe(false)
      expect(isObject(undefined)).toBe(false)
      expect(isObject(42)).toBe(false)
      expect(isObject("string")).toBe(false)
    })
  })

  describe("isArray", () => {
    it("should return true for arrays", () => {
      expect(isArray([])).toBe(true)
      expect(isArray([1, 2])).toBe(true)
    })

    it("should return false for non-arrays", () => {
      expect(isArray({})).toBe(false)
      expect(isArray("string")).toBe(false)
      expect(isArray(null)).toBe(false)
    })
  })
})
