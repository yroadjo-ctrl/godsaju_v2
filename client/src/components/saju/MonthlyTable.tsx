import { useState } from 'react'
import { getRelation, getJeonggi, getTwelveMeteor, getTwelveSpirit, getStemRelation, getBranchRelation } from '@core/pillars'
import { calculateMonthGanzi } from '@core/monthly-data'
import { stemColorClass, branchColorClass, stemSolidBgClass, branchSolidBgClass, formatSinsal, getStemAttr, getBranchAttr } from '../../utils/format.ts'
import { useLocale } from '../../i18n/index.ts'

interface Props {
  currentYear: number
  currentMonth: number
  pillars: string[][]
  dayStem: string
  yearBranch: string
  gongmangBranches: [string, string]
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
  isGongmang: boolean
  solarTerm: string
}

const MONTH_TO_SOLAR_TERM: Record<number, string> = {
  1: '소한(小寒)',
  2: '입춘(立春)',
  3: '경칩(驚蟄)',
  4: '청명(清明)',
  5: '입하(入夏)',
  6: '망종(芒種)',
  7: '소서(小暑)',
  8: '입추(立秋)',
  9: '백로(白露)',
  10: '한로(寒露)',
  11: '입동(立冬)',
  12: '대설(大雪)',
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
  pillars: string[][], dayStem: string, yearBranch: string,
  gmSet: Set<string>,
): MonthlyItem[] {
  const items: MonthlyItem[] = []
  const posLabels = ["시", "일", "월", "년"]

  for (let month = 1; month <= 12; month++) {
    const ganzi = calculateMonthGanzi(displayYear, month)
    const stem = ganzi[0]
    const branch = ganzi[1]

    const stemRel = getRelation(dayStem, stem)
    const stemSipsin = stemRel ? stemRel.hanja : '?'
    const jeonggi = getJeonggi(branch)
    const jeonggiRel = getRelation(dayStem, jeonggi)
    const branchSipsin = jeonggiRel ? jeonggiRel.hanja : '?'

    const interArr: string[] = []

    pillars.forEach((p, idx) => {
      const natalStem = p[0]
      const natalBranch = p[1]
      const pos = posLabels[idx]

      const sRel = getStemRelation(natalStem, stem)
      if (sRel) {
        const sRels = Array.isArray(sRel) ? sRel : [sRel]
        sRels.forEach(rel => {
          const label = typeof rel === 'object' ? (rel.hanja || rel.name || rel.type || '') : rel
          if (label) interArr.push(`${natalStem}${stem}${label}(${pos}간)`)
        })
      }

      const bRel = getBranchRelation(natalBranch, branch)
      if (bRel) {
        const bRels = Array.isArray(bRel) ? bRel : [bRel]
        bRels.forEach(rel => {
          const label = typeof rel === 'object' ? (rel.hanja || rel.name || rel.type || '') : rel
          if (label) interArr.push(`${natalBranch}${branch}${label}(${pos}지)`)
        })
      }
    })

    items.push({
      year: displayYear,
      month,
      ganzi,
      stemSipsin,
      branchSipsin,
      unseong: getTwelveMeteor(dayStem, branch),
      sinsal: formatSinsal(getTwelveSpirit(yearBranch, branch)),
      interactions: interArr.length > 0 ? interArr.join('\n') : '',
      isGongmang: gmSet.has(branch),
      solarTerm: MONTH_TO_SOLAR_TERM[month] || '',
    })
  }
  return items
}

export default function MonthlyTable({
  currentYear, currentMonth, pillars, dayStem, yearBranch, gongmangBranches, onYearChange,
}: Props) {
  const { t } = useLocale()
  const [displayYear, setDisplayYear] = useState(currentYear)
  const gmSet = new Set(gongmangBranches)
  const monthlyItems = buildMonthlyItems(displayYear, pillars, dayStem, yearBranch, gmSet)

  const handlePrevYear = () => {
    const newYear = displayYear - 1
    setDisplayYear(newYear)
    onYearChange?.(newYear)
  }

  const handleNextYear = () => {
    const newYear = displayYear + 1
    setDisplayYear(newYear)
    onYearChange?.(newYear)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-medium text-gray-700 dark:text-gray-200">
          월운 <span className="font-hanja">(月運)</span>
        </h3>
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
                <td key={idx} className="border border-black px-2 py-1 text-center text-xs">
                  {item.solarTerm}
                </td>
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
                <td key={idx} className="border border-black px-2 py-1 text-center text-xs">
                  {item.isGongmang ? '空亡' : '-'}
                </td>
              ))}
            </tr>
            <tr className="bg-blue-50/30">
              {monthlyItems.map((item, idx) => (
                <td key={idx} className="border border-black px-2 py-1 text-center text-[10px] leading-tight whitespace-pre-line break-keep">
                  {item.interactions || '-'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
