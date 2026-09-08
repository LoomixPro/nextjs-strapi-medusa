"use client"

import React, { createContext, useContext } from "react"

const DictionaryContext = createContext<Record<string, string>>({})

export function DictionaryProvider({
  dictionary,
  children,
}: {
  dictionary: Record<string, string>
  children: React.ReactNode
}) {
  return (
    <DictionaryContext.Provider value={dictionary}>
      {children}
    </DictionaryContext.Provider>
  )
}

export function useDictionary() {
  const dictionary = useContext(DictionaryContext)
  return (key: string | undefined | null) => {
    if (!key) return ""
    const trimmedKey = key.trim()
    // Try exact match first
    if (dictionary[trimmedKey]) return dictionary[trimmedKey]
    // Try case-insensitive matching
    const lowerKey = trimmedKey.toLowerCase()
    const matchedKey = Object.keys(dictionary).find(
      (k) => k.trim().toLowerCase() === lowerKey
    )
    if (matchedKey) return dictionary[matchedKey]
    return key
  }
}
