import type { ZiweiChart, ZiweiPalace } from '@core/types'
import { MAIN_STAR_NAMES, LUCKY_STAR_NAMES, SHA_STAR_NAMES } from '@core/constants'
import { getDaxianList } from '@core/ziwei'
import { formatGanziKorHanja } from './ganzi-display.ts'
import { formatPalaceTheme, formatZiweiInline, formatZhiKorHanja } from './ziwei-labels.ts'

/** 지지 → 그리드 위치 (row, col) — 전통 命盤 배치 */
export const ZHI_GRID: Record<string, [number, number]> = {
  '巳': [1, 1], '午': [1, 2], '未': [1, 3], '申': [1, 4],
  '辰': [2, 1],                                '酉': [2, 4],
  '卯': [3, 1],                                '戌': [3, 4],
  '寅': [4, 1], '丑': [4, 2], '子': [4, 3], '亥': [4, 4],
}

const COL_W = 22

function padLine(text: string, width: number): string {
  const chars = [...text]
  if (chars.length >= width) return chars.slice(0, width).join('')
  return text + ' '.repeat(width - chars.length)
}

function padLines(lines: string[], height: number, width: number): string[] {
  const out = lines.map(l => padLine(l, width))
  while (out.length < height) out.push(' '.repeat(width))
  return out
}

function hBorder(widths: number[], gaps: ('full' | 'split')[]): string {
  let line = '+'
  for (let i = 0; i < widths.length; i++) {
    line += '-'.repeat(widths[i] + 2)
    if (i < gaps.length) {
      line += gaps[i] === 'full' ? '+' : '+'
    }
  }
  return line + '+'
}

function midSplitBorder(leftW: number, centerW: number, rightW: number): string {
  return `+${'-'.repeat(leftW + 2)}+${' '.repeat(centerW + 2)}+${'-'.repeat(rightW + 2)}+`
}

function rowBorder(cols: string[], widths: number[]): string {
  return '| ' + cols.map((c, i) => padLine(c, widths[i])).join(' | ') + ' |'
}

export function getPalaceByZhi(chart: ZiweiChart, zhi: string): ZiweiPalace | undefined {
  for (const p of Object.values(chart.palaces)) {
    if (p.zhi === zhi) return p
  }
  return undefined
}

function buildPalaceCellLines(
  palace: ZiweiPalace,
  daxianRange?: string,
  fmt: (h: string) => string = formatZiweiInline,
): string[] {
  const lines: string[] = []
  const shenMark = palace.isShenGong ? `·${fmt('身')}` : ''
  lines.push(`${fmt(palace.name)}${shenMark}`)
  lines.push(formatPalaceTheme(palace.name))
  lines.push(formatGanziKorHanja(palace.ganZhi))

  const mainStars = palace.stars.filter(s => MAIN_STAR_NAMES.has(s.name))
  const luckyStars = palace.stars.filter(s => LUCKY_STAR_NAMES.has(s.name))
  const shaStars = palace.stars.filter(s => SHA_STAR_NAMES.has(s.name))

  if (mainStars.length > 0) {
    for (const s of mainStars) {
      let star = fmt(s.name)
      if (s.brightness) star += ` ${fmt(s.brightness)}`
      if (s.siHua) star += ` ${fmt(s.siHua)}`
      lines.push(star)
    }
  } else {
    lines.push(`(${fmt('空宮')})`)
  }

  if (luckyStars.length > 0) {
    lines.push(`${fmt('吉')}: ${luckyStars.map(s => fmt(s.name)).join(' ')}`)
  }
  if (shaStars.length > 0) {
    lines.push(`${fmt('煞')}: ${shaStars.map(s => fmt(s.name)).join(' ')}`)
  }
  if (daxianRange) lines.push(daxianRange)

  return lines
}

function buildCenterCellLines(chart: ZiweiChart, fmt: (h: string) => string): string[] {
  let shenPalaceName = ''
  for (const p of Object.values(chart.palaces)) {
    if (p.isShenGong) { shenPalaceName = p.name; break }
  }

  const lines: string[] = ['[ 중 궁 ]']
  lines.push(...buildZiweiBirthInfoLines(chart, fmt))
  lines.push(`${fmt('年柱')}: ${formatGanziKorHanja(`${chart.yearGan}${chart.yearZhi}`)}`)
  const ming = chart.palaces['命宮']
  lines.push(`${fmt('命宮')}: ${ming?.ganZhi ? formatGanziKorHanja(ming.ganZhi) : ''}`)
  lines.push(`${fmt('身宮')}: ${shenPalaceName ? fmt(shenPalaceName) : ''} (${formatZhiKorHanja(chart.shenGongZhi)})`)
  lines.push(`${fmt('五行局')}: ${fmt(chart.wuXingJu.name)}`)
  lines.push(`${fmt('大限起始')}: ${chart.daXianStartAge}歲`)
  return lines
}

/** AI 복사·중궁 — 양력·음력·성별 */
export function buildZiweiBirthInfoLines(
  chart: ZiweiChart,
  fmt: (h: string) => string = formatZiweiInline,
): string[] {
  const genderHanja = chart.isMale ? '男' : '女'
  return [
    `${fmt('陽曆')}: ${chart.solarYear}年 ${chart.solarMonth}月 ${chart.solarDay}日 ${chart.hour}時 ${chart.minute}分`,
    `${fmt('陰曆')}: ${chart.lunarYear}年 ${chart.lunarMonth}月 ${chart.lunarDay}日${chart.isLeapMonth ? ` (${fmt('閏月')})` : ''}`,
    `${fmt('性別')}: ${fmt(genderHanja)}`,
  ]
}

function renderFourColRow(cells: string[][], widths: number[]): string[] {
  const height = Math.max(...cells.map(c => c.length))
  const padded = cells.map(c => padLines(c, height, widths[0]))
  const out: string[] = [hBorder(widths, ['full', 'full', 'full'])]
  for (let i = 0; i < height; i++) {
    out.push(rowBorder(padded.map(p => p[i]), widths))
  }
  return out
}

/** AI 복사용 — 명반 4×4 그리드 ASCII (UI 배치와 동일) */
export function buildZiweiPalaceGridText(chart: ZiweiChart): string[] {
  const fmt = formatZiweiInline
  const w = COL_W
  const centerW = w * 2 + 3

  const daxianByZhi = new Map<string, string>()
  for (const dx of getDaxianList(chart)) {
    const palace = chart.palaces[dx.palaceName]
    if (palace) daxianByZhi.set(palace.zhi, `${dx.ageStart}-${dx.ageEnd}歲`)
  }

  const cell = (zhi: string): string[] => {
    const palace = getPalaceByZhi(chart, zhi)
    if (!palace) return ['']
    return buildPalaceCellLines(palace, daxianByZhi.get(zhi), fmt)
  }

  const lines: string[] = []

  // 1행: 巳午未申
  const row1 = renderFourColRow(
    ['巳', '午', '未', '申'].map(cell),
    [w, w, w, w],
  )
  lines.push(...row1)
  lines.push(hBorder([w, w, w, w], ['full', 'full', 'full']))

  // 2–3행: 辰|중궁|酉 / 卯|중궁|戌
  const topL = cell('辰')
  const topR = cell('酉')
  const botL = cell('卯')
  const botR = cell('戌')
  const center = buildCenterCellLines(chart, fmt)

  let hTop = Math.max(topL.length, topR.length)
  let hBot = Math.max(botL.length, botR.length)
  if (center.length > hTop + hBot) {
    hBot = center.length - hTop
  }
  const centerH = hTop + hBot

  const topLP = padLines(topL, hTop, w)
  const topRP = padLines(topR, hTop, w)
  const botLP = padLines(botL, hBot, w)
  const botRP = padLines(botR, hBot, w)
  const centerP = padLines(center, centerH, centerW)

  lines.push(`+${'-'.repeat(w + 2)}+${'-'.repeat(centerW + 2)}+${'-'.repeat(w + 2)}+`)
  for (let i = 0; i < hTop; i++) {
    lines.push(`| ${topLP[i]} | ${padLine(centerP[i], centerW)} | ${topRP[i]} |`)
  }
  lines.push(midSplitBorder(w, centerW, w))
  for (let i = 0; i < hBot; i++) {
    lines.push(`| ${botLP[i]} | ${padLine(centerP[hTop + i] ?? '', centerW)} | ${botRP[i]} |`)
  }
  lines.push(`+${'-'.repeat(w + 2)}+${'-'.repeat(centerW + 2)}+${'-'.repeat(w + 2)}+`)

  // 4행: 寅丑子亥
  const row4 = renderFourColRow(
    ['寅', '丑', '子', '亥'].map(cell),
    [w, w, w, w],
  )
  lines.push(...row4)
  lines.push(hBorder([w, w, w, w], ['full', 'full', 'full']))

  return lines
}
