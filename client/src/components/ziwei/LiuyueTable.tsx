import { useMemo } from 'react'
import { calculateLiunian } from '@core/ziwei'
import type { ZiweiChart } from '@core/types'
import { branchSolidBgClass } from '../../utils/format.ts'
import { ZiweiInline, ZiweiSectionTitleKey } from './ZiweiLabel.tsx'
import { getMainStarsAtZhi } from '../../utils/ziwei-liunian-export.ts'

interface Props {
  chart: ZiweiChart
  displayYear: number
  onYearChange: (year: number) => void
}

const LUNAR_MONTH_HANJA = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '臘月',
] as const

export default function LiuyueTable({ chart, displayYear, onYearChange }: Props) {
  const liunian = useMemo(
    () => calculateLiunian(chart, displayYear),
    [chart, displayYear],
  )

  const handlePrevYear = () => onYearChange(displayYear - 1)
  const handleNextYear = () => onYearChange(displayYear + 1)

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <ZiweiSectionTitleKey text="流月" />
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={handlePrevYear}
            className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          >
            &lt; 이전해
          </button>
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            {displayYear}년
            <span className="font-hanja text-sm text-gray-400 dark:text-gray-500 ml-1">
              ({liunian.gan}{liunian.zhi}年)
            </span>
          </span>
          <button
            type="button"
            onClick={handleNextYear}
            className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          >
            다음해 &gt;
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        流月는 선택한 流年({displayYear}년) 기준 음력월 순서입니다.
      </p>
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              {liunian.liuyue.map(ly => (
                <th
                  key={ly.month}
                  className="border border-black dark:border-gray-600 px-2 py-1 text-center min-w-[88px] text-xs bg-gray-100 dark:bg-gray-800"
                >
                  {displayYear}년
                  <br />
                  <ZiweiInline text={LUNAR_MONTH_HANJA[ly.month - 1]} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {liunian.liuyue.map(ly => (
                <td key={ly.month} className="border border-black dark:border-gray-600 px-2 py-2 text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 text-base font-hanja rounded text-white ${branchSolidBgClass(ly.mingGongZhi)}`}>
                    {ly.mingGongZhi}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              {liunian.liuyue.map(ly => (
                <td key={ly.month} className="border border-black dark:border-gray-600 px-2 py-1 text-center text-xs">
                  <ZiweiInline text={ly.natalPalaceName} />
                </td>
              ))}
            </tr>
            <tr>
              {liunian.liuyue.map(ly => {
                const stars = getMainStarsAtZhi(chart, ly.mingGongZhi)
                return (
                  <td key={ly.month} className="border border-black dark:border-gray-600 px-2 py-1 text-center text-xs leading-tight">
                    {stars.length > 0
                      ? stars.map(s => (
                        <div key={s}>
                          <ZiweiInline text={s} />
                        </div>
                      ))
                      : <ZiweiInline text="空宮" />}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
