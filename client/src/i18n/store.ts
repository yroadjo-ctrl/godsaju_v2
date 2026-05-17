export type Locale = 'ko' | 'zh' | 'ja' | 'en'

const STORAGE_KEY = 'orrery-locale'
const VALID: Set<string> = new Set(['ko', 'zh', 'ja', 'en'])

function detectBrowserLocale(): Locale {
  for (const lang of navigator.languages ?? [navigator.language]) {
    const code = lang.split('-')[0].toLowerCase()
    if (VALID.has(code)) return code as Locale
  }
  return 'en'
}

function getStored(): Locale {
  const v = localStorage.getItem(STORAGE_KEY)
  return v && VALID.has(v) ? (v as Locale) : detectBrowserLocale()
}

let currentLocale: Locale = getStored()
const listeners = new Set<() => void>()

export const localeStore = {
  getSnapshot: (): Locale => currentLocale,
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },
  setLocale: (locale: Locale) => {
    currentLocale = locale
    localStorage.setItem(STORAGE_KEY, locale)
    listeners.forEach(l => l())
  },
}
