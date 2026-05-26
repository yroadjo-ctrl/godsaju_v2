import { useMemo, useRef, useEffect } from 'react'
import type { ZiweiChart } from '@core/types'
import { getDaxianList } from '@core/ziwei'
import { stemSolidBgClass, branchSolidBgClass } from '../../utils/format.ts'
import { ZiweiInline, ZiweiStacked, ZiweiSectionTitleKey } from './ZiweiLabel.tsx'
import { getDaxianStartCalendarYear } from '../../utils/ziwei-yun-period.ts'
interface Props {
  chart: ZiweiChart
  selectedIdx: number
  autoIndex: number
  onSelectDaxian: (idx: number) => void
}

export default function DaxianTable({
  chart,
  selectedIdx,
  autoIndex,
  onSelectDaxian,
}: Props) {
  const daxianList = useMemo(() => getDaxianList(chart), [chart])
  const activeIdx = autoIndex
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeHeaderRef = useRef<HTMLTableCellElement>(null)

  useEffect(() => {
    if (activeHeaderRef.current && scrollRef.current) {
      const container = scrollRef.current
      const el = activeHeaderRef.current
      container.scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2
    }
  }, [activeIdx, daxianList.length])

  return (
    <section>
      <ZiweiSectionTitleKey text="大限" className="mb-2" />
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        열을 클릭하면 해당 大限 구간의 流年을 아래에서 볼 수 있습니다.
        <span className="block mt-0.5">※ 大限 나이는 자미두수 虚岁(해당 양력년 − 출생년 + 1) 기준입니다. 사주 대운·세운의 만나이와 다를 수 있습니다.</span>
      </p>
      <div ref={scrollRef} className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              {[...daxianList].reverse().map((dx, revIdx) => {
                const actualIdx = daxianList.length - 1 - revIdx
                const isActive = activeIdx >= 0 && actualIdx === activeIdx
                const isSelected = selectedIdx >= 0 && actualIdx === selectedIdx && actualIdx !== activeIdx
                const startYear = getDaxianStartCalendarYear(chart, dx)
                return (
                  <th
                    key={actualIdx}
                    ref={isActive ? activeHeaderRef : undefined}
                    onClick={() => onSelectDaxian(actualIdx)}
                    className={`border border-black dark:border-gray-600 px-2 py-2 text-center min-w-[100px] text-xs font-semibold cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#66FFFF]'
                        : isActive
                          ? 'bg-[#FFFF00]'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {dx.ageStart}-{dx.ageEnd}歲
                    {startYear != null && (
                      <>
                        <br />
                        ({startYear}년~)
                      </>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              {[...daxianList].reverse().map((dx, revIdx) => {
                const actualIdx = daxianList.length - 1 - revIdx
                return (
                  <td
                    key={actualIdx}
                    className="border border-black dark:border-gray-600 px-2 py-1 text-center text-xs"
                  >
                    <ZiweiStacked text={dx.palaceName} />
                  </td>
                )
              })}
            </tr>
            <tr>
              {[...daxianList].reverse().map((dx, revIdx) => {
                const actualIdx = daxianList.length - 1 - revIdx
                const gan = dx.ganZhi[0]
                const zhi = dx.ganZhi[1]
                return (
                  <td key={actualIdx} className="border border-black dark:border-gray-600 px-2 py-2 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`inline-flex items-center justify-center w-8 h-8 text-base font-hanja rounded text-white ${stemSolidBgClass(gan)}`}>
                        {gan}
                      </span>
                      <span className={`inline-flex items-center justify-center w-8 h-8 text-base font-hanja rounded text-white ${branchSolidBgClass(zhi)}`}>
                        {zhi}
                      </span>
                    </div>
                  </td>
                )
              })}
            </tr>
            <tr>
              {[...daxianList].reverse().map((dx, revIdx) => {
                const actualIdx = daxianList.length - 1 - revIdx
                return (
                  <td
                    key={actualIdx}
                    className="border border-black dark:border-gray-600 px-2 py-1 text-center text-xs leading-tight"
                  >
                    {dx.mainStars.length > 0 ? (
                      dx.mainStars.map(s => (
                        <div key={s}>
                          <ZiweiInline text={s} />
                        </div>
                      ))
                    ) : (
                      <ZiweiInline text="空宮" />
                    )}
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
