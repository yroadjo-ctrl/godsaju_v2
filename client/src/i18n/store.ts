export type Locale = 'ko' | 'zh' | 'ja' | 'en'

const STORAGE_KEY = 'orrery-locale'
const VALID: Set<string> = new Set(['ko', 'zh', 'ja', 'en'])

function getStored(): Locale {
  const v = localStorage.getItem(STORAGE_KEY)
  // 저장값 없으면 한국어(갓사주 기본). Cursor 내장 브라우저 등 별도 localStorage·en navigator 환경 대응.
  return v && VALID.has(v) ? (v as Locale) : 'ko'
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
