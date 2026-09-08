"use client"

import { useState } from "react"

export type StateType = [boolean, () => void, () => void, () => void] & {
  state: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

/**
 * A utility hook for managing a boolean toggle state.
 * Useful for modals, dropdowns, switches, or any component that needs an open/close state.
 *
 * @param initialState - The initial boolean value (defaults to false)
 * @returns An array-like object with `state`, `open`, `close`, and `toggle` properties
 *  to allow both object and array destructuring.
 *
 * @example
 * ```tsx
 *  const [showModal, openModal, closeModal, toggleModal] = useToggleState()
 *  // or
 *  const { state, open, close, toggle } = useToggleState()
 * ```
 */
const useToggleState = (initialState = false) => {
  const [state, setState] = useState<boolean>(initialState)

  const close = () => {
    setState(false)
  }

  const open = () => {
    setState(true)
  }

  const toggle = () => {
    setState((state) => !state)
  }

  const hookData = [state, open, close, toggle] as StateType
  hookData.state = state
  hookData.open = open
  hookData.close = close
  hookData.toggle = toggle
  return hookData
}

export default useToggleState
