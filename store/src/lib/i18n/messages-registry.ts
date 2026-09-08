/**
 * AUTO-GENERATED FILE by scripts/sync-translations.js
 * DO NOT EDIT MANUALLY.
 */

import defaultMessages from "../../../messages/default.json"

export type MessageLoader = () => Promise<{ default: Record<string, unknown> }>

export const LOCAL_MESSAGE_LOADERS: Record<string, MessageLoader> = {
  default: () =>
    Promise.resolve({
      default: defaultMessages as unknown as Record<string, unknown>,
    }),
  "ar-AE": () => import("../../../messages/ar-AE.json"),
  fa: () => import("../../../messages/fa.json"),
}

export const AVAILABLE_LOCALES: string[] = ["ar-AE", "fa"]

export function getAvailableLocales(): string[] {
  return AVAILABLE_LOCALES
}

export function isLocaleAvailable(locale: string): boolean {
  return locale in LOCAL_MESSAGE_LOADERS
}
