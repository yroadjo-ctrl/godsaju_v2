import type { ZiweiChart } from '@core/types'
import { getDaxianList, getZiweiXuSuiInCalendarYear } from '@core/ziwei'

export type ZiweiDaxianItem = ReturnType<typeof getDaxianList>[number]

/** 현재 연도 虚岁 기준 활성 大限 인덱스 (혼천의 등 자미 표준) */
export function findActiveZiweiDaxianIndex(
  daxianList: Array<{ ageStart: number; ageEnd: number }>,
  birthYear: number,
  calendarYear: number = new Date().getFullYear(),
): number {
  const currentAge = getZiweiXuSuiInCalendarYear(birthYear, calendarYear)
  for (let i = daxianList.length - 1; i >= 0; i--) {
    if (currentAge >= daxianList[i].ageStart) return i
  }
  return -1
}

/** 大限 구간에 해당하는 양력 연도 목록 (虚岁 기준) */
export function getCalendarYearsForDaxian(
  chart: ZiweiChart,
  daxian: { ageStart: number; ageEnd: number },
): number[] {
  const years: number[] = []
  const endScan = chart.solarYear + 120
  for (let y = chart.solarYear; y <= endScan; y++) {
    const age = getZiweiXuSuiInCalendarYear(chart.solarYear, y)
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

/** 현재 大限 구간 표시 중인지 (대한 파란 선택이 아님 — 사주 display 대운 = auto 대운과 동일) */
export function isViewingActiveZiweiDaxian(
  selectedDaxianIdx: number,
  autoDaxianIdx: number,
): boolean {
  if (selectedDaxianIdx < 0) return true
  return selectedDaxianIdx === autoDaxianIdx
}

/** 流年 표 노란 칸 — 현재 大限일 때만 올해(사주 shouldHighlightSewoonYear와 동일, 파란 칸 없음) */
export function shouldHighlightZiweiLiunianYear(
  year: number,
  selectedDaxianIdx: number,
  autoDaxianIdx: number,
  calendarYear: number = new Date().getFullYear(),
): boolean {
  if (!isViewingActiveZiweiDaxian(selectedDaxianIdx, autoDaxianIdx)) return false
  return year === calendarYear
}

/** 올해 虚岁 기준 활성 大限 */
export function getActiveDaxianToday(chart: ZiweiChart) {
  const list = getDaxianList(chart)
  const idx = findActiveZiweiDaxianIndex(list, chart.solarYear)
  return list[idx >= 0 ? idx : 0]
}
