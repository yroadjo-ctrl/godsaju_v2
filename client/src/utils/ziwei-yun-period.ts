import type { ZiweiChart } from '@core/types'
import { instantToKstParts } from '@core/kst-clock'
import { calculateLiunian, getDaxianList, getZiweiXuSuiInCalendarYear } from '@core/ziwei'
import { formatCurrentYunLine } from './ganzi-display.ts'
import { formatZhiKorHanja } from './ziwei-labels.ts'

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

/** 유월 표 노란 칸 — 표시 중인 流年 연도 + 양력 월(1일 기준, KST) */
export function shouldHighlightZiweiLiuyueMonth(
  displayYear: number,
  itemMonth: number,
  now: Date = new Date(),
): boolean {
  const kst = instantToKstParts(now)
  return displayYear === kst.year && itemMonth === kst.month
}

/** AI·UI 📍 현재 대한 — 활성 大限 干支 + 시작년 */
export function formatZiweiCurrentDaxianExportLine(chart: ZiweiChart): string | null {
  const active = getActiveDaxianToday(chart)
  const startYear = getDaxianStartCalendarYear(chart, active)
  return formatCurrentYunLine(
    '대한',
    active.ganZhi,
    null,
    startYear != null ? { kind: 'year', year: startYear } : null,
  )
}

/** AI·UI 📍 현재 유년 — 올해 流年 干支 (KST 연도) */
export function formatZiweiCurrentLiunianExportLine(
  chart: ZiweiChart,
  now: Date = new Date(),
): string | null {
  const kst = instantToKstParts(now)
  const ln = calculateLiunian(chart, kst.year)
  return formatCurrentYunLine(
    '유년',
    `${ln.gan}${ln.zhi}`,
    null,
    { kind: 'year', year: kst.year },
  )
}

/** AI·UI 📍 현재 유월 — 流月命宮 지지 + 양력 연월 */
export function formatZiweiCurrentLiuyueLine(
  chart: ZiweiChart,
  now: Date = new Date(),
): string | null {
  const kst = instantToKstParts(now)
  const ln = calculateLiunian(chart, kst.year)
  const ly = ln.liuyue[kst.month - 1]
  if (!ly?.mingGongZhi) return null
  return `📍 현재 유월 : ${formatZhiKorHanja(ly.mingGongZhi)} (${kst.year}년 ${kst.month}월)`
}
