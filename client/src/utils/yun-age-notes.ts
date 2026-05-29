import type { DaewoonItem, DaewoonMeta } from '@core/types'
import { getManAge } from '@core/age'

export function formatStartDateShort(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${h}:${min}`
}

/** 세운 헤더용 — 생일 월/일 (예: 9/1) */
export function formatStartDateMonthDay(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** 세운 표 헤더 — 2030년 / (만45세 9/1) */
export function formatSewoonHeaderCell(
  year: number,
  age: number,
  startDate: Date,
  lineBreak = '\n',
): string {
  return `${year}년${lineBreak}(만${age}세 ${formatStartDateMonthDay(startDate)})`
}

/**
 * 1運 — 대운수 표기(반올림) vs ◆시작 시점 만나이 차이 안내
 * (칸 헤더 나이는 ◆시작 시점과 동일 — saju.ts getManAge(startDate))
 */
export function formatDaewoonAgeBridgeNote(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  dw: DaewoonItem,
  meta?: DaewoonMeta,
): string | null {
  if (dw.index !== 1 || !meta) return null
  const atStart = getManAge(birthYear, birthMonth, birthDay, dw.startDate)
  if (meta.daewoonSuDisplay === atStart) return null

  return `※ 1運 ◆시작(${formatStartDateShort(dw.startDate)}): 만 ${atStart}세 · 대운수 표기 ${meta.daewoonSuDisplay}(정밀 ${meta.daewoonSu})`
}
