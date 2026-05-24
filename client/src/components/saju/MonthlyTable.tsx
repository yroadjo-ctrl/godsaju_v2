import { useState } from 'react'
import type { YongsinStats } from '@core/types'
import { annotateTransit } from '@core/index'
import { getRelation, getJeonggi, getTwelveMeteor, getTwelveSpirit } from '@core/pillars'
import { collectNatalTransitInteractions } from '../../utils/yun-bigo.ts'
import YunBigoCell from './YunBigoCell.tsx'
import { getLiuYueGanziForCalendarMonth } from '@core/yun-transit'
import { getMonthlyJieQiEntries } from '@core/jieqi-lunar'
import type { MonthlyJieQiEntry } from '@core/jieqi-lunar'
import { YUN_METHOD_NOTES } from '../../utils/yun-method-notes.ts'
import { stemColorClass, branchColorClass, stemSolidBgClass, branchSolidBgClass, formatSinsal, getStemAttr, getBranchAttr } from '../../utils/format.ts'
import YunSectionHeading from './YunSectionHeading.tsx'
import { MonthlyJieQiCell } from './JieQiCell.tsx'
import { getCurrentLiuYueGanzi } from '../../utils/yun-period.ts'
interface Props {
  currentYear: number
  currentMonth: number
  /** App과 복사 상태 동기화용 — 지정 시 controlled */
  displayYear?: number
  /** [시, 일, 월, 년] 간지 문자열 */
  pillars: string[]
  dayStem: string
  yearBranch: string
  gongmangBranches: [string, string]
  yongsin: YongsinStats
  onYearChange?: (year: number) => void
}

interface MonthlyItem {
  year: number
  month: number
  ganzi: string
  stemSipsin: string
  branchSipsin: string
  unseong: string
  sinsal: string
  interactions: string
  fuYinFanYin: string
  yongsinLabel: string
  isGongmang: boolean
  jieQiEntries: MonthlyJieQiEntry[]
}

const STEM_SIPSIN_MAP: Record<string, string> = {
  '正官': '정관(正官)', '偏官': '편관(偏官)', '正印': '정인(正印)', '偏印': '편인(偏印)',
  '正財': '정재(正財)', '偏財': '편재(偏財)', '食神': '식신(食神)', '傷官': '상관(傷官)',
  '比肩': '비견(比肩)', '劫財': '겁재(劫財)'
}

const BRANCH_SIPSIN_MAP: Record<string, string> = {
  '正官': '정관(正官)', '偏官': '편관(偏官)', '正印': '정인(正印)', '偏印': '편인(偏印)',
  '正財': '정재(正財)', '偏財': '편재(偏財)', '食神': '식신(食神)', '傷官': '상관(傷官)',
  '比肩': '비견(比肩)', '劫財': '겁재(劫財)'
}

function buildMonthlyItems(
  displayYear: number,
  pillars: string[], dayStem: string, yearBranch: string,
  gmSet: Set<string>,
  natalGanzis: string[],
  yongsin: YongsinStats,
): MonthlyItem[] {
  const items: MonthlyItem[] = []

  for (let month = 1; month <= 12; month++) {
    const ganzi = getLiuYueGanziForCalendarMonth(displayYear, month)
    const stem = ganzi[0]
    const branch = ganzi[1]

    const stemRel = getRelation(dayStem, stem)
    const stemSipsin = stemRel ? stemRel.hanja : '?'
    const jeonggi = getJeonggi(branch)
    const jeonggiRel = getRelation(dayStem, jeonggi)
    const branchSipsin = jeonggiRel ? jeonggiRel.hanja : '?'

    const interArr = collectNatalTransitInteractions(ganzi, natalGanzis)
    const ann = annotateTransit(ganzi, natalGanzis, yongsin)

    items.push({
      year: displayYear,
      month,
      ganzi,
      stemSipsin,
      branchSipsin,
      unseong: getTwelveMeteor(dayStem, branch),
      sinsal: formatSinsal(getTwelveSpirit(yearBranch, branch)),
      interactions: interArr.length > 0 ? interArr.join('\n') : '',
      fuYinFanYin: ann.fuYinFanYin,
      yongsinLabel: ann.yongsinLabel,
      isGongmang: gmSet.has(branch),
      jieQiEntries: getMonthlyJieQiEntries(displayYear, month),
    })
  }
  return items
}

export default function MonthlyTable({
  currentYear, currentMonth, displayYear: displayYearProp,
  pillars, dayStem, yearBranch, gongmangBranches, yongsin, onYearChange,
}: Props) {
  const [internalYear, setInternalYear] = useState(currentYear)
  const isControlled = displayYearProp !== undefined
  const displayYear = isControlled ? displayYearProp : internalYear
  const gmSet = new Set(gongmangBranches)
  const natalGanzis = pillars.map((p) => (typeof p === 'string' ? p : `${p[0]}${p[1]}`))
  const monthlyItems = buildMonthlyItems(displayYear, pillars, dayStem, yearBranch, gmSet, natalGanzis, yongsin)
  const currentMonthGanzi = getCurrentLiuYueGanzi()

  const changeYear = (newYear: number) => {
    if (!isControlled) setInternalYear(newYear)
    onYearChange?.(newYear)
  }

  const handlePrevYear = () => changeYear(displayYear - 1)

  const handleNextYear = () => changeYear(displayYear + 1)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <YunSectionHeading
          title={<>월운 <span className="font-hanja">(月運)</span></>}
          yunLabel="월운"
          currentGanzi={currentMonthGanzi}
          context={{ kind: 'yearMonth', year: currentYear, month: currentMonth }}
        />
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={handlePrevYear}
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 text-gray-600"
          >
            &lt; 이전해
          </button>
          <span className="font-semibold text-gray-700">{displayYear}년</span>
          <button
            onClick={handleNextYear}
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 text-gray-600"
          >
            다음해 &gt;
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 leading-relaxed">
        {YUN_METHOD_NOTES.monthly}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
        {YUN_METHOD_NOTES.yongsinTransit}
      </p>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {monthlyItems.map((item, idx) => {
                const isCurrentMonth = item.year === currentYear && item.month === currentMonth
                return (
                  <th
                    key={idx}
                    className={`border border-black px-2 py-1 text-center min-w-[100px] text-xs ${
                      isCurrentMonth ? 'bg-[#FFFF00] text-black font-bold' : 'bg-gray-100'
                    }`}
                  >
                    {item.year}년<br />{item.month}월
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              {monthlyItems.map((item, idx) => (
                <MonthlyJieQiCell key={idx} entries={item.jieQiEntries} />
              ))}
            </tr>
            <tr>
              {monthlyItems.map((item, idx) => (
                <td key={idx} className={`border border-black px-2 py-1 text-center text-xs font-medium ${stemColorClass(item.ganzi[0])}`}>
                  {STEM_SIPSIN_MAP[item.stemSipsin] || item.stemSipsin}
                </td>
              ))}
            </tr>
            <tr>
              {monthlyItems.map((item, idx) => {
                const stemAttr = getStemAttr(item.ganzi[0])
                return (
                  <td key={idx} className="border border-black px-2 py-2 text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <span className="absolute -top-1.5 -right-5 text-[9px] font-bold text-slate-900 leading-none">
                        {stemAttr.um}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-white font-bold text-sm ${stemSolidBgClass(item.ganzi[0])}`}>
                        {item.ganzi[0]}
                      </span>
                      <span className="absolute -bottom-1.5 -right-9 text-[9px] font-bold text-slate-900 leading-none whitespace-nowrap">
                        ({stemAttr.ohaeng})
                      </span>
                    </div>
                  </td>
                )
              })}
            </tr>
            <tr>
              {monthlyItems.map((item, idx) => {
                const branchAttr = getBranchAttr(item.ganzi[1])
                return (
                  <td key={idx} className="border border-black px-2 py-2 text-center">
                    <div className="relative inline-flex items-center justify-center">
                      <span className="absolute -top-1.5 -right-5 text-[9px] font-bold text-slate-900 leading-none">
                        {branchAttr.um}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-white font-bold text-sm ${branchSolidBgClass(item.ganzi[1])}`}>
                        {item.ganzi[1]}
                      </span>
                      <span className="absolute -bottom-1.5 -right-9 text-[9px] font-bold text-slate-900 leading-none whitespace-nowrap">
                        ({branchAttr.ohaeng})
                      </span>
                    </div>
                  </td>
                )
              })}
            </tr>
            <tr>
              {monthlyItems.map((item, idx) => (
                <td key={idx} className={`border border-black px-2 py-1 text-center text-xs font-medium ${branchColorClass(item.ganzi[1])}`}>
                  {BRANCH_SIPSIN_MAP[item.branchSipsin] || item.branchSipsin}
                </td>
              ))}
            </tr>
            <tr>
              {monthlyItems.map((item, idx) => (
                <td key={idx} className="border border-black px-2 py-1 text-center text-xs">
                  {item.unseong}
                </td>
              ))}
            </tr>
            <tr>
              {monthlyItems.map((item, idx) => {
                const match = item.sinsal.match(/^(.+?)\((.+?)\)$/)
                const hangul = match ? match[1] : item.sinsal
                const hanja = match ? `(${match[2]})` : ''
                return (
                  <td key={idx} className="border border-black px-2 py-1 text-center text-xs">
                    {hangul}<br />{hanja}
                  </td>
                )
              })}
            </tr>
            <tr>
              {monthlyItems.map((item, idx) => (
                <YunBigoCell
                  key={idx}
                  isGongmang={item.isGongmang}
                  interactions={item.interactions}
                  fuYinFanYin={item.fuYinFanYin}
                />
              ))}
            </tr>
            <tr>
              {monthlyItems.map((item, idx) => (
                <td key={idx} className="border border-black px-2 py-1 text-center text-[10px] leading-tight">
                  {item.yongsinLabel}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
