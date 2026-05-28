import type { DaewoonItem, DaewoonMeta } from '@core/types'
import { getManAge } from '@core/age'

function formatStartDateShort(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${h}:${min}`
}

/** ◆시작 직후 만나이 vs 칸 헤더 불일치 시 (드묾) */
export function formatDaewoonAgeBridgeNote(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  dw: DaewoonItem,
  meta?: DaewoonMeta,
): string | null {
  const atStart = getManAge(birthYear, birthMonth, birthDay, dw.startDate)
  if (atStart === dw.age) return null

  const label = dw.index === 1
    ? `1運 ◆시작(${formatStartDateShort(dw.startDate)})`
    : `${dw.startDate.getFullYear()}년 ◆시작(${formatStartDateShort(dw.startDate)})`

  const su = meta && dw.index === 1
    ? ` · 대운수 ${meta.daewoonSuDisplay}(${meta.daewoonSu})`
    : ''

  return `※ ${label}: 만 ${atStart}세 → 칸 만 ${dw.age}세${su}`
}

/** @deprecated formatDaewoonAgeBridgeNote 사용 */
export function formatFirstDaewoonStartNote(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  meta: DaewoonMeta,
  first: DaewoonItem | undefined,
): string | null {
  if (!first) return null
  return formatDaewoonAgeBridgeNote(birthYear, birthMonth, birthDay, first, meta)
}

/** @deprecated formatDaewoonAgeBridgeNote 사용 */
export function formatSewoonStartYearAgeNote(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  targetDaewoon: DaewoonItem,
): string | null {
  return formatDaewoonAgeBridgeNote(birthYear, birthMonth, birthDay, targetDaewoon)
}
