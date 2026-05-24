import type { DaewoonItem } from '@core/types'
import { getEffectiveCalendarYearForLichun, getLiuNianGanziAtDate, getLiuYueGanziAtDate } from '@core/yun-transit'

/** 첫 대운 시작 나이 (칸 헤더 age) */
export function getFirstDaewoonAge(daewoon: DaewoonItem[]): number {
  return daewoon[0]?.age ?? 0
}

/** 첫 대운·세운 시작 연도 */
export function getFirstDaewoonStartYear(daewoon: DaewoonItem[]): number | null {
  const start = daewoon[0]?.startDate
  return start ? start.getFullYear() : null
}

/** 첫 대운 시작 전 — 소운(小運) 구간 (대운수>0 이고 현재 나이 < 첫 대운 age) */
export function isBeforeFirstDaewoon(currentAge: number, daewoon: DaewoonItem[]): boolean {
  const firstAge = getFirstDaewoonAge(daewoon)
  return firstAge > 0 && currentAge < firstAge
}

/** 현재 나이에 해당하는 대운 칸 — 대운 전이면 -1 */
export function findActiveDaewoonIndexByAge(daewoon: DaewoonItem[], currentAge: number): number {
  if (daewoon.length === 0 || isBeforeFirstDaewoon(currentAge, daewoon)) {
    return -1
  }
  for (let i = 0; i < daewoon.length; i++) {
    const d = daewoon[i]
    if (currentAge >= d.age && currentAge <= d.age + 9) {
      return i
    }
  }
  if (currentAge >= daewoon[daewoon.length - 1].age) {
    return daewoon.length - 1
  }
  return -1
}

/** 세운 표 올해 하이라이트 — 대운 시작 후에만 */
export function shouldHighlightSewoonYear(
  year: number,
  currentYear: number,
  currentAge: number,
  daewoon: DaewoonItem[],
): boolean {
  if (year !== currentYear) return false
  if (isBeforeFirstDaewoon(currentAge, daewoon)) return false
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
