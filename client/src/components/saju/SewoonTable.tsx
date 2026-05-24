import { useMemo } from 'react'
import type { DaewoonItem, YongsinStats } from '@core/types'
import { annotateTransit } from '@core/index'
import { getRelation, getJeonggi, getTwelveMeteor, getTwelveSpirit } from '@core/pillars'
import { collectNatalTransitInteractions } from '../../utils/yun-bigo.ts'
import YunBigoCell from './YunBigoCell.tsx'
import { getLiuNianGanziForCalendarYear } from '@core/yun-transit'
import { getManAgeInCalendarYear } from '@core/age'
import { formatLichunBoundaryCell } from '@core/jieqi-lunar'
import { stemColorClass, branchColorClass, stemSolidBgClass, branchSolidBgClass, formatSinsal, getStemAttr, getBranchAttr } from '../../utils/format.ts'
import { YUN_SEWOON_UI_NOTES } from '../../utils/yun-method-notes.ts'
import YunSectionHeading from './YunSectionHeading.tsx'
import { isBeforeFirstDaewoon, shouldHighlightSewoonYear, getFirstDaewoonStartYear, getCurrentLiuNianGanzi, getEffectiveYunCalendarYear } from '../../utils/yun-period.ts'
import { formatDaewoonAgeBridgeNote } from '../../utils/yun-age-notes.ts'
import { JieQiBoundaryCell } from './JieQiCell.tsx'

interface Props {
  daewoon: DaewoonItem[]
  displayIndex: number
  birthYear: number
  birthMonth: number
  birthDay: number
  dayStem: string
  yearBranch: string
  gongmangBranches: [string, string]
  natalGanzis: string[]
  yongsin: YongsinStats
}

interface SewoonItem {
  year: number
  age: number
  ganzi: string
  stemSipsin: string
  branchSipsin: string
  unseong: string
  sinsal: string
  isGongmang: boolean
  interactions: string
  fuYinFanYin: string
  yongsinLabel: string
}

const STEM_SIPSIN_MAP: Record<string, string> = {
  '正官': '정관(正官)', '偏官': '편관(偏官)', '正印': '정인(正印)', '偏印': '편인(偏印)',
  '正財': '정재(正財)', '偏財': '편재(偏財)', '食神': '식신(食神)', '傷官': '상관(傷官)',
  '比肩': '비견(比肩)', '劫財': '겁재(劫財)',
}

function buildSewoonItems(
  startYear: number, endYear: number,
  birthYear: number, birthMonth: number, birthDay: number,
  dayStem: string, yearBranch: string,
  gmSet: Set<string>,
  natalGanzis: string[],
  yongsin: YongsinStats,
): SewoonItem[] {
  const items: SewoonItem[] = []

  for (let y = startYear; y < endYear; y++) {
    const ganzi = getLiuNianGanziForCalendarYear(y)
    const stem = ganzi[0]
    const branch = ganzi[1]
    const rel = getRelation(dayStem, stem)
    const stemSipsin = rel ? rel.hanja : '?'
    const jeonggi = getJeonggi(branch)
    const bRel = getRelation(dayStem, jeonggi)
    const branchSipsin = bRel ? bRel.hanja : '?'
    const ann = annotateTransit(ganzi, natalGanzis, yongsin)

    const interArr = collectNatalTransitInteractions(ganzi, natalGanzis)

    items.push({
      year: y,
      age: getManAgeInCalendarYear(birthYear, birthMonth, birthDay, y),
      ganzi,
      stemSipsin,
      branchSipsin,
      unseong: getTwelveMeteor(dayStem, branch),
      sinsal: formatSinsal(getTwelveSpirit(yearBranch, branch)),
      isGongmang: gmSet.has(branch),
      interactions: interArr.length > 0 ? interArr.join('\n') : '',
      fuYinFanYin: ann.fuYinFanYin,
      yongsinLabel: ann.yongsinLabel,
    })
  }
  return items
}

export default function SewoonTable({
  daewoon, displayIndex, birthYear, birthMonth, birthDay, dayStem, yearBranch, gongmangBranches, natalGanzis, yongsin,
}: Props) {
  const gmSet = useMemo(() => new Set(gongmangBranches), [gongmangBranches])

  const targetDaewoon = daewoon[displayIndex] ?? daewoon[0]
  const startYearForSewoon = targetDaewoon?.startDate.getFullYear() ?? birthYear
  const nextDaewoon = daewoon[displayIndex + 1]
  const endYearForSewoon = nextDaewoon
    ? nextDaewoon.startDate.getFullYear()
    : startYearForSewoon + 10

  const sewoonItems = useMemo(() => {
    if (!targetDaewoon) return []
    return buildSewoonItems(
      startYearForSewoon,
      endYearForSewoon,
      birthYear,
      birthMonth,
      birthDay,
      dayStem,
      yearBranch,
      gmSet,
      natalGanzis,
      yongsin,
    )
  }, [targetDaewoon, startYearForSewoon, endYearForSewoon, birthYear, birthMonth, birthDay, dayStem, yearBranch, gmSet, natalGanzis, yongsin])

  if (sewoonItems.length === 0) return null

  const currentYear = new Date().getFullYear()
  const beforeFirstDaewoon = isBeforeFirstDaewoon(daewoon)
  const pendingStartYear = beforeFirstDaewoon ? getFirstDaewoonStartYear(daewoon) : null
  const currentSewoonGanzi = beforeFirstDaewoon ? null : getCurrentLiuNianGanzi()
  const effectiveYunYear = getEffectiveYunCalendarYear()
  const periodLabel = `${targetDaewoon.age}세~ (${startYearForSewoon}년~${endYearForSewoon - 1}년)`
  const ageBridgeNote = formatDaewoonAgeBridgeNote(
    birthYear, birthMonth, birthDay, targetDaewoon,
  )

  return (
    <section>
      <YunSectionHeading
        title={<>세운 <span className="font-hanja">(歲運)</span></>}
        yunLabel="세운"
        currentGanzi={currentSewoonGanzi}
        pendingStartYear={pendingStartYear}
        context={currentSewoonGanzi ? { kind: 'year', year: effectiveYunYear } : null}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
        선택 대운: {periodLabel}
      </p>
      {ageBridgeNote && (
        <p className="text-xs text-amber-700 dark:text-amber-300 mb-1 leading-relaxed">
          {ageBridgeNote}
        </p>
      )}
      {YUN_SEWOON_UI_NOTES.map((line) => (
        <p key={line} className="text-xs text-gray-500 dark:text-gray-400 mb-1 leading-relaxed">
          {line}
        </p>
      ))}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {[...sewoonItems].reverse().map((item, idx) => {
                const isCurrentYear = shouldHighlightSewoonYear(item.year, currentYear, daewoon)
                return (
                  <th
                    key={idx}
                    className={`border border-black px-2 py-2 text-center min-w-[100px] text-xs font-semibold ${
                      isCurrentYear ? 'bg-[#FFFF00]' : 'bg-gray-100'
                    }`}
                  >
                    {item.age}세<br />({item.year}년)
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              {[...sewoonItems].reverse().map((item, idx) => (
                <JieQiBoundaryCell key={idx} text={formatLichunBoundaryCell(item.year)} />
              ))}
            </tr>
            <tr>
              {[...sewoonItems].reverse().map((item, idx) => (
                <td key={idx} className={`border border-black px-2 py-1 text-center text-xs font-medium ${stemColorClass(item.ganzi[0])}`}>
                  {STEM_SIPSIN_MAP[item.stemSipsin] || item.stemSipsin}
                </td>
              ))}
            </tr>
            <tr>
              {[...sewoonItems].reverse().map((item, idx) => {
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
              {[...sewoonItems].reverse().map((item, idx) => {
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
              {[...sewoonItems].reverse().map((item, idx) => (
                <td key={idx} className={`border border-black px-2 py-1 text-center text-xs font-medium ${branchColorClass(item.ganzi[1])}`}>
                  {STEM_SIPSIN_MAP[item.branchSipsin] || item.branchSipsin}
                </td>
              ))}
            </tr>
            <tr>
              {[...sewoonItems].reverse().map((item, idx) => (
                <td key={idx} className="border border-black px-2 py-1 text-center text-xs">
                  {item.unseong}
                </td>
              ))}
            </tr>
            <tr>
              {[...sewoonItems].reverse().map((item, idx) => {
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
              {[...sewoonItems].reverse().map((item, idx) => (
                <YunBigoCell
                  key={idx}
                  isGongmang={item.isGongmang}
                  interactions={item.interactions}
                  fuYinFanYin={item.fuYinFanYin}
                />
              ))}
            </tr>
            <tr>
              {[...sewoonItems].reverse().map((item, idx) => (
                <td key={idx} className="border border-black px-2 py-1 text-center text-[10px] leading-tight">
                  {item.yongsinLabel}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
