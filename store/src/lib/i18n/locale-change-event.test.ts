import {
  dispatchLocaleChange,
  LOCALE_CHANGE_EVENT,
} from "./locale-change-event"

describe("locale-change-event", () => {
  it("dispatches a custom event with the locale detail", () => {
    const handler = jest.fn()
    window.addEventListener(LOCALE_CHANGE_EVENT, handler)

    dispatchLocaleChange("fa-IR")

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0].detail).toEqual({ locale: "fa-IR" })

    window.removeEventListener(LOCALE_CHANGE_EVENT, handler)
  })
})
