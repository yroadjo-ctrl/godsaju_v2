import { useSyncExternalStore } from 'react'
import { localeStore } from './store.ts'
import type { Locale } from './store.ts'
import ko from './locales/ko.ts'
import zh from './locales/zh.ts'
import ja from './locales/ja.ts'
import en from './locales/en.ts'

export type { Locale }

const messages: Record<Locale, Record<string, string>> = { ko, zh, ja, en }

export function useLocale() {
  const locale = useSyncExternalStore(localeStore.subscribe, localeStore.getSnapshot)
  return {
    locale,
    setLocale: localeStore.setLocale,
    t: (key: string) => messages[locale][key] ?? key,
  }
}

/** Non-hook version for use outside React components (e.g., text-export) */
export function t(locale: Locale, key: string): string {
  return messages[locale][key] ?? key
}

export function getLocale(): Locale {
  return localeStore.getSnapshot()
}
