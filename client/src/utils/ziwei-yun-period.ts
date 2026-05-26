import type { ZiweiChart } from '@core/types'
import { getManAge, getManAgeInCalendarYear } from '@core/age'
import { getDaxianList } from '@core/ziwei'

export type ZiweiDaxianItem = ReturnType<typeof getDaxianList>[number]

/** 현재 만나이 기준 활성 大限 인덱스 */
export function findActiveZiweiDaxianIndex(
  daxianList: Array<{ ageStart: number; ageEnd: number }>,
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  refDate: Date = new Date(),
): number {
  const currentAge = getManAge(birthYear, birthMonth, birthDay, refDate)
  for (let i = daxianList.length - 1; i >= 0; i--) {
    if (currentAge >= daxianList[i].ageStart) return i
  }
  return -1
}

/** 大限 구간에 해당하는 양력 연도 목록 (만나이 기준) */
export function getCalendarYearsForDaxian(
  chart: ZiweiChart,
  daxian: { ageStart: number; ageEnd: number },
): number[] {
  const years: number[] = []
  const endScan = chart.solarYear + 120
  for (let y = chart.solarYear; y <= endScan; y++) {
    const age = getManAgeInCalendarYear(
      chart.solarYear,
      chart.solarMonth,
      chart.solarDay,
      y,
    )
    if (age >= daxian.ageStart && age <= daxian.ageEnd) {
      years.push(y)
    }
  }
  return years
}

/** 大限 클릭 시 流年 연도 스냅 — 구간 내 올해면 올해, 아니면 구간 최근년 */
export function snapLiunianYearForDaxian(
  chart: ZiweiChart,
  daxian: { ageStart: number; ageEnd: number },
  preferredYear: number = new Date().getFullYear(),
): number {
  const years = getCalendarYearsForDaxian(chart, daxian)
  if (years.length === 0) return preferredYear
  if (years.includes(preferredYear)) return preferredYear
  return years[years.length - 1]
}

/** 大限 헤더용 시작 양력년 */
export function getDaxianStartCalendarYear(
  chart: ZiweiChart,
  daxian: { ageStart: number; ageEnd: number },
): number | null {
  const years = getCalendarYearsForDaxian(chart, daxian)
  return years[0] ?? null
}

/** 오늘 만나이 기준 활성 大限 */
export function getActiveDaxianToday(chart: ZiweiChart) {
  const list = getDaxianList(chart)
  const idx = findActiveZiweiDaxianIndex(
    list,
    chart.solarYear,
    chart.solarMonth,
    chart.solarDay,
  )
  return list[idx >= 0 ? idx : 0]
}
