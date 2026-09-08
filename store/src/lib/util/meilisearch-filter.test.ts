import {
  escapeMeilisearchFilterValue,
  meilisearchFilterEquals,
} from "./meilisearch-filter"

describe("meilisearch-filter", () => {
  it("escapes backslashes and single quotes", () => {
    expect(escapeMeilisearchFilterValue("O'Brien")).toBe("O\\'Brien")
    expect(escapeMeilisearchFilterValue("a\\b")).toBe("a\\\\b")
  })

  it("builds equality filters with escaped values", () => {
    expect(meilisearchFilterEquals("options.value", "Red")).toBe(
      "options.value = 'Red'"
    )
    expect(meilisearchFilterEquals("options.value", "Men's")).toBe(
      "options.value = 'Men\\'s'"
    )
  })
})
