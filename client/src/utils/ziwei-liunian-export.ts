import type { LiuNianInfo, ZiweiChart } from '@core/types'
import { MAIN_STAR_NAMES } from '@core/constants'
import { calculateLiunian, getDaxianList, getZiweiXuSuiInCalendarYear } from '@core/ziwei'
import { formatZiweiInline, formatZhiKorHanja } from './ziwei-labels.ts'
import { getPalaceByZhi } from './ziwei-palace-grid.ts'
import {
  findActiveZiweiDaxianIndex,
  getCalendarYearsForDaxian,
  getDaxianStartCalendarYear,
  shouldHighlightZiweiLiunianYear,
  type ZiweiDaxianItem,
} from './ziwei-yun-period.ts'

const LUNAR_MONTH_HANJA = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '臘月',
] as const

const SI_HUA_ORDER = ['化祿', '化權', '化科', '化忌'] as const

/** AI 복사 — 大限·流年 나이 기준 (사주 만나이와 별도) */
export const ZIWEI_XUSUI_EXPORT_NOTE =
  '※ 大限·流年 나이 = 虚岁(해당 양력년 − 출생년 + 1). 사주 대운·세운은 만나이(생일·◆시작 기준)라 다를 수 있음.'

export const ZIWEI_YUN_TABLE_EXPORT_NOTES = [
  ZIWEI_XUSUI_EXPORT_NOTE,
  '※ 표 열 순서: UI와 동일(최신 大限·연도·월이 좌측, 臘月←正月).',
  '※ 📍 = 올해 流年 (현재 大限 구간 표시 시). ◆ = 화면에서 선택한 流年(유월 표 연동).',
] as const

function escapeMdCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, '<br>')
}

/** 사주 text-export 대운·세운 표와 동일한 가로 마크다운 표 */
function pushHorizontalMarkdownTable(
  lines: string[],
  columnHeaders: string[],
  dataRows: Array<{ label: string; cells: string[] }>,
): void {
  if (columnHeaders.length === 0) return
  lines.push(`|  | ${columnHeaders.map(escapeMdCell).join(' | ')} |`)
  lines.push(`| ${['---', ...columnHeaders.map(() => '---')].join(' | ')} |`)
  for (const row of dataRows) {
    lines.push(`| ${escapeMdCell(row.label)} | ${row.cells.map(escapeMdCell).join(' | ')} |`)
  }
}

export function getMainStarsAtZhi(chart: ZiweiChart, zhi: string): string[] {
  const palace = getPalaceByZhi(chart, zhi)
  if (!palace) return []
  return palace.stars
    .filter(s => MAIN_STAR_NAMES.has(s.name))
    .map(s => s.name)
}

export function resolveDisplayZiweiDaxian(
  chart: ZiweiChart,
  selectedDaxianIdx?: number,
): { daxian: ZiweiDaxianItem; idx: number } {
  const list = getDaxianList(chart)
  const autoIdx = findActiveZiweiDaxianIndex(list, chart.solarYear)
  const idx = selectedDaxianIdx != null && selectedDaxianIdx >= 0
    ? selectedDaxianIdx
    : (autoIdx >= 0 ? autoIdx : 0)
  return { daxian: list[idx] ?? list[0], idx }
}

export function resolveZiweiLiunian(
  chart: ZiweiChart,
  liunianOrYear?: LiuNianInfo | number,
): LiuNianInfo {
  if (liunianOrYear != null && typeof liunianOrYear === 'object') {
    return liunianOrYear
  }
  const year = typeof liunianOrYear === 'number'
    ? liunianOrYear
    : new Date().getFullYear()
  return calculateLiunian(chart, year)
}

/** UI LiunianTable 사화 칸과 동일 (줄바꿈) */
function formatLiunianSiHuaForExport(
  liunian: LiuNianInfo,
  fmt: (h: string) => string,
): string {
  const parts: string[] = []
  for (const huaType of SI_HUA_ORDER) {
    let starName = ''
    for (const [s, h] of Object.entries(liunian.siHua)) {
      if (h === huaType) { starName = s; break }
    }
    const palaceName = liunian.siHuaPalaces[huaType]
    if (starName) parts.push(`${fmt(huaType)}:${fmt(starName)}→${fmt(palaceName)}`)
  }
  return parts.length > 0 ? parts.join('\n') : '-'
}

function yearColumnSuffix(
  year: number,
  options: {
    selectedDaxianIdx: number
    autoDaxianIdx: number
    calendarYear: number
    focusYear: number
  },
): string {
  const marks: string[] = []
  if (shouldHighlightZiweiLiunianYear(
    year, options.selectedDaxianIdx, options.autoDaxianIdx, options.calendarYear,
  )) {
    marks.push('📍')
  }
  if (year === options.focusYear && !marks.includes('📍')) {
    marks.push('◆')
  }
  return marks.length > 0 ? ` ${marks.join('')}` : ''
}

/** AI 복사 — 大限 가로 표 (UI DaxianTable 열 순) */
export function buildDaxianHorizontalTableLines(
  chart: ZiweiChart,
  fmt: (h: string) => string = formatZiweiInline,
): string[] {
  const daxianList = getDaxianList(chart)
  const cols = [...daxianList].reverse()
  const headers = cols.map((_, revIdx) => {
    const actualIdx = daxianList.length - 1 - revIdx
    return `[${actualIdx + 1}限]`
  })

  const lines: string[] = []
  pushHorizontalMarkdownTable(lines, headers, [
    {
      label: '虛岁',
      cells: cols.map(dx => `${dx.ageStart}-${dx.ageEnd}歲`),
    },
    {
      label: '開始年',
      cells: cols.map(dx => {
        const y = getDaxianStartCalendarYear(chart, dx)
        return y != null ? `${y}年~` : '-'
      }),
    },
    {
      label: fmt('宮'),
      cells: cols.map(dx => fmt(dx.palaceName)),
    },
    {
      label: '干支',
      cells: cols.map(dx => dx.ganZhi),
    },
    {
      label: fmt('主星'),
      cells: cols.map(dx =>
        dx.mainStars.length > 0
          ? dx.mainStars.map(s => fmt(s)).join(' ')
          : `(${fmt('空宮')})`,
      ),
    },
  ])
  return lines
}

/** AI 복사 — 선택 大限 구간 流年 가로 표 (UI LiunianTable 행·열 구조) */
export function buildLiunianPeriodHorizontalTableLines(
  chart: ZiweiChart,
  daxian: ZiweiDaxianItem,
  fmt: (h: string) => string = formatZiweiInline,
  options?: {
    selectedDaxianIdx?: number
    autoDaxianIdx?: number
    calendarYear?: number
    focusYear?: number
  },
): string[] {
  const calendarYear = options?.calendarYear ?? new Date().getFullYear()
  const focusYear = options?.focusYear ?? calendarYear
  const selectedDaxianIdx = options?.selectedDaxianIdx ?? -1
  const autoDaxianIdx = options?.autoDaxianIdx
    ?? findActiveZiweiDaxianIndex(getDaxianList(chart), chart.solarYear)
  const markOpts = { selectedDaxianIdx, autoDaxianIdx, calendarYear, focusYear }

  const years = getCalendarYearsForDaxian(chart, daxian)
  const cols = [...years].reverse().map(year => {
    const ln = calculateLiunian(chart, year)
    const age = getZiweiXuSuiInCalendarYear(chart.solarYear, year)
    const stars = getMainStarsAtZhi(chart, ln.mingGongZhi)
    const suffix = yearColumnSuffix(year, markOpts)
    return { year, age, ln, stars, suffix }
  })

  const headers = cols.map(c =>
    `${c.age}세<br>(${c.year}년)${c.suffix}<br>${c.ln.gan}${c.ln.zhi}`,
  )

  const lines: string[] = []
  pushHorizontalMarkdownTable(lines, headers, [
    {
      label: fmt('流年命宮'),
      cells: cols.map(c => formatZhiKorHanja(c.ln.mingGongZhi)),
    },
    {
      label: `${fmt('本命')}${fmt('宮')}`,
      cells: cols.map(c => fmt(c.ln.natalPalaceAtMing)),
    },
    {
      label: fmt('主星'),
      cells: cols.map(c =>
        c.stars.length > 0
          ? c.stars.map(s => fmt(s)).join(' ')
          : `(${fmt('空宮')})`,
      ),
    },
    {
      label: fmt('流年四化'),
      cells: cols.map(c => formatLiunianSiHuaForExport(c.ln, fmt)),
    },
  ])
  return lines
}

/** AI 복사 — 流月 가로 표 (UI LiuyueTable 열 순: 臘月←正月) */
export function buildLiuyueHorizontalTableLines(
  chart: ZiweiChart,
  liunian: LiuNianInfo,
  fmt: (h: string) => string = formatZiweiInline,
): string[] {
  const months = [...liunian.liuyue].reverse()
  const headers = months.map(ly => {
    const monthHanja = LUNAR_MONTH_HANJA[ly.month - 1] ?? `${ly.month}月`
    return `${liunian.year}년<br>${fmt(monthHanja)}`
  })

  const lines: string[] = []
  pushHorizontalMarkdownTable(lines, headers, [
    {
      label: fmt('流月命宮'),
      cells: months.map(ly => formatZhiKorHanja(ly.mingGongZhi)),
    },
    {
      label: `${fmt('本命')}${fmt('宮')}`,
      cells: months.map(ly => fmt(ly.natalPalaceName)),
    },
    {
      label: fmt('主星'),
      cells: months.map(ly => {
        const stars = getMainStarsAtZhi(chart, ly.mingGongZhi)
        return stars.length > 0
          ? stars.map(s => fmt(s)).join(' ')
          : `(${fmt('空宮')})`
      }),
    },
  ])
  return lines
}

/** UI YunSectionHeading — 화면 상단 한 줄 (AI 복사 본문에는 미포함) */
export function formatZiweiCurrentYunLine(
  liunian: LiuNianInfo,
  activeDaxian: { ageStart: number; ageEnd: number; palaceName: string },
): string {
  const fmt = formatZiweiInline
  const daxian = `${fmt('大限')} ${activeDaxian.ageStart}-${activeDaxian.ageEnd}歲 ${fmt(activeDaxian.palaceName)}`
  const liunianPart = `${fmt('流年')} ${liunian.year} ${liunian.gan}${liunian.zhi}年`
  return `(현재 ${daxian} · ${liunianPart})`
}

export interface ZiweiYunExportOptions {
  selectedDaxianIdx?: number
}

export function appendLiunianExportSections(
  lines: string[],
  chart: ZiweiChart,
  liunian: LiuNianInfo,
  fmt: (h: string) => string,
  sectionTitle: (title: string) => string,
  options?: ZiweiYunExportOptions,
): void {
  const { daxian: displayDaxian } = resolveDisplayZiweiDaxian(chart, options?.selectedDaxianIdx)
  const daxianList = getDaxianList(chart)
  const autoDaxianIdx = findActiveZiweiDaxianIndex(daxianList, chart.solarYear)
  const selectedDaxianIdx = options?.selectedDaxianIdx ?? -1
  const periodYears = getCalendarYearsForDaxian(chart, displayDaxian)
  const periodStart = periodYears[0]
  const periodEnd = periodYears[periodYears.length - 1]
  const currentYear = new Date().getFullYear()
  const periodLabel = `${displayDaxian.ageStart}-${displayDaxian.ageEnd}歲 (${periodStart ?? '?'}년~${periodEnd ?? '?'}년)`
  const tableOpts = {
    selectedDaxianIdx,
    autoDaxianIdx,
    calendarYear: currentYear,
    focusYear: liunian.year,
  }

  lines.push('')
  lines.push(sectionTitle(fmt('流年')))
  lines.push(`- **선택 ${fmt('大限')}**: ${periodLabel}`)
  lines.push(`- **선택 ${fmt('流年')}** (${fmt('流月')} 연동): ${liunian.year}年 ${liunian.gan}${liunian.zhi}年`)
  lines.push('')
  lines.push(...buildLiunianPeriodHorizontalTableLines(chart, displayDaxian, fmt, tableOpts))
  lines.push('')
  const hasPin = shouldHighlightZiweiLiunianYear(
    currentYear, selectedDaxianIdx, autoDaxianIdx, currentYear,
  )
  if (hasPin && liunian.year === currentYear) {
    lines.push(
      `> **AI 참고**: 📍 = **${currentYear}년** ${fmt('流年')} 풀이·${fmt('流月')} 연동(현재 ${fmt('大限')} 구간). 그 외 칸은 해당년 레퍼런스.`,
    )
  } else if (hasPin) {
    lines.push(
      `> **AI 참고**: 📍 = **${currentYear}년** ${fmt('流年')} 풀이 기준. ◆ = **${liunian.year}년** ${fmt('流月')} 연동. 그 외 칸은 레퍼런스.`,
    )
  } else {
    lines.push(
      `> **AI 참고**: 다른 ${fmt('大限')} 구간(📍 없음). ◆ = **${liunian.year}년** ${fmt('流年')}·${fmt('流月')} 연동.`,
    )
  }

  lines.push('')
  lines.push(sectionTitle(fmt('流月')))
  lines.push(`- **${liunian.year}年** ${liunian.gan}${liunian.zhi}年 · 열 순서: 臘月(좌)←正月(우)`)
  lines.push('')
  lines.push(...buildLiuyueHorizontalTableLines(chart, liunian, fmt))
}
