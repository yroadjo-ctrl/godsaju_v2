import { useLocale } from '../i18n/index.ts'
import type { Locale } from '../i18n/index.ts'

const OPTIONS: { value: Locale; label: string }[] = [
  { value: 'ko', label: '한' },
  { value: 'zh', label: '中' },
  { value: 'ja', label: '日' },
  { value: 'en', label: 'EN' },
]

export default function LanguageToggle() {
  const { locale, setLocale } = useLocale()

  function cycle() {
    const idx = OPTIONS.findIndex(o => o.value === locale)
    const next = OPTIONS[(idx + 1) % OPTIONS.length]
    setLocale(next.value)
  }

  const current = OPTIONS.find(o => o.value === locale)!

  return (
    <button
      onClick={cycle}
      className="fixed top-14 left-3 z-50 w-8 h-8 rounded-full
        flex items-center justify-center
        bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
        border border-gray-200 dark:border-gray-700
        text-gray-600 dark:text-gray-300
        hover:bg-gray-100 dark:hover:bg-gray-700
        transition-colors text-xs font-medium"
      title={`Language: ${current.label}`}
    >
      {current.label}
    </button>
  )
}
