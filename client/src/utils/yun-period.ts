import type { DaewoonItem, SounItem } from '@core/types'
import { getMonthlyJieQiEntries, lookupJieForYear } from '@core/jieqi-lunar'
import { instantToKstParts } from '@core/kst-clock'
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

/** 세운 표 하이라이트 — 📍 현재 세운과 동일(입춘 기준 적용 연도 칸) */
export function shouldHighlightSewoonYear(
  year: number,
  daewoon: DaewoonItem[],
  now: Date = new Date(),
): boolean {
  if (isBeforeFirstDaewoon(daewoon, now)) return false
  return year === getEffectiveCalendarYearForLichun(now)
}

/** 현재 流年 간지 (입춘 기준) */
export function getCurrentLiuNianGanzi(now: Date = new Date()): string {
  const p = instantToKstParts(now)
  return getLiuNianGanziAtDate(p.year, p.month, p.day, p.hour, p.minute)
}

/** 현재 流月 간지 (12節 기준) */
export function getCurrentLiuYueGanzi(now: Date = new Date()): string {
  const p = instantToKstParts(now)
  return getLiuYueGanziAtDate(p.year, p.month, p.day, p.hour, p.minute)
}

/** 입춘 전이면 전년도 칸 기준 (세운) */
export function getEffectiveYunCalendarYear(now: Date = new Date()): number {
  return getEffectiveCalendarYearForLichun(now)
}

/** 월운 하이라이트·📍 현재 월운 — 첫 ◆節入 전이면 직전 양력 월 칸 */
export function getEffectiveYunCalendarYearMonth(now: Date = new Date()): {
  year: number
  month: number
} {
  const nowKst = instantToKstParts(now)
  const calYear = nowKst.year
  const calMonth = nowKst.month
  const firstJieRu = getMonthlyJieQiEntries(calYear, calMonth).find((e) => e.isJieRu)

  if (!firstJieRu) {
    return { year: calYear, month: calMonth }
  }

  const jieDt = lookupJieForYear(calYear, firstJieRu.jieIndex)
  if (!jieDt || now.getTime() >= jieDt.getTime()) {
    return { year: calYear, month: calMonth }
  }

  if (calMonth <= 1) {
    return { year: calYear - 1, month: 12 }
  }
  return { year: calYear, month: calMonth - 1 }
}

/** 월운 표 노란 칸 — displayYear를 보고 있을 때만 */
export function shouldHighlightMonthlyColumn(
  itemYear: number,
  itemMonth: number,
  displayYear: number,
  now: Date = new Date(),
): boolean {
  const effective = getEffectiveYunCalendarYearMonth(now)
  if (displayYear !== effective.year) return false
  return itemYear === effective.year && itemMonth === effective.month
}

/** 현재 시각 기준 활성 소운 칸 — startDate(생일) 기준 */
export function findActiveSounIndex(soun: SounItem[], now: Date = new Date()): number {
  if (soun.length === 0) return -1
  const t = now.getTime()
  for (let i = soun.length - 1; i >= 0; i--) {
    if (t >= soun[i].startDate.getTime()) return i
  }
  return -1
}

/** 1운 ◆시작 전에만 소운 활성 (대운 시작 후에는 하이라이트·현재 소운 없음) */
export function getActiveSounIndex(
  soun: SounItem[],
  daewoon: DaewoonItem[],
  now: Date = new Date(),
): number {
  if (!isBeforeFirstDaewoon(daewoon, now)) return -1
  return findActiveSounIndex(soun, now)
}

/** 📍 현재 대운 — 활성 大運 ◆시작 연도 */
export function getActiveDaewoonContextYear(
  daewoon: DaewoonItem[],
  now: Date = new Date(),
): number | null {
  const idx = findActiveDaewoonIndex(daewoon, now)
  if (idx < 0) return null
  return daewoon[idx].startDate.getFullYear()
}

/** 대운 표 노란 칸 — ◆대운 시작 시각 기준 활성 칸 */
export function shouldHighlightDaewoonColumn(
  columnIndex: number,
  daewoon: DaewoonItem[],
  now: Date = new Date(),
): boolean {
  const activeIdx = findActiveDaewoonIndex(daewoon, now)
  return activeIdx >= 0 && columnIndex === activeIdx
}

/** 소운 표 노란 칸 — ◆소운 시작(생일) 시각 기준 활성 칸 (1운 ◆ 전만) */
export function shouldHighlightSounColumn(
  columnIndex: number,
  soun: SounItem[],
  daewoon: DaewoonItem[],
  now: Date = new Date(),
): boolean {
  const activeIdx = getActiveSounIndex(soun, daewoon, now)
  return activeIdx >= 0 && columnIndex === activeIdx
}
