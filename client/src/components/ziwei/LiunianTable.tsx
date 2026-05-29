import { useMemo, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { calculateLiunian } from '@core/ziwei'
import type { LiuNianInfo, ZiweiChart } from '@core/types'
import { getZiweiXuSuiInCalendarYear } from '@core/ziwei'
import { branchSolidBgClass } from '../../utils/format.ts'
import { ZiweiInline } from './ZiweiLabel.tsx'
import YunSectionHeading from '../saju/YunSectionHeading.tsx'
import { getMainStarsAtZhi } from '../../utils/ziwei-liunian-export.ts'
import {
  getCalendarYearsForDaxian,
  shouldHighlightZiweiLiunianYear,
  type ZiweiDaxianItem,
} from '../../utils/ziwei-yun-period.ts'

interface Props {
  chart: ZiweiChart
  daxian: ZiweiDaxianItem
  onYearChange: (year: number) => void
  selectedDaxianIdx: number
  autoDaxianIdx: number
}

interface LiunianColumn {
  year: number
  age: number
  liunian: LiuNianInfo
  mainStars: string[]
}

const SI_HUA_ORDER = ['化祿', '化權', '化科', '化忌'] as const

const SI_HUA_COLOR: Record<string, string> = {
  '化祿': 'text-green-600 dark:text-green-400',
  '化權': 'text-yellow-600 dark:text-yellow-400',
  '化科': 'text-blue-600 dark:text-blue-400',
  '化忌': 'text-red-600 dark:text-red-400',
}

function buildLiunianColumns(chart: ZiweiChart, daxian: ZiweiDaxianItem): LiunianColumn[] {
  const years = getCalendarYearsForDaxian(chart, daxian)
  return years.map(year => {
    const liunian = calculateLiunian(chart, year)
    return {
      year,
      age: getZiweiXuSuiInCalendarYear(chart.solarYear, year),
      liunian,
      mainStars: getMainStarsAtZhi(chart, liunian.mingGongZhi),
    }
  })
}

function formatSiHuaCell(liunian: LiuNianInfo): ReactNode {
  return (
    <div className="space-y-0.5 text-[10px] leading-tight">
      {SI_HUA_ORDER.map(huaType => {
        let starName = ''
        for (const [s, h] of Object.entries(liunian.siHua)) {
          if (h === huaType) { starName = s; break }
        }
        const palaceName = liunian.siHuaPalaces[huaType]
        if (!starName) return null
        return (
          <div key={huaType} className={SI_HUA_COLOR[huaType]}>
            <ZiweiInline text={huaType} hanjaClassName={`font-hanja ${SI_HUA_COLOR[huaType]}`} />
            <span className="text-gray-400 mx-0.5">:</span>
            <ZiweiInline text={starName} />
            <span className="text-gray-400 mx-0.5">→</span>
            <ZiweiInline text={palaceName} />
          </div>
        )
      })}
    </div>
  )
}

export default function LiunianTable({
  chart,
  daxian,
  onYearChange,
  selectedDaxianIdx,
  autoDaxianIdx,
}: Props) {
  const columns = useMemo(() => buildLiunianColumns(chart, daxian), [chart, daxian])
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  useEffect(() => {
    setCurrentYear(new Date().getFullYear())
  }, [])
  const currentLiunian = useMemo(
    () => calculateLiunian(chart, currentYear),
    [chart, currentYear],
  )

  if (columns.length === 0) return null

  const years = getCalendarYearsForDaxian(chart, daxian)
  const periodLabel = `${daxian.ageStart}-${daxian.ageEnd}歲 (${years[0]}년~${years[years.length - 1]}년)`

  return (
    <section>
      <YunSectionHeading
        title={<>유년 <span className="font-hanja">(流年)</span></>}
        yunLabel="유년"
        currentGanzi={`${currentLiunian.gan}${currentLiunian.zhi}`}
        context={{ kind: 'year', year: currentYear }}
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
        선택 大限: {periodLabel}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        열을 클릭하면 해당 연도의 流月을 아래에서 볼 수 있습니다. 노란 칸은 현재 大限일 때 올해만 표시됩니다(사주 세운과 동일). 📍는 제목의 현재 유년과 동일합니다.
      </p>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              {[...columns].reverse().map(col => {
                const isActive = shouldHighlightZiweiLiunianYear(
                  col.year,
                  selectedDaxianIdx,
                  autoDaxianIdx,
                  currentYear,
                )
                return (
                  <th
                    key={col.year}
                    onClick={() => onYearChange(col.year)}
                    className={`border border-black dark:border-gray-600 px-2 py-2 text-center min-w-[100px] text-xs font-semibold cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-[#FFFF00]'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {col.age}세<br />
                    ({col.year}년)<br />
                    <span className="font-hanja">{col.liunian.gan}{col.liunian.zhi}</span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              {[...columns].reverse().map(col => (
                <td key={col.year} className="border border-black dark:border-gray-600 px-2 py-2 text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 text-base font-hanja rounded text-white ${branchSolidBgClass(col.liunian.mingGongZhi)}`}>
                    {col.liunian.mingGongZhi}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              {[...columns].reverse().map(col => (
                <td key={col.year} className="border border-black dark:border-gray-600 px-2 py-1 text-center text-xs">
                  <ZiweiInline text={col.liunian.natalPalaceAtMing} />
                </td>
              ))}
            </tr>
            <tr>
              {[...columns].reverse().map(col => (
                <td key={col.year} className="border border-black dark:border-gray-600 px-2 py-1 text-center text-xs leading-tight">
                  {col.mainStars.length > 0
                    ? col.mainStars.map(s => (
                      <div key={s}>
                        <ZiweiInline text={s} />
                      </div>
                    ))
                    : <ZiweiInline text="空宮" />}
                </td>
              ))}
            </tr>
            <tr>
              {[...columns].reverse().map(col => (
                <td key={col.year} className="border border-black dark:border-gray-600 px-2 py-1 text-center align-top">
                  {formatSiHuaCell(col.liunian)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
