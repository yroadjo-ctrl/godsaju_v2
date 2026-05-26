import type { Locale } from '../i18n/index.ts'

export interface BirthDateTimeParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

/** UI·시간 보정 안내 — yyyy년 m월 d일 HH시 mm분 (로케일별) */
export function formatBirthDateTimeForDisplay(
  dt: BirthDateTimeParts,
  locale: Locale,
): string {
  const hh = String(dt.hour).padStart(2, '0')
  const mm = String(dt.minute).padStart(2, '0')
  switch (locale) {
    case 'ko':
      return `${dt.year}년 ${dt.month}월 ${dt.day}일 ${hh}시 ${mm}분`
    case 'ja':
      return `${dt.year}年${dt.month}月${dt.day}日 ${hh}時${mm}分`
    case 'zh':
      return `${dt.year}年${dt.month}月${dt.day}日 ${hh}时${mm}分`
    default:
      return `${dt.year}-${String(dt.month).padStart(2, '0')}-${String(dt.day).padStart(2, '0')} ${hh}:${mm}`
  }
}
