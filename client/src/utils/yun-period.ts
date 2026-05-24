import type { DaewoonItem } from '@core/types'
import { getEffectiveCalendarYearForLichun, getLiuNianGanziAtDate, getLiuYueGanziAtDate } from '@core/yun-transit'

/** 첫 대운 시작 나이 (칸 헤더 — startDate 시점 만나이) */
export function getFirstDaewoonAge(daewoon: DaewoonItem[]): number {
  return daewoon[0]?.age ?? 0
}

/** 첫 대운·세운 시작 연도 */
export function getFirstDaewoonStartYear(daewoon: DaewoonItem[]): number | null {
  const start = daewoon[0]?.startDate
  return start ? start.getFullYear() : null
}

/** 첫 대운 시작 전 — 소운(小運) 구간 */
export function isBeforeFirstDaewoon(daewoon: DaewoonItem[], now: Date = new Date()): boolean {
  const first = daewoon[0]?.startDate
  if (!first) return false
  return now.getTime() < first.getTime()
}

/** 현재 시각 기준 활성 대운 칸 — startDate 기준 */
export function findActiveDaewoonIndex(daewoon: DaewoonItem[], now: Date = new Date()): number {
  if (daewoon.length === 0 || isBeforeFirstDaewoon(daewoon, now)) {
    return -1
  }
  const t = now.getTime()
  for (let i = daewoon.length - 1; i >= 0; i--) {
    if (t >= daewoon[i].startDate.getTime()) {
      return i
    }
  }
  return -1
}

/** @deprecated findActiveDaewoonIndex 사용 */
export function findActiveDaewoonIndexByAge(daewoon: DaewoonItem[], _currentAge: number): number {
  return findActiveDaewoonIndex(daewoon)
}

/** 세운 표 올해 하이라이트 — 대운 시작 후에만 */
export function shouldHighlightSewoonYear(
  year: number,
  currentYear: number,
  daewoon: DaewoonItem[],
  now: Date = new Date(),
): boolean {
  if (year !== currentYear) return false
  if (isBeforeFirstDaewoon(daewoon, now)) return false
  return true
}

/** 현재 流年 간지 (입춘 기준) */
export function getCurrentLiuNianGanzi(now: Date = new Date()): string {
  return getLiuNianGanziAtDate(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
  )
}

/** 현재 流月 간지 (12節 기준) */
export function getCurrentLiuYueGanzi(now: Date = new Date()): string {
  return getLiuYueGanziAtDate(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
  )
}

/** 입춘 전이면 전년도 칸 기준 (소운·세운) */
export function getEffectiveYunCalendarYear(now: Date = new Date()): number {
  return getEffectiveCalendarYearForLichun(now)
}
