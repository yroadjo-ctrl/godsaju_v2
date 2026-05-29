import type { LiuNianInfo, ZiweiChart } from '@core/types'
import { MAIN_STAR_NAMES, PALACE_NAMES } from '@core/constants'
import { calculateLiunian, getZiweiXuSuiInCalendarYear } from '@core/ziwei'
import { formatZiweiInline, formatZhiKorHanja } from './ziwei-labels.ts'
import { getPalaceByZhi } from './ziwei-palace-grid.ts'
import { getActiveDaxianToday } from './ziwei-yun-period.ts'

const LUNAR_MONTH_HANJA = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '臘月',
] as const

/** AI 복사 — 大限·流年 나이 기준 (사주 만나이와 별도) */
export const ZIWEI_XUSUI_EXPORT_NOTE =
  '※ 大限·流年 나이 = 虚岁(해당 양력년 − 출생년 + 1). 사주 대운·세운은 만나이(생일·◆시작 기준)라 다를 수 있음.'

export function getMainStarsAtZhi(chart: ZiweiChart, zhi: string): string[] {
  const palace = getPalaceByZhi(chart, zhi)
  if (!palace) return []
  return palace.stars
    .filter(s => MAIN_STAR_NAMES.has(s.name))
    .map(s => s.name)
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

/** AI 복사 — 현재 大限 · 流年 (UI YunSectionHeading 스타일) */
export function formatZiweiCurrentYunLine(
  liunian: LiuNianInfo,
  activeDaxian: { ageStart: number; ageEnd: number; palaceName: string },
): string {
  const fmt = formatZiweiInline
  const daxian = `${fmt('大限')} ${activeDaxian.ageStart}-${activeDaxian.ageEnd}歲 ${fmt(activeDaxian.palaceName)}`
  const liunianPart = `${fmt('流年')} ${liunian.year} ${liunian.gan}${liunian.zhi}年`
  return `(현재 ${daxian} · ${liunianPart})`
}

/** AI 복사 — 流年十二宮 표 */
export function buildLiunianPalacesExportLines(
  chart: ZiweiChart,
  liunian: LiuNianInfo,
  fmt: (h: string) => string = formatZiweiInline,
): string[] {
  const lines: string[] = []
  lines.push(`| ${fmt('宮')} | ${fmt('流年')} ${fmt('地支')} | ${fmt('本命')} ${fmt('宮')} | ${fmt('主星')} |`)
  lines.push('| --- | --- | --- | --- |')

  for (const palaceName of PALACE_NAMES) {
    const lnZhi = liunian.palaces[palaceName] ?? ''
    const natalPalace = lnZhi ? getPalaceByZhi(chart, lnZhi) : undefined
    const natalName = natalPalace?.name ?? '-'
    const stars = lnZhi ? getMainStarsAtZhi(chart, lnZhi) : []
    const starText = stars.length > 0
      ? stars.map(s => fmt(s)).join(' ')
      : `(${fmt('空宮')})`
    lines.push(`| ${fmt(palaceName)} | ${formatZhiKorHanja(lnZhi)} | ${fmt(natalName)} | ${starText} |`)
  }

  lines.push('')
  lines.push(`※ ${fmt('流年')} ${fmt('命宮')} ${formatZhiKorHanja(liunian.mingGongZhi)} → ${fmt('本命')} ${fmt(liunian.natalPalaceAtMing)}`)
  return lines
}

/** AI 복사 — 流月 (主星 포함) */
export function buildLiuyueExportLines(
  chart: ZiweiChart,
  liunian: LiuNianInfo,
  fmt: (h: string) => string = formatZiweiInline,
): string[] {
  const lines: string[] = []
  lines.push(`| ${fmt('年')}·${fmt('月')} | ${fmt('流月')} ${fmt('命宮')} | ${fmt('本命')} ${fmt('宮')} | ${fmt('主星')} |`)
  lines.push('| --- | --- | --- | --- |')

  for (const ly of liunian.liuyue) {
    const monthHanja = LUNAR_MONTH_HANJA[ly.month - 1] ?? `${ly.month}月`
    const stars = getMainStarsAtZhi(chart, ly.mingGongZhi)
    const starText = stars.length > 0
      ? stars.map(s => fmt(s)).join(' ')
      : `(${fmt('空宮')})`
    lines.push(
      `| ${liunian.year}년\n${fmt(monthHanja)} | ${formatZhiKorHanja(ly.mingGongZhi)} | ${fmt(ly.natalPalaceName)} | ${starText} |`,
    )
  }
  return lines
}

export function appendLiunianExportSections(
  lines: string[],
  chart: ZiweiChart,
  liunian: LiuNianInfo,
  fmt: (h: string) => string,
  sectionTitle: (title: string) => string,
): void {
  lines.push('')
  lines.push(sectionTitle(`${fmt('流年')} (${liunian.year}年 ${liunian.gan}${liunian.zhi}年)`))
  lines.push(ZIWEI_XUSUI_EXPORT_NOTE)
  lines.push(formatZiweiCurrentYunLine(liunian, getActiveDaxianToday(chart)))
  lines.push('─────')
  const xuSui = getZiweiXuSuiInCalendarYear(chart.solarYear, liunian.year)
  lines.push(`${fmt('大限')}(${liunian.year}年·虚岁 ${xuSui}세): ${liunian.daxianAgeStart}-${liunian.daxianAgeEnd}歲 ${fmt(liunian.daxianPalaceName)}`)
  lines.push(`${fmt('流年命宮')}: ${formatZhiKorHanja(liunian.mingGongZhi)} → ${fmt('本命')} ${fmt(liunian.natalPalaceAtMing)}`)

  const mingStars = getMainStarsAtZhi(chart, liunian.mingGongZhi)
  lines.push(`${fmt('主星')}: ${mingStars.length > 0 ? mingStars.map(s => fmt(s)).join(' ') : `(${fmt('空宮')})`}`)

  lines.push('')
  lines.push(sectionTitle(fmt('流年四化')))
  lines.push('─────')
  for (const huaType of ['化祿', '化權', '化科', '化忌'] as const) {
    let starName = ''
    for (const [s, h] of Object.entries(liunian.siHua)) {
      if (h === huaType) { starName = s; break }
    }
    const palaceName = liunian.siHuaPalaces[huaType] || '?'
    if (starName) lines.push(`${fmt(huaType)}: ${fmt(starName)} → ${fmt(palaceName)}`)
  }

  lines.push('')
  lines.push(sectionTitle(`${fmt('流年')}${fmt('十二宮')}`))
  lines.push('─────')
  lines.push(...buildLiunianPalacesExportLines(chart, liunian, fmt))

  lines.push('')
  lines.push(sectionTitle(fmt('流月')))
  lines.push('─────')
  lines.push(...buildLiuyueExportLines(chart, liunian, fmt))
}
