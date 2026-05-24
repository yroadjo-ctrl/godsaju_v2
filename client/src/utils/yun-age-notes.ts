import type { DaewoonItem, DaewoonMeta } from '@core/types'
import { getManAge } from '@core/age'

function formatStartDateShort(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${h}:${min}`
}

/** ◆시작 시점 vs 칸(12/31) 나이 — 1차이 날 때만 */
export function formatDaewoonAgeBridgeNote(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  dw: DaewoonItem,
  meta?: DaewoonMeta,
): string | null {
  const atMoment = getManAge(birthYear, birthMonth, birthDay, dw.startDate)
  const atYearEnd = dw.age
  if (atMoment === atYearEnd) return null

  const label = dw.index === 1
    ? `1運 ◆시작(${formatStartDateShort(dw.startDate)})`
    : `${dw.startDate.getFullYear()}년 ◆시작(${formatStartDateShort(dw.startDate)})`

  const su = meta && dw.index === 1
    ? ` · 대운수 ${meta.daewoonSuDisplay}(${meta.daewoonSu})`
    : ''

  return `※ ${label}: 당시 ${atMoment}세 → 칸 ${atYearEnd}세(12/31)${su}`
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
